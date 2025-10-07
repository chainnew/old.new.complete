#!/usr/bin/env python3
"""
Core Scraper Module - Fetches GitHub repos, images, READMEs, stores in DB.

Part of Godmode Artillery System.
Run: python core_scraper.py --max-repos 500 --vision-mode
Outputs: themes.db, raw_batch.json (for agent pipeline).
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
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, AsyncIterator, Set
from pathlib import Path
from dataclasses import dataclass, field
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from tqdm.asyncio import tqdm
import base64

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False
    logging.warning("beautifulsoup4 not installed")

try:
    import aiosqlite
    HAS_AIOSQLITE = True
except ImportError:
    HAS_AIOSQLITE = False
    logging.warning("aiosqlite not available")

try:
    import git
    HAS_GIT = True
except ImportError:
    HAS_GIT = False

load_dotenv()

@dataclass
class CoreConfig:
    GITHUB_TOKEN: str = field(default_factory=lambda: os.getenv('GITHUB_TOKEN', ''))
    DB_PATH: str = 'themes.db'
    BATCH_SIZE: int = 30
    MAX_CONCURRENT: int = 20
    MAX_REPOS: int = 1000
    FRESH_DAYS: int = 730
    VISION_ENABLED: bool = False
    MAX_IMAGES_PER_REPO: int = 3
    IMAGE_EXTS: List[str] = field(default_factory=lambda: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'])
    IMAGE_PRIORITY: List[str] = field(default_factory=lambda: [
        'screenshot.png', 'demo.jpg', 'preview.gif', 'ui-theme.svg', 'diagram.png', 'stencil.png',
        'resume-preview.jpg', 'cv-screenshot.png', 'component-diagram.svg'
    ])
    SCRAPE_HTML: bool = HAS_BS4
    DEFAULT_QUERIES: List[str] = field(default_factory=lambda: [
        # All your default queries here (abbrev for space)
        'jsonresume-theme stars:>5', 'vue ui component stars:>10', 'awesome vue',  # etc. - paste full from before
    ])
    # Add RESUME_TWEAK_QUERIES, STENCIL_QUERIES if needed, but keep core simple

    def validate(self):
        if not self.GITHUB_TOKEN:
            logging.warning("No GitHub token - limited API")
        if self.VISION_ENABLED and not HAS_BS4:
            self.VISION_ENABLED = False
            logging.warning("Vision disabled (no BS4)")

class RateLimiter:
    # Unchanged from previous - keep full impl

class DatabaseManager:
    # Enhanced from previous with all fields (tweaked_variants, stencil_patterns, ui_graph, doc_enhance_score)
    # Keep full impl as in last version

class GitHubFetcher:
    # Unchanged full impl, but add enrich_repo with subdir scan for stencils/tweaks as in last

# Main Core Runner
def main_core():
    parser = argparse.ArgumentParser(description="Core Scraper - Raw Data Fetch")
    parser.add_argument('--max-repos', type=int, default=1000)
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--vision-mode', action='store_true')
    parser.add_argument('--input-file', type=str)
    # ... other args

    args = parser.parse_args()
    config = CoreConfig()
    config.MAX_REPOS = args.max_repos
    config.VISION_ENABLED = args.vision_mode
    config.validate()

    agent = CoreAgent(config)  # Wrapper around Fetcher + DB
    asyncio.run(agent.run(args))

if __name__ == "__main__":
    main_core()
