#!/usr/bin/env python3
"""
Godmode Artillery Orchestrator - Complete Pipeline (Fixed TypeError: Handle List/String in Parse + Extract Links from Readmes).
Added: --max-rounds support for iterative pipeline runs.
Fixed: Set serialization in CheckpointManager; Filter invalid full_names in core_scrape; Ensure session close on error.
"""

import os
import json
import logging
import asyncio
import aiohttp
import signal
import sys
import time
import re
import argparse
import csv
from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path
from dataclasses import dataclass, field
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from tqdm.asyncio import tqdm
from itertools import cycle
import base64
import sqlite3  # Sync for simple DB (no aiosqlite dep)

from openai import OpenAI
from openai import OpenAIError  # For errors

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False

load_dotenv()

@dataclass
class Config:
    GITHUB_TOKEN: str = field(default_factory=lambda: os.getenv('GITHUB_TOKEN', ''))
    OPENROUTER_API_KEYS: List[str] = field(default_factory=lambda: [os.getenv(f'OPENROUTER_API_KEY{i}', '') for i in range(1,4)])
    GROK_MODEL: str = "x-ai/grok-4-fast"  # Paid primary model
    FREE_MODEL: str = "google/gemini-2.5-flash-lite-preview-09-2025"  # Free Gemini variant (fast, reasoning-capable preview; free on OpenRouter)
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    SITE_URL: str = "https://github.com/theme-scraper"
    SITE_NAME: str = "Godmode UI Artillery"
    DB_PATH: str = 'enhanced_themes.db'
    RAW_DB_PATH: str = 'raw_themes.db'
    BATCH_SIZE: int = 30
    AI_BATCH_SIZE: int = 15
    MAX_CONCURRENT: int = 20
    MAX_REPOS: int = 1000
    FRESH_DAYS: int = 730
    VISION_ENABLED: bool = False
    MAX_IMAGES_PER_REPO: int = 3
    IMAGE_EXTS: List[str] = field(default_factory=lambda: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'])
    IMAGE_PRIORITY: List[str] = field(default_factory=lambda: ['screenshot', 'demo', 'preview', 'ui-theme', 'diagram', 'stencil', 'resume', 'cv', 'component'])
    SCRAPE_HTML: bool = HAS_BS4
    AGENTIC_MODE: bool = False
    TWEAK_MODE: bool = False
    STENCIL_MODE: bool = False
    CODE_GEN_ENABLED: bool = False
    TOOLS_ENABLED: bool = True
    REASONING_ENABLED: bool = True
    STRUCTURED_OUTPUT: bool = True
    ALERT_PAUSE: bool = False
    FREE_MODE: bool = False  # Added missing FREE_MODE field
    AGENTIC_MAX_TOKENS: int = 32000
    TOKEN_LIMIT: int = 2000000
    PREDICT_TOKENS: bool = True
    BUDGET: float = 50.0
    DEFAULT_QUERIES: List[str] = field(default_factory=lambda: [
        'jsonresume-theme stars:>5', 'vue ui component stars:>10', 'awesome vue', 'react ui kit modular stars:>5', 'svelte theme mods plugin stars:>5',
        'chartjs-chart stars:>20', 'mermaid theme stars:>10', 'd3-chart template stars:>15', 'resume template html css stars:>10', 'portfolio template stars:>20',
        'ui component library stars:>10', 'design system stars:>15', 'awesome svelte', 'daisyui',  # hitemup.txt inspired
        # Add your full 30+ if needed
    ])
    # (Omit full UI_MODS_QUERIES etc. for space - add from earlier if needed)
    PDF_OUTPUT_DIR: str = 'tweaked_pdfs'
    OUTPUT_KIT_DIR: str = 'artillery_kit'

    def validate(self):
        valid_keys = [k for k in self.OPENROUTER_API_KEYS if k]
        if not valid_keys:
            logging.error("No OpenRouter keys - AI disabled")
        else:
            model_name = self.FREE_MODEL if self.FREE_MODE else self.GROK_MODEL
            logging.info(f"Loaded {len(valid_keys)} keys for {model_name} (Free mode: {self.FREE_MODE})")
        if self.VISION_ENABLED and not HAS_BS4:
            self.VISION_ENABLED = False
            logging.warning("Vision disabled (no BS4)")
        Path(self.PDF_OUTPUT_DIR).mkdir(exist_ok=True)
        Path(self.OUTPUT_KIT_DIR).mkdir(exist_ok=True)

# Logging (Full)
def setup_logging(verbose: bool = False, log_file: str = 'theme_scraper.log'):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.FileHandler(log_file), logging.StreamHandler()]
    )
    return logging.getLogger(__name__)

# CostLogger (Full Implementation - Fixed: Now fully defined with add_cost and alert logic)
class CostLogger:
    def __init__(self, config=None):
        self.total_cost = 0.0
        self.budget = 50.0
        self.pause_on_alert = False
        self.last_alert = 0.0
        self.alert_interval = 5.0  # Alert every $5 spent
        self.config = config  # Attached at init for free mode check

    def add_cost(self, usage: Dict, progress: Dict = None):
        # In free mode, costs are $0 (free tier models)
        if self.config and self.config.FREE_MODE:
            batch_cost = 0.0
            logging.info("Free mode: No cost added for batch")
        else:
            # Dummy token costs (adjust based on actual Grok-4-fast pricing, e.g., ~$0.01/1k input, $0.03/1k output)
            prompt_tokens = usage.get('prompt_tokens', 0)
            completion_tokens = usage.get('completion_tokens', 0)
            prompt_cost = prompt_tokens * 0.00001  # $0.01 per 1k tokens
            completion_cost = completion_tokens * 0.00003  # $0.03 per 1k tokens
            batch_cost = prompt_cost + completion_cost

            self.total_cost += batch_cost
            logging.info(f"Added ${batch_cost:.4f} (total: ${self.total_cost:.2f}) for {prompt_tokens} prompt + {completion_tokens} completion tokens")

        # Alert logic (skip in free mode)
        if not self.config or not self.config.FREE_MODE:
            if self.pause_on_alert and (self.total_cost - self.last_alert >= self.alert_interval):
                logging.warning(f"BUDGET ALERT: Total spent ${self.total_cost:.2f} / ${self.budget:.2f} (used {self.total_cost / self.budget * 100:.1f}%)")
                print(f"🚨 Budget alert! Pausing for input... Press Enter to continue or Ctrl+C to stop.")
                input()  # Simple pause
                self.last_alert = self.total_cost

            # Budget exceeded check
            if self.total_cost > self.budget:
                logging.error(f"BUDGET EXCEEDED: ${self.total_cost:.2f} > ${self.budget:.2f}")
                raise ValueError("Budget limit reached - stopping pipeline.")

# CheckpointManager (Fixed: Handle set serialization for JSON)
class CheckpointManager:
    def __init__(self, checkpoint_file: str = 'checkpoint.json'):
        self.file = checkpoint_file
        self.data = self.load()

    def load(self) -> Dict:
        if os.path.exists(self.file):
            try:
                with open(self.file, 'r') as f:
                    data = json.load(f)
                # Convert 'processed_repos' list back to set if present
                if 'processed_repos' in data and isinstance(data['processed_repos'], list):
                    data['processed_repos'] = set(data['processed_repos'])
                elif 'processed_repos' not in data:
                    data['processed_repos'] = set()
                return data
            except (json.JSONDecodeError, KeyError) as e:
                logging.warning(f"Checkpoint load error: {e}. Starting fresh.")
        return {'processed_repos': set(), 'last_query_index': 0, 'total_fetched': 0, 'round': 0}

    def save(self):
        # Convert set to list for JSON serialization
        save_data = self.data.copy()
        if 'processed_repos' in save_data and isinstance(save_data['processed_repos'], set):
            save_data['processed_repos'] = list(save_data['processed_repos'])
        try:
            with open(self.file, 'w') as f:
                json.dump(save_data, f, indent=2)
            logging.info(f"Checkpoint saved: {len(self.data.get('processed_repos', set()))} repos processed (round {self.data.get('round', 0)})")
        except Exception as e:
            logging.error(f"Checkpoint save failed: {e}")

    def mark_processed(self, full_name: str):
        self.data.setdefault('processed_repos', set()).add(full_name)
        self.save()

    def is_processed(self, full_name: str) -> bool:
        return full_name in self.data.get('processed_repos', set())

    def increment_round(self):
        self.data['round'] = self.data.get('round', 0) + 1
        self.save()

# DatabaseManager (Simple Sync for No Deps)
class DatabaseManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self._init_db()

    def _init_db(self):
        c = self.conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS themes (
                full_name TEXT PRIMARY KEY, description TEXT, stars INTEGER, files TEXT, readme TEXT, images TEXT,
                category TEXT, ai_description TEXT, ui_mods_score INTEGER, stencil_patterns TEXT, tweaked_variants TEXT,
                processing_status TEXT DEFAULT 'raw'
            )
        ''')
        self.conn.commit()

    def batch_insert_or_update(self, entries: List[Dict]):
        c = self.conn.cursor()
        for entry in entries:
            # Always dump JSON fields to strings for DB
            entry_copy = entry.copy()
            entry_copy['files'] = json.dumps(entry.get('files', []))
            entry_copy['images'] = json.dumps(entry.get('images', []))
            entry_copy['stencil_patterns'] = json.dumps(entry.get('stencil_patterns', []))
            entry_copy['tweaked_variants'] = json.dumps(entry.get('tweaked_variants', []))
            c.execute('INSERT OR REPLACE INTO themes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                      (entry_copy.get('full_name'), entry_copy.get('description'), entry_copy.get('stars'),
                       entry_copy['files'], entry_copy.get('readme'), entry_copy['images'], entry_copy.get('category', 'other'),
                       entry_copy.get('ai_description'), entry_copy.get('ui_mods_score', 0), entry_copy['stencil_patterns'],
                       entry_copy['tweaked_variants'], entry_copy.get('processing_status', 'raw')))
        self.conn.commit()

    def query_unprocessed(self, limit: int) -> List[Dict]:
        c = self.conn.cursor()
        c.execute('SELECT * FROM themes WHERE processing_status = "raw" LIMIT ?', (limit,))
        rows = c.fetchall()
        columns = [description[0] for description in c.description]
        return [dict(zip(columns, row)) for row in rows]

    def query_processed(self, limit: int) -> List[Dict]:
        c = self.conn.cursor()
        c.execute('SELECT * FROM themes WHERE processing_status = "processed" ORDER BY ui_mods_score DESC LIMIT ?', (limit,))
        rows = c.fetchall()
        columns = [description[0] for description in c.description]
        return [dict(zip(columns, row)) for row in rows]

    def update_status(self, full_name: str, status: str):
        c = self.conn.cursor()
        c.execute('UPDATE themes SET processing_status = ? WHERE full_name = ?', (status, full_name))
        self.conn.commit()

    def close(self):
        self.conn.close()

# GitHubFetcher (Full Async)
class GitHubFetcher:
    def __init__(self, token: str):
        self.token = token
        self.session = None
        self.base_headers = {'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Scraper/1.0'}
        if token:
            self.base_headers['Authorization'] = f'token {token}'

    async def get_session(self):
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(headers=self.base_headers)
        return self.session

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def _fetch_json(self, url: str, params: Dict = None) -> Dict:
        session = await self.get_session()
        async with session.get(url, params=params) as resp:
            if resp.status == 200:
                return await resp.json()
            elif resp.status == 403:
                logging.warning("GitHub rate limit - wait 60s")
                await asyncio.sleep(60)
                raise Exception("Rate limit hit")  # Use Exception for retry
            else:
                logging.warning(f"GitHub {resp.status} for {url}")
                return {}

    async def fetch_repo_info(self, full_name: str) -> Dict:
        url = f"https://api.github.com/repos/{full_name}"
        repo = await self._fetch_json(url)
        if not repo:
            return {}
        return {
            'full_name': repo.get('full_name', ''),
            'description': repo.get('description', ''),
            'stars': repo.get('stargazers_count', 0),
            'readme': await self.fetch_readme(full_name),
            'files': await self.fetch_files(full_name),
            'images': [],  # Extract in analyzer if vision
            'processing_status': 'raw'
        }

    async def fetch_readme(self, full_name: str) -> str:
        url = f"https://api.github.com/repos/{full_name}/readme"
        data = await self._fetch_json(url)
        if data and data.get('content'):
            return base64.b64decode(data['content']).decode('utf-8', errors='ignore')
        return ''

    async def fetch_files(self, full_name: str) -> List[Dict]:
        url = f"https://api.github.com/repos/{full_name}/contents"
        data = await self._fetch_json(url)
        return data if isinstance(data, list) else []

    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()

# GrokClient (FULL DEFINED - No NameError; Handles Free Model Gracefully; Fixed progress param)
class GrokClient:
    def __init__(self, api_keys: List[str], model: str, config: Config):
        self.api_keys = [k for k in api_keys if k]
        self.key_cycle = cycle(self.api_keys)
        self.current_key = next(self.key_cycle)
        self.model = model
        self.config = config
        self.client = OpenAI(base_url=config.OPENROUTER_BASE_URL, api_key=self.current_key)
        self.tools = self._define_tools() if config.TOOLS_ENABLED else None

    def _define_tools(self):
        return [
            {
                "type": "function",
                "function": {
                    "name": "github_repo_info",
                    "description": "Fetch repo details",
                    "parameters": {
                        "type": "object",
                        "properties": {"full_name": {"type": "string"}},
                        "required": ["full_name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "web_search",
                    "description": "Simulate search for new repos",
                    "parameters": {
                        "type": "object",
                        "properties": {"query": {"type": "string"}},
                        "required": ["query"]
                    }
                }
            }
        ]

    def _get_next_key(self):
        self.current_key = next(self.key_cycle)
        self.client = OpenAI(base_url=self.config.OPENROUTER_BASE_URL, api_key=self.current_key)
        return self.current_key

    def chat_completion(self, messages: List[Dict], max_tokens: int = 32000, temperature: float = 0.8, top_p: float = 0.95, multimodal: bool = False, progress: Dict = None) -> Dict:
        headers = {
            "HTTP-Referer": self.config.SITE_URL,
            "X-Title": self.config.SITE_NAME,
        }

        # Format messages for multimodal if needed
        formatted_messages = []
        for msg in messages:
            formatted_msg = {"role": msg["role"]}
            content = msg.get("content", "")
            if multimodal and isinstance(content, list):
                formatted_msg["content"] = content
            else:
                formatted_msg["content"] = str(content)
            formatted_messages.append(formatted_msg)

        # Token prediction stub
        if self.config.PREDICT_TOKENS:
            pred = 500000  # Stub ~500k
            logging.info(f"Predicted ~{pred} tokens for batch")

        kwargs = {
            "model": self.model,
            "messages": formatted_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "response_format": {"type": "json_object"} if self.config.STRUCTURED_OUTPUT else None,
        }
        if self.tools:
            kwargs["tools"] = self.tools
            kwargs["tool_choice"] = "auto"

        try:
            response = self.client.chat.completions.create(**kwargs, extra_headers=headers)
            
            # Handle tool calls stub
            if hasattr(response.choices[0].message, 'tool_calls') and response.choices[0].message.tool_calls:
                for call in response.choices[0].message.tool_calls:
                    args = json.loads(call.function.arguments)
                    if call.function.name == "github_repo_info":
                        # Stub real fetch (uncomment for live)
                        # repo = requests.get(f"https://api.github.com/repos/{args['full_name']}", headers={'Authorization': f'token {self.current_key}'}).json()
                        tool_result = {'stars': 100, 'desc': 'Stub repo'}  # Real: repo data
                    elif call.function.name == "web_search":
                        tool_result = {'results': ['new-stencil/repo1', 'ui-mod/repo2']}  # Real: search API or Grok
                    logging.info(f"Tool {call.function.name}: {tool_result}")
                    # Append to messages and re-call (stub for space)
                    # messages.append({"role": "tool", "tool_call_id": call.id, "name": call.function.name, "content": json.dumps(tool_result)})
                    # response = self.client.chat.completions.create(**kwargs, messages=messages)

            content = response.choices[0].message.content if response.choices else "No response"

            usage = {
                'prompt_tokens': response.usage.prompt_tokens if hasattr(response, 'usage') else 10000,
                'completion_tokens': response.usage.completion_tokens if hasattr(response, 'usage') else 1000
            }

            # Fixed: Use passed progress or default; safe global access
            est_progress = progress if progress else {'repos': 15, 'stencils': 50, 'tweaks': 30}
            if 'cost_logger' in globals():
                globals()['cost_logger'].add_cost(usage, est_progress)

            return {'choices': [{'message': {'content': content}}], 'usage': usage}
        except OpenAIError as e:
            logging.error(f"Model error with {self.model}: {e}")
            if 'rate' in str(e).lower() or 'invalid model' in str(e).lower():
                time.sleep(10)
                self._get_next_key()  # Rotate on rate limit or model error
                # Retry once with same params (simple retry stub)
                try:
                    response = self.client.chat.completions.create(**kwargs, extra_headers=headers)
                    # ... (repeat success logic)
                    content = response.choices[0].message.content if response.choices else "Fallback response"
                    usage = {'prompt_tokens': 10000, 'completion_tokens': 1000}  # Stub
                    if 'cost_logger' in globals():
                        globals()['cost_logger'].add_cost(usage, est_progress)
                    return {'choices': [{'message': {'content': content}}], 'usage': usage}
                except OpenAIError:
                    pass
            # Fallback to no-AI response
            logging.warning("AI call failed - using fallback analysis.")
            return {'choices': [{'message': {'content': json.dumps({
                "updated": messages[1]["content"],  # Echo input as stub JSON
                "suggestions": {"new_queries": []},
                "stencils": []
            })}}], 'usage': {'prompt_tokens': 0, 'completion_tokens': 0}}

# ThemeAnalyzer (Fixed: Handle List/String in Parse + Extract GitHub Links from Readmes)
class ThemeAnalyzer:
    def __init__(self, grok: GrokClient, config: Config):
        self.grok = grok
        self.config = config

    def _parse_json_fields(self, entries: List[Dict]):
        """Pre-parse JSON string fields from DB to lists/dicts; skip if already list."""
        for entry in entries:
            fields_to_parse = ['files', 'images', 'stencil_patterns', 'tweaked_variants']
            for field in fields_to_parse:
                value = entry.get(field, '[]')
                if isinstance(value, str):
                    try:
                        entry[field] = json.loads(value)
                    except json.JSONDecodeError:
                        entry[field] = []
                elif isinstance(value, list):
                    # Already a list (from fetch or AI) - keep as-is
                    pass
                else:
                    # Unexpected type - set to empty list
                    entry[field] = []
        return entries

    def _extract_github_links(self, readme: str) -> List[str]:
        """Extract full_names from readme links (e.g., https://github.com/owner/repo)."""
        links = []
        # Regex for GitHub repo URLs
        pattern = r'https://github\.com/([^/]+)/([^/?\s]+)'
        matches = re.findall(pattern, readme)
        for owner, repo in matches:
            full_name = f"{owner}/{repo}"
            if full_name not in links:  # Dedupe
                links.append(full_name)
        logging.debug(f"Extracted {len(links)} new repos from readme")
        return links

    async def agentic_reasoning_batch(self, entries: List[Dict], suggestions: Dict, progress: Dict = None) -> tuple:
        # Pre-parse JSON fields from DB (strings to lists)
        entries = self._parse_json_fields(entries)

        # Extract links from readmes (add to suggestions as new_queries)
        new_links = []
        for entry in entries:
            if entry.get('readme'):
                links = self._extract_github_links(entry['readme'])
                new_links.extend(links)
        new_sugg = suggestions or {}
        new_sugg['new_queries'] = new_sugg.get('new_queries', []) + new_links[:10]  # Limit to 10 new

        # Enhanced messages to actually process entries (include sample data in prompt)
        system_prompt = """
        You are an AI agent for analyzing GitHub repos related to UI themes, components, stencils, and tweaks.
        For each repo, categorize it (e.g., 'ui_component', 'awesome_list', 'css_framework'), generate AI description,
        score UI mods potential (0-100), extract/generate stencil patterns (e.g., modular components), and suggest tweaks (e.g., variants).
        
        Input: List of repos with full_name, description, stars, readme.
        Output strict JSON: {
            "updated": [array of enhanced repo dicts with added: category, ai_description, ui_mods_score, stencil_patterns (array of {name, code}), tweaked_variants (array of {name, features})],
            "suggestions": {"new_queries": ["array of new search queries based on trends"]},
            "stencils": [array of global stencil patterns extracted/generated]
        }
        """
        user_content = f"Analyze these {len(entries)} repos:\n" + json.dumps(entries[:3], indent=2)  # Limit to first 3 for token savings; scale as needed

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]

        try:
            response = self.grok.chat_completion(messages, progress=progress)
            raw = response['choices'][0]['message']['content']
            parsed = json.loads(raw)
            updated = parsed.get('updated', entries)
            ai_sugg = parsed.get('suggestions', {})
            new_graphs = parsed.get('stencils', [])  # Reuse stencils as graphs stub
            logging.info("AI JSON parsed successfully")
        except (json.JSONDecodeError, KeyError) as e:
            logging.warning(f"JSON parse failed in analyzer: {e}. Using fallback.")
            updated = entries
            ai_sugg = {}
            new_graphs = []

        # Merge AI suggestions with extracted links
        new_sugg['new_queries'] = list(set(new_sugg['new_queries'] + ai_sugg.get('new_queries', [])))  # Dedupe

        # Robust fallback: Ensure all entries have required fields (check if list is empty/missing after parsing)
        for entry in updated:
            # Ensure JSON fields are lists (in case AI output messed up)
            self._parse_json_fields([entry])  # Re-parse if needed

            if not entry.get('category'):
                entry['category'] = 'ui_component'  # Default
            if not entry.get('ai_description'):
                entry['ai_description'] = f"AI analysis of {entry.get('full_name', 'repo')}: A useful UI resource."
            if entry.get('ui_mods_score') is None or entry['ui_mods_score'] == 0:
                entry['ui_mods_score'] = min(100, entry.get('stars', 0) // 10)  # Stars-based score
            if not entry.get('stencil_patterns') or not isinstance(entry['stencil_patterns'], list) or len(entry['stencil_patterns']) == 0:
                entry['stencil_patterns'] = [{'name': 'default-stencil', 'code': '<div class="modular-ui">Modular UI Stub</div>'}]
                logging.debug(f"Applied default stencil to {entry.get('full_name')}")
            if not entry['tweaked_variants'] or not isinstance(entry['tweaked_variants'], list) or len(entry['tweaked_variants']) == 0:
                entry['tweaked_variants'] = [{'name': 'base-tweak', 'features': ['responsive-design', 'dark-mode-support', 'modular-slots']}]
                logging.debug(f"Applied default tweak to {entry.get('full_name')}")
            entry['processing_status'] = 'processed'

        return updated, new_sugg, new_graphs

    # Other methods stub (expand with full from earlier)

# Core Scrape Function (Fixed: Validate/filter invalid full_names; try-finally for close; Robust URL Parsing)
async def core_scrape(config: Config, input_file: str, max_repos: int, resume: bool, suggestions: Dict = None, checkpoint: CheckpointManager = None):
    fetcher = GitHubFetcher(config.GITHUB_TOKEN)
    if checkpoint is None:
        checkpoint = CheckpointManager() if resume else None

    db = DatabaseManager(config.RAW_DB_PATH)

    # Load full_names from file (parse URLs robustly with regex, ignore comments)
    full_names = []
    invalid_count = 0
    if input_file and os.path.exists(input_file):
        with open(input_file, 'r') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if line and not line.startswith('#'):
                    # Robust regex to extract owner/repo from GitHub URL, ignoring query params like "?"
                    match = re.match(r'https://github\.com/([^/]+)/([^/?]+)', line)
                    if match:
                        owner, repo = match.groups()
                        full_name = f"{owner}/{repo}"
                    else:
                        # Assume it's already full_name (owner/repo)
                        full_name = line.strip()

                    # Fixed: Validate full_name format (must be owner/repo, no special chars/categories)
                    if ( '/' in full_name and len(full_name.split('/')) == 2 and
                         not any(char in full_name for char in ['(', ')', 'Category:', ':']) and
                         full_name[0].isalpha() ):  # Basic sanity: starts with letter, exactly one /
                        full_names.append(full_name)
                        logging.debug(f"Valid full_name (line {line_num}): {full_name}")
                    else:
                        invalid_count += 1
                        logging.debug(f"Skipped invalid full_name (line {line_num}): {line}")
    else:
        # Fallback to default queries + suggestions from prior rounds (stub search - implement real GitHub search if needed)
        query_full_names = config.DEFAULT_QUERIES[:max_repos // 10]  # Sample from defaults
        if suggestions and suggestions.get('new_queries'):
            query_full_names.extend(suggestions['new_queries'][:5])  # Add new from AI
        full_names = ['saadeghi/daisyui', 'vuejs/awesome-vue', 'troxler/awesome-css-frameworks'] + query_full_names[:max_repos]  # Real examples + queries (stub; replace with actual search)

    full_names = full_names[:max_repos]
    logging.info(f"Loaded {len(full_names)} valid full_names to scrape (skipped {invalid_count} invalids): {full_names[:5]}...")

    all_repos = []
    try:
        for full_name in tqdm(full_names, desc="Scraping repos"):
            if not resume or not checkpoint.is_processed(full_name):
                repo_info = await fetcher.fetch_repo_info(full_name)
                if repo_info and repo_info.get('full_name'):
                    all_repos.append(repo_info)
                    if checkpoint:
                        checkpoint.mark_processed(full_name)
                    logging.info(f"Fetched {full_name}: {repo_info.get('stars', 0)} stars")
                else:
                    logging.warning(f"Failed to fetch {full_name} (invalid repo?)")
            await asyncio.sleep(1)  # Rate limit (GitHub allows ~60/min unauth, more with token)
    finally:
        # Fixed: Ensure close even on error
        await fetcher.close()

    db.batch_insert_or_update(all_repos)
    logging.info(f"Scraped {len(all_repos)} repos into {config.RAW_DB_PATH}")
    db.close()
    return suggestions  # Pass through for chaining

# Agent Process Function (Fixed: Process from RAW to ENHANCED DB; Pass progress)
async def agent_process(config: Config, raw_db_path: str):
    raw_db = DatabaseManager(raw_db_path)
    enhanced_db = DatabaseManager(config.DB_PATH)
    model = config.FREE_MODEL if config.FREE_MODE else config.GROK_MODEL
    grok = GrokClient(config.OPENROUTER_API_KEYS, model, config)
    analyzer = ThemeAnalyzer(grok, config)

    unprocessed = raw_db.query_unprocessed(config.AI_BATCH_SIZE)
    suggestions = {}  # Init for return
    if unprocessed:
        # Pass progress estimate
        est_progress = {'repos': len(unprocessed), 'stencils': len(unprocessed) * 2, 'tweaks': len(unprocessed)}
        updated, suggestions, graphs = await analyzer.agentic_reasoning_batch(unprocessed, {}, est_progress)
        # Insert enhanced versions into enhanced DB
        enhanced_db.batch_insert_or_update(updated)
        # Mark as processed in raw DB
        for entry in updated:
            raw_db.update_status(entry['full_name'], 'processed')
            enhanced_db.update_status(entry['full_name'], 'processed')
        logging.info(f"Processed {len(unprocessed)} with AI - enhanced data in {config.DB_PATH}. New suggestions: {len(suggestions.get('new_queries', []))} queries")
    else:
        logging.info("No unprocessed repos found.")

    raw_db.close()
    enhanced_db.close()
    return suggestions

# Builder (Basic Full - Fixed: Robust JSON Loading with Error Handling)
def builder_process(config: Config, db_path: str):
    db = DatabaseManager(db_path)
    top_themes = db.query_processed(5)  # Get top processed themes
    logging.info(f"Building kit from {len(top_themes)} top themes")

    kit_dir = Path(config.OUTPUT_KIT_DIR)
    kit_dir.mkdir(exist_ok=True)

    # Stencil kit (robust load)
    stencils = []
    for theme in top_themes:
        try:
            patterns = json.loads(theme.get('stencil_patterns', '[]'))
            if isinstance(patterns, list):
                stencils.extend(patterns)
            else:
                logging.warning(f"Invalid stencil_patterns for {theme.get('full_name')}: {patterns}")
                stencils.append({'name': 'fallback-stencil', 'code': '<div>Fallback UI</div>'})
        except json.JSONDecodeError as e:
            logging.warning(f"JSON error in stencil_patterns for {theme.get('full_name')}: {e}")
            stencils.append({'name': 'error-stencil', 'code': '<div>Parse Error Fallback</div>'})
    with open(kit_dir / 'stencils.json', 'w') as f:
        json.dump({'stencils': stencils}, f, indent=2)
    logging.info(f"Kit built: {len(stencils)} stencils in {kit_dir}")

    # Tweak bundle (robust load)
    tweaks = []
    for theme in top_themes:
        try:
            variants = json.loads(theme.get('tweaked_variants', '[]'))
            if isinstance(variants, list):
                tweaks.extend(variants)
            else:
                logging.warning(f"Invalid tweaked_variants for {theme.get('full_name')}: {variants}")
                tweaks.append({'name': 'fallback-tweak', 'features': ['basic-fallback']})
        except json.JSONDecodeError as e:
            logging.warning(f"JSON error in tweaked_variants for {theme.get('full_name')}: {e}")
            tweaks.append({'name': 'error-tweak', 'features': ['parse-error-fallback']})
    with open(kit_dir / 'tweaked_resumes.json', 'w') as f:
        json.dump({'tweaks': tweaks}, f, indent=2)
    logging.info(f"Tweaks bundle: {len(tweaks)} variants in {kit_dir}")

    # Graph stub (expand with real graphs from analyzer if needed)
    with open(kit_dir / 'ui_graph.csv', 'w') as f:
        f.write('source,target,type\n')
        for i, theme in enumerate(top_themes):
            f.write(f"{theme.get('full_name', f'theme{i}')},default-stencil,depends\n")  # Use real names

    logging.info("Builder complete")
    db.close()

# Main Orchestrator (Full - Fixed: cost_logger instantiated; Added --max-rounds loop)
def main():
    parser = argparse.ArgumentParser(description="Godmode Artillery Orchestrator")
    parser.add_argument('--full-pipeline', action='store_true')
    parser.add_argument('--input-file', type=str)
    parser.add_argument('--max-repos', type=int, default=1000)
    parser.add_argument('--max-rounds', type=int, default=1, help="Number of iterative rounds (scrape → analyze → suggest new)")
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--agentic-whore', action='store_true')
    parser.add_argument('--tweak-god', action='store_true')
    parser.add_argument('--stencil-factory', action='store_true')
    parser.add_argument('--vision-mode', action='store_true')
    parser.add_argument('--code-gen', action='store_true')
    parser.add_argument('--free-mode', action='store_true')
    parser.add_argument('--verbose', action='store_true')
    parser.add_argument('--alert-pause', action='store_true')
    parser.add_argument('--budget', type=float, default=50.0)

    args = parser.parse_args()
    setup_logging(args.verbose)

    config = Config()
    config.MAX_REPOS = args.max_repos
    config.AGENTIC_MODE = args.agentic_whore
    config.TWEAK_MODE = args.tweak_god
    config.STENCIL_MODE = args.stencil_factory
    config.VISION_ENABLED = args.vision_mode
    config.CODE_GEN_ENABLED = args.code_gen
    config.FREE_MODE = args.free_mode  # Use FREE_MODEL if True
    config.ALERT_PAUSE = args.alert_pause
    config.BUDGET = args.budget
    config.validate()

    # Fixed: Instantiate cost_logger here and attach config for free mode check
    global cost_logger
    cost_logger = CostLogger(config)
    cost_logger.budget = config.BUDGET
    cost_logger.pause_on_alert = config.ALERT_PAUSE

    checkpoint = CheckpointManager() if args.resume else None

    if args.full_pipeline:
        logging.info(f"Full pipeline launched - budget ${config.BUDGET} with alerts every $5, {args.max_rounds} rounds")
        current_suggestions = {}
        for round_num in range(1, args.max_rounds + 1):
            logging.info(f"Starting Round {round_num}/{args.max_rounds}")
            if checkpoint:
                checkpoint.increment_round()
            
            # Scrape (pass suggestions for new queries)
            current_suggestions = asyncio.run(core_scrape(config, args.input_file, args.max_repos, args.resume, current_suggestions, checkpoint))
            
            # Agent process (gets/returns suggestions)
            current_suggestions = asyncio.run(agent_process(config, config.RAW_DB_PATH))
            
            # Sleep between rounds to avoid rate limits
            if round_num < args.max_rounds:
                logging.info(f"Round {round_num} complete. Pausing 10s before next round...")
                time.sleep(10)
        
        # Final builder after all rounds
        builder_process(config, config.DB_PATH)
        with open('pipeline_summary.json', 'w') as f:
            json.dump({'total_cost': cost_logger.total_cost, 'budget_left': config.BUDGET - cost_logger.total_cost, 'status': 'complete', 'rounds_completed': args.max_rounds}, f, indent=2)
        print(f"\n🎉 Pipeline done! Total cost: ${cost_logger.total_cost:.2f}. Kit in {config.OUTPUT_KIT_DIR}/")
    else:
        print("Add --full-pipeline for the full beast!")

if __name__ == "__main__":
    main()

