#!/usr/bin/env python3
"""
LaTeX Template Scraper - A resilient tool for discovering, analyzing, and downloading LaTeX templates from GitHub.

Features:
- Scrapes LaTeX templates from GitHub using multiple queries
- Analyzes LaTeX content for structure and categorization
- AI-powered categorization (with Grok API)
- Checkpointing for resuming interrupted work
- Downloads templates locally
- Exports results in multiple formats
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
from openai import OpenAI
from urllib.parse import quote

# Async database support
try:
    import aiosqlite
    HAS_AIOSQLITE = True
except ImportError:
    HAS_AIOSQLITE = False
    logging.warning("aiosqlite not available - database operations may be slower")

# Optional dependencies
try:
    import git
    HAS_GIT = True
except ImportError:
    HAS_GIT = False

# Load environment variables
load_dotenv()

# ==============================================================================
# Configuration
# ==============================================================================

@dataclass
class Config:
    """Configuration class for the LaTeX Template Scraper"""
    
    # API Configuration
    GITHUB_TOKEN: str = field(default_factory=lambda: os.getenv('GITHUB_TOKEN', ''))
    XAI_API_KEY: str = field(default_factory=lambda: os.getenv('XAI_API_KEY', ''))
    
    # Database Configuration
    DB_PATH: str = 'latex_refs.db'
    
    # Scraping Configuration
    DEFAULT_TOPIC: str = 'latex-template'
    BATCH_SIZE: int = 50
    MAX_CONCURRENT: int = 20
    AI_BATCH_SIZE: int = 5
    MAX_REPOS: int = 5000
    FRESH_DAYS: int = 730  # <2 years for fresh
    
    # File Paths
    CHECKPOINT_FILE: str = 'agent_checkpoint.json'
    TEMP_BATCH_FILE: str = 'temp_batch.json'
    DOWNLOAD_DIR: str = 'templates'
    
    # Default Queries - Focused on professional, polished templates
    DEFAULT_QUERIES: List[str] = field(default_factory=lambda: [
        'latex resume template stars:>50',
        'latex cv template stars:>50',
        'moderncv OR awesome-cv OR altacv template stars:>20',
        'latex cover letter template stars:>10',
        'latex professional resume modern stars:>10',
        'latex elegant paper template stars:>10',
        'latex clean thesis template stars:>20',
        'latex minimalist resume stars:>5',
        'latex ats friendly resume stars:>5',
        'topic:latex-template topic:resume stars:>10',
        'topic:latex-template topic:cv stars:>10',
        'topic:latex-template topic:cover-letter',
        'documentclass resume OR cv language:TeX stars:>15',
        'latex invoice OR letter template professional stars:>5'
    ])
    
    # Categories
    CATEGORIES: List[str] = field(default_factory=lambda: [
        'resume_cv', 'cover_letter', 'thesis_dissertation', 'presentation_slides', 
        'article_paper', 'book_manual', 'letter_memo', 'poster', 'invoice_form', 
        'creative_portfolio', 'academic_bibtex', 'business_proposal', 'report', 
        'technical_diagram', 'general'
    ])
    
    # Heuristic Rules
    HEURISTIC_RULES: Dict[str, List[str]] = field(default_factory=lambda: {
        'resume_cv': ['resume', 'cv', 'moderncv', 'curriculum', 'job', 'career', 'professional', 'experiences'],
        'cover_letter': ['cover', 'letter', 'application', 'motivation'],
        'thesis_dissertation': ['thesis', 'dissertation', 'phd', 'master', 'bachelor', 'graduation', 'laTeXthesis'],
        'presentation_slides': ['beamer', 'slide', 'presentation', 'talk', 'conference', 'ppt'],
        'article_paper': ['article', 'paper', 'journal', 'academic', 'research', 'arxiv'],
        'book_manual': ['book', 'manual', 'documentation', 'guide', 'handbook', 'ebook'],
        'poster': ['poster', 'conference poster', 'scientific poster', 'a0'],
        'letter_memo': ['letter', 'memo', 'correspondence', 'email', 'formal'],
        'invoice_form': ['invoice', 'form', 'template form', 'bill', 'receipt'],
        'creative_portfolio': ['portfolio', 'design', 'creative', 'graphic', 'typography'],
        'academic_bibtex': ['bibtex', 'bibliography', 'references', 'cite', 'biber'],
        'business_proposal': ['proposal', 'business', 'contract', 'pitch', 'grant'],
        'report': ['report', 'technical report', 'annual report', 'whitepaper'],
        'technical_diagram': ['tikz', 'pgfplots', 'diagram', 'flowchart', 'circuit'],
        'general': []
    })
    
    def validate(self):
        """Validate configuration and log warnings for missing values"""
        if not self.GITHUB_TOKEN:
            logging.warning("No GitHub token provided - rate limits will be restrictive")
        
        if self.USE_AI and not self.XAI_API_KEY:
            logging.warning("AI categorization requested but no XAI API key provided")
    
    @property
    def USE_AI(self) -> bool:
        return bool(self.XAI_API_KEY)

# ==============================================================================
# Custom Exceptions
# ==============================================================================

class ScraperError(Exception):
    """Base exception for the scraper"""
    pass

class GitHubAPIError(ScraperError):
    """Exception for GitHub API errors"""
    pass

class RateLimitError(GitHubAPIError):
    """Exception for rate limit errors"""
    pass

class DatabaseError(ScraperError):
    """Exception for database errors"""
    pass

# ==============================================================================
# Logging Configuration
# ==============================================================================

def setup_logging(verbose: bool = False, log_file: str = 'latex_scraper.log'):
    """Setup logging configuration"""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    return logging.getLogger(__name__)

# ==============================================================================
# Rate Limiter
# ==============================================================================

class RateLimiter:
    """Rate limiter for GitHub API requests"""
    
    def __init__(self, token: Optional[str] = None):
        self.token = token
        self._session = None
        self.remaining = 5000 if token else 60
        self.reset_timestamp = int(time.time()) + 3600
        self.poll_interval = 5
        self.call_count = 0
        self.lock = asyncio.Lock()
    
    async def check_and_wait(self):
        """Check rate limit and wait if necessary"""
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
                    else:
                        logging.warning(f"Rate poll failed: {resp.status}")
            except Exception as e:
                logging.debug(f"Rate check error: {e}")
            finally:
                if self._session:
                    await self._session.close()
                    self._session = None

# ==============================================================================
# Database Manager
# ==============================================================================

class DatabaseManager:
    """Database manager for storing template information"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._pool = None
        self._init_db()
    
    def _init_db(self):
        """Initialize database with required tables and indexes"""
        try:
            with sqlite3.connect(self.db_path, timeout=30) as conn:
                cursor = conn.cursor()
                
                # Create templates table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS templates (
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
                        main_tex TEXT,
                        tex_preview TEXT,
                        doctype TEXT,
                        sections TEXT,
                        packages TEXT,
                        is_valid BOOLEAN DEFAULT 0,
                        category TEXT DEFAULT 'general',
                        ai_description TEXT DEFAULT '',
                        ai_features TEXT,
                        ai_use_case TEXT DEFAULT '',
                        keywords TEXT,
                        ats_score INTEGER DEFAULT 0,
                        freshness_days INTEGER DEFAULT 0,
                        processing_errors TEXT,
                        processing_status TEXT DEFAULT 'scraped',
                        scraped_at TEXT
                    )
                ''')
                
                # Check and add missing columns
                cursor.execute("PRAGMA table_info(templates)")
                columns = [col[1] for col in cursor.fetchall()]
                
                # Add missing columns one by one
                if 'freshness_days' not in columns:
                    cursor.execute('ALTER TABLE templates ADD COLUMN freshness_days INTEGER DEFAULT 0')
                if 'ats_score' not in columns:
                    cursor.execute('ALTER TABLE templates ADD COLUMN ats_score INTEGER DEFAULT 0')
                if 'processing_errors' not in columns:
                    cursor.execute('ALTER TABLE templates ADD COLUMN processing_errors TEXT')
                if 'processing_status' not in columns:
                    cursor.execute('ALTER TABLE templates ADD COLUMN processing_status TEXT DEFAULT "scraped"')
                if 'scraped_at' not in columns:
                    cursor.execute('ALTER TABLE templates ADD COLUMN scraped_at TEXT')
                if 'ai_description' not in columns:
                    cursor.execute('ALTER TABLE templates ADD COLUMN ai_description TEXT DEFAULT ""')
                if 'ai_features' not in columns:
                    cursor.execute('ALTER TABLE templates ADD COLUMN ai_features TEXT')
                if 'ai_use_case' not in columns:
                    cursor.execute('ALTER TABLE templates ADD COLUMN ai_use_case TEXT DEFAULT ""')
                
                conn.commit()
                
                # Create indexes
                indexes = [
                    'CREATE INDEX IF NOT EXISTS idx_category ON templates(category)',
                    'CREATE INDEX IF NOT EXISTS idx_stars ON templates(stars DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_full_name ON templates(full_name)',
                    'CREATE INDEX IF NOT EXISTS idx_freshness ON templates(freshness_days)',
                    'CREATE INDEX IF NOT EXISTS idx_ats_score ON templates(ats_score DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_status ON templates(processing_status)'
                ]
                
                for idx in indexes:
                    cursor.execute(idx)
                
                cursor.execute('PRAGMA vacuum;')
                cursor.execute('ANALYZE templates;')
                conn.commit()
                
                # Integrity check
                cursor.execute('PRAGMA integrity_check;')
                integrity = cursor.fetchone()[0]
                if 'ok' not in integrity.lower():
                    raise DatabaseError(f"Database integrity check failed: {integrity}")
                
                logging.info("Database initialized successfully")
                
        except Exception as e:
            logging.error(f"Database initialization failed: {e}")
            raise DatabaseError(f"Failed to initialize database: {e}")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get database connection"""
        conn = await aiosqlite.connect(self.db_path, timeout=30)
        try:
            yield conn
        finally:
            await conn.close()
    
    async def batch_insert_or_update(self, entries: List[Dict]):
        """Insert or update multiple entries in a transaction"""
        if not entries:
            return
        
        async with self.get_connection() as conn:
            try:
                await conn.execute("BEGIN TRANSACTION")
                
                for entry in entries:
                    # Validate and sanitize entry
                    entry = self._validate_entry(entry)
                    
                    await conn.execute('''
                        INSERT OR REPLACE INTO templates 
                        (repo_name, full_name, description, stars, forks, url, clone_url, last_updated,
                         readme, main_tex, tex_preview, doctype, sections, packages, is_valid,
                         category, ai_description, ai_features, ai_use_case, keywords, ats_score,
                         freshness_days, processing_errors, processing_status, scraped_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        entry['repo_name'], entry['full_name'], entry['description'][:500],
                        entry['stars'], entry['forks'], entry['url'], entry['clone_url'],
                        entry['last_updated'], entry['readme'][:10000], entry['main_tex'][:100000],
                        entry['tex_preview'][:1000], entry['doctype'],
                        json.dumps(entry['sections']) if entry['sections'] else '[]',
                        json.dumps(entry['packages']) if entry['packages'] else '[]',
                        int(entry['is_valid']), entry['category'], entry['ai_description'][:500],
                        json.dumps(entry['ai_features']) if entry['ai_features'] else '[]',
                        entry['ai_use_case'][:300], json.dumps(entry['keywords']) if entry['keywords'] else '[]',
                        entry['ats_score'], entry['freshness_days'], entry['processing_errors'][:500],
                        entry['processing_status'], entry['scraped_at']
                    ))
                
                await conn.commit()
                logging.info(f"Successfully inserted/updated {len(entries)} entries")
                
            except Exception as e:
                await conn.rollback()
                logging.error(f"Batch insert failed: {e}")
                raise DatabaseError(f"Failed to insert batch: {e}")
    
    def _validate_entry(self, entry: Dict) -> Dict:
        """Validate and sanitize entry data"""
        # Set defaults
        entry.setdefault('forks', 0)
        entry.setdefault('description', '')
        entry.setdefault('stars', 0)
        entry.setdefault('url', '')
        entry.setdefault('clone_url', '')
        entry.setdefault('last_updated', datetime.now().isoformat())
        entry.setdefault('readme', '')
        entry.setdefault('main_tex', '')
        entry.setdefault('tex_preview', '')
        entry.setdefault('doctype', 'unknown')
        entry.setdefault('sections', [])
        entry.setdefault('packages', [])
        entry.setdefault('is_valid', False)
        entry.setdefault('category', 'general')
        entry.setdefault('ai_description', '')
        entry.setdefault('ai_features', [])
        entry.setdefault('ai_use_case', 'General template')
        entry.setdefault('keywords', [])
        entry.setdefault('processing_errors', '')
        
        # Calculate derived fields
        entry['ats_score'] = self._calc_ats_score(entry)
        entry['freshness_days'] = self._calc_freshness(entry.get('last_updated', ''))
        entry['scraped_at'] = datetime.now().isoformat()
        entry['repo_name'] = entry.get('repo_name', entry.get('full_name', '').split('/')[-1] or 'unknown')
        entry['processing_status'] = entry.get('processing_status', 'scraped')
        
        # Sanitize strings
        for key, value in entry.items():
            if isinstance(value, str):
                entry[key] = re.sub(r'[^\w\s\-\.\/\,\:\;\!\?\(\)\[\]\{\}@#\$%\^&\*\+\=\|\\`~]', '', value)
        
        return entry
    
    def _calc_ats_score(self, entry: Dict) -> int:
        """Calculate ATS (Applicant Tracking System) friendliness score"""
        score = 0
        sections_lower = ' '.join(entry.get('sections', [])).lower()
        
        if 'experience' in sections_lower: score += 3
        if 'skills' in sections_lower: score += 2
        if 'education' in sections_lower: score += 2
        if len(entry.get('packages', [])) <= 10: score += 1
        
        tex_lower = entry.get('main_tex', '').lower()
        if not any(pkg in tex_lower for pkg in ['tikz', 'fancyhdr', 'hyperref']): 
            score += 2  # Plain = ATS OK
        
        return min(10, score)
    
    def _calc_freshness(self, updated_str: str) -> int:
        """Calculate freshness in days from last update"""
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
        """Get set of already processed repository names"""
        try:
            async with self.get_connection() as conn:
                cursor = await conn.execute('SELECT full_name FROM templates WHERE processing_status != "error"')
                return {row[0] for row in await cursor.fetchall()}
        except Exception as e:
            logging.error(f"Failed to get processed names: {e}")
            return set()
    
    async def query_top(self, category: str = None, top_n: int = 50, min_stars: int = 10, 
                       fresh_only: bool = False, fresh_days: int = 730) -> List[Dict]:
        """Query top templates by various criteria"""
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
                
                where_clause = ' AND '.join(where) if where else '1=1'
                
                cursor = await conn.execute(f'''
                    SELECT repo_name, full_name, description, category, ai_use_case, stars, forks, url, doctype, keywords,
                           ai_description, ai_features, processing_errors, ats_score, freshness_days, processing_status
                    FROM templates 
                    WHERE {where_clause} AND stars >= ? AND is_valid = 1 AND processing_status != 'error'
                    ORDER BY stars DESC, forks DESC LIMIT ?
                ''', params + [min_stars, top_n])
                
                rows = await cursor.fetchall()
                
                templates = []
                for row in rows:
                    kw = json.loads(row[9]) if row[9] else []
                    feats = json.loads(row[11]) if row[11] else []
                    templates.append({
                        'repo_name': row[0] or 'unknown',
                        'full_name': row[1],
                        'description': row[2] or '',
                        'category': row[3] or 'general',
                        'use_case': row[4] or 'General',
                        'stars': row[5] or 0,
                        'forks': row[6] or 0,
                        'url': row[7] or '',
                        'doctype': row[8] or 'unknown',
                        'keywords': kw,
                        'ai_description': row[10] or '',
                        'ai_features': feats,
                        'errors': row[12] or None,
                        'ats_score': row[13] or 0,
                        'freshness_days': row[14] or 9999,
                        'status': row[15] or 'scraped'
                    })
                
                return templates
                
        except Exception as e:
            logging.error(f"Failed to query top templates: {e}")
            return []
    
    async def count_rows(self) -> int:
        """Count total rows in database"""
        try:
            async with self.get_connection() as conn:
                cursor = await conn.execute('SELECT COUNT(*) FROM templates')
                return (await cursor.fetchone())[0]
        except:
            return 0
    
    async def rebuild(self):
        """Rebuild database indexes and check integrity"""
        try:
            async with self.get_connection() as conn:
                await conn.execute('PRAGMA integrity_check;')
                cursor = await conn.execute('PRAGMA integrity_check;')
                integrity = (await cursor.fetchone())[0]
                
                if 'ok' not in integrity.lower():
                    logging.warning(f"Database integrity issue: {integrity} - attempting repair")
                    await conn.execute('REINDEX;')
                
                await conn.execute('VACUUM;')
                await conn.execute('ANALYZE;')
                await conn.commit()
                
                logging.info("Database rebuilt successfully")
                
        except Exception as e:
            logging.error(f"Database rebuild failed: {e}")
            raise DatabaseError(f"Failed to rebuild database: {e}")
    
    async def close(self):
        """Close database connection"""
        # No pooling, so nothing to close
        pass

# ==============================================================================
# Checkpoint Manager
# ==============================================================================

class CheckpointManager:
    """Manages checkpointing for resuming interrupted work"""
    
    def __init__(self, checkpoint_file: str = Config.CHECKPOINT_FILE, 
                 temp_batch_file: str = Config.TEMP_BATCH_FILE):
        self.checkpoint_file = checkpoint_file
        self.temp_batch_file = temp_batch_file
    
    def save(self, processed: Set[str], total_new: int, queries_used: Dict, 
             start_pages: Dict, query_idx: int):
        """Save checkpoint state"""
        try:
            data = {
                'processed': list(processed),
                'total_new': total_new,
                'queries_used': queries_used,
                'start_pages': start_pages,
                'query_idx': query_idx
            }
            with open(self.checkpoint_file, 'w') as f:
                json.dump(data, f, indent=2)
            logging.info(f"Checkpoint saved to {self.checkpoint_file}")
        except Exception as e:
            logging.error(f"Failed to save checkpoint: {e}")
    
    def load(self) -> tuple[Set[str], Dict, int, Dict]:
        """Load checkpoint state"""
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
            logging.info("No checkpoint found - starting fresh")
            return set(), {}, 0, {}
        except Exception as e:
            logging.error(f"Failed to load checkpoint: {e}")
            return set(), {}, 0, {}
    
    def save_batch_progress(self, batch: List[Dict], context: Dict):
        """Save batch progress"""
        try:
            data = {'batch': batch, 'context': context}
            with open(self.temp_batch_file, 'w') as f:
                json.dump(data, f, indent=2)
            logging.debug(f"Batch progress saved to {self.temp_batch_file}")
        except Exception as e:
            logging.error(f"Failed to save batch progress: {e}")
    
    def load_batch_progress(self) -> List[Dict]:
        """Load batch progress"""
        try:
            with open(self.temp_batch_file, 'r') as f:
                data = json.load(f)
                return data.get('batch', [])
        except FileNotFoundError:
            return []
        except Exception as e:
            logging.error(f"Failed to load batch progress: {e}")
            return []
    
    def cleanup(self):
        """Clean up temporary files"""
        Path(self.temp_batch_file).unlink(missing_ok=True)

# ==============================================================================
# LaTeX Analyzer
# ==============================================================================

class LaTeXAnalyzer:
    """Analyzes LaTeX content for structure and categorization"""
    
    def __init__(self, xai_client: Optional[OpenAI] = None, config: Optional[Config] = None):
        self.xai = xai_client
        self.use_ai = xai_client is not None
        self.config = config or Config()
        
        # Compile regex patterns
        self.docclass_re = re.compile(r'\\documentclass(?:\s*\[.*?\])?\s*\{([^}]+?)\}')
        self.section_re = re.compile(r'\\((?:sub)?(?:sub)?section\*?)\s*\{([^}]+?)\}')
        self.pkg_re = re.compile(r'\\usepackage(?:\s*\[.*?\])?\s*\{([^}]+?)\}')
        self.comment_re = re.compile(r'%.*', re.MULTILINE)
        
        # Build keyword regex
        all_keywords = sum(self.config.HEURISTIC_RULES.values(), [])
        self.keyword_re = re.compile(r'(?i)\b(?:' + '|'.join(all_keywords) + r')\b')
    
    def parse_tex(self, content: str) -> Dict[str, Any]:
        """Parse LaTeX content and extract structure"""
        content = self.comment_re.sub('', content)  # Remove comments
        
        parsed = {
            'error': '',
            'doctype': 'unknown',
            'sections': [],
            'packages': [],
            'is_valid': False,
            'preview_code': '',
            'keywords': [],
            'word_count': 0,
            'has_tikz': False,
            'has_bibtex': False,
            'tex_size': len(content)
        }
        
        if not content or len(content) < 50:
            parsed['error'] = 'Empty/short content (skipped)'
            return parsed
        
        # Extract document class
        doctype_match = self.docclass_re.search(content)
        if doctype_match:
            parsed['doctype'] = doctype_match.group(1).strip()
        
        # Extract sections
        sections = self.section_re.findall(content)
        parsed['sections'] = list(set(sec[1].strip() for sec in sections[:30]))
        
        # Extract packages
        packages = self.pkg_re.findall(content)
        parsed['packages'] = list(set(pkg.strip() for pkg in packages[:50]))
        
        # Check validity
        has_begin_doc = r'\begin\s*\{\s*document\s*\}' in content
        has_end_doc = r'\end\s*\{\s*document\s*\}' in content
        has_docclass = parsed['doctype'] != 'unknown'
        has_content = len(re.findall(r'[a-zA-Z]+\{', content)) > 2
        
        parsed['is_valid'] = (
            has_docclass and 
            has_begin_doc and 
            has_end_doc and 
            has_content and 
            len(content) > 200
        )
        
        # Extract keywords
        keyword_matches = list(set(self.keyword_re.findall(content)))
        parsed['keywords'] = [kw for kw in keyword_matches if len(kw) > 2]
        
        # Check for special features
        parsed['has_tikz'] = (
            any('tikz' in p.lower() for p in parsed['packages']) or 
            'tikzpicture' in content.lower()
        )
        parsed['has_bibtex'] = any(
            kw in content.lower() 
            for kw in ['bibliography', 'bibtex', r'\\cite']
        )
        
        # Calculate word count
        parsed['word_count'] = len(re.findall(r'\w+', content))
        
        # Create preview
        preview_len = min(2000, len(content))
        parsed['preview_code'] = (
            content[:preview_len] + '...' 
            if len(content) > preview_len else content
        )
        
        if parsed['tex_size'] > 100000:
            parsed['error'] += 'Large file truncated; '
        
        return parsed
    
    async def ai_categorize_batch(self, entries: List[Dict]) -> List[Dict]:
        """Categorize entries using AI"""
        if not self.use_ai:
            return [self._heuristic_categorize(entry) for entry in entries]
        
        try:
            prompt = (
                "Categorize the following LaTeX templates based on their content and metadata. "
                f"For each, assign a category from: {', '.join(self.config.CATEGORIES)}. "
                "Provide a brief description, key features (list up to 5), and a use case. "
                "Return JSON for each entry with fields: category, ai_description, ai_features, ai_use_case.\n\n"
            )
            
            for entry in entries:
                prompt += (
                    f"Repo: {entry['full_name']}\n"
                    f"Description: {entry.get('description', '')}\n"
                    f"Doctype: {entry.get('doctype', 'unknown')}\n"
                    f"Sections: {', '.join(entry.get('sections', []))}\n"
                    f"Packages: {', '.join(entry.get('packages', []))}\n"
                    f"Keywords: {', '.join(entry.get('keywords', []))}\n"
                    f"Preview:\n{entry.get('preview_code', '')[:500]}\n---\n"
                )
            
            response = self.xai.chat.completions.create(
                model="grok4-fast-reasoning",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000
            )
            
            raw_output = response.choices[0].message.content
            results = self._extract_json(raw_output)
            
            for entry, result in zip(entries, results):
                if result:
                    entry.update({
                        'category': result.get('category', 'general'),
                        'ai_description': result.get('ai_description', ''),
                        'ai_features': result.get('ai_features', []),
                        'ai_use_case': result.get('ai_use_case', 'General template')
                    })
                else:
                    entry.update(self._heuristic_categorize(entry))
            
            return entries
            
        except Exception as e:
            logging.error(f"AI categorization failed: {e}")
            return [self._heuristic_categorize(entry) for entry in entries]
    
    def _extract_json(self, raw: str) -> List[Dict]:
        """Extract JSON objects from raw text"""
        try:
            results = []
            json_blocks = re.findall(r'\{.*?\}', raw, re.DOTALL)
            for block in json_blocks:
                try:
                    results.append(json.loads(block))
                except:
                    continue
            return results
        except:
            return []
    
    def _heuristic_categorize(self, entry: Dict) -> Dict:
        """Categorize entry using heuristic rules"""
        text = (
            entry.get('description', '') + ' ' + 
            ' '.join(entry.get('sections', [])) + ' ' +
            ' '.join(entry.get('keywords', [])) + ' ' + 
            entry.get('preview_code', '')
        ).lower()
        
        for cat, keywords in self.config.HEURISTIC_RULES.items():
            if any(kw in text for kw in keywords):
                return {
                    'category': cat,
                    'ai_description': f"Heuristic: {cat.replace('_', ' ').title()} template",
                    'ai_features': keywords[:5],
                    'ai_use_case': f"Use for {cat.replace('_', ' ').title()}"
                }
        
        return {
            'category': 'general',
            'ai_description': 'General LaTeX template',
            'ai_features': [],
            'ai_use_case': 'General template'
        }

# ==============================================================================
# GitHub Fetcher
# ==============================================================================

class GitHubFetcher:
    """Fetches repository information from GitHub API"""
    
    def __init__(self, token: Optional[str] = None, rate_limiter: Optional[RateLimiter] = None):
        self.token = token
        self.rate_limiter = rate_limiter
        self._session = None
        
        self.base_headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'LaTeX-Template-Agent/1.0'
        }
        
        if token:
            self.base_headers['Authorization'] = f'token {token}'
        
        self.default_params = {'fork': 'false', 'archived': 'false'}
    
    async def get_session(self):
        """Get or create HTTP session"""
        if not self._session or self._session.closed:
            connector = aiohttp.TCPConnector(limit=100, limit_per_host=30)
            timeout = aiohttp.ClientTimeout(total=30)
            self._session = aiohttp.ClientSession(connector=connector, timeout=timeout)
        return self._session
    
    async def close(self):
        """Close HTTP session"""
        if self._session and not self._session.closed:
            await self._session.close()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type((aiohttp.ClientError, asyncio.TimeoutError))
    )
    async def _fetch_json(self, url: str, params: Dict = None) -> Dict:
        """Fetch JSON from GitHub API with retries"""
        if self.rate_limiter:
            await self.rate_limiter.check_and_wait()
        
        session = await self.get_session()
        
        try:
            async with session.get(
                url, 
                headers=self.base_headers, 
                params=params or self.default_params
            ) as resp:
                if resp.status == 200:
                    return await resp.json()
                elif resp.status == 403:
                    raise RateLimitError(f"Rate limit exceeded for {url}")
                elif resp.status == 404:
                    logging.warning(f"Resource not found: {url}")
                    return {}
                else:
                    raise GitHubAPIError(f"API error for {url}: Status {resp.status}")
                    
        except asyncio.TimeoutError:
            logging.error(f"Timeout fetching {url}")
            return {}
        except aiohttp.ClientError as e:
            logging.error(f"Client error for {url}: {e}")
            return {}
    
    async def discover_repos_stream(self, queries: List[str], max_repos: int, 
                                   start_page: int = 1) -> AsyncIterator[Dict]:
        """Discover repositories matching queries"""
        per_page = 100
        repos_fetched = 0
        
        for query in queries:
            page = start_page
            while repos_fetched < max_repos:
                params = {
                    'q': query,
                    'sort': 'stars',
                    'order': 'desc',
                    'per_page': per_page,
                    'page': page
                }
                
                data = await self._fetch_json(
                    'https://api.github.com/search/repositories', 
                    params
                )
                
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
                        'last_updated': repo.get('updated_at', '')
                    }
                    
                    yield repo_info
                    repos_fetched += 1
                
                page += 1
                if not data.get('items'):
                    break
    
    async def download_repo(self, repo_info: Dict, output_dir: Path, 
                           method: str = 'git') -> bool:
        """Download repository files locally"""
        full_name = repo_info['full_name']
        category = repo_info.get('category', 'general')
        repo_name = repo_info.get('repo_name', full_name.split('/')[-1])
        local_repo_dir = output_dir / category / repo_name
        local_repo_dir.mkdir(parents=True, exist_ok=True)
        
        repo_info['local_path'] = str(local_repo_dir)
        
        try:
            if method == 'git' and HAS_GIT:
                git.Repo.clone_from(repo_info['clone_url'], local_repo_dir, depth=1)
                logging.info(f"Cloned {full_name} to {local_repo_dir}")
                return True
            
            # Fallback to raw file download
            return await self._download_raw_files(repo_info, local_repo_dir)
            
        except Exception as e:
            logging.error(f"Download failed for {full_name}: {e}")
            repo_info['processing_errors'] = f"; Download error: {str(e)}"
            repo_info['processing_status'] = 'error_download'
            return False
    
    async def _download_raw_files(self, repo_info: Dict, local_repo_dir: Path) -> bool:
        """Download repository files using raw URLs"""
        session = await self.get_session()
        full_name = repo_info['full_name']
        
        try:
            # Get repository contents
            contents_url = f"https://api.github.com/repos/{full_name}/contents"
            contents = await self._fetch_json(contents_url)
            
            # Filter for relevant files
            tex_files = [
                c for c in contents 
                if c.get('name', '').lower().endswith(('.tex', '.cls', '.sty'))
            ][:10]
            
            downloaded = 0
            for file in tex_files:
                file_path = local_repo_dir / file['name']
                if file_path.exists():
                    continue
                
                async with session.get(
                    file['download_url'], 
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        content = await resp.text()
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        downloaded += 1
                        logging.debug(f"Downloaded {file['name']} to {file_path}")
            
            # Try to download README
            try:
                readme_data = await self._fetch_json(
                    f"https://api.github.com/repos/{full_name}/readme"
                )
                if 'download_url' in readme_data:
                    readme_path = local_repo_dir / 'README.md'
                    if not readme_path.exists():
                        async with session.get(readme_data['download_url']) as resp:
                            if resp.status == 200:
                                with open(readme_path, 'w') as f:
                                    f.write(await resp.text())
            except Exception as e:
                logging.debug(f"README download failed for {full_name}: {e}")
            
            success = downloaded > 0
            if success:
                logging.info(f"Downloaded {downloaded} files from {full_name}")
            else:
                logging.warning(f"No new files downloaded for {full_name}")
            
            return success
            
        except Exception as e:
            logging.error(f"Raw download failed for {full_name}: {e}")
            return False

# ==============================================================================
# Main Agent Class
# ==============================================================================

class LaTeXTemplateAgent:
    """Main agent class for orchestrating the scraping process"""
    
    def __init__(self, config: Config, db_manager: Optional[DatabaseManager] = None,
                 fetcher: Optional[GitHubFetcher] = None, analyzer: Optional[LaTeXAnalyzer] = None,
                 checkpoint: Optional[CheckpointManager] = None):
        """Initialize the agent with optional dependency injection"""
        self.config = config
        
        # Initialize components
        self.db = db_manager or DatabaseManager(config.DB_PATH)
        self.checkpoint = checkpoint or CheckpointManager()
        
        # Initialize rate limiter
        rate_limiter = RateLimiter(config.GITHUB_TOKEN)
        
        # Initialize fetcher
        self.fetcher = fetcher or GitHubFetcher(config.GITHUB_TOKEN, rate_limiter)
        
        # Initialize analyzer
        xai_client = None
        if config.USE_AI and config.XAI_API_KEY:
            xai_client = OpenAI(
                api_key=config.XAI_API_KEY,
                base_url="https://api.x.ai/v1"
            )
            logging.info("Grok client initialized")
        
        self.analyzer = analyzer or LaTeXAnalyzer(xai_client, config)
        
        # Control variables
        self.semaphore = asyncio.Semaphore(config.MAX_CONCURRENT)
        self.shutdown_flag = False
    
    async def run(self, max_repos: int = None, resume: bool = True, 
                  force_fresh: bool = False, custom_query: str = None,
                  top_n: int = 100, export_csv: bool = False, 
                  fresh_only: bool = True, download: bool = False,
                  download_top: int = 20, output_dir: str = None,
                  clone_method: str = 'git', rebuild_db: bool = False):
        """Run the scraping process"""
        
        # Set defaults from config
        max_repos = max_repos or self.config.MAX_REPOS
        output_dir = output_dir or self.config.DOWNLOAD_DIR
        
        # Rebuild database if requested
        if rebuild_db:
            await self.db.rebuild()
        
        # Load or initialize checkpoint
        if force_fresh:
            processed, start_pages, query_idx, queries_used = set(), {}, 0, {}
            logging.info("Starting fresh run")
        else:
            processed, start_pages, query_idx, queries_used = self.checkpoint.load()
            if not resume:
                processed, start_pages, query_idx, queries_used = set(), {}, 0, {}
        
        # Prepare queries
        queries = [custom_query] if custom_query else self.config.DEFAULT_QUERIES
        logging.info(f"Running with {len(queries)} queries")
        
        # Setup signal handlers
        self._setup_signal_handlers()
        
        total_new = 0
        
        try:
            # Main scraping loop
            async with await self.fetcher.get_session():
                pbar = tqdm(total=max_repos, desc="Scraping Templates", unit="repo")
                
                for q_idx in range(query_idx, len(queries)):
                    if self.shutdown_flag:
                        logging.warning("Shutdown requested - saving state")
                        break
                    
                    query = queries[q_idx]
                    start_page = start_pages.get(query, 1)
                    
                    # Stream repositories
                    stream = self.fetcher.discover_repos_stream(
                        [query], 
                        max_repos // len(queries), 
                        start_page
                    )
                    
                    batch = self.checkpoint.load_batch_progress() or []
                    current_page = start_page
                    
                    async for repo_info in stream:
                        if self.shutdown_flag:
                            logging.info("Graceful shutdown - saving batch")
                            self.checkpoint.save_batch_progress(
                                batch, 
                                {'query': query, 'page': current_page}
                            )
                            self._save_checkpoint(
                                processed, total_new, queries_used, 
                                start_pages, q_idx
                            )
                            break
                        
                        full_name = repo_info['full_name']
                        if full_name in processed:
                            pbar.update(1)
                            continue
                        
                        batch.append(repo_info)
                        
                        # Process batch when full
                        if len(batch) >= self.config.BATCH_SIZE:
                            self.checkpoint.save_batch_progress(
                                batch, 
                                {'query': query, 'page': current_page}
                            )
                            
                            new_in_batch = await self._process_batch(batch, processed)
                            total_new += new_in_batch
                            pbar.update(len(batch))
                            batch = []
                            current_page += 1
                            start_pages[query] = current_page
                            queries_used[query] = True
                            
                            self._save_checkpoint(
                                processed, total_new, queries_used, 
                                start_pages, q_idx
                            )
                    
                    # Process remaining batch
                    if batch and not self.shutdown_flag:
                        self.checkpoint.save_batch_progress(
                            batch, 
                            {'query': query, 'page': current_page}
                        )
                        
                        new_in_batch = await self._process_batch(batch, processed)
                        total_new += new_in_batch
                        pbar.update(len(batch))
                        start_pages[query] = current_page
                        queries_used[query] = True
                        
                        self._save_checkpoint(
                            processed, total_new, queries_used, 
                            start_pages, q_idx
                        )
                
                pbar.close()
                
        except KeyboardInterrupt:
            logging.warning("Interrupted by user")
        except Exception as e:
            logging.error(f"Run error: {e}")
        finally:
            self._save_checkpoint(
                processed, total_new, queries_used, 
                start_pages, len(queries)
            )
            self.checkpoint.cleanup()
            logging.info("Cleanup complete")
        
        # Export results
        await self._export_results(total_new, top_n, export_csv, fresh_only)
        
        # Download templates if requested
        if download:
            await self.download_templates(download_top, output_dir, clone_method)
        
        total_db = await self.db.count_rows()
        logging.info(f"Complete: {total_new} new templates (Total: {total_db})")
        print(f"✅ Complete: {total_new} new templates added!")
    
    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(sig, frame):
            logging.warning(f"Signal {sig} received - shutting down gracefully")
            self.shutdown_flag = True
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    def _save_checkpoint(self, processed, total_new, queries_used, start_pages, query_idx):
        """Save checkpoint state"""
        self.checkpoint.save(processed, total_new, queries_used, start_pages, query_idx)
    
    async def _process_batch(self, batch: List[Dict], processed: Set[str]) -> int:
        """Process a batch of repositories"""
        async def fetch_tex_content(repo_info: Dict) -> Dict:
            async with self.semaphore:
                try:
                    contents_url = f"https://api.github.com/repos/{repo_info['full_name']}/contents"
                    contents = await self.fetcher._fetch_json(contents_url)
                    
                    tex_files = [
                        c for c in contents 
                        if c.get('name', '').lower().endswith('.tex')
                    ][:1]
                    
                    if tex_files:
                        session = await self.fetcher.get_session()
                        async with session.get(
                            tex_files[0]['download_url'],
                            timeout=aiohttp.ClientTimeout(total=30)
                        ) as resp:
                            if resp.status == 200:
                                repo_info['main_tex'] = await resp.text()
                    
                    return repo_info
                    
                except Exception as e:
                    repo_info['processing_errors'] = f"Tex fetch error: {str(e)}"
                    return repo_info
        
        # Fetch LaTeX content
        tasks = [fetch_tex_content(repo_info) for repo_info in batch]
        entries = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions
        valid_entries = []
        for entry in entries:
            if isinstance(entry, Exception):
                continue
            valid_entries.append(entry)
        
        # Parse LaTeX content
        for entry in valid_entries:
            if entry.get('main_tex'):
                parsed = self.analyzer.parse_tex(entry['main_tex'])
                entry.update(parsed)
            else:
                entry['processing_errors'] = "; No tex file found"
                entry['processing_status'] = 'error_no_tex'
        
        # Categorize entries
        if self.analyzer.use_ai:
            valid_entries = await self.analyzer.ai_categorize_batch(valid_entries)
        else:
            for entry in valid_entries:
                entry.update(self.analyzer._heuristic_categorize(entry))
        
        # Update processing status
        for entry in valid_entries:
            if entry.get('is_valid') and entry.get('ats_score', 0) >= 5:
                entry['processing_status'] = 'scraped_valid'
            else:
                entry['processing_status'] = 'scraped_invalid'
        
        # Save to database
        if valid_entries:
            await self.db.batch_insert_or_update(valid_entries)
        
        # Update processed set
        new_count = 0
        for entry in valid_entries:
            if entry['full_name'] not in processed:
                processed.add(entry['full_name'])
                new_count += 1
        
        return new_count
    
    async def download_templates(self, top_per_cat: int = 20, output_dir: str = None,
                               method: str = 'git'):
        """Download top templates locally"""
        output_dir = output_dir or self.config.DOWNLOAD_DIR
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        # Get top repositories
        top_repos = []
        for cat in self.config.CATEGORIES:
            cat_top = await self.db.query_top(
                category=cat, 
                top_n=top_per_cat, 
                fresh_only=True, 
                min_stars=10,
                fresh_days=self.config.FRESH_DAYS
            )
            top_repos.extend(cat_top)
        
        # Sort by stars
        top_repos = sorted(
            top_repos, 
            key=lambda r: r['stars'], 
            reverse=True
        )[: (top_per_cat * len(self.config.CATEGORIES))]
        
        # Download repositories
        download_success = 0
        pbar = tqdm(
            total=len(top_repos), 
            desc="Downloading Templates", 
            unit="repo"
        )
        
        for repo in top_repos:
            if repo.get('processing_status') == 'downloaded':
                pbar.update(1)
                continue
            
            try:
                success = await self.fetcher.download_repo(repo, output_path, method)
                if success:
                    await self.db.batch_insert_or_update([{
                        'full_name': repo['full_name'],
                        'processing_status': 'downloaded',
                        'local_path': repo.get('local_path', '')
                    }])
                    download_success += 1
                pbar.update(1)
            except Exception as e:
                logging.error(f"Download error for {repo['full_name']}: {e}")
                pbar.update(1)
        
        pbar.close()
        logging.info(f"Downloaded {download_success}/{len(top_repos)} repositories")
        print(f"📦 Templates downloaded to {output_path}")
    
    async def _export_results(self, total_new: int, top_n: int, export_csv: bool, 
                             fresh_only: bool):
        """Export results in various formats"""
        top_repos = await self.db.query_top(top_n=top_n, fresh_only=fresh_only, fresh_days=self.config.FRESH_DAYS)
        
        # JSON export
        output = {
            'total_new': total_new,
            'total_db': await self.db.count_rows(),
            'top_templates': top_repos
        }
        
        with open('templates_report.json', 'w') as f:
            json.dump(output, f, indent=2)
        
        # CSV export
        if export_csv:
            with open('templates_report.csv', 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=[
                    'full_name', 'category', 'stars', 'ats_score', 
                    'freshness_days', 'ai_use_case', 'url'
                ])
                writer.writeheader()
                for repo in top_repos:
                    writer.writerow({
                        'full_name': repo['full_name'],
                        'category': repo['category'],
                        'stars': repo['stars'],
                        'ats_score': repo['ats_score'],
                        'freshness_days': repo['freshness_days'],
                        'ai_use_case': repo['ai_use_case'],
                        'url': repo['url']
                    })
        
        # Markdown export
        with open('templates_report.md', 'w') as f:
            f.write(f"# LaTeX Template Report\n\n")
            f.write(f"- **New Templates**: {total_new}\n")
            f.write(f"- **Total in DB**: {await self.db.count_rows()}\n\n")
            f.write("## Top Templates\n")
            
            for repo in top_repos[:10]:
                f.write(
                    f"- **{repo['full_name']}** ({repo['category']}): "
                    f"{repo['ai_use_case']} (Stars: {repo['stars']}, "
                    f"ATS: {repo['ats_score']})\n"
                )
    
    async def cleanup(self):
        """Cleanup resources"""
        await self.fetcher.close()
        await self.db.close()

# ==============================================================================
# Main Entry Point
# ==============================================================================

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="LaTeX Template Scraper v1.0",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --max-repos 1000 --download
  %(prog)s --query "latex resume template" --export-csv
  %(prog)s --force-fresh --rebuild-db --verbose
        """
    )
    
    # Scraping options
    parser.add_argument('--max-repos', type=int, help="Maximum repositories to scrape")
    parser.add_argument('--query', type=str, help="Custom search query")
    parser.add_argument('--resume', action='store_true', default=True, help="Resume from checkpoint")
    parser.add_argument('--force-fresh', action='store_true', help="Force fresh start")
    parser.add_argument('--rebuild-db', action='store_true', help="Rebuild database")
    
    # AI options
    parser.add_argument('--no-ai', action='store_true', help="Disable AI categorization")
    
    # Output options
    parser.add_argument('--top-n', type=int, default=100, help="Number of top templates to report")
    parser.add_argument('--export-csv', action='store_true', help="Export results as CSV")
    parser.add_argument('--fresh-only', action='store_true', default=True, help="Only include fresh templates")
    
    # Download options
    parser.add_argument('--download', action='store_true', help="Download templates locally")
    parser.add_argument('--download-top', type=int, default=20, help="Top templates per category to download")
    parser.add_argument('--output-dir', help="Download directory")
    parser.add_argument('--clone-method', choices=['git', 'raw'], default='git', help="Download method")
    
    # Database options
    parser.add_argument('--db', help="Database file path")
    
    # Other options
    parser.add_argument('--verbose', action='store_true', help="Verbose logging")
    
    args = parser.parse_args()
    
    # Setup logging
    logger = setup_logging(args.verbose)
    
    # Load configuration
    config = Config()
    
    # Override config with arguments
    if args.max_repos:
        config.MAX_REPOS = args.max_repos
    if args.db:
        config.DB_PATH = args.db
    if args.output_dir:
        config.DOWNLOAD_DIR = args.output_dir
    if args.no_ai:
        config.XAI_API_KEY = None
    
    # Validate configuration
    config.validate()
    
    # Create and run agent
    async def run():
        agent = LaTeXTemplateAgent(config)
        try:
            await agent.run(
                max_repos=args.max_repos,
                resume=args.resume,
                force_fresh=args.force_fresh,
                custom_query=args.query,
                top_n=args.top_n,
                export_csv=args.export_csv,
                fresh_only=args.fresh_only,
                download=args.download,
                download_top=args.download_top,
                output_dir=args.output_dir,
                clone_method=args.clone_method,
                rebuild_db=args.rebuild_db
            )
        finally:
            await agent.cleanup()
    
    # Run the agent
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        logging.info("Interrupted by user")
    except Exception as e:
        logging.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
