#!/usr/bin/env python3
"""
Quick hack: Re-extract sub-repos from top 50 awesomes' READMEs, dedupe, and force-add to raw_themes.db if new.
Bypasses main.py filters—adds all valid GitHub repos (UI or not; filter later).
Requires: requests, dotenv (pip install requests python-dotenv).
"""

import os
import json
import re
import sqlite3
import base64
from pathlib import Path
from dotenv import load_dotenv
import requests

load_dotenv()
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '').strip()
DB_PATH = Path('raw_themes.db')
TOP_AWESOMES_JSON = 'top_awesome_repos.json'  # From hunter.py

def get_readme(full_name):
    """Fetch README content via GitHub API."""
    session = requests.Session()
    headers = {'Authorization': f'token {GITHUB_TOKEN}', 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Extractor/1.0'}
    session.headers.update(headers)
    url = f"https://api.github.com/repos/{full_name}/readme"
    resp = session.get(url)
    if resp.status_code == 200:
        data = resp.json()
        content = base64.b64decode(data['content']).decode('utf-8', errors='ignore')
        return content
    return ''

def extract_github_links(readme_text):
    """Regex for GitHub repos in text (owner/repo format)."""
    # Match github.com/owner/repo or owner/repo
    links = re.findall(r'(?:https://github\.com/)?([a-zA-Z0-9-]+)/([a-zA-Z0-9-_.]+)(?=/|$|\s|\n)', readme_text)
    full_names = [f"{owner}/{repo}" for owner, repo in links if len(owner) > 1 and len(repo) > 1 and not owner.startswith('github')]
    return list(set(full_names))  # Dedupe

# Load top 50 awesomes
with open(TOP_AWESOMES_JSON, 'r') as f:
    awesomes = json.load(f)[:50]

new_repos = set()
for repo in awesomes:
    full_name = repo['full_name']
    print(f"Extracting from {full_name}...")
    readme = get_readme(full_name)
    if readme:
        links = extract_github_links(readme)
        new_repos.update(links)
        print(f"  Found {len(links)} links")

# Filter basics (non-empty, no internals)
new_repos = [r for r in new_repos if '/' in r and len(r.split('/')) == 2 and not r.startswith('github/')]

print(f"Total unique new repos: {len(new_repos)}")

# Add to DB if new
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
added = 0
for full_name in new_repos[:500]:  # Limit to 500 to avoid flood
    cursor.execute("SELECT full_name FROM themes WHERE full_name = ?", (full_name,))
    if not cursor.fetchone():
        # Fetch stars/desc for quality (optional—skip for speed)
        stars_resp = requests.get(f"https://api.github.com/repos/{full_name}", headers={'Authorization': f'token {GITHUB_TOKEN}', 'User-Agent': 'Extractor/1.0'})
        if stars_resp.status_code == 200:
            data = stars_resp.json()
            stars = data.get('stargazers_count', 0)
            desc = data.get('description', '')
            cursor.execute("""
                INSERT INTO themes (full_name, description, stars, category, processing_status)
                VALUES (?, ?, ?, 'extracted-awesome', 'raw')
            """, (full_name, desc, stars))
            added += 1

conn.commit()
conn.close()
print(f"Added {added} new repos to raw_themes.db (total now: $(sqlite3 {DB_PATH} 'SELECT COUNT(*) FROM themes;'))")

