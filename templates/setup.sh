#!/bin/bash

# LaTeX Template Agent - Automated Setup Script
# =============================================

set -e  # Exit on error

echo "🚀 LaTeX Template Agent Setup"
echo "=============================="
echo ""

# Check Python version
echo "📋 Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo "✅ Found Python $PYTHON_VERSION"
echo ""

# Create project directory
PROJECT_DIR="latex_template_agent"
echo "📁 Creating project directory: $PROJECT_DIR"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Download the agent code
echo "📥 Creating agent script..."
cat > latex_agent.py << 'AGENT_CODE'
#!/usr/bin/env python3
"""
LaTeX Template Agent v2.0 - Production-Ready
Improvements: Async-first, resumable, rate-aware, robust error handling
"""

import os
import json
import sqlite3
import logging
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, AsyncIterator
from pathlib import Path
from dotenv import load_dotenv
import re
from contextlib import asynccontextmanager
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from tqdm.asyncio import tqdm
from groq import Groq

load_dotenv()

# Config
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
TOPIC = 'latex-template'
DB_PATH = 'latex_refs.db'
BATCH_SIZE = 50  # Process in batches
MAX_CONCURRENT = 10  # Concurrent API calls
CHECKPOINT_FILE = 'agent_checkpoint.json'

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('latex_agent.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

CATEGORIES = [
    'resume_cv', 'thesis_dissertation', 'presentation_slides', 'article_paper',
    'book_manual', 'letter_memo', 'poster', 'invoice_form', 'creative_portfolio',
    'academic_bibtex', 'business_proposal', 'report', 'general'
]

class RateLimiter:
    """Smart rate limiter that checks GitHub's actual limits"""
    def __init__(self, token: Optional[str] = None):
        self.token = token
        self.remaining = 5000 if token else 60
        self.reset_time = datetime.now()
        self.lock = asyncio.Lock()
    
    async def check_and_wait(self, session: aiohttp.ClientSession):
        """Check rate limit and wait if necessary"""
        async with self.lock:
            if self.remaining < 10:  # Safety buffer
                wait_sec = (self.reset_time - datetime.now()).total_seconds()
                if wait_sec > 0:
                    logger.warning(f"Rate limit low ({self.remaining}), waiting {wait_sec:.0f}s")
                    await asyncio.sleep(wait_sec + 1)
            
            # Update from API
            headers = {'Authorization': f'token {self.token}'} if self.token else {}
            async with session.get('https://api.github.com/rate_limit', headers=headers) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    core = data['resources']['core']
                    self.remaining = core['remaining']
                    self.reset_time = datetime.fromtimestamp(core['reset'])
                    logger.debug(f"Rate limit: {self.remaining} remaining, resets {self.reset_time}")

class DatabaseManager:
    """Connection pool and batch operations"""
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repo_name TEXT UNIQUE,
                full_name TEXT,
                description TEXT,
                stars INTEGER,
                url TEXT,
                clone_url TEXT,
                last_updated TEXT,
                readme TEXT,
                main_tex TEXT,
                tex_preview TEXT,
                doctype TEXT,
                sections TEXT,
                packages TEXT,
                is_valid BOOLEAN,
                category TEXT,
                ai_description TEXT,
                ai_features TEXT,
                ai_use_case TEXT,
                keywords TEXT,
                processing_errors TEXT,
                scraped_at TEXT,
                UNIQUE(full_name)
            )
        ''')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_category ON templates(category)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_stars ON templates(stars DESC)')
        conn.commit()
        conn.close()
        logger.info(f"DB initialized: {self.db_path}")
    
    def batch_insert(self, entries: List[Dict]):
        """Batch insert for efficiency"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        for entry in entries:
            try:
                cursor.execute('''
                    INSERT OR REPLACE INTO templates 
                    (repo_name, full_name, description, stars, url, clone_url, last_updated, 
                     readme, main_tex, tex_preview, doctype, sections, packages, is_valid, 
                     category, ai_description, ai_features, ai_use_case, keywords, 
                     processing_errors, scraped_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    entry['name'], entry['full_name'], entry.get('description', ''),
                    entry.get('stars', 0), entry.get('url', ''), entry.get('clone_url', ''),
                    entry.get('last_updated', ''), entry.get('readme', '')[:5000],
                    entry.get('main_tex', '')[:50000], entry.get('preview_code', '')[:500],
                    entry.get('doctype', 'unknown'), json.dumps(entry.get('sections', [])),
                    json.dumps(entry.get('packages', [])), entry.get('is_valid', False),
                    entry.get('category', 'general'), entry.get('description_ai', ''),
                    json.dumps(entry.get('features_ai', [])), entry.get('use_case', ''),
                    json.dumps(entry.get('keywords', [])), entry.get('error', ''),
                    datetime.now().isoformat()
                ))
            except Exception as e:
                logger.error(f"Failed to insert {entry.get('name', 'unknown')}: {e}")
        conn.commit()
        conn.close()
    
    def get_processed_repos(self) -> set:
        """Get set of already processed repo names"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        result = {row[0] for row in cursor.execute('SELECT full_name FROM templates').fetchall()}
        conn.close()
        return result

class LaTeXAnalyzer:
    """AI + Heuristic Parser with robust error handling"""
    
    def __init__(self, groq_client: Optional[Groq] = None):
        self.groq = groq_client
        self.pkg_re = re.compile(r'\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}')
        self.docclass_re = re.compile(r'\\documentclass(?:\[[^\]]*\])?\{([^}]+)\}')
    
    def parse_tex(self, content: str) -> Dict[str, Any]:
        """Extract structure from .tex content"""
        if not content or len(content) < 50:
            return {'error': 'Empty or too short'}
        
        doctype_match = self.docclass_re.search(content)
        sections = re.findall(r'\\((?:sub)*section)\{([^}]+)\}', content, re.IGNORECASE)
        packages = list(set(self.pkg_re.findall(content)))
        
        # Validity checks
        has_docclass = bool(doctype_match)
        has_begin_doc = r'\begin{document}' in content
        has_end_doc = r'\end{document}' in content
        is_valid = has_docclass and has_begin_doc and has_end_doc
        
        # Extract keywords
        keyword_patterns = ['resume', 'cv', 'thesis', 'dissertation', 'beamer', 
                          'article', 'moderncv', 'presentation', 'poster']
        keywords = [kw for kw in keyword_patterns if kw in content.lower()]
        
        return {
            'doctype': doctype_match.group(1) if doctype_match else 'unknown',
            'sections': [sec[1].strip() for sec in sections[:20]],  # Limit
            'packages': packages[:30],  # Limit
            'is_valid': is_valid,
            'preview_code': content[:500],
            'keywords': keywords,
            'word_count': len(content.split()),
            'has_tikz': 'tikz' in content.lower(),
            'has_bibtex': any(x in content.lower() for x in ['bibliography', 'biblatex']),
        }
    
    async def ai_categorize(self, repo_info: Dict, tex_parsed: Dict) -> Dict[str, Any]:
        """Use Groq with fallback and validation"""
        if not self.groq or 'error' in tex_parsed:
            return self._heuristic_cat(repo_info.get('description', ''), tex_parsed.get('keywords', []))
        
        prompt = f"""Analyze this LaTeX repo. Output ONLY valid JSON, no markdown.

Repo: {repo_info.get('name', 'unknown')}
Description: {repo_info.get('description', 'N/A')[:200]}
Doctype: {tex_parsed.get('doctype', 'unknown')}
Keywords: {', '.join(tex_parsed.get('keywords', []))}
Packages: {', '.join(tex_parsed.get('packages', [])[:10])}

Categorize into ONE of: {', '.join(CATEGORIES)}

Output format:
{{"category": "resume_cv", "description_ai": "Brief purpose", "features_ai": ["feature1", "feature2"], "use_case": "When to use this"}}"""
        
        try:
            # Run in thread to avoid blocking
            response = await asyncio.to_thread(
                lambda: self.groq.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="llama-3.3-70b-versatile",
                    temperature=0.2,
                    max_tokens=250,
                )
            )
            
            ai_text = response.choices[0].message.content.strip()
            
            # Try multiple JSON extraction methods
            parsed = self._extract_json(ai_text)
            
            # Validate
            if not isinstance(parsed, dict) or 'category' not in parsed:
                raise ValueError("Invalid AI response structure")
            
            if parsed['category'] not in CATEGORIES:
                parsed['category'] = 'general'
            
            return parsed
            
        except Exception as e:
            logger.warning(f"AI categorization failed: {e}")
            return self._heuristic_cat(repo_info.get('description', ''), tex_parsed.get('keywords', []))
    
    def _extract_json(self, text: str) -> Dict:
        """Robust JSON extraction"""
        # Try direct parse
        try:
            return json.loads(text)
        except:
            pass
        
        # Try extracting from markdown
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except:
                pass
        
        # Try finding any JSON object
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except:
                pass
        
        raise ValueError(f"Could not extract JSON from: {text[:100]}")
    
    def _heuristic_cat(self, desc: str, keywords: List[str]) -> Dict[str, Any]:
        """Improved heuristic categorization"""
        desc_lower = desc.lower()
        combined = desc_lower + ' ' + ' '.join(keywords)
        
        category_rules = [
            ('resume_cv', ['resume', 'cv', 'moderncv', 'curriculum']),
            ('thesis_dissertation', ['thesis', 'dissertation', 'phd']),
            ('presentation_slides', ['beamer', 'slide', 'presentation']),
            ('article_paper', ['article', 'paper', 'academic']),
            ('book_manual', ['book', 'manual', 'documentation']),
            ('poster', ['poster', 'conference poster']),
            ('letter_memo', ['letter', 'memo', 'correspondence']),
        ]
        
        for cat, terms in category_rules:
            if any(term in combined for term in terms):
                return {
                    'category': cat,
                    'description_ai': f"Heuristic: {desc[:150]}",
                    'features_ai': [f"Keywords: {', '.join(keywords[:5])}"],
                    'use_case': f"Template for {cat.replace('_', ' ')}"
                }
        
        return {
            'category': 'general',
            'description_ai': desc[:150] if desc else 'No description',
            'features_ai': ['General LaTeX template'],
            'use_case': 'Flexible template'
        }

class GitHubFetcher:
    """Async GitHub API client with retry logic"""
    
    def __init__(self, token: Optional[str], rate_limiter: RateLimiter):
        self.token = token
        self.rate_limiter = rate_limiter
        self.base_headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'LaTeX-Template-Agent/2.0'
        }
        if token:
            self.base_headers['Authorization'] = f'token {token}'
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError))
    )
    async def _fetch_json(self, session: aiohttp.ClientSession, url: str) -> Dict:
        """Fetch with retry and rate limit awareness"""
        await self.rate_limiter.check_and_wait(session)
        async with session.get(url, headers=self.base_headers, timeout=aiohttp.ClientTimeout(total=30)) as resp:
            resp.raise_for_status()
            return await resp.json()
    
    async def discover_repos_stream(self, session: aiohttp.ClientSession, max_repos: int = 2500) -> AsyncIterator[Dict]:
        """Stream repos with pagination"""
        per_page = 100
        page = 1
        total_fetched = 0
        
        while total_fetched < max_repos:
            try:
                url = f"https://api.github.com/search/repositories?q=topic:{TOPIC}&sort=stars&order=desc&per_page={per_page}&page={page}"
                data = await self._fetch_json(session, url)
                
                if 'items' not in data or not data['items']:
                    break
                
                for item in data['items']:
                    if total_fetched >= max_repos:
                        return
                    
                    yield {
                        'name': item['name'],
                        'full_name': item['full_name'],
                        'description': item.get('description', ''),
                        'stars': item.get('stargazers_count', 0),
                        'url': item['html_url'],
                        'clone_url': item['clone_url'],
                        'last_updated': item['updated_at'],
                        'language': item.get('language', ''),
                    }
                    total_fetched += 1
                
                page += 1
                
            except Exception as e:
                logger.error(f"Error fetching page {page}: {e}")
                break
    
    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=5))
    async def fetch_repo_files(self, session: aiohttp.ClientSession, repo_info: Dict) -> Dict:
        """Fetch README and main .tex files"""
        full_name = repo_info['full_name']
        
        try:
            # Get repo contents
            url = f"https://api.github.com/repos/{full_name}/contents"
            contents = await self._fetch_json(session, url)
            
            files = {'readme': '', 'tex_files': [], 'main_tex': ''}
            
            # Find files
            tex_files = [f for f in contents if f.get('name', '').endswith('.tex')][:3]
            readme_file = next((f for f in contents if 'readme' in f.get('name', '').lower()), None)
            
            # Fetch in parallel
            tasks = []
            if readme_file and 'download_url' in readme_file:
                tasks.append(self._fetch_file(session, readme_file['download_url'], 'readme'))
            
            for tex_file in tex_files:
                if 'download_url' in tex_file:
                    tasks.append(self._fetch_file(session, tex_file['download_url'], f"tex_{tex_file['name']}"))
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    continue
                file_type, content = result
                if file_type == 'readme':
                    files['readme'] = content
                elif file_type.startswith('tex_'):
                    files['tex_files'].append({'name': file_type[4:], 'content': content})
                    if 'main' in file_type.lower() or 'template' in file_type.lower():
                        files['main_tex'] = content
            
            # Use first tex if no main found
            if not files['main_tex'] and files['tex_files']:
                files['main_tex'] = files['tex_files'][0]['content']
            
            return files
            
        except Exception as e:
            logger.debug(f"Failed to fetch files for {full_name}: {e}")
            return {'error': str(e)}
    
    async def _fetch_file(self, session: aiohttp.ClientSession, url: str, file_type: str) -> tuple:
        """Fetch individual file with size limit"""
        try:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status == 200:
                    # Limit size
                    content = await resp.text()
                    return (file_type, content[:50000])  # Max 50KB
        except Exception as e:
            logger.debug(f"Failed to fetch {file_type}: {e}")
        return (file_type, '')

class Checkpoint:
    """Save/load progress"""
    def __init__(self, filepath: str = CHECKPOINT_FILE):
        self.filepath = filepath
    
    def save(self, processed: set, total: int):
        with open(self.filepath, 'w') as f:
            json.dump({
                'processed': list(processed),
                'total': total,
                'timestamp': datetime.now().isoformat()
            }, f)
    
    def load(self) -> Optional[set]:
        if not Path(self.filepath).exists():
            return None
        try:
            with open(self.filepath) as f:
                data = json.load(f)
                logger.info(f"Loaded checkpoint: {len(data['processed'])}/{data['total']} repos")
                return set(data['processed'])
        except:
            return None

class LaTeXTemplateAgent:
    """Main orchestrator"""
    
    def __init__(self, db_path: str, groq_key: Optional[str] = None):
        self.db = DatabaseManager(db_path)
        self.analyzer = LaTeXAnalyzer(Groq(api_key=groq_key) if groq_key else None)
        self.rate_limiter = RateLimiter(GITHUB_TOKEN)
        self.fetcher = GitHubFetcher(GITHUB_TOKEN, self.rate_limiter)
        self.checkpoint = Checkpoint()
        self.semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    
    async def run(self, max_repos: int = 2500, resume: bool = True):
        """Main entry point"""
        logger.info(f"Starting agent (max {max_repos} repos)")
        
        # Load checkpoint
        processed = self.checkpoint.load() if resume else None
        if processed is None:
            processed = self.db.get_processed_repos()
        
        logger.info(f"Already processed: {len(processed)} repos")
        
        async with aiohttp.ClientSession() as session:
            repo_stream = self.fetcher.discover_repos_stream(session, max_repos)
            
            batch = []
            total_processed = 0
            pbar = tqdm(total=max_repos, desc="Processing repos")
            
            async for repo_info in repo_stream:
                # Skip if already processed
                if repo_info['full_name'] in processed:
                    pbar.update(1)
                    continue
                
                batch.append(repo_info)
                
                if len(batch) >= BATCH_SIZE:
                    await self._process_batch(session, batch, processed)
                    total_processed += len(batch)
                    pbar.update(len(batch))
                    batch = []
                    
                    # Checkpoint every batch
                    self.checkpoint.save(processed, max_repos)
            
            # Process remaining
            if batch:
                await self._process_batch(session, batch, processed)
                pbar.update(len(batch))
            
            pbar.close()
        
        logger.info(f"Agent complete. Processed {total_processed} new repos")
        self._export_outputs()
    
    async def _process_batch(self, session: aiohttp.ClientSession, batch: List[Dict], processed: set):
        """Process batch with concurrency limit"""
        async def process_with_semaphore(repo):
            async with self.semaphore:
                return await self._process_repo(session, repo)
        
        tasks = [process_with_semaphore(repo) for repo in batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        valid_results = []
        for repo, result in zip(batch, results):
            if isinstance(result, Exception):
                logger.error(f"Failed {repo['name']}: {result}")
            elif result:
                valid_results.append(result)
                processed.add(repo['full_name'])
        
        if valid_results:
            self.db.batch_insert(valid_results)
    
    async def _process_repo(self, session: aiohttp.ClientSession, repo_info: Dict) -> Optional[Dict]:
        """Process single repo"""
        try:
            # Fetch files
            files = await self.fetcher.fetch_repo_files(session, repo_info)
            if 'error' in files:
                return {**repo_info, 'error': files['error']}
            
            # Parse
            main_tex = files.get('main_tex', '')
            tex_parsed = self.analyzer.parse_tex(main_tex)
            
            # Categorize with AI
            ai_cat = await self.analyzer.ai_categorize(repo_info, tex_parsed)
            
            # Merge
            return {**repo_info, **tex_parsed, **ai_cat, 'readme': files.get('readme', '')}
            
        except Exception as e:
            logger.error(f"Process error {repo_info['name']}: {e}")
            return None
    
    def _export_outputs(self):
        """Export JSON and markdown report"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        rows = cursor.execute('''
            SELECT repo_name, full_name, description, category, ai_use_case, 
                   stars, url, doctype, keywords 
            FROM templates ORDER BY stars DESC
        ''').fetchall()
        
        # JSON export
        templates = []
        for row in rows:
            templates.append({
                'repo_name': row[0],
                'full_name': row[1],
                'description': row[2],
                'category': row[3],
                'use_case': row[4],
                'stars': row[5],
                'url': row[6],
                'doctype': row[7],
                'keywords': json.loads(row[8]) if row[8] else []
            })
        
        with open('templates.json', 'w') as f:
            json.dump(templates, f, indent=2)
        
        # Markdown report
        with open('categorized_report.md', 'w') as f:
            f.write(f"# LaTeX Templates Report\n")
            f.write(f"Generated: {datetime.now()}\n")
            f.write(f"Total: {len(templates)}\n\n")
            
            for cat in CATEGORIES:
                cat_templates = [t for t in templates if t['category'] == cat]
                f.write(f"## {cat.upper()}: {len(cat_templates)}\n")
                for t in sorted(cat_templates, key=lambda x: x['stars'], reverse=True)[:5]:
                    f.write(f"- **[{t['repo_name']}]({t['url']})** (⭐ {t['stars']})\n")
                    f.write(f"  - {t['use_case']}\n")
                f.write("\n")
        
        conn.close()
        logger.info("Exported: templates.json, categorized_report.md")

# CLI
import argparse

async def main():
    parser = argparse.ArgumentParser(description="LaTeX Template Agent v2.0")
    parser.add_argument('--max-repos', type=int, default=2500, help="Max repos to process")
    parser.add_argument('--no-resume', action='store_true', help="Ignore checkpoint")
    parser.add_argument('--db', default=DB_PATH, help="Database path")
    args = parser.parse_args()
    
    agent = LaTeXTemplateAgent(args.db, GROQ_API_KEY)
    await agent.run(args.max_repos, resume=not args.no_resume)

if __name__ == "__main__":
    asyncio.run(main())
AGENT_CODE

chmod +x latex_agent.py
echo "✅ Agent script created"
echo ""

# Install dependencies
echo "📦 Installing Python dependencies..."
python3 -m pip install --user --upgrade pip > /dev/null 2>&1
python3 -m pip install --user aiohttp tenacity tqdm groq python-dotenv > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Some dependencies may have failed. Check logs if errors occur."
fi
echo ""

# Setup .env file
echo "🔑 Setting up API keys..."
if [ ! -f .env ]; then
    cat > .env << 'ENV_TEMPLATE'
# GitHub Personal Access Token (optional but recommended)
# Get one at: https://github.com/settings/tokens
# Scopes needed: public_repo
GITHUB_TOKEN=

# Groq API Key (optional, for AI categorization)
# Get one at: https://console.groq.com/keys
GROQ_API_KEY=
ENV_TEMPLATE
    echo "✅ Created .env file"
    echo ""
    echo "📝 API Key Configuration:"
    echo "   Edit the .env file to add your API keys:"
    echo "   - GITHUB_TOKEN (optional): Increases rate limit from 60 to 5000/hour"
    echo "   - GROQ_API_KEY (optional): Enables AI-powered categorization"
    echo ""
    
    # Interactive setup
    read -p "   Would you like to add keys now? (y/n): " add_keys
    if [ "$add_keys" = "y" ] || [ "$add_keys" = "Y" ]; then
        echo ""
        read -p "   GitHub Token (press Enter to skip): " github_token
        read -p "   Groq API Key (press Enter to skip): " groq_key
        
        if [ ! -z "$github_token" ]; then
            sed -i.bak "s/GITHUB_TOKEN=.*/GITHUB_TOKEN=$github_token/" .env
            echo "   ✅ GitHub token saved"
        fi
        
        if [ ! -z "$groq_key" ]; then
            sed -i.bak "s/GROQ_API_KEY=.*/GROQ_API_KEY=$groq_key/" .env
            echo "   ✅ Groq API key saved"
        fi
        rm -f .env.bak
    fi
else
    echo "✅ Using existing .env file"
fi
echo ""

# Create quick-run script
cat > run.sh << 'RUN_SCRIPT'
#!/bin/bash
echo "🚀 Starting LaTeX Template Agent..."
python3 latex_agent.py "$@"
RUN_SCRIPT

chmod +x run.sh

# Summary
echo "╔════════════════════════════════════════════╗"
echo "║          Setup Complete! ✅                ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📂 Location: $(pwd)"
echo ""
echo "🎯 Quick Start:"
echo "   cd $PROJECT_DIR"
echo "   ./run.sh                    # Default: 2500 repos with resume"
echo "   ./run.sh --max-repos 100    # Test with 100 repos"
echo "   ./run.sh --no-resume        # Fresh start (ignore checkpoint)"
echo ""
echo "📄 Output files:"
echo "   - latex_refs.db             # SQLite database"
echo "   - templates.json            # JSON export"
echo "   - categorized_report.md     # Markdown report"
echo "   - latex_agent.log           # Processing log"
echo ""
echo "⏱️  Estimated runtime: ~30min with GitHub token, ~2hrs without"
echo "💾 Memory usage: <500MB"
echo ""
echo "🔧 Edit .env to add/update API keys anytime"
echo ""
