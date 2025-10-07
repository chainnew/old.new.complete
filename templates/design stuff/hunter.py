#!/usr/bin/env python3
"""
Fixed: Escaped f-string braces in prompt for JSON literals. Handles missing 'tweaked_variants'; resumes from partial awesome_stencils.json.
- Fetches top 200 'awesome' repos.
- Filters ~20-22 UI-relevant.
- Generates stencils for top 20 (resumes if partial).
- Appends to enhanced_themes.db (raw 'awesome-list' category).
"""

import os
import json
import logging
import re  # For sub-repo extraction if added later
from typing import List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from openai import OpenAI

load_dotenv()

# Config
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '').strip()
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY1', '')  # First valid key
GROK_MODEL = "x-ai/grok-4-fast"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
TOP_N = 200  # Top repos from 'awesome' topic
TOP_UI_FOR_STENCILS = 20  # Limit Grok calls (UI-filtered; set to 25 for all relevant)
GITHUB_API_BASE = "https://api.github.com"
DB_PATH = Path('enhanced_themes.db')  # Optional DB update (enabled)

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

if not GITHUB_TOKEN:
    logger.warning("No GITHUB_TOKEN - unauth API (60 req/hour). Add for 5k/hour.")
if not OPENROUTER_API_KEY:
    logger.warning("No OpenRouter key - skipping stencil gen (raw repos only).")

def create_github_session() -> requests.Session:
    """Authenticated GitHub API session with retries."""
    session = requests.Session()
    retry_strategy = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    headers = {'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Awesome-Scraper/1.0'}
    if GITHUB_TOKEN:
        headers['Authorization'] = f'token {GITHUB_TOKEN}'
        logger.info("Using GITHUB_TOKEN for API")

    session.headers.update(headers)
    return session

def fetch_top_awesome_repos(max_repos: int = TOP_N) -> List[Dict[str, Any]]:
    """Fetch top repos from 'awesome' topic via Search API."""
    session = create_github_session()
    repos = []
    # Tightened UI keywords: Focus on UI/CSS/design, avoid broad/false positives like 'go' or 'system'
    ui_keywords = ['ui', 'component', 'css', 'tailwind', 'shadcn', 'vue', 'react', 'android ui', 'design pattern', 'theme', 'dashboard']

    # Page 1-2 for 200 (100/page max)
    for page in range(1, 3):
        params = {
            'q': 'topic:awesome',
            'sort': 'stars',
            'order': 'desc',
            'per_page': 100,
            'page': page
        }
        try:
            response = session.get(f"{GITHUB_API_BASE}/search/repositories", params=params)
            response.raise_for_status()
            data = response.json()

            if 'items' in data:
                for item in data['items']:
                    full_name = item.get('full_name', '')
                    if full_name and not full_name.startswith('github/') and item.get('stargazers_count', 0) > 100:
                        desc_lower = (item.get('description', '') or '').lower()
                        is_ui = any(kw in desc_lower for kw in ui_keywords)
                        repo = {
                            'full_name': full_name,
                            'stars': item.get('stargazers_count', 0),
                            'description': item.get('description', ''),
                            'html_url': item.get('html_url', ''),
                            'language': item.get('language', ''),
                            'is_ui_relevant': is_ui
                        }
                        repos.append(repo)

            # Rate limit check
            if 'X-RateLimit-Remaining' in response.headers:
                remaining = int(response.headers['X-RateLimit-Remaining'])
                logger.info(f"API remaining: {remaining}")
                if remaining < 10:
                    logger.warning("Low rate limit - pause 60s")
                    import time; time.sleep(60)

            if len(repos) >= max_repos:
                break

        except requests.RequestException as e:
            logger.error(f"API error page {page}: {e}")
            break

    session.close()
    logger.info(f"Fetched {len(repos)} awesome repos (top {min(len(repos), max_repos)})")
    return sorted(repos[:max_repos], key=lambda x: x['stars'], reverse=True)

def generate_stencil(full_name: str, description: str, html_url: str) -> Dict[str, Any]:
    """Grok: Generate UI stencils from awesome list desc (focus on UI themes/components). Always return both keys."""
    if not OPENROUTER_API_KEY:
        return {"stencil_patterns": [], "tweaked_variants": {}, "note": "No API key"}

    client = OpenAI(base_url=OPENROUTER_BASE_URL, api_key=OPENROUTER_API_KEY)
    # Fixed: Double-escaped braces for literal JSON in f-string
    prompt = f"""
    For awesome GitHub repo '{full_name}': '{description[:300]}...' (see {html_url} for full list).
    This is a curated 'awesome' list of UI/CSS/design resources. Extract 2-3 key UI stencils/themes (e.g., component examples, color schemes) from common patterns in such lists.
    Output ONLY JSON: {{'stencil_patterns': [{{'name': 'ui-card', 'code': "<div class='bg-white rounded-lg shadow-md p-6'>Card Content</div>", 'description': 'Basic Tailwind card stencil from awesome lists'}}, ...], 'tweaked_variants': {{'dark': 'bg-gray-800 text-white', 'minimal': 'border border-gray-200 no-shadow'}}}}
    Focus on modular, Tailwind/Shadcn-inspired: buttons, cards, themes. If not UI-focused, use defaults. ALWAYS include tweaked_variants (even if empty {{}}).
    """
    try:
        response = client.chat.completions.create(
            model=GROK_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.6,
            response_format={"type": "json_object"}
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith('```json'):  # Clean markdown
            raw = raw.split('```json')[1].split('```')[0].strip()
        parsed = json.loads(raw)
        # Ensure keys exist (fallback)
        parsed['stencil_patterns'] = parsed.get('stencil_patterns', [{"name": "default-stencil", "code": "<div class=\"modular-ui\">Awesome UI Stub</div>", "description": "Fallback stencil"}])
        parsed['tweaked_variants'] = parsed.get('tweaked_variants', {"default": "bg-white text-black"})
        return parsed
    except Exception as e:
        logger.error(f"Grok error for {full_name}: {e}")
        return {
            "stencil_patterns": [{"name": "default-stencil", "code": "<div class=\"modular-ui\">Awesome UI Stub</div>", "description": "Fallback from awesome list"}],
            "tweaked_variants": {"default": "bg-white text-black"}
        }

def load_existing_stencils() -> Dict[str, Any]:
    """Load partial awesome_stencils.json for resume."""
    stencils_path = Path('awesome_stencils.json')
    if stencils_path.exists():
        try:
            with open(stencils_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Error loading existing stencils: {e}")
    return {}

def update_db(repos: List[Dict[str, Any]]):
    """Append top awesome repos to enhanced_themes.db (raw 'awesome-list' category)."""
    if not DB_PATH.exists():
        logger.warning("No DB found - skipping update")
        return

    import sqlite3
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    added = 0
    for repo in repos:
        full_name = repo['full_name']
        # Check if exists
        cursor.execute("SELECT full_name FROM themes WHERE full_name = ?", (full_name,))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO themes (full_name, description, stars, category, processing_status)
                VALUES (?, ?, ?, 'awesome-list', 'raw')
            """, (full_name, repo['description'], repo['stars']))
            added += 1
    conn.commit()
    conn.close()
    logger.info(f"Added {added} new awesome repos to DB")

def main():
    # Fetch top 200 awesome repos (idempotent—runs every time)
    logger.info(f"Fetching top {TOP_N} from 'awesome' topic...")
    awesome_repos = fetch_top_awesome_repos(TOP_N)

    # Save all 200
    output_path = Path('top_awesome_repos.json')
    with open(output_path, 'w') as f:
        json.dump(awesome_repos, f, indent=2)
    logger.info(f"Saved {len(awesome_repos)} repos to {output_path}")

    # Add to DB
    update_db(awesome_repos)

    # Filter UI-relevant
    ui_repos = [r for r in awesome_repos if r['is_ui_relevant']]
    logger.info(f"Found {len(ui_repos)} UI-relevant awesome lists (e.g., awesome-vue, awesome-css)")

    # Load existing stencils for resume
    existing_stencils = load_existing_stencils()
    logger.info(f"Loaded {len(existing_stencils)} existing stencils (resume mode)")

    # Top UI to process (skip existing)
    top_ui = ui_repos[:TOP_UI_FOR_STENCILS]
    to_process = [r for r in top_ui if r['full_name'] not in existing_stencils]
    logger.info(f"Generating {len(to_process)} new stencils (skipping {len(top_ui) - len(to_process)} existing)")

    stencils = existing_stencils.copy()
    for repo in to_process:
        full_name = repo['full_name']
        logger.info(f"Generating stencil for {full_name} ({repo['stars']} stars)...")
        stencil_data = generate_stencil(full_name, repo['description'], repo['html_url'])
        stencils[full_name] = {
            'stencil_patterns': stencil_data['stencil_patterns'],
            'tweaked_variants': stencil_data['tweaked_variants'],  # Now always exists
            'stars': repo['stars'],
            'description': repo['description']
        }

    # Save updated stencils
    stencils_path = Path('awesome_stencils.json')
    with open(stencils_path, 'w') as f:
        json.dump(stencils, f, indent=2)
    logger.info(f"Generated/updated stencils for {len(stencils)} UI awesome lists → {stencils_path}")

    # Console summary (top 10 overall + top 5 stenciled)
    print("\n=== TOP 10 AWESOME REPOS (by stars) ===")
    for repo in awesome_repos[:10]:
        print(f"- {repo['full_name']} ({repo['stars']} stars): {repo['description'][:100]}... | {repo['html_url']}")

    print(f"\n=== TOP 5 STENCILED UI-RELEVANT ===")
    for full_name in list(stencils.keys())[:5]:
        data = stencils[full_name]
        print(f"- {full_name} ({data['stars']} stars): {data['description'][:80]}...")
        if data['stencil_patterns']:
            pattern = data['stencil_patterns'][0]
            print(f"  Sample Pattern: {pattern['name']} - {pattern['description']}")
            print(f"  Code Snippet: {pattern['code'][:100]}...")
        print()

if __name__ == "__main__":
    main()

