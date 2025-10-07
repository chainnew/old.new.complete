#!/usr/bin/env python3
"""
GitHub Topic Scraper with Grok-4-Fast Analysis (Refactored: Uses GitHub API with Token from .env for Authentication).
Replaces Selenium with requests + GitHub Search API for efficiency and reliability.
Requires GITHUB_TOKEN in .env for higher rate limits (unauth fallback at 30 req/min).
Targets up to 100 repos/topic via API (per_page=100); takes first N.

Usage: python3 scrape_github_topics.py
Output: github_topics_repos.json + console.
"""

import os
import json
import time
import logging
import re
import argparse  # Built-in
from typing import List, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from openai import OpenAI
from openai import OpenAIError

load_dotenv()

# Config
TOPIC_URLS = [
    "https://github.com/topics/tailwindcss",
    "https://github.com/topics/html5",
    "https://github.com/topics/mermaid-diagrams",
    "https://github.com/topics/tailwindcss-components"
]
MAX_REPOS_PER_TOPIC = 20
DELAY_BETWEEN_TOPICS = 1  # Shorter with API
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN', '').strip()
GITHUB_API_BASE = "https://api.github.com"

if not GITHUB_TOKEN:
    logging.warning("No GITHUB_TOKEN in .env - Using unauthenticated API (rate limit: 30 req/min). Add token for 5000 req/hour.")

# OpenRouter keys (matches your main script)
OPENROUTER_API_KEYS = [os.getenv(f'OPENROUTER_API_KEY{i}', '') for i in range(1, 4)]
OPENROUTER_API_KEY = next((k for k in OPENROUTER_API_KEYS if k), '')  # First valid
GROK_MODEL = "x-ai/grok-4-fast"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

if OPENROUTER_API_KEY:
    logger.info(f"Loaded OpenRouter key (1 valid from {len([k for k in OPENROUTER_API_KEYS if k])} keys) for {GROK_MODEL}")
else:
    logger.warning("No valid OpenRouter keys - Grok skipped (raw output only)")

def create_session() -> requests.Session:
    """Create authenticated session with retry strategy."""
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)

    headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitHub-Topic-Scraper/1.0'  # Required
    }
    if GITHUB_TOKEN:
        headers['Authorization'] = f'token {GITHUB_TOKEN}'
        logger.info("Using GITHUB_TOKEN for authenticated API access (rate limit: 5000 req/hour)")
    else:
        logger.info("Using unauthenticated API access (rate limit: 60 req/hour)")

    session.headers.update(headers)
    return session

class GitHubTopicScraper:
    def __init__(self):
        self.session = create_session()
        self.repos_per_topic = {}

    def extract_topic_name(self, url: str) -> str:
        """Extract topic name from URL (e.g., https://github.com/topics/tailwindcss -> tailwindcss)."""
        match = re.search(r'/topics/([^/?\s]+)', url)
        return match.group(1).replace('-', '_') if match else ''

    def fetch_repos_for_topic(self, topic_name: str, max_repos: int) -> List[str]:
        """Fetch repos via GitHub Search API: q=topic:topic_name sort:stars-desc."""
        repos = []
        url = f"{GITHUB_API_BASE}/search/repositories"
        params = {
            'q': f'topic:{topic_name}',
            'sort': 'stars',
            'order': 'desc',
            'per_page': min(100, max_repos)  # API max 100/page
        }
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            if 'items' in data:
                for item in data['items'][:max_repos]:
                    full_name = item.get('full_name', '')
                    if full_name and '/' in full_name and not full_name.startswith('github/'):  # Valid and skip internal
                        # Basic validation: owner/repo format
                        if re.match(r'^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]/[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$', full_name):
                            repos.append(full_name)

            # Handle rate limit warning
            if 'X-RateLimit-Remaining' in response.headers:
                remaining = response.headers['X-RateLimit-Remaining']
                logger.info(f"API rate limit remaining: {remaining}")
                if int(remaining) < 10:
                    logger.warning("Low rate limit - sleeping 60s")
                    time.sleep(60)

            # Sample log
            sample = repos[:3]
            if sample:
                logger.info(f"Sample repos for '{topic_name}': {sample}")
            else:
                logger.warning(f"No repos for '{topic_name}' - check topic name or API response: {data.get('message', 'OK')}")

        except requests.exceptions.RequestException as e:
            logger.error(f"API request error for {topic_name}: {e}")
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error for {topic_name}: {e}")
        except KeyError as e:
            logger.error(f"Unexpected API response for {topic_name}: {e}")

        return repos[:max_repos]

    def scrape_topics(self, urls: List[str], max_per_topic: int) -> Dict[str, List[str]]:
        for url in urls:
            topic_name = self.extract_topic_name(url)
            if not topic_name:
                logger.warning(f"Invalid topic URL: {url}")
                continue

            logger.info(f"Fetching repos for topic: {topic_name} via API...")
            repos = self.fetch_repos_for_topic(topic_name, max_per_topic)
            self.repos_per_topic[topic_name] = repos
            logger.info(f"Extracted {len(repos)} repos for '{topic_name}'")
            time.sleep(DELAY_BETWEEN_TOPICS)  # Rate limit courtesy

        # Cleanup session
        self.session.close()
        return self.repos_per_topic

class GrokAnalyzer:
    def __init__(self, api_keys: List[str]):
        valid_keys = [k for k in api_keys if k]
        if not valid_keys:
            raise ValueError("No valid OpenRouter keys")
        self.api_key = valid_keys[0]
        self.client = OpenAI(base_url=OPENROUTER_BASE_URL, api_key=self.api_key)
        self.model = GROK_MODEL
        logger.info(f"GrokAnalyzer: {len(valid_keys)} keys")

    def analyze_topics(self, topics_data: Dict[str, List[str]]) -> Dict[str, Any]:
        # Filter topics with repos only
        filtered_topics = {t: r for t, r in topics_data.items() if len(r) > 0}
        if not filtered_topics:
            return {"topics": {}, "overall_unique_repos": [], "note": "No repos scraped"}

        all_repos = [repo for repos in filtered_topics.values() for repo in repos]
        unique_repos = list(set(all_repos))

        system_prompt = """
        You are a GitHub repo analyst for UI/themes/stencils. Given topics and repos, for each:
        - Rank top repos (up to 20) by UI/theme relevance (score 0-100; prioritize CSS/JS/modular/diagrams/resumes).
        - Output only JSON: {
          "topics": {
            "topic_name": {
              "top_repos": [{"full_name": "owner/repo", "relevance_score": 85, "why": "Brief reason (e.g., modular components)"}],
              "summary": "Short trends summary",
              "expansion_queries": ["3-5 GitHub searches for similar (e.g., 'topic variants stars:>50')"]
            }
          },
          "overall_unique_repos": [deduped full_names, sorted by score desc]
        }
        Ignore off-topic; focus on UI (e.g., Tailwind components > general HTML).
        """

        user_content = f"Topics/repos (UI focus):\n{json.dumps(filtered_topics, indent=2)}"

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_content}],
                max_tokens=2500,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            raw = response.choices[0].message.content
            analyzed = json.loads(raw)
            logger.info("Grok analysis complete")
            return analyzed
        except OpenAIError as e:
            logger.error(f"Grok error: {e}. Raw fallback.")
            fallback = {
                "topics": {t: {
                    "top_repos": [{"full_name": r, "relevance_score": 50, "why": "Raw repo"} for r in repos[:20]],
                    "summary": f"Raw {len(repos)} repos for {t}",
                    "expansion_queries": [f"{t} ui stars:>10"]
                } for t, repos in filtered_topics.items()},
                "overall_unique_repos": sorted(unique_repos)
            }
            return fallback

def main():
    parser = argparse.ArgumentParser(description="Scrape GitHub Topics with Grok Analysis (API-based)")
    parser.add_argument('--topics', nargs='+', default=TOPIC_URLS, help="Topic URLs")
    parser.add_argument('--max-per-topic', type=int, default=MAX_REPOS_PER_TOPIC, help="Max repos/topic")
    parser.add_argument('--output', type=str, default='github_topics_repos.json', help="Output JSON")
    args = parser.parse_args()

    scraper = GitHubTopicScraper()
    raw_topics = scraper.scrape_topics(args.topics, args.max_per_topic)

    if OPENROUTER_API_KEY and raw_topics:
        try:
            analyzer = GrokAnalyzer(OPENROUTER_API_KEYS)
            analyzed = analyzer.analyze_topics(raw_topics)
        except ValueError as e:
            logger.warning(f"{e} - Skipping Grok")
            analyzed = {"raw_topics": raw_topics, "note": "No valid keys"}
    else:
        analyzed = {"raw_topics": raw_topics, "note": "Grok skipped"}

    output_path = Path(args.output)
    with open(output_path, 'w') as f:
        json.dump(analyzed, f, indent=2)
    logger.info(f"Saved to {output_path}")

    # Summary - Fixed: Only iterate over valid topic dicts with 'top_repos' key
    print("\n=== SUMMARY ===")
    topics = analyzed.get('topics', {})
    for topic, data in topics.items():
        if isinstance(data, dict) and 'top_repos' in data:  # Skip if not a valid topic structure (e.g., misplaced overall_unique_repos)
            print(f"\nTopic: {topic}")
            print(f"Top Repos: {len(data['top_repos'])}")
            for repo in data['top_repos'][:5]:
                print(f"  - {repo['full_name']} (Score: {repo['relevance_score']}) - {repo['why']}")
            print(f"Summary: {data['summary']}")
            print(f"Expansion Queries: {', '.join(data['expansion_queries'])}")
        else:
            logger.warning(f"Skipping invalid topic structure for '{topic}': {type(data)}")
    print(f"\nOverall Unique Repos: {len(analyzed.get('overall_unique_repos', []))}")
    print("Full data in github_topics_repos.json")

if __name__ == "__main__":
    main()

