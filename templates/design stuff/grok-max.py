#!/usr/bin/env python3
"""
Document & Visualization Theme Scraper - Enhanced with Vision Capabilities for UI/Mods Link Collection.

New Features (based on MiniMax API docs):
- Vision analysis via MiniMax-VL-01: Analyzes repo screenshots and images for UI components, modular themes
- Agentic reasoning via MiniMax-M1: Parses README/HTML for GitHub links, scores for UI/mods relevance
- Dynamic query suggestions based on visual analysis
- Image metadata extraction and storage in database
- Visual similarity scoring for UI components
"""

import os
import json
import sqlite3
import logging
import asyncio
import aiohttp
import signal
import sys
import time
import re
import argparse
import csv
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, AsyncIterator, Set, Union
from pathlib import Path
from dataclasses import dataclass, field
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from tqdm.asyncio import tqdm
import requests
from itertools import cycle
import base64 # For README decoding

# For HTML parsing (optional)
try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False
    logging.warning("beautifulsoup4 not installed - HTML link extraction disabled (pip install beautifulsoup4)")

# Async database support
try:
    import aiosqlite
    HAS_AIOSQLITE = True
except ImportError:
    HAS_AIOSQLITE = False
    logging.warning("aiosqlite not available - database operations may be slower")

# Optional git
try:
    import git
    HAS_GIT = True
except ImportError:
    HAS_GIT = False

# Load env
load_dotenv()

# ==============================================================================
# Configuration
# ==============================================================================

@dataclass
class Config:
    """Configuration class for the Theme Scraper"""

    # API Configuration
    GITHUB_TOKEN: str = field(default_factory=lambda: os.getenv('GITHUB_TOKEN', ''))
    MINIMAX_API_KEYS: List[str] = field(default_factory=lambda: [
        os.getenv('MINIMAX_API_KEY1', ''),
        os.getenv('MINIMAX_API_KEY2', ''),
        os.getenv('MINIMAX_API_KEY3', ''),
        os.getenv('MINIMAX_API_KEY4', ''),
        os.getenv('MINIMAX_API_KEY5', ''),
    ])

    # Default model (M1 for agentic reasoning, VL-01 for vision)
    MINIMAX_MODEL: str = "MiniMax-M1"
    VISION_MODEL: str = "MiniMax-VL-01"

    # Database Configuration
    DB_PATH: str = 'themes.db'

    # Scraping Configuration
    BATCH_SIZE: int = 30
    MAX_CONCURRENT: int = 20
    AI_BATCH_SIZE: int = 5 # For agentic batches
    MAX_REPOS: int = 1000
    FRESH_DAYS: int = 730

    # Vision Configuration
    VISION_ENABLED: bool = False
    MAX_IMAGES_PER_REPO: int = 2
    IMAGE_EXTS: List[str] = field(default_factory=lambda: ['.png', '.jpg', '.jpeg', '.gif', '.svg'])
    IMAGE_PRIORITY: List[str] = field(default_factory=lambda: [
        'screenshot.png', 'demo.jpg', 'preview.gif', 'ui-theme.svg', 'diagram.png',
        'screenshot.jpg', 'screenshot.jpeg', 'screenshot.gif', 'demo.png', 'preview.png'
    ])

    # Agentic Configuration
    AGENTIC_MODE: bool = False
    SCRAPE_HTML: bool = HAS_BS4 # Fetch HTML for deeper link extraction
    MAX_LINKS_PER_REPO: int = 50
    AGENTIC_MAX_TOKENS: int = 4096 # For M1 reasoning outputs

    # File Paths
    CHECKPOINT_FILE: str = 'agent_checkpoint.json'
    TEMP_BATCH_FILE: str = 'temp_batch.json'
    DOWNLOAD_DIR: str = 'themes'

    # Default Queries (original + UI/Mods)
    DEFAULT_QUERIES: List[str] = field(default_factory=lambda: [
        # JSON Resume, Mermaid, etc. (your originals)
        'jsonresume-theme stars:>5', 'topic:jsonresume-theme stars:>3', '"jsonresume theme" in:description stars:>2', 'jsonresume theme in:name',
        'mermaid theme stars:>10', 'mermaid diagram template stars:>5', 'topic:mermaid-diagrams', 'mermaid flowchart example',
        'chartjs-chart stars:>20', 'chartjs-plugin stars:>10', 'topic:chartjs-plugin', 'chart.js theme',
        'react-flow example stars:>10', 'topic:reactflow', 'react flow diagram',
        'd3-chart template stars:>15', 'd3 visualization example stars:>10', 'topic:d3-visualization',
        'recharts example stars:>5', 'topic:recharts',
        'resume template html css stars:>10', 'cv template javascript stars:>5', 'document generator theme', 'portfolio template stars:>20',
        'billboard.js example', 'britecharts example', 'plottable chart',
        'infographic template javascript', 'data visualization template html',
        # NEW: UI/Mods focused (e.g., for Awesome lists, kits)
        'vue ui component stars:>10', 'react ui kit modular stars:>5', 'svelte theme mods plugin stars:>5',
        'awesome vue', 'awesome react ui', 'ui component library extensible stars:>5',
        'modular theme css js stars:>10', 'tailwind ui mods', 'bootstrap theme plugins', 'material ui react mods',
    ])

    # Categories (original + new)
    CATEGORIES: List[str] = field(default_factory=lambda: [
        'jsonresume_theme', 'mermaid_theme', 'chartjs_plugin', 'chartjs_example', 'react_flow_example',
        'd3_visualization', 'd3_chart_library', 'recharts_example', 'document_template', 'infographic_template',
        'portfolio_template', 'general_visualization', 'other',
        # NEW:
        'ui_component', 'modular_theme', 'ui_mods', 'awesome_list',
    ])

    # Tech Keywords (original + new)
    TECH_KEYWORDS: Dict[str, List[str]] = field(default_factory=lambda: {
        'jsonresume': ['jsonresume', 'resume.json', 'json resume', 'resume schema'],
        'mermaid': ['mermaid', 'mermaid.js', 'mermaidjs', 'flowchart', 'sequence diagram'],
        'chartjs': ['chart.js', 'chartjs', 'chartjs-plugin', 'chartjs-chart'],
        'react_flow': ['react-flow', 'reactflow', 'xyflow', 'node-based'],
        'd3': ['d3.js', 'd3-', 'd3 v', 'data-driven'],
        'recharts': ['recharts', 'react chart'],
        'typescript': ['typescript', '.ts', '.tsx'],
        'tailwind': ['tailwind', 'tailwindcss'],
        'bootstrap': ['bootstrap', 'bs-'],
        'sass': ['sass', 'scss', '.scss'],
        'less': ['less', '.less'],
        'react': ['react', 'jsx', '.jsx'],
        'vue': ['vue', 'vue.js'],
        'svelte': ['svelte', 'svelte.js'],
        # NEW: UI/Mods
        'ui_component': ['ui-kit', 'component', 'button', 'form', 'vue-component', 'react-component', 'svelte-component'],
        'modular_theme': ['mod', 'plugin', 'extensible', 'configurable', 'slots', 'props', 'module'],
    })

    # Heuristic Rules (original + new)
    HEURISTIC_RULES: Dict[str, List[str]] = field(default_factory=lambda: {
        'jsonresume_theme': ['jsonresume-theme', 'resume.json', 'json resume theme'],
        'mermaid_theme': ['mermaid theme', 'mermaid config', 'mermaid.config'],
        'chartjs_plugin': ['chartjs-plugin', 'chart.js plugin'],
        'chartjs_example': ['chart.js example', 'chartjs demo', 'chartjs sample'],
        'react_flow_example': ['react-flow', 'reactflow', 'react flow example'],
        'd3_visualization': ['d3 visualization', 'd3.js viz', 'd3 chart', 'd3 graph'],
        'd3_chart_library': ['billboard.js', 'britecharts', 'plottable', 'dc.js'],
        'recharts_example': ['recharts', 'recharts example'],
        'document_template': ['resume template', 'cv template', 'document template'],
        'infographic_template': ['infographic', 'data visualization template'],
        'portfolio_template': ['portfolio', 'personal website template'],
        # NEW:
        'ui_component': ['ui component', 'ui kit', 'vue ui', 'react ui', 'svelte ui', 'component library'],
        'modular_theme': ['modular theme', 'theme mod', 'plugin system', 'extensible ui', 'configurable mod'],
    })

    def validate(self):
        if not self.GITHUB_TOKEN:
            logging.warning("No GitHub token - rate limits restrictive")
        valid_keys = [k for k in self.MINIMAX_API_KEYS if k]
        if self.USE_AI and not valid_keys:
            logging.warning("AI requested but no MiniMax keys")
        elif valid_keys:
            logging.info(f"Loaded {len(valid_keys)} MiniMax API keys")
        if self.SCRAPE_HTML and not HAS_BS4:
            logging.warning("HTML scraping enabled but no BeautifulSoup - install it")
        if self.VISION_ENABLED and not valid_keys:
            logging.warning("Vision enabled but no MiniMax keys - disabling vision")
            self.VISION_ENABLED = False

    @property
    def USE_AI(self) -> bool:
        return any(self.MINIMAX_API_KEYS)

# ==============================================================================
# Custom Exceptions (unchanged)
# ==============================================================================

class ScraperError(Exception):
    pass

class GitHubAPIError(ScraperError):
    pass

class RateLimitError(GitHubAPIError):
    pass

class DatabaseError(ScraperError):
    pass

# ==============================================================================
# Logging (unchanged)
# ==============================================================================

def setup_logging(verbose: bool = False, log_file: str = 'theme_scraper.log'):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.FileHandler(log_file), logging.StreamHandler()]
    )
    return logging.getLogger(__name__)

# ==============================================================================
# Rate Limiter (unchanged)
# ==============================================================================

class RateLimiter:
    def __init__(self, token: Optional[str] = None):
        self.token = token
        self._session = None
        self.remaining = 5000 if token else 60
        self.reset_timestamp = int(time.time()) + 3600
        self.poll_interval = 5
        self.call_count = 0
        self.lock = asyncio.Lock()

    async def check_and_wait(self):
        async with self.lock:
            self.call_count += 1
            if self.call_count % self.poll_interval != 0 or self.remaining > 100:
                return
            if self._session is None:
                self._session = aiohttp.ClientSession()
            headers = {'Authorization': f'token {self.token}'} if self.token else {}
            try:
                timeout = aiohttp.ClientTimeout(total=5)
                async with self._session.get('https://api.github.com/rate_limit', headers=headers, timeout=timeout) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        core = data['resources']['core']
                        self.remaining = core['remaining']
                        self.reset_timestamp = core['reset']
                        if self.remaining < 50:
                            wait_sec = max(3600 - (int(time.time()) - self.reset_timestamp) + 60, 300)
                            logging.warning(f"Rate limit low ({self.remaining}), pausing {wait_sec}s")
                            await asyncio.sleep(wait_sec)
                            await self.check_and_wait()
            except Exception as e:
                logging.debug(f"Rate check error: {e}")
            finally:
                if self._session:
                    await self._session.close()
                    self._session = None

# ==============================================================================
# MiniMax Client (MODIFIED: Aligned with docs, M1 default, error handling, top_p, vision support)
# ==============================================================================

class MiniMaxClient:
    def __init__(self, api_keys: List[str], model: str = "MiniMax-M1"):
        self.api_keys = [key for key in api_keys if key]
        if not self.api_keys:
            raise ValueError("No valid MiniMax API keys")
        self.key_cycle = cycle(self.api_keys)
        self.current_key = next(self.key_cycle)
        self.base_url = "https://api.minimax.io/v1/text/chatcompletion_v2"
        self.model = model # e.g., "MiniMax-M1" for reasoning, "MiniMax-VL-01" for vision
        logging.info(f"MiniMax client init with {len(self.api_keys)} keys, model: {model}")

    def _get_next_key(self):
        self.current_key = next(self.key_cycle)
        return self.current_key

    def chat_completion(self, messages: List[Dict], max_tokens: int = 4096, temperature: float = 0.8,
                        top_p: float = 0.95, stream: bool = False, multimodal: bool = False) -> Dict:
        """
        Call MiniMax chatcompletion_v2 (aligned with docs).
        Uses M1 defaults: max_tokens=8192, temp=1.0 (overridden here for control).
        Handles base_resp errors, sensitive content, key rotation.
        Supports multimodal content when multimodal=True.
        """
        headers = {
            "Authorization": f"Bearer {self.current_key}",
            "Content-Type": "application/json"
        }

        # Format messages per docs: role, content (str or array), name (role-based, optional but used for clarity)
        formatted_messages = []
        for msg in messages:
            formatted_msg = {
                "role": msg["role"],
            }
            
            # Handle content as either string or array (for multimodal)
            content = msg.get("content", "")
            if multimodal and isinstance(content, list):
                formatted_msg["content"] = content  # Array: [{"type": "text", ...}, {"type": "image_url", ...}]
            else:
                formatted_msg["content"] = str(content)  # Ensure string otherwise

            if msg["role"] == "system":
                formatted_msg["name"] = "MiniMax AI"
            elif msg["role"] == "user":
                formatted_msg["name"] = "user"
            elif msg["role"] == "assistant":
                formatted_msg["name"] = "MiniMax AI"
            
            formatted_messages.append(formatted_msg)

        payload = {
            "model": self.model,
            "messages": formatted_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "stream": stream
        }

        max_retries = len(self.api_keys)
        last_error = None

        for attempt in range(max_retries):
            try:
                response = requests.post(self.base_url, headers=headers, json=payload, timeout=60)

                if response.status_code == 200:
                    result = response.json()

                    # Check base_resp per docs
                    base_resp = result.get('base_resp', {})
                    if base_resp.get('status_code', 0) != 0:
                        error_msg = base_resp.get('status_msg', 'Unknown error')
                        last_error = f"MiniMax error {base_resp['status_code']}: {error_msg}"
                        logging.error(last_error)
                        if base_resp['status_code'] == 1002:  # Rate limit
                            time.sleep(2)
                        if base_resp['status_code'] == 1008:  # Insufficient balance
                            raise ValueError("Insufficient MiniMax balance - check account")
                        continue

                    # Log sensitive content if any
                    if result.get('input_sensitive', False):
                        logging.warning(f"Input sensitive (type: {result.get('input_sensitive_type')})")
                    if result.get('output_sensitive', False):
                        logging.warning(f"Output sensitive (type: {result.get('output_sensitive_type')})")

                    # Extract content from choices[0]
                    if 'choices' in result and len(result['choices']) > 0:
                        choice = result['choices'][0]
                        if 'message' in choice:
                            content = choice['message'].get('content', '')
                        elif stream and 'delta' in choice:
                            content = choice['delta'].get('content', '')
                        else:
                            content = ''

                    # Log usage
                    usage = result.get('usage', {})
                    logging.info(f"Tokens used: {usage.get('total_tokens', 0)} (prompt: {usage.get('prompt_tokens', 0)}, completion: {usage.get('completion_tokens', 0)})")

                    return {
                        'choices': [{'message': {'content': content}}],
                        'usage': usage  # Expose for monitoring
                    }

                    return result

                elif response.status_code == 401:
                    logging.warning("Invalid key, rotating")
                    self._get_next_key()
                    headers["Authorization"] = f"Bearer {self.current_key}"
                    continue
                elif response.status_code == 429:
                    logging.warning("Rate limited, rotating + wait")
                    self._get_next_key()
                    headers["Authorization"] = f"Bearer {self.current_key}"
                    time.sleep(2)
                    continue
                else:
                    last_error = f"HTTP {response.status_code}: {response.text}"
                    logging.error(last_error)
                    if attempt < max_retries - 1:
                        self._get_next_key()
                        headers["Authorization"] = f"Bearer {self.current_key}"
                        time.sleep(1)
                        continue

            except requests.exceptions.Timeout:
                last_error = "Timeout"
                logging.error(f"Timeout, attempt {attempt+1}")
                if attempt < max_retries - 1:
                    self._get_next_key()
                    time.sleep(2)
                    continue
            except Exception as e:
                last_error = str(e)
                if attempt < max_retries - 1:
                    self._get_next_key()
                    time.sleep(1)
                    continue

        raise Exception(f"MiniMax failed after {max_retries} attempts: {last_error}")

# ==============================================================================
# Database Manager (as in my previous response - with new columns for images)
# ==============================================================================

class DatabaseManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        try:
            with sqlite3.connect(self.db_path, timeout=30) as conn:
                cursor = conn.cursor()

                cursor.execute('''
                CREATE TABLE IF NOT EXISTS themes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    repo_name TEXT,
                    full_name TEXT UNIQUE,
                    description TEXT,
                    stars INTEGER,
                    forks INTEGER DEFAULT 0,
                    url TEXT,
                    clone_url TEXT,
                    last_updated TEXT,
                    readme TEXT,
                    main_file TEXT,
                    file_preview TEXT,
                    file_type TEXT,
                    tech_stack TEXT,
                    features TEXT,
                    is_valid BOOLEAN DEFAULT 0,
                    category TEXT DEFAULT 'other',
                    ai_description TEXT DEFAULT '',
                    ai_features TEXT,
                    ai_use_case TEXT DEFAULT '',
                    keywords TEXT,
                    quality_score INTEGER DEFAULT 0,
                    freshness_days INTEGER DEFAULT 0,
                    processing_errors TEXT,
                    processing_status TEXT DEFAULT 'scraped',
                    scraped_at TEXT,
                    has_demo BOOLEAN DEFAULT 0,
                    demo_url TEXT,
                    npm_package TEXT,
                    license TEXT,
                    related_links TEXT,
                    agent_suggestions TEXT,
                    ui_mods_score INTEGER DEFAULT 0,
                    images TEXT
                )
                ''')

                # Add missing columns (includes new ones)
                cursor.execute("PRAGMA table_info(themes)")
                columns = [col[1] for col in cursor.fetchall()]

                missing_columns = {
                    'freshness_days': 'INTEGER DEFAULT 0',
                    'quality_score': 'INTEGER DEFAULT 0',
                    'processing_errors': 'TEXT',
                    'processing_status': 'TEXT DEFAULT "scraped"',
                    'scraped_at': 'TEXT',
                    'ai_description': 'TEXT DEFAULT ""',
                    'ai_features': 'TEXT',
                    'ai_use_case': 'TEXT DEFAULT ""',
                    'has_demo': 'BOOLEAN DEFAULT 0',
                    'demo_url': 'TEXT',
                    'npm_package': 'TEXT',
                    'license': 'TEXT',
                    'related_links': 'TEXT',
                    'agent_suggestions': 'TEXT',
                    'ui_mods_score': 'INTEGER DEFAULT 0',
                    'images': 'TEXT',
                }

                for col, type_def in missing_columns.items():
                    if col not in columns:
                        cursor.execute(f'ALTER TABLE themes ADD COLUMN {col} {type_def}')

                # Indexes (includes new)
                indexes = [
                    'CREATE INDEX IF NOT EXISTS idx_category ON themes(category)',
                    'CREATE INDEX IF NOT EXISTS idx_stars ON themes(stars DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_full_name ON themes(full_name)',
                    'CREATE INDEX IF NOT EXISTS idx_freshness ON themes(freshness_days)',
                    'CREATE INDEX IF NOT EXISTS idx_quality ON themes(quality_score DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_status ON themes(processing_status)',
                    'CREATE INDEX IF NOT EXISTS idx_ui_mods ON themes(ui_mods_score DESC)',
                ]
                for idx in indexes:
                    cursor.execute(idx)

                cursor.execute('PRAGMA vacuum;')
                cursor.execute('ANALYZE themes;')
                conn.commit()
                logging.info("DB initialized")
        except Exception as e:
            logging.error(f"DB init failed: {e}")
            raise DatabaseError(f"DB init error: {e}")

    @asynccontextmanager
    async def get_connection(self):
        conn = await aiosqlite.connect(self.db_path, timeout=30)
        try:
            yield conn
        finally:
            await conn.close()

    async def batch_insert_or_update(self, entries: List[Dict]):
        if not entries:
            return
        async with self.get_connection() as conn:
            try:
                await conn.execute("BEGIN TRANSACTION")
                for entry in entries:
                    entry = self._validate_entry(entry)
                    await conn.execute('''
                    INSERT OR REPLACE INTO themes
                    (repo_name, full_name, description, stars, forks, url, clone_url, last_updated,
                    readme, main_file, file_preview, file_type, tech_stack, features, is_valid,
                    category, ai_description, ai_features, ai_use_case, keywords, quality_score,
                    freshness_days, processing_errors, processing_status, scraped_at,
                    has_demo, demo_url, npm_package, license, related_links, agent_suggestions, ui_mods_score, images)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        entry['repo_name'], entry['full_name'], entry['description'][:500],
                        entry['stars'], entry['forks'], entry['url'], entry['clone_url'],
                        entry['last_updated'], entry['readme'][:10000], entry['main_file'][:100000],
                        entry['file_preview'][:2000], entry['file_type'],
                        json.dumps(entry['tech_stack']) if entry['tech_stack'] else '[]',
                        json.dumps(entry['features']) if entry['features'] else '[]',
                        int(entry['is_valid']), entry['category'], entry['ai_description'][:500],
                        json.dumps(entry['ai_features']) if entry['ai_features'] else '[]',
                        entry['ai_use_case'][:300], json.dumps(entry['keywords']) if entry['keywords'] else '[]',
                        entry['quality_score'], entry['freshness_days'], entry['processing_errors'][:500],
                        entry['processing_status'], entry['scraped_at'],
                        int(entry['has_demo']), entry.get('demo_url', ''), entry.get('npm_package', ''),
                        entry.get('license', ''),
                        json.dumps(entry.get('related_links', [])),
                        json.dumps(entry.get('agent_suggestions', {})),
                        entry.get('ui_mods_score', 0),
                        json.dumps(entry.get('images', []))
                    ))
                await conn.commit()
                logging.info(f"Batch insert {len(entries)} entries")
            except Exception as e:
                await conn.rollback()
                logging.error(f"Batch insert failed: {e}")
                raise DatabaseError(f"Batch insert error: {e}")

    def _validate_entry(self, entry: Dict) -> Dict:
        entry.setdefault('forks', 0)
        entry.setdefault('description', '')
        entry.setdefault('stars', 0)
        entry.setdefault('url', '')
        entry.setdefault('clone_url', '')
        entry.setdefault('last_updated', datetime.now().isoformat())
        entry.setdefault('readme', '')
        entry.setdefault('main_file', '')
        entry.setdefault('file_preview', '')
        entry.setdefault('file_type', 'unknown')
        entry.setdefault('tech_stack', [])
        entry.setdefault('features', [])
        entry.setdefault('is_valid', False)
        entry.setdefault('category', 'other')
        entry.setdefault('ai_description', '')
        entry.setdefault('ai_features', [])
        entry.setdefault('ai_use_case', 'General theme')
        entry.setdefault('keywords', [])
        entry.setdefault('processing_errors', '')
        entry.setdefault('has_demo', False)
        entry.setdefault('related_links', [])
        entry.setdefault('agent_suggestions', {})
        entry.setdefault('ui_mods_score', 0)
        entry.setdefault('images', [])

        # Calc quality
        entry['quality_score'] = self._calc_quality_score(entry)
        entry['freshness_days'] = self._calc_freshness(entry.get('last_updated', ''))
        entry['scraped_at'] = datetime.now().isoformat()
        entry['repo_name'] = entry.get('repo_name', entry.get('full_name', '').split('/')[-1] or 'unknown')
        entry['processing_status'] = entry.get('processing_status', 'scraped')

        # NEW: UI/Mods score
        ui_mods_score = 0
        if any(cat in entry['category'] for cat in ['ui_component', 'modular_theme', 'ui_mods', 'awesome_list']):
            ui_mods_score += 20
        ui_mods_score += min(20, len(entry.get('related_links', [])) * 2)
        tech_lower = ' '.join(entry.get('tech_stack', [])).lower()
        if any(kw in tech_lower for kw in ['ui', 'mod', 'component', 'plugin']):
            ui_mods_score += 10
        
        # Vision boost: if images are analyzed and show UI components
        if entry.get('images'):
            for img in entry['images']:
                if img.get('ui_relevance', 0) > 5:
                    ui_mods_score += min(10, img['ui_relevance'])
        
        entry['ui_mods_score'] = min(50, ui_mods_score)

        return entry

    def _calc_quality_score(self, entry: Dict) -> int:
        score = 0
        stars = entry.get('stars', 0)
        score += min(40, int(stars / 5))
        if entry.get('readme'):
            score += 10
        if entry.get('has_demo'):
            score += 15
        tech_count = len(entry.get('tech_stack', []))
        score += min(15, tech_count * 3)
        features_count = len(entry.get('features', []))
        score += min(10, features_count * 2)
        freshness = entry.get('freshness_days', 9999)
        if freshness < 180:
            score += 10
        elif freshness < 365:
            score += 7
        elif freshness < 730:
            score += 4
        # NEW: Boost for UI/Mods
        score += entry.get('ui_mods_score', 0) // 2
        
        # Vision boost: if images are analyzed and show high-quality UI
        if entry.get('images'):
            for img in entry['images']:
                if img.get('quality_score', 0) > 5:
                    score += min(5, img['quality_score'])
        
        return min(100, score)

    def _calc_freshness(self, updated_str: str) -> int:
        if not updated_str:
            return 9999
        try:
            updated = datetime.fromisoformat(updated_str.replace('Z', '+00:00'))
            now = datetime.now(updated.tzinfo)
            days = int((now - updated).total_seconds() / 86400)
            return max(0, days)
        except:
            return 9999

    async def get_processed_full_names(self) -> Set[str]:
        try:
            async with self.get_connection() as conn:
                cursor = await conn.execute('SELECT full_name FROM themes WHERE processing_status != "error"')
                return {row[0] for row in await cursor.fetchall()}
        except Exception as e:
            logging.error(f"Get processed names failed: {e}")
            return set()

    async def query_top(self, category: str = None, top_n: int = 50, min_stars: int = 3,
                       fresh_only: bool = False, fresh_days: int = 730, ui_mods_focus: bool = False) -> List[Dict]:
        try:
            async with self.get_connection() as conn:
                where = []
                params = []
                if category:
                    where.append('category = ?')
                    params.append(category)
                if fresh_only:
                    where.append('freshness_days < ?')
                    params.append(fresh_days)
                if ui_mods_focus:
                    where.append('ui_mods_score > 10')
                where_clause = ' AND '.join(where) if where else '1=1'
                cursor = await conn.execute(f'''
                SELECT repo_name, full_name, description, category, ai_use_case, stars, forks, url,
                file_type, keywords, ai_description, ai_features, processing_errors,
                quality_score, freshness_days, processing_status, has_demo, demo_url,
                npm_package, license, tech_stack, related_links, agent_suggestions, ui_mods_score, images
                FROM themes
                WHERE {where_clause} AND stars >= ? AND is_valid = 1 AND processing_status != 'error'
                ORDER BY quality_score DESC, ui_mods_score DESC, stars DESC LIMIT ?
                ''', params + [min_stars, top_n])
                rows = await cursor.fetchall()
                themes = []
                for row in rows:
                    kw = json.loads(row[9] or '[]')
                    feats = json.loads(row[11] or '[]')
                    tech = json.loads(row[20] or '[]')
                    links = json.loads(row[21] or '[]')
                    suggestions = json.loads(row[22] or '{}')
                    images = json.loads(row[24] or '[]')
                    themes.append({
                        'repo_name': row[0] or 'unknown',
                        'full_name': row[1],
                        'description': row[2] or '',
                        'category': row[3] or 'other',
                        'use_case': row[4] or 'General',
                        'stars': row[5] or 0,
                        'forks': row[6] or 0,
                        'url': row[7] or '',
                        'file_type': row[8] or 'unknown',
                        'keywords': kw,
                        'ai_description': row[10] or '',
                        'ai_features': feats,
                        'errors': row[12] or None,
                        'quality_score': row[13] or 0,
                        'freshness_days': row[14] or 9999,
                        'status': row[15] or 'scraped',
                        'has_demo': bool(row[16]),
                        'demo_url': row[17] or '',
                        'npm_package': row[18] or '',
                        'license': row[19] or '',
                        'tech_stack': tech,
                        'related_links': links,
                        'agent_suggestions': suggestions,
                        'ui_mods_score': row[23] or 0,
                        'images': images
                    })
                return themes
        except Exception as e:
            logging.error(f"Query top failed: {e}")
            return []

    async def count_rows(self) -> int:
        try:
            async with self.get_connection() as conn:
                cursor = await conn.execute('SELECT COUNT(*) FROM themes')
                return (await cursor.fetchone())[0]
        except:
            return 0

    async def rebuild(self):
        try:
            async with self.get_connection() as conn:
                cursor = await conn.execute('PRAGMA integrity_check;')
                integrity = (await cursor.fetchone())[0]
                if 'ok' not in integrity.lower():
                    logging.warning(f"DB integrity: {integrity}")
                await conn.execute('REINDEX;')
                await conn.execute('VACUUM;')
                await conn.execute('ANALYZE;')
                await conn.commit()
                logging.info("DB rebuilt")
        except Exception as e:
            logging.error(f"DB rebuild failed: {e}")
            raise DatabaseError(f"Rebuild error: {e}")

    async def close(self):
        pass

# ==============================================================================
# Checkpoint Manager (unchanged)
# ==============================================================================

class CheckpointManager:
    def __init__(self, checkpoint_file: str = 'agent_checkpoint.json', temp_batch_file: str = 'temp_batch.json'):
        self.checkpoint_file = checkpoint_file
        self.temp_batch_file = temp_batch_file

    def save(self, processed: Set[str], total_new: int, queries_used: Dict, start_pages: Dict, query_idx: int):
        data = {
            'processed': list(processed),
            'total_new': total_new,
            'queries_used': queries_used,
            'start_pages': start_pages,
            'query_idx': query_idx
        }
        with open(self.checkpoint_file, 'w') as f:
            json.dump(data, f, indent=2)
        logging.info("Checkpoint saved")

    def load(self) -> tuple[Set[str], Dict, int, Dict]:
        try:
            with open(self.checkpoint_file, 'r') as f:
                data = json.load(f)
            return (
                set(data.get('processed', [])),
                data.get('start_pages', {}),
                data.get('query_idx', 0),
                data.get('queries_used', {})
            )
        except FileNotFoundError:
            logging.info("No checkpoint - starting fresh")
            return set(), {}, 0, {}
        except Exception as e:
            logging.error(f"Load checkpoint failed: {e}")
            return set(), {}, 0, {}

    def cleanup(self):
        Path(self.temp_batch_file).unlink(missing_ok=True)

# ==============================================================================
# Theme Analyzer (COMPLETED: Link extraction + agentic reasoning with M1 + Vision)
# ==============================================================================

class ThemeAnalyzer:
    def __init__(self, minimax_client: Optional[MiniMaxClient] = None, config: Optional[Config] = None):
        self.minimax = minimax_client
        self.use_ai = minimax_client is not None
        self.config = config or Config()

    def analyze_files(self, files: List[Dict], repo_info: Dict, readme: str = '', html_content: str = '') -> Dict[str, Any]:
        result = {
            'error': '',
            'file_type': 'unknown',
            'tech_stack': [],
            'features': [],
            'is_valid': False,
            'file_preview': '',
            'keywords': [],
            'has_demo': False,
            'demo_url': '',
            'npm_package': '',
            'related_links': [], # NEW
            'ui_mods_score': 0, # Temp, finalized in DB
            'images': [], # NEW
        }

        if not files:
            result['error'] = 'No files found'
            return result

        # Detect extensions/tech (original logic)
        file_extensions = {f.get('name', '').lower().split('.')[-1] for f in files if '.' in f.get('name', '')}
        content_sample = ' '.join(f.get('name', '') for f in files[:20]).lower()
        tech_stack = []
        for tech, keywords in self.config.TECH_KEYWORDS.items():
            if any(kw in content_sample for kw in keywords):
                tech_stack.append(tech)
        if 'ts' in file_extensions or 'tsx' in file_extensions:
            tech_stack.append('typescript')
        if 'jsx' in file_extensions:
            tech_stack.append('react')
        if 'scss' in file_extensions:
            tech_stack.append('sass')
        if 'less' in file_extensions:
            tech_stack.append('less')
        if 'vue' in file_extensions:
            tech_stack.append('vue')
        result['tech_stack'] = list(set(tech_stack))

        # Main file preview (original)
        priority_files = ['index.js', 'index.ts', 'index.html', 'package.json', 'README.md', 'theme.js', 'style.css', 'main.js']
        main_file_content = ''
        for priority in priority_files:
            matching = [f for f in files if f.get('name', '').lower() == priority.lower()]
            if matching:
                main_file_content = f"Found: {matching[0].get('name')}"
                break
        result['file_preview'] = main_file_content[:2000]

        # Demo check
        has_demo = any('demo' in f.get('name', '').lower() or 'example' in f.get('name', '').lower() for f in files)
        result['has_demo'] = has_demo

        # NPM check
        has_package_json = any(f.get('name', '').lower() == 'package.json' for f in files)
        if has_package_json:
            result['npm_package'] = repo_info.get('full_name', '').split('/')[-1]

        # File type (original + UI/Mods)
        if 'jsonresume' in content_sample:
            result['file_type'] = 'jsonresume_theme'
        elif 'mermaid' in content_sample:
            result['file_type'] = 'mermaid_theme'
        elif 'chart' in content_sample and 'js' in content_sample:
            result['file_type'] = 'chartjs_related'
        elif 'react-flow' in content_sample or 'reactflow' in content_sample:
            result['file_type'] = 'react_flow'
        elif 'd3' in content_sample:
            result['file_type'] = 'd3_visualization'
        elif 'recharts' in content_sample:
            result['file_type'] = 'recharts'
        elif any(kw in content_sample for kw in ['ui component', 'ui kit', 'modular', 'plugin']):
            result['file_type'] = 'ui_mods'
        else:
            result['file_type'] = 'general'

        # Keywords
        repo_text = (repo_info.get('description', '') + ' ' + repo_info.get('repo_name', '')).lower()
        keywords = re.findall(r'\b\w{4,}\b', repo_text)
        result['keywords'] = list(set(keywords))[:15]

        # Validate
        result['is_valid'] = len(files) > 0 and len(result['tech_stack']) > 0 and result['file_type'] != 'unknown'

        # NEW: Extract links from README/HTML
        result['related_links'] = self.extract_links(readme, html_content, repo_info)

        # NEW: Extract images if vision is enabled
        if self.config.VISION_ENABLED:
            result['images'] = self.extract_images(files, repo_info)

        return result

    def extract_links(self, readme: str, html_content: str, repo_info: Dict) -> List[Dict]:
        """Extract all GitHub repo links from README/HTML, score for UI/mods relevance (heuristic + simple regex)."""
        links = []
        texts = [readme.lower()] if readme else []
        if self.config.SCRAPE_HTML and html_content and HAS_BS4:
            soup = BeautifulSoup(html_content, 'html.parser')
            # Extract from README render, links, lists (e.g., Awesome lists)
            texts.append(soup.get_text().lower())
            # Find <a> with href
            for a in soup.find_all('a', href=True):
                href = a['href']
                if 'github.com' in href:
                    texts[-1] += f" {href}"

        all_text = ' '.join(texts)

        # Regex for GitHub repos (e.g., github.com/user/repo or user/repo)
        github_links = re.findall(r'(?:github\.com/|)([\w\-]+/[\w\-]+)(?:\s|\)|")', all_text)
        github_links = list(set(github_links[-self.config.MAX_LINKS_PER_REPO:])) # Dedup + limit

        for link in github_links:
            if not link.startswith('http'):
                full_url = f"https://github.com/{link}"
            else:
                full_url = link
            # Heuristic score (0-10) for UI/mods
            score = 0
            link_lower = link.lower()
            if any(kw in link_lower for kw in ['ui', 'component', 'kit', 'theme', 'mod', 'plugin', 'vue', 'react', 'svelte', 'awesome']):
                score += 5
            if 'stars' in all_text or 'repo' in all_text: # Context boost
                score += 3
            if any(cat in link_lower for cat in self.config.CATEGORIES):
                score += 2
            links.append({
                'url': full_url,
                'type': 'ui_component' if 'ui' in link_lower else 'modular_theme' if 'mod' in link_lower else 'other',
                'relevance_score': min(10, score),
                'source': 'readme' if readme else 'html' if html_content else 'text'
            })

        logging.info(f"Extracted {len(links)} links from {repo_info.get('full_name', 'unknown')}")
        return links[:self.config.MAX_LINKS_PER_REPO]

    def extract_images(self, files: List[Dict], repo_info: Dict) -> List[Dict]:
        """Extract image files from repository for vision analysis."""
        images = []
        
        # Filter for image files
        image_files = [f for f in files if any(f.get('name', '').lower().endswith(ext) for ext in self.config.IMAGE_EXTS)]
        
        # Prioritize important images
        prioritized = []
        others = []
        
        for img in image_files:
            name_lower = img.get('name', '').lower()
            if any(priority in name_lower for priority in self.config.IMAGE_PRIORITY):
                prioritized.append(img)
            else:
                others.append(img)
        
        # Combine prioritized images first, then others
        sorted_images = prioritized + others
        
        # Limit to max images per repo
        for img in sorted_images[:self.config.MAX_IMAGES_PER_REPO]:
            # Get raw URL for GitHub
            download_url = img.get('download_url', '')
            if not download_url and 'github.com' in repo_info.get('clone_url', ''):
                # Construct raw URL if not provided
                path = img.get('path', img.get('name', ''))
                download_url = f"https://raw.githubusercontent.com/{repo_info['full_name']}/main/{path}"
            
            images.append({
                'name': img.get('name', ''),
                'path': img.get('path', ''),
                'url': download_url,
                'size': img.get('size', 0),
                'ui_relevance': 0,  # To be filled by vision analysis
                'quality_score': 0,  # To be filled by vision analysis
                'description': '',  # To be filled by vision analysis
            })
        
        return images

    async def ai_categorize_batch(self, entries: List[Dict]) -> List[Dict]:
        """Original categorize + heuristic fallback with vision support."""
        if not self.use_ai:
            return [self._heuristic_categorize(entry) for entry in entries]
        
        try:
            # Build multimodal content if vision is enabled
            multimodal_content = []
            prompt_text = (
                f"Categorize these web/UI themes/mods. Categories: {', '.join(self.config.CATEGORIES)}. "
                "For each: category, ai_description (brief), ai_features (list <=5), ai_use_case. "
                "JSON array only, no extra text.\n\n"
            )
            
            # Add text part
            multimodal_content.append({"type": "text", "text": prompt_text})
            
            # Process each entry
            for entry in entries:
                entry_text = (
                    f"Repo: {entry['full_name']}\nDesc: {entry.get('description', '')}\n"
                    f"Type: {entry.get('file_type', 'unknown')}\nTech: {', '.join(entry.get('tech_stack', []))}\n"
                    f"Keywords: {', '.join(entry.get('keywords', []))}\nLinks: {len(entry.get('related_links', []))}\n"
                )
                multimodal_content.append({"type": "text", "text": entry_text})
                
                # Add images if available
                if self.config.VISION_ENABLED and entry.get('images'):
                    for img in entry['images'][:self.config.MAX_IMAGES_PER_REPO]:
                        if img.get('url'):
                            multimodal_content.append({
                                "type": "image_url",
                                "image_url": {"url": img['url']}
                            })
                
                multimodal_content.append({"type": "text", "text": "---\n"})
            
            response = self.minimax.chat_completion(
                messages=[
                    {"role": "system", "content": "You categorize web themes/UI/mods. Respond with valid JSON array."},
                    {"role": "user", "content": multimodal_content if self.config.VISION_ENABLED else prompt_text}
                ],
                max_tokens=self.config.AGENTIC_MAX_TOKENS,
                temperature=0.7,
                multimodal=self.config.VISION_ENABLED
            )
            
            raw_output = response['choices'][0]['message']['content']
            results = self._extract_json(raw_output)
            
            for entry, result in zip(entries, results + [{}] * (len(entries) - len(results))): # Pad if short
                if result:
                    entry.update({
                        'category': result.get('category', 'other'),
                        'ai_description': result.get('ai_description', ''),
                        'ai_features': result.get('ai_features', []),
                        'ai_use_case': result.get('ai_use_case', 'General theme')
                    })
                else:
                    entry.update(self._heuristic_categorize(entry))
            
            return entries
        except Exception as e:
            logging.error(f"AI categorize failed: {e}")
            return [self._heuristic_categorize(entry) for entry in entries]

    # NEW: Agentic reasoning batch (uses M1 for step-by-step thinking with vision)
    async def agentic_reasoning_batch(self, entries: List[Dict], previous_suggestions: Dict = {}) -> tuple[List[Dict], Dict]:
        """Agentic loop: Feed batch to M1/VL-01 for link scoring, categorization, suggestions. Reasons step-by-step."""
        if not self.use_ai:
            return entries, previous_suggestions

        try:
            # Build multimodal content if vision is enabled
            multimodal_content = []
            
            # Add text part
            prompt_text = (
                "You are an agentic scraper for UI components and modular themes/mods. Reason step-by-step:\n"
                "1. For each repo: Analyze desc/files/links/images for UI (components/kits) or mods (plugins/extensible) relevance. "
                "Score ui_mods_score (0-50). Extract/refine related_links (GitHub repos, score 0-10, type: 'ui_component'|'modular_theme'|'other').\n"
                "2. Categorize into: {categories}.\n"
                "3. Suggest 3 new queries/repos to chain (e.g., if Vue UI found, suggest 'svelte ui mods'). Base on patterns.\n"
                "4. Update ai_features (top 5), ai_use_case.\n"
                "Output ONLY valid JSON: {'updated_entries': [array of dicts], 'suggestions': {{'new_queries': [str], 'priority_repos': [str], 'reasoning': str}}}.\n"
                "Previous suggestions: {prev_sugg}\n\n"
                f"Categories: {', '.join(self.config.CATEGORIES)}\n\n".format(
                    categories=', '.join(self.config.CATEGORIES), 
                    prev_sugg=json.dumps(previous_suggestions)
                )
            )
            
            multimodal_content.append({"type": "text", "text": prompt_text})
            
            # Append batch data (summarize to fit context: ~50k tokens total)
            for i, entry in enumerate(entries[:self.config.AI_BATCH_SIZE], 1):
                links_str = json.dumps(entry.get('related_links', [])[:10]) # Top 10 links
                entry_text = (
                    f"Repo {i}: {entry['full_name']}\nDesc: {entry.get('description', '')[:500]}\n"
                    f"Files: {entry.get('file_type', '')}, Tech: {', '.join(entry.get('tech_stack', [])[:5])}\n"
                    f"Links: {links_str}\n"
                )
                multimodal_content.append({"type": "text", "text": entry_text})
                
                # Add images if available
                if self.config.VISION_ENABLED and entry.get('images'):
                    for img in entry['images'][:self.config.MAX_IMAGES_PER_REPO]:
                        if img.get('url'):
                            multimodal_content.append({
                                "type": "image_url",
                                "image_url": {"url": img['url']}
                            })
                
                multimodal_content.append({"type": "text", "text": "---\n"})
            
            # Determine which model to use based on vision
            model = self.config.VISION_MODEL if self.config.VISION_ENABLED and any(entry.get('images') for entry in entries) else self.config.MINIMAX_MODEL
            
            # Call model with higher temp for creative suggestions, larger tokens
            response = self.minimax.chat_completion(
                messages=[
                    {"role": "system", "content": "Reason step-by-step as an agentic UI/mods scraper with vision. Output strict JSON."},
                    {"role": "user", "content": multimodal_content if self.config.VISION_ENABLED else prompt_text}
                ],
                max_tokens=self.config.AGENTIC_MAX_TOKENS,
                temperature=0.8, # Balanced for reasoning + creativity
                top_p=0.95,
                multimodal=self.config.VISION_ENABLED
            )

            raw_output = response['choices'][0]['message']['content']
            parsed = self._extract_json(raw_output)[0] if self._extract_json(raw_output) else {}

            updated_entries = parsed.get('updated_entries', [])
            new_suggestions = parsed.get('suggestions', {})

            # Merge back to entries
            for i, updated in enumerate(updated_entries):
                if i < len(entries):
                    entries[i].update({
                        'ui_mods_score': updated.get('ui_mods_score', entries[i].get('ui_mods_score', 0)),
                        'related_links': updated.get('related_links', entries[i].get('related_links', [])),
                        'category': updated.get('category', entries[i]['category']),
                        'ai_features': updated.get('ai_features', entries[i]['ai_features']),
                        'ai_use_case': updated.get('ai_use_case', entries[i]['ai_use_case']),
                        'agent_suggestions': new_suggestions, # Apply to all in batch
                    })
                    
                    # Update image analysis if provided
                    if entries[i].get('images') and updated.get('image_analyses'):
                        for j, img in enumerate(entries[i]['images']):
                            if j < len(updated['image_analyses']):
                                img.update({
                                    'ui_relevance': updated['image_analyses'][j].get('ui_relevance', 0),
                                    'quality_score': updated['image_analyses'][j].get('quality_score', 0),
                                    'description': updated['image_analyses'][j].get('description', ''),
                                })

            # Merge suggestions (e.g., accumulate new queries)
            all_suggestions = previous_suggestions.copy()
            all_suggestions['new_queries'] = all_suggestions.get('new_queries', []) + new_suggestions.get('new_queries', [])
            all_suggestions['priority_repos'] = all_suggestions.get('priority_repos', []) + new_suggestions.get('priority_repos', [])
            all_suggestions['reasoning'] = new_suggestions.get('reasoning', '')

            logging.info(f"Agentic reasoning: Updated {len(updated_entries)} entries, suggestions: {len(all_suggestions.get('new_queries', []))} new queries")
            return entries, all_suggestions

        except Exception as e:
            logging.error(f"Agentic reasoning failed: {e}")
            return entries, previous_suggestions

    def _extract_json(self, raw: str) -> List[Dict]:
        try:
            # Handle possible JSON array or single object
            json_str = re.search(r'\{.*\}|\[.*\]', raw, re.DOTALL)
            if json_str:
                return json.loads(json_str.group()) if json_str.group().startswith('[') else [json.loads(json_str.group())]
            return []
        except:
            return []

    def _heuristic_categorize(self, entry: Dict) -> Dict:
        text = (
            entry.get('description', '') + ' ' + ' '.join(entry.get('keywords', [])) + ' ' +
            entry.get('file_type', '') + ' ' + ' '.join(entry.get('tech_stack', []))
        ).lower()
        for cat, keywords in self.config.HEURISTIC_RULES.items():
            if any(kw in text for kw in keywords):
                return {
                    'category': cat,
                    'ai_description': f"Heuristic: {cat.replace('_', ' ').title()}",
                    'ai_features': keywords[:5],
                    'ai_use_case': f"Use for {cat.replace('_', ' ')}",
                    'ui_mods_score': 10 if cat in ['ui_component', 'modular_theme'] else 0,
                    'related_links': entry.get('related_links', []) # Preserve
                }
        return {
            'category': 'other',
            'ai_description': 'General web theme',
            'ai_features': [],
            'ai_use_case': 'General purpose',
            'ui_mods_score': 0,
            'related_links': entry.get('related_links', [])
        }

# ==============================================================================
# GitHub Fetcher (MODIFIED: Added README + optional HTML fetch + image extraction)
# ==============================================================================

class GitHubFetcher:
    def __init__(self, token: Optional[str] = None, rate_limiter: Optional[RateLimiter] = None):
        self.token = token
        self.rate_limiter = rate_limiter
        self._session = None
        self.base_headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Theme-Scraper/1.0'
        }
        if token:
            self.base_headers['Authorization'] = f'token {token}'

    async def get_session(self):
        if not self._session or self._session.closed:
            connector = aiohttp.TCPConnector(limit=100, limit_per_host=30)
            timeout = aiohttp.ClientTimeout(total=30)
            self._session = aiohttp.ClientSession(connector=connector, timeout=timeout)
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10),
           retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError)))
    async def _fetch_json(self, url: str, params: Dict = None) -> Dict:
        if self.rate_limiter:
            await self.rate_limiter.check_and_wait()
        session = await self.get_session()
        try:
            async with session.get(url, headers=self.base_headers, params=params) as resp:
                if resp.status == 200:
                    return await resp.json()
                elif resp.status == 403:
                    raise RateLimitError("Rate limit exceeded")
                elif resp.status == 404:
                    return {}
                else:
                    raise GitHubAPIError(f"API error: {resp.status}")
        except asyncio.TimeoutError:
            logging.error(f"Timeout {url}")
            return {}

    # NEW: Fetch README (base64 decode)
    async def fetch_readme(self, full_name: str) -> str:
        try:
            url = f"https://api.github.com/repos/{full_name}/readme"
            data = await self._fetch_json(url)
            if data and data.get('content'):
                return base64.b64decode(data['content']).decode('utf-8', errors='ignore')
            return ''
        except Exception as e:
            logging.debug(f"README fetch failed for {full_name}: {e}")
            return ''

    # NEW: Fetch HTML page (for full link extraction, e.g., rendered README)
    async def fetch_repo_html(self, full_name: str) -> str:
        try:
            # Use raw HTML (GitHub pages)
            html_url = f"https://github.com/{full_name}"
            session = await self.get_session()
            async with session.get(html_url, headers={'User-Agent': 'Mozilla/5.0'}) as resp:
                if resp.status == 200:
                    return await resp.text()
                return ''
        except Exception as e:
            logging.debug(f"HTML fetch failed for {full_name}: {e}")
            return ''

    async def discover_repos_stream(self, queries: List[str], max_repos: int, start_page: int = 1) -> AsyncIterator[Dict]:
        per_page = 100
        repos_fetched = 0
        for query in queries:
            page = start_page
            while repos_fetched < max_repos:
                params = {'q': query, 'sort': 'stars', 'order': 'desc', 'per_page': per_page, 'page': page}
                data = await self._fetch_json('https://api.github.com/search/repositories', params)
                items = data.get('items', [])
                if not items:
                    break
                for repo in items:
                    if repos_fetched >= max_repos:
                        break
                    repo_info = {
                        'full_name': repo.get('full_name', ''),
                        'repo_name': repo.get('name', ''),
                        'description': repo.get('description', '') or '',
                        'stars': repo.get('stargazers_count', 0),
                        'forks': repo.get('forks_count', 0),
                        'url': repo.get('html_url', ''),
                        'clone_url': repo.get('clone_url', ''),
                        'last_updated': repo.get('updated_at', ''),
                        'license': repo.get('license', {}).get('spdx_id', '') if repo.get('license') else ''
                    }
                    yield repo_info
                    repos_fetched += 1
                page += 1

    async def fetch_repo_info(self, full_name: str) -> Optional[Dict]:
        try:
            url = f"https://api.github.com/repos/{full_name}"
            repo = await self._fetch_json(url)
            if not repo or 'full_name' not in repo:
                return None
            return {
                'full_name': repo.get('full_name', ''),
                'repo_name': repo.get('name', ''),
                'description': repo.get('description', '') or '',
                'stars': repo.get('stargazers_count', 0),
                'forks': repo.get('forks_count', 0),
                'url': repo.get('html_url', ''),
                'clone_url': repo.get('clone_url', ''),
                'last_updated': repo.get('updated_at', ''),
                'license': repo.get('license', {}).get('spdx_id', '') if repo.get('license') else ''
            }
        except Exception as e:
            logging.error(f"Fetch repo {full_name} failed: {e}")
            return None

# ==============================================================================
# Main Agent Class (MODIFIED: Integrate agentic reasoning, dynamic queries, vision)
# ==============================================================================

class ThemeScraperAgent:
    def __init__(self, config: Config, model: str = "MiniMax-M1"):
        self.config = config
        self.db = DatabaseManager(config.DB_PATH)
        self.checkpoint = CheckpointManager()
        rate_limiter = RateLimiter(config.GITHUB_TOKEN)
        self.fetcher = GitHubFetcher(config.GITHUB_TOKEN, rate_limiter)
        self.model = model
        minimax_client = None
        if config.USE_AI:
            try:
                minimax_client = MiniMaxClient(config.MINIMAX_API_KEYS, model=self.model)
                logging.info(f"MiniMax-{model} client initialized for {'agentic' if config.AGENTIC_MODE else 'standard'} mode")
            except Exception as e:
                logging.error(f"MiniMax init failed: {e}")
                config.MINIMAX_API_KEYS = [] # Disable AI
        self.analyzer = ThemeAnalyzer(minimax_client, config)
        self.semaphore = asyncio.Semaphore(config.MAX_CONCURRENT)
        self.shutdown_flag = False
        self.dynamic_queries = [] # NEW: AI-suggested queries
        self.suggestions = {} # Accumulate agent suggestions

    async def run(self, max_repos: int = None, resume: bool = True, custom_query: str = None, input_file: str = None):
        max_repos = max_repos or self.config.MAX_REPOS

        # Validation (as before)
        print("\n🔍 Config check...")
        if not self.config.GITHUB_TOKEN:
            print("❌ No GITHUB_TOKEN - limited to 60 req/hr")
            if input("Continue? (y/n): ").lower() != 'y':
                return
        print("✅ GitHub token OK")
        if self.config.USE_AI:
            print(f"✅ MiniMax-{self.model} enabled ({len([k for k in self.config.MINIMAX_API_KEYS if k])} keys, agentic: {self.config.AGENTIC_MODE}, vision: {self.config.VISION_ENABLED})")
        else:
            print("ℹ️ No AI - heuristics only")
        if input_file:
            print(f"📄 From file: {input_file}")
            repo_list = self._read_repo_file(input_file)
            if not repo_list:
                print(f"❌ Invalid file {input_file}")
                return
            print(f"✅ {len(repo_list)} repos loaded")
            max_repos = len(repo_list)
        else:
            repo_list = None
            print(f"🎯 Max repos: {max_repos}")

        print(f"💾 DB: {self.config.DB_PATH}\n")

        if not resume:
            processed, start_pages, query_idx, queries_used = set(), {}, 0, {}
        else:
            processed, start_pages, query_idx, queries_used = self.checkpoint.load()
            if processed:
                print(f"📂 Resume: {len(processed)} processed")

        # Queries: default + custom + dynamic (agentic)
        base_queries = [custom_query] if custom_query else self.config.DEFAULT_QUERIES
        queries = base_queries.copy()
        if self.config.AGENTIC_MODE:
            queries += self.config.UI_MODS_QUERIES # Start with UI focus
        logging.info(f"Queries: {len(queries)} base")

        self._setup_signal_handlers()
        total_new = 0

        try:
            pbar = tqdm(total=max_repos, desc="Scraping Themes (Agentic + Vision)", unit="repo")

            if input_file and repo_list:
                await self._process_from_file(repo_list, processed, pbar, max_repos)
            else:
                for q_idx in range(query_idx, len(queries)):
                    if self.shutdown_flag:
                        break
                    query = queries[q_idx]
                    start_page = start_pages.get(query, 1)

                    # Dynamic: Add AI suggestions mid-run
                    if self.config.AGENTIC_MODE and self.suggestions:
                        new_q = self.suggestions.get('new_queries', [])
                        if new_q:
                            queries.extend(new_q[:3]) # Add top 3
                            logging.info(f"Agentic add: {new_q[:3]} queries")
                            self.suggestions['new_queries'] = new_q[3:] # Dequeue
                        prio_repos = self.suggestions.get('priority_repos', [])
                        if prio_repos:
                            # Process priority repos directly
                            for prio in prio_repos[:5]:
                                repo_info = await self.fetcher.fetch_repo_info(prio)
                                if repo_info and repo_info['full_name'] not in processed:
                                    batch = [repo_info]
                                    new_count = await self._process_batch(batch, processed, pbar)
                                    total_new += new_count
                            self.suggestions['priority_repos'] = prio_repos[5:]

                    stream = self.fetcher.discover_repos_stream([query], max_repos // len(queries), start_page)
                    batch = []
                    async for repo_info in stream:
                        if self.shutdown_flag:
                            break
                        if repo_info['full_name'] in processed:
                            pbar.update(1)
                            continue
                        batch.append(repo_info)
                        if len(batch) >= self.config.BATCH_SIZE:
                            new_count = await self._process_batch(batch, processed, pbar)
                            total_new += new_count
                            batch = []
                            start_pages[query] = start_page # Update checkpoint
                            self.checkpoint.save(processed, total_new, queries_used, start_pages, q_idx)
                    if batch:
                        new_count = await self._process_batch(batch, processed, pbar)
                        total_new += new_count

            pbar.close()
        except Exception as e:
            logging.error(f"Run error: {e}")
        finally:
            self.checkpoint.save(processed, total_new, queries_used, start_pages, len(queries))
            self.checkpoint.cleanup()
            await self._export_results(total_new, self.suggestions)

        total_db = await self.db.count_rows()
        print(f"\n✅ Done: {total_new} new themes (total DB: {total_db}). Suggestions: {len(self.suggestions.get('new_queries', []))} queued")

    def _setup_signal_handlers(self):
        def handler(sig, frame):
            print("\n⚠️ Interrupted!")
            logging.warning("Shutdown")
            self.shutdown_flag = True
            sys.exit(0)
        signal.signal(signal.SIGINT, handler)
        signal.signal(signal.SIGTERM, handler)

    def _read_repo_file(self, filepath: str) -> List[str]:
        try:
            with open(filepath, 'r') as f:
                lines = f.readlines()
                repos = []
                for line in lines:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    if 'github.com/' in line:
                        parts = line.split('github.com/')[-1].split('/')
                        if len(parts) >= 2:
                            repos.append(f"{parts[0]}/{parts[1]}")
                    elif '/' in line:
                        repos.append(line)
                    else:
                        logging.warning(f"Invalid line: {line}")
                return repos
        except Exception as e:
            logging.error(f"Read file {filepath} failed: {e}")
            return []

    async def _process_from_file(self, repo_list: List[str], processed: Set[str], pbar, max_repos):
        batch = []
        for repo_full_name in repo_list:
            if repo_full_name in processed or self.shutdown_flag:
                pbar.update(1)
                continue
            repo_info = await self.fetcher.fetch_repo_info(repo_full_name)
            if not repo_info:
                logging.warning(f"No info for {repo_full_name}")
                pbar.update(1)
                continue
            batch.append(repo_info)
            if len(batch) >= self.config.BATCH_SIZE:
                new_count = await self._process_batch(batch, processed, pbar)
                total_new = new_count # Accumulate if needed
                batch = []
        if batch:
            new_count = await self._process_batch(batch, processed, pbar)

    async def _process_batch(self, batch: List[Dict], processed: Set[str], pbar) -> int:
        async def enrich_repo(repo_info: Dict) -> Dict:
            async with self.semaphore:
                try:
                    # Fetch files
                    contents_url = f"https://api.github.com/repos/{repo_info['full_name']}/contents"
                    contents = await self.fetcher._fetch_json(contents_url)
                    if isinstance(contents, list):
                        repo_info['files'] = contents[:50]

                    # Fetch README + HTML for links
                    readme = await self.fetcher.fetch_readme(repo_info['full_name'])
                    repo_info['readme'] = readme
                    html = await self.fetcher.fetch_repo_html(repo_info['full_name'])
                    repo_info['html_content'] = html

                    return repo_info
                except Exception as e:
                    repo_info['processing_errors'] = f"Fetch error: {str(e)}"
                    return repo_info

        # Enrich batch
        tasks = [enrich_repo(repo_info) for repo_info in batch]
        entries = await asyncio.gather(*tasks, return_exceptions=True)
        valid_entries = [e for e in entries if isinstance(e, dict)]

        # Analyze
        for entry in valid_entries:
            if entry.get('files') or entry.get('readme'):
                analysis = self.analyzer.analyze_files(
                    entry.get('files', []), entry,
                    entry.get('readme', ''), entry.get('html_content', '')
                )
                entry.update(analysis)
                entry['main_file'] = str(entry.get('files', []))[:100000]
            else:
                entry['processing_errors'] = "No files/README"
                entry['processing_status'] = 'error_no_files'

        # Categorize (standard)
        if self.config.USE_AI:
            valid_entries = await self.analyzer.ai_categorize_batch(valid_entries)

        # NEW: Agentic reasoning if enabled (processes batch, updates suggestions)
        if self.config.AGENTIC_MODE:
            valid_entries, new_sugg = await self.analyzer.agentic_reasoning_batch(valid_entries, self.suggestions)
            self.suggestions.update(new_sugg)

        # Status
        for entry in valid_entries:
            entry['processing_status'] = 'scraped_valid' if entry.get('is_valid') else 'scraped_invalid'

        # Save
        if valid_entries:
            await self.db.batch_insert_or_update(valid_entries)

        # Update processed
        new_count = sum(1 for entry in valid_entries if entry['full_name'] not in processed)
        for entry in valid_entries:
            processed.add(entry['full_name'])
        pbar.update(len(valid_entries))

        return new_count

    async def _export_results(self, total_new: int, suggestions: Dict):
        top_themes = await self.db.query_top(top_n=100, min_stars=3, ui_mods_focus=self.config.AGENTIC_MODE)

        output = {
            'total_new': total_new,
            'total_db': await self.db.count_rows(),
            'top_themes': top_themes,
            'agent_suggestions': suggestions, # NEW: Export graph-like suggestions
            'ui_mods_highlights': [t for t in top_themes if t['ui_mods_score'] > 20][:20],
            'vision_highlights': [t for t in top_themes if t.get('images')][:10] if self.config.VISION_ENABLED else []
        }

        # JSON
        with open('themes_report.json', 'w') as f:
            json.dump(output, f, indent=2)

        # Markdown (enhanced)
        with open('themes_report.md', 'w') as f:
            f.write(f"# Theme Scraper Report (Agentic Mode: {self.config.AGENTIC_MODE}, Vision: {self.config.VISION_ENABLED})\n\n")
            f.write(f"- **New Themes**: {total_new}\n- **Total DB**: {await self.db.count_rows()}\n")
            if suggestions:
                f.write(f"- **Agent Suggestions**: {len(suggestions.get('new_queries', []))} queries, {len(suggestions.get('priority_repos', []))} repos\n\n")
            f.write("## Top Themes (Quality + UI/Mods Score)\n\n")
            for theme in top_themes[:20]:
                f.write(f"### {theme['full_name']} ({theme['category']}, UI/Mods: {theme['ui_mods_score']})\n")
                f.write(f"- Stars: {theme['stars']} | Quality: {theme['quality_score']}\n")
                f.write(f"- Tech: {', '.join(theme.get('tech_stack', []))}\n")
                f.write(f"- Use: {theme['use_case']}\n")
                f.write(f"- Related Links: {len(theme['related_links'])} (e.g., {theme['related_links'][0]['url'] if theme['related_links'] else 'None'})\n")
                f.write(f"- URL: {theme['url']}\n\n")

            # NEW: Suggestions section
            if suggestions:
                f.write("## Agentic Suggestions (Next Steps)\n\n")
                f.write(f"**New Queries**: {', '.join(suggestions.get('new_queries', []))}\n")
                f.write(f"**Priority Repos**: {', '.join(suggestions.get('priority_repos', []))}\n")
                f.write(f"**Reasoning**: {suggestions.get('reasoning', 'N/A')}\n\n")

            # NEW: Vision section
            if self.config.VISION_ENABLED:
                f.write("## Vision Insights (Top Image Analyses)\n\n")
                for theme in top_themes[:5]:
                    if theme.get('images'):
                        f.write(f"### {theme['full_name']}\n")
                        f.write(f"- Images: {len(theme['images'])}\n")
                        for img in theme['images'][:2]:
                            f.write(f" - {img['name']}: {img.get('description', 'No description')[:100]} | UI Relevance: {img.get('ui_relevance', 0)}\n")
                        f.write(f"- UI/Mods Boost: +{theme['ui_mods_score'] // 5} from visuals\n\n")

        # NEW: CSV for UI/Mods links (easy import to tools like Gephi for graph viz)
        if top_themes:
            with open('ui_mods_links.csv', 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['repo', 'related_url', 'type', 'score'])
                for theme in top_themes:
                    for link in theme['related_links'][:10]: # Top 10 per repo
                        writer.writerow([theme['full_name'], link['url'], link['type'], link['relevance_score']])

        # NEW: Image CSV for vision insights
        if self.config.VISION_ENABLED and top_themes:
            with open('repo_images.csv', 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['repo', 'image_url', 'name', 'description', 'ui_relevance', 'quality_score'])
                for theme in top_themes:
                    for img in theme.get('images', []):
                        writer.writerow([
                            theme['full_name'], 
                            img.get('url', ''), 
                            img.get('name', ''), 
                            img.get('description', '')[:100],
                            img.get('ui_relevance', 0),
                            img.get('quality_score', 0)
                        ])

        logging.info("Exports: themes_report.json/md, ui_mods_links.csv, repo_images.csv")

    async def cleanup(self):
        await self.fetcher.close()
        await self.db.close()

# ==============================================================================
# Main Entry Point (MODIFIED: Add --agentic-mode, --model, --vision-mode)
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="Theme Scraper v2.0 - Agentic UI/Mods Scraper with Vision (MiniMax-M1/VL-01)")
    parser.add_argument('--max-repos', type=int, help="Max repos")
    parser.add_argument('--query', type=str, help="Custom query")
    parser.add_argument('--input-file', type=str, help="File with repos (one per line)")
    parser.add_argument('--resume', action='store_true', default=True, help="Resume")
    parser.add_argument('--no-ai', action='store_true', help="Disable AI")
    parser.add_argument('--db', type=str, help="DB path")
    parser.add_argument('--verbose', action='store_true', help="Verbose")
    parser.add_argument('--agentic-mode', action='store_true', help="Enable agentic reasoning (link chaining, suggestions)")
    parser.add_argument('--model', type=str, default='MiniMax-M1', choices=['MiniMax-Text-01', 'MiniMax-M1', 'MiniMax-VL-01'], help="MiniMax model")
    parser.add_argument('--no-html', action='store_true', help="Disable HTML scraping")
    parser.add_argument('--vision-mode', action='store_true', help="Enable image analysis (fetches/analyzes repo screenshots for UI/mods)")
    
    args = parser.parse_args()
    setup_logging(args.verbose)

    config = Config()
    if args.max_repos:
        config.MAX_REPOS = args.max_repos
    if args.db:
        config.DB_PATH = args.db
    if args.no_ai:
        config.MINIMAX_API_KEYS = []
    config.AGENTIC_MODE = args.agentic_mode
    config.SCRAPE_HTML = not args.no_html and HAS_BS4
    config.MINIMAX_MODEL = args.model
    config.VISION_ENABLED = args.vision_mode
    
    # If vision mode is enabled, use VL-01 model by default unless specified
    if config.VISION_ENABLED and args.model == 'MiniMax-M1':
        config.MINIMAX_MODEL = config.VISION_MODEL
    
    config.validate()

    async def run_async():
        agent = ThemeScraperAgent(config, model=args.model)
        try:
            await agent.run(
                max_repos=args.max_repos,
                resume=args.resume,
                custom_query=args.query,
                input_file=args.input_file
            )
        finally:
            await agent.cleanup()

    try:
        asyncio.run(run_async())
    except KeyboardInterrupt:
        logging.info("Interrupted")
    except Exception as e:
        logging.error(f"Fatal: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
