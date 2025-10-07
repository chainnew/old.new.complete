#!/usr/bin/env python3
"""
Document & Visualization Theme Scraper - A comprehensive tool for discovering themes and templates.

Targets:
- JSON Resume themes (HTML/CSS/JS)
- Mermaid diagram themes
- Chart.js plugins and examples
- React Flow examples
- D3.js visualization templates
- Recharts examples
- General document generation themes

Features:
- Multi-category scraping with targeted queries
- Analyzes theme structure, features, and technology stack
- AI-powered categorization (with Grok API)
- Checkpointing for resuming interrupted work
- Downloads themes locally
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
import requests
from itertools import cycle

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
    
    # Database Configuration
    DB_PATH: str = 'themes.db'
    
    # Scraping Configuration
    BATCH_SIZE: int = 30
    MAX_CONCURRENT: int = 20
    AI_BATCH_SIZE: int = 5
    MAX_REPOS: int = 1000
    FRESH_DAYS: int = 730  # <2 years for fresh
    
    # File Paths
    CHECKPOINT_FILE: str = 'agent_checkpoint.json'
    TEMP_BATCH_FILE: str = 'temp_batch.json'
    DOWNLOAD_DIR: str = 'themes'
    
    # Default Queries - Comprehensive coverage
    DEFAULT_QUERIES: List[str] = field(default_factory=lambda: [
        # JSON Resume themes
        'jsonresume-theme stars:>5',
        'topic:jsonresume-theme stars:>3',
        '"jsonresume theme" in:description stars:>2',
        'jsonresume theme in:name',
        
        # Mermaid themes and examples
        'mermaid theme stars:>10',
        'mermaid diagram template stars:>5',
        'topic:mermaid-diagrams',
        'mermaid flowchart example',
        
        # Chart.js plugins and themes
        'chartjs-chart stars:>20',
        'chartjs-plugin stars:>10',
        'topic:chartjs-plugin',
        'chart.js theme',
        
        # React Flow examples
        'react-flow example stars:>10',
        'topic:reactflow',
        'react flow diagram',
        
        # D3.js visualizations
        'd3-chart template stars:>15',
        'd3 visualization example stars:>10',
        'topic:d3-visualization',
        
        # Recharts examples
        'recharts example stars:>5',
        'topic:recharts',
        
        # General document themes
        'resume template html css stars:>10',
        'cv template javascript stars:>5',
        'document generator theme',
        'portfolio template stars:>20',
        
        # Billboard.js and other chart libraries
        'billboard.js example',
        'britecharts example',
        'plottable chart',
        
        # Infographic templates
        'infographic template javascript',
        'data visualization template html',
    ])
    
    # Categories
    CATEGORIES: List[str] = field(default_factory=lambda: [
        'jsonresume_theme',
        'mermaid_theme',
        'chartjs_plugin',
        'chartjs_example',
        'react_flow_example',
        'd3_visualization',
        'd3_chart_library',
        'recharts_example',
        'document_template',
        'infographic_template',
        'portfolio_template',
        'general_visualization',
        'other'
    ])
    
    # Technology Stack Keywords
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
    })
    
    # Heuristic Rules for Categorization
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
    })
    
    def validate(self):
        """Validate configuration and log warnings for missing values"""
        if not self.GITHUB_TOKEN:
            logging.warning("No GitHub token provided - rate limits will be restrictive")
        
        valid_keys = [k for k in self.MINIMAX_API_KEYS if k]
        if self.USE_AI and not valid_keys:
            logging.warning("AI categorization requested but no MiniMax API keys provided")
        elif valid_keys:
            logging.info(f"Loaded {len(valid_keys)} MiniMax API keys")
    
    @property
    def USE_AI(self) -> bool:
        return any(self.MINIMAX_API_KEYS)

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

def setup_logging(verbose: bool = False, log_file: str = 'theme_scraper.log'):
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
            except Exception as e:
                logging.debug(f"Rate check error: {e}")
            finally:
                if self._session:
                    await self._session.close()
                    self._session = None

# ==============================================================================
# MiniMax Client
# ==============================================================================

class MiniMaxClient:
    """Client for MiniMax API with key rotation"""
    
    def __init__(self, api_keys: List[str]):
        """Initialize with list of API keys"""
        self.api_keys = [key for key in api_keys if key]  # Filter out empty keys
        if not self.api_keys:
            raise ValueError("No valid MiniMax API keys provided")
        
        self.key_cycle = cycle(self.api_keys)
        self.current_key = next(self.key_cycle)
        self.base_url = "https://api.minimax.io/v1/text/chatcompletion_v2"
        
        logging.info(f"MiniMax client initialized with {len(self.api_keys)} API keys")
    
    def _get_next_key(self):
        """Rotate to next API key"""
        self.current_key = next(self.key_cycle)
        return self.current_key
    
    def chat_completion(self, messages: List[Dict], model: str = "MiniMax-Text-01", 
                       max_tokens: int = 2048, temperature: float = 0.7,
                       stream: bool = False) -> Dict:
        """
        Call MiniMax chat completion API
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model name (MiniMax-Text-01 or MiniMax-M1)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.1-1.0)
            stream: Whether to stream response
        
        Returns:
            Response dict with 'choices' containing generated text
        """
        headers = {"Authorization": f"Bearer {self.current_key}"}
        
        # Format messages for MiniMax - add name field
        formatted_messages = []
        for msg in messages:
            formatted_msg = {
                "role": msg["role"],
                "content": msg.get("content", "")
            }
            # Add name field based on role
            if msg["role"] == "system":
                formatted_msg["name"] = "MiniMax AI"
            elif msg["role"] == "user":
                formatted_msg["name"] = "user"
            elif msg["role"] == "assistant":
                formatted_msg["name"] = "MiniMax AI"
            
            formatted_messages.append(formatted_msg)
        
        payload = {
            "model": model,
            "messages": formatted_messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": stream
        }
        
        max_retries = len(self.api_keys)
        last_error = None
        
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    self.base_url, 
                    headers=headers, 
                    json=payload,
                    timeout=60
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Extract content from response
                    if 'choices' in result and len(result['choices']) > 0:
                        choice = result['choices'][0]
                        
                        # Handle both message and delta formats
                        if 'message' in choice:
                            content = choice['message'].get('content', '')
                        elif 'delta' in choice:
                            content = choice['delta'].get('content', '')
                        else:
                            content = ''
                        
                        # Return in OpenAI-compatible format
                        return {
                            'choices': [{
                                'message': {'content': content}
                            }]
                        }
                    
                    return result
                
                elif response.status_code == 401:
                    # Invalid key, rotate and retry
                    logging.warning(f"API key invalid, rotating to next key")
                    self._get_next_key()
                    headers = {"Authorization": f"Bearer {self.current_key}"}
                    continue
                
                elif response.status_code == 429:
                    # Rate limited, rotate and retry
                    logging.warning(f"Rate limited, rotating to next key")
                    self._get_next_key()
                    headers = {"Authorization": f"Bearer {self.current_key}"}
                    time.sleep(2)
                    continue
                
                else:
                    last_error = f"API error: {response.status_code} - {response.text}"
                    logging.error(last_error)
                    
                    # Try next key
                    if attempt < max_retries - 1:
                        self._get_next_key()
                        headers = {"Authorization": f"Bearer {self.current_key}"}
                        time.sleep(1)
                        continue
            
            except requests.exceptions.Timeout:
                last_error = "Request timeout"
                logging.error(f"MiniMax API timeout, attempt {attempt + 1}/{max_retries}")
                if attempt < max_retries - 1:
                    self._get_next_key()
                    headers = {"Authorization": f"Bearer {self.current_key}"}
                    time.sleep(2)
                    continue
            
            except Exception as e:
                last_error = str(e)
                logging.error(f"MiniMax API error: {e}")
                if attempt < max_retries - 1:
                    self._get_next_key()
                    headers = {"Authorization": f"Bearer {self.current_key}"}
                    time.sleep(1)
                    continue
        
        # All retries failed
        raise Exception(f"MiniMax API failed after {max_retries} attempts: {last_error}")

# ==============================================================================
# Database Manager
# ==============================================================================

class DatabaseManager:
    """Database manager for storing theme information"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._pool = None
        self._init_db()
    
    def _init_db(self):
        """Initialize database with required tables and indexes"""
        try:
            with sqlite3.connect(self.db_path, timeout=30) as conn:
                cursor = conn.cursor()
                
                # Create themes table
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
                        license TEXT
                    )
                ''')
                
                # Check and add missing columns
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
                }
                
                for col, type_def in missing_columns.items():
                    if col not in columns:
                        cursor.execute(f'ALTER TABLE themes ADD COLUMN {col} {type_def}')
                
                conn.commit()
                
                # Create indexes
                indexes = [
                    'CREATE INDEX IF NOT EXISTS idx_category ON themes(category)',
                    'CREATE INDEX IF NOT EXISTS idx_stars ON themes(stars DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_full_name ON themes(full_name)',
                    'CREATE INDEX IF NOT EXISTS idx_freshness ON themes(freshness_days)',
                    'CREATE INDEX IF NOT EXISTS idx_quality ON themes(quality_score DESC)',
                    'CREATE INDEX IF NOT EXISTS idx_status ON themes(processing_status)'
                ]
                
                for idx in indexes:
                    cursor.execute(idx)
                
                cursor.execute('PRAGMA vacuum;')
                cursor.execute('ANALYZE themes;')
                conn.commit()
                
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
                    entry = self._validate_entry(entry)
                    
                    await conn.execute('''
                        INSERT OR REPLACE INTO themes 
                        (repo_name, full_name, description, stars, forks, url, clone_url, last_updated,
                         readme, main_file, file_preview, file_type, tech_stack, features, is_valid,
                         category, ai_description, ai_features, ai_use_case, keywords, quality_score,
                         freshness_days, processing_errors, processing_status, scraped_at,
                         has_demo, demo_url, npm_package, license)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                        entry.get('license', '')
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
        
        # Calculate derived fields
        entry['quality_score'] = self._calc_quality_score(entry)
        entry['freshness_days'] = self._calc_freshness(entry.get('last_updated', ''))
        entry['scraped_at'] = datetime.now().isoformat()
        entry['repo_name'] = entry.get('repo_name', entry.get('full_name', '').split('/')[-1] or 'unknown')
        entry['processing_status'] = entry.get('processing_status', 'scraped')
        
        return entry
    
    def _calc_quality_score(self, entry: Dict) -> int:
        """Calculate quality score for a theme"""
        score = 0
        
        # Stars contribution (max 40 points)
        stars = entry.get('stars', 0)
        score += min(40, int(stars / 5))
        
        # Has README (10 points)
        if entry.get('readme'):
            score += 10
        
        # Has demo (15 points)
        if entry.get('has_demo'):
            score += 15
        
        # Tech stack diversity (max 15 points)
        tech_count = len(entry.get('tech_stack', []))
        score += min(15, tech_count * 3)
        
        # Features documented (max 10 points)
        features_count = len(entry.get('features', []))
        score += min(10, features_count * 2)
        
        # Freshness (max 10 points)
        freshness = entry.get('freshness_days', 9999)
        if freshness < 180:  # < 6 months
            score += 10
        elif freshness < 365:  # < 1 year
            score += 7
        elif freshness < 730:  # < 2 years
            score += 4
        
        return min(100, score)
    
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
                cursor = await conn.execute('SELECT full_name FROM themes WHERE processing_status != "error"')
                return {row[0] for row in await cursor.fetchall()}
        except Exception as e:
            logging.error(f"Failed to get processed names: {e}")
            return set()
    
    async def query_top(self, category: str = None, top_n: int = 50, min_stars: int = 3, 
                       fresh_only: bool = False, fresh_days: int = 730) -> List[Dict]:
        """Query top themes by various criteria"""
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
                    SELECT repo_name, full_name, description, category, ai_use_case, stars, forks, url, 
                           file_type, keywords, ai_description, ai_features, processing_errors, 
                           quality_score, freshness_days, processing_status, has_demo, demo_url,
                           npm_package, license, tech_stack
                    FROM themes 
                    WHERE {where_clause} AND stars >= ? AND is_valid = 1 AND processing_status != 'error'
                    ORDER BY quality_score DESC, stars DESC LIMIT ?
                ''', params + [min_stars, top_n])
                
                rows = await cursor.fetchall()
                
                themes = []
                for row in rows:
                    kw = json.loads(row[9]) if row[9] else []
                    feats = json.loads(row[11]) if row[11] else []
                    tech = json.loads(row[20]) if row[20] else []
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
                        'tech_stack': tech
                    })
                
                return themes
                
        except Exception as e:
            logging.error(f"Failed to query top themes: {e}")
            return []
    
    async def count_rows(self) -> int:
        """Count total rows in database"""
        try:
            async with self.get_connection() as conn:
                cursor = await conn.execute('SELECT COUNT(*) FROM themes')
                return (await cursor.fetchone())[0]
        except:
            return 0
    
    async def rebuild(self):
        """Rebuild database indexes and check integrity"""
        try:
            async with self.get_connection() as conn:
                cursor = await conn.execute('PRAGMA integrity_check;')
                integrity = (await cursor.fetchone())[0]
                
                if 'ok' not in integrity.lower():
                    logging.warning(f"Database integrity issue: {integrity}")
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
        pass

# ==============================================================================
# Checkpoint Manager
# ==============================================================================

class CheckpointManager:
    """Manages checkpointing for resuming interrupted work"""
    
    def __init__(self, checkpoint_file: str = 'agent_checkpoint.json', 
                 temp_batch_file: str = 'temp_batch.json'):
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
            logging.info(f"Checkpoint saved")
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
    
    def cleanup(self):
        """Clean up temporary files"""
        Path(self.temp_batch_file).unlink(missing_ok=True)

# ==============================================================================
# Theme Analyzer
# ==============================================================================

class ThemeAnalyzer:
    """Analyzes theme content for structure and categorization"""
    
    def __init__(self, minimax_client: Optional[MiniMaxClient] = None, config: Optional[Config] = None):
        self.minimax = minimax_client
        self.use_ai = minimax_client is not None
        self.config = config or Config()
    
    def analyze_files(self, files: List[Dict], repo_info: Dict) -> Dict[str, Any]:
        """Analyze repository files to extract theme information"""
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
            'npm_package': ''
        }
        
        if not files:
            result['error'] = 'No files found'
            return result
        
        # Detect file types and tech stack
        file_extensions = set()
        for file in files:
            name = file.get('name', '').lower()
            if '.' in name:
                ext = name.split('.')[-1]
                file_extensions.add(ext)
        
        # Determine tech stack
        tech_stack = []
        content_sample = ' '.join(f.get('name', '') for f in files[:20]).lower()
        
        for tech, keywords in self.config.TECH_KEYWORDS.items():
            if any(kw in content_sample for kw in keywords):
                tech_stack.append(tech)
        
        # Add based on file extensions
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
        
        # Find main file and extract preview
        priority_files = ['index.js', 'index.ts', 'index.html', 'package.json', 
                         'README.md', 'theme.js', 'style.css', 'main.js']
        
        main_file_content = ''
        for priority in priority_files:
            matching = [f for f in files if f.get('name', '').lower() == priority.lower()]
            if matching:
                # In real implementation, would fetch file content
                main_file_content = f"Found: {matching[0].get('name')}"
                break
        
        result['file_preview'] = main_file_content[:2000]
        
        # Check for demo
        has_demo = any('demo' in f.get('name', '').lower() or 'example' in f.get('name', '').lower() 
                      for f in files)
        result['has_demo'] = has_demo
        
        # Check for package.json (npm package)
        has_package_json = any(f.get('name', '').lower() == 'package.json' for f in files)
        if has_package_json:
            result['npm_package'] = repo_info.get('full_name', '').split('/')[-1]
        
        # Determine file type
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
        else:
            result['file_type'] = 'general'
        
        # Extract keywords from repo description and name
        repo_text = (repo_info.get('description', '') + ' ' + repo_info.get('repo_name', '')).lower()
        keywords = re.findall(r'\b\w{4,}\b', repo_text)
        result['keywords'] = list(set(keywords))[:15]
        
        # Validate
        result['is_valid'] = (
            len(files) > 0 and
            len(result['tech_stack']) > 0 and
            result['file_type'] != 'unknown'
        )
        
        return result
    
    async def ai_categorize_batch(self, entries: List[Dict]) -> List[Dict]:
        """Categorize entries using AI"""
        if not self.use_ai:
            return [self._heuristic_categorize(entry) for entry in entries]
        
        try:
            prompt = (
                "Categorize the following web themes and visualization templates. "
                f"Categories: {', '.join(self.config.CATEGORIES)}. "
                "For each, provide: category, ai_description (brief), ai_features (list up to 5), ai_use_case.\n"
                "Return ONLY valid JSON array format with no markdown or extra text.\n\n"
            )
            
            for entry in entries:
                prompt += (
                    f"Repo: {entry['full_name']}\n"
                    f"Description: {entry.get('description', '')}\n"
                    f"Type: {entry.get('file_type', 'unknown')}\n"
                    f"Tech: {', '.join(entry.get('tech_stack', []))}\n"
                    f"Keywords: {', '.join(entry.get('keywords', []))}\n---\n"
                )
            
            # Call MiniMax API
            response = self.minimax.chat_completion(
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that categorizes web themes and templates. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                model="MiniMax-Text-01",
                max_tokens=2048,
                temperature=0.7
            )
            
            raw_output = response['choices'][0]['message']['content']
            results = self._extract_json(raw_output)
            
            for entry, result in zip(entries, results):
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
            ' '.join(entry.get('keywords', [])) + ' ' +
            entry.get('file_type', '') + ' ' +
            ' '.join(entry.get('tech_stack', []))
        ).lower()
        
        for cat, keywords in self.config.HEURISTIC_RULES.items():
            if any(kw in text for kw in keywords):
                return {
                    'category': cat,
                    'ai_description': f"Heuristic: {cat.replace('_', ' ').title()}",
                    'ai_features': keywords[:5],
                    'ai_use_case': f"Use for {cat.replace('_', ' ')}"
                }
        
        return {
            'category': 'other',
            'ai_description': 'General web theme',
            'ai_features': [],
            'ai_use_case': 'General purpose'
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
            'User-Agent': 'Theme-Scraper/1.0'
        }
        
        if token:
            self.base_headers['Authorization'] = f'token {token}'
    
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
            async with session.get(url, headers=self.base_headers, params=params) as resp:
                if resp.status == 200:
                    return await resp.json()
                elif resp.status == 403:
                    raise RateLimitError(f"Rate limit exceeded")
                elif resp.status == 404:
                    return {}
                else:
                    raise GitHubAPIError(f"API error: Status {resp.status}")
        except asyncio.TimeoutError:
            logging.error(f"Timeout fetching {url}")
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
                        'last_updated': repo.get('updated_at', ''),
                        'license': repo.get('license', {}).get('spdx_id', '') if repo.get('license') else ''
                    }
                    
                    yield repo_info
                    repos_fetched += 1
                
                page += 1

# ==============================================================================
# Main Agent Class
# ==============================================================================

class ThemeScraperAgent:
    """Main agent class for orchestrating the scraping process"""
    
    def __init__(self, config: Config):
        self.config = config
        self.db = DatabaseManager(config.DB_PATH)
        self.checkpoint = CheckpointManager()
        
        rate_limiter = RateLimiter(config.GITHUB_TOKEN)
        self.fetcher = GitHubFetcher(config.GITHUB_TOKEN, rate_limiter)
        
        minimax_client = None
        if config.USE_AI:
            try:
                minimax_client = MiniMaxClient(config.MINIMAX_API_KEYS)
                logging.info("MiniMax client initialized successfully")
            except Exception as e:
                logging.error(f"Failed to initialize MiniMax client: {e}")
        
        self.analyzer = ThemeAnalyzer(minimax_client, config)
        self.semaphore = asyncio.Semaphore(config.MAX_CONCURRENT)
        self.shutdown_flag = False
    
    async def run(self, max_repos: int = None, resume: bool = True, custom_query: str = None):
        """Run the scraping process"""
        max_repos = max_repos or self.config.MAX_REPOS
        
        if not resume:
            processed, start_pages, query_idx, queries_used = set(), {}, 0, {}
        else:
            processed, start_pages, query_idx, queries_used = self.checkpoint.load()
        
        queries = [custom_query] if custom_query else self.config.DEFAULT_QUERIES
        logging.info(f"Running with {len(queries)} queries")
        
        self._setup_signal_handlers()
        
        total_new = 0
        
        try:
            pbar = tqdm(total=max_repos, desc="Scraping Themes", unit="repo")
            
            for q_idx in range(query_idx, len(queries)):
                if self.shutdown_flag:
                    break
                
                query = queries[q_idx]
                start_page = start_pages.get(query, 1)
                
                stream = self.fetcher.discover_repos_stream(
                    [query], 
                    max_repos // len(queries), 
                    start_page
                )
                
                batch = []
                
                async for repo_info in stream:
                    if self.shutdown_flag:
                        break
                    
                    if repo_info['full_name'] in processed:
                        pbar.update(1)
                        continue
                    
                    batch.append(repo_info)
                    
                    if len(batch) >= self.config.BATCH_SIZE:
                        new_count = await self._process_batch(batch, processed)
                        total_new += new_count
                        pbar.update(len(batch))
                        batch = []
                        
                        self.checkpoint.save(processed, total_new, queries_used, start_pages, q_idx)
                
                if batch:
                    new_count = await self._process_batch(batch, processed)
                    total_new += new_count
                    pbar.update(len(batch))
            
            pbar.close()
            
        except Exception as e:
            logging.error(f"Run error: {e}")
        finally:
            self.checkpoint.save(processed, total_new, queries_used, start_pages, len(queries))
            self.checkpoint.cleanup()
        
        await self._export_results(total_new)
        
        total_db = await self.db.count_rows()
        print(f"\n✅ Complete: {total_new} new themes added! (Total: {total_db})")
    
    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(sig, frame):
            logging.warning("Shutdown signal received")
            self.shutdown_flag = True
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    async def _process_batch(self, batch: List[Dict], processed: Set[str]) -> int:
        """Process a batch of repositories"""
        async def fetch_repo_files(repo_info: Dict) -> Dict:
            async with self.semaphore:
                try:
                    contents_url = f"https://api.github.com/repos/{repo_info['full_name']}/contents"
                    contents = await self.fetcher._fetch_json(contents_url)
                    
                    if isinstance(contents, list):
                        repo_info['files'] = contents[:50]  # Limit to first 50 files
                    
                    return repo_info
                except Exception as e:
                    repo_info['processing_errors'] = f"File fetch error: {str(e)}"
                    return repo_info
        
        # Fetch repository contents
        tasks = [fetch_repo_files(repo_info) for repo_info in batch]
        entries = await asyncio.gather(*tasks, return_exceptions=True)
        
        valid_entries = [e for e in entries if isinstance(e, dict)]
        
        # Analyze files
        for entry in valid_entries:
            if entry.get('files'):
                analysis = self.analyzer.analyze_files(entry['files'], entry)
                entry.update(analysis)
                entry['main_file'] = str(entry.get('files', []))[:100000]
            else:
                entry['processing_errors'] = "; No files found"
                entry['processing_status'] = 'error_no_files'
        
        # Categorize
        if self.analyzer.use_ai:
            valid_entries = await self.analyzer.ai_categorize_batch(valid_entries)
        else:
            for entry in valid_entries:
                entry.update(self.analyzer._heuristic_categorize(entry))
        
        # Update status
        for entry in valid_entries:
            if entry.get('is_valid'):
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
    
    async def _export_results(self, total_new: int):
        """Export results"""
        top_themes = await self.db.query_top(top_n=100, min_stars=3)
        
        # JSON export
        output = {
            'total_new': total_new,
            'total_db': await self.db.count_rows(),
            'top_themes': top_themes
        }
        
        with open('themes_report.json', 'w') as f:
            json.dump(output, f, indent=2)
        
        # Markdown export
        with open('themes_report.md', 'w') as f:
            f.write(f"# Theme Scraper Report\n\n")
            f.write(f"- **New Themes**: {total_new}\n")
            f.write(f"- **Total in DB**: {await self.db.count_rows()}\n\n")
            f.write("## Top Themes by Quality Score\n\n")
            
            for theme in top_themes[:20]:
                f.write(
                    f"### {theme['full_name']} ({theme['category']})\n"
                    f"- **Stars**: {theme['stars']} | **Quality Score**: {theme['quality_score']}\n"
                    f"- **Tech**: {', '.join(theme.get('tech_stack', []))}\n"
                    f"- **Use Case**: {theme['ai_use_case']}\n"
                    f"- **URL**: {theme['url']}\n\n"
                )
        
        logging.info("Results exported to themes_report.json and themes_report.md")
    
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
        description="Theme Scraper v1.0 - JSON Resume, Mermaid, Chart.js, D3.js, etc. (MiniMax-Text-01 AI)"
    )
    
    parser.add_argument('--max-repos', type=int, help="Maximum repositories to scrape")
    parser.add_argument('--query', type=str, help="Custom search query")
    parser.add_argument('--resume', action='store_true', default=True, help="Resume from checkpoint")
    parser.add_argument('--no-ai', action='store_true', help="Disable AI categorization (use heuristics only)")
    parser.add_argument('--db', help="Database file path")
    parser.add_argument('--verbose', action='store_true', help="Verbose logging")
    
    args = parser.parse_args()
    
    setup_logging(args.verbose)
    
    config = Config()
    
    if args.max_repos:
        config.MAX_REPOS = args.max_repos
    if args.db:
        config.DB_PATH = args.db
    if args.no_ai:
        config.MINIMAX_API_KEYS = []  # Clear API keys to disable AI
    
    config.validate()
    
    async def run():
        agent = ThemeScraperAgent(config)
        try:
            await agent.run(
                max_repos=args.max_repos,
                resume=args.resume,
                custom_query=args.query
            )
        finally:
            await agent.cleanup()
    
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        logging.info("Interrupted by user")
    except Exception as e:
        logging.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
