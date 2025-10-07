#!/usr/bin/env python3
"""
Grok Agent Module - Agentic Reasoning, Tools, Tweaks, Stencils with Cost Tracking.

Part of Godmode Artillery.
Run: python grok_agent.py --input-db themes.db --agentic-whore --tweak-god --max-batches 20
Enhances DB with AI fields; outputs enhanced_batch.json.
"""

import os
import json
import sqlite3
import logging
import asyncio
import aiohttp
import argparse
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from dotenv import load_dotenv
from openai import OpenAI
from itertools import cycle

# Optional dependencies
try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

load_dotenv()

# ==============================================================================
# Cost Logger for Budget Tracking
# ==============================================================================

class CostLogger:
    """Track API costs and alert at budget thresholds"""
    
    def __init__(self, budget: float = 50.0):
        self.grok_input_cost = 0.00015 / 1000  # Approx from OpenRouter (input)
        self.grok_output_cost = 0.0006 / 1000  # Output
        self.total_cost = 0.0
        self.calls = 0
        self.budget = budget
        self.alert_thresholds = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]  # $5 increments
        self.last_alert = 0
        
    def add_cost(self, usage: Dict, pause_on_alert: bool = False, checkpoint_callback=None) -> bool:
        """
        Add cost from API call and check alerts.
        
        Args:
            usage: Dict with prompt_tokens and completion_tokens
            pause_on_alert: Whether to pause and ask user when threshold hit
            checkpoint_callback: Optional function to call for checkpoint save
            
        Returns:
            bool: True if should continue, False if user aborted
        """
        input_t = usage.get('prompt_tokens', 0)
        output_t = usage.get('completion_tokens', 0)
        cost = (input_t * self.grok_input_cost) + (output_t * self.grok_output_cost)
        self.total_cost += cost
        self.calls += 1
        
        # Alert check
        for thresh in self.alert_thresholds:
            if self.last_alert < thresh <= round(self.total_cost, 2) and thresh <= self.budget:
                remaining = self.budget - self.total_cost
                est_repos = self.calls * 15  # Rough estimate: 15 repos per batch call
                progress_pct = min(100, (est_repos / 1000) * 100)
                
                alert_msg = (
                    f"BUDGET ALERT: Hit ${thresh}! Total spent: ${self.total_cost:.2f} "
                    f"(remaining: ${remaining:.2f}). Calls: {self.calls}. "
                    f"Est. progress: {progress_pct:.1f}% (~{est_repos} repos processed)."
                )
                print("\n" + "="*60)
                print(f"🔔 {alert_msg}")
                print("="*60 + "\n")
                logging.warning(alert_msg)
                
                # Optional pause
                if pause_on_alert:
                    cont = input("Continue run? (y/n/pause): ").lower().strip()
                    if cont == 'n':
                        logging.info("User aborted - saving checkpoint...")
                        if checkpoint_callback:
                            checkpoint_callback()
                        return False
                    elif cont in ['p', 'pause']:
                        print("Checkpointing... Resume later with --resume")
                        if checkpoint_callback:
                            checkpoint_callback()
                        return False
                
                self.last_alert = thresh
                break
        
        # Log per-call cost
        avg = self.total_cost / self.calls if self.calls > 0 else 0
        logging.debug(f"Call {self.calls}: ${cost:.4f} (total ${self.total_cost:.2f}, avg/call ${avg:.4f})")
        
        return True
    
    def get_summary(self) -> str:
        """Get cost summary string"""
        avg = self.total_cost / self.calls if self.calls > 0 else 0
        remaining = self.budget - self.total_cost
        return (
            f"Total Cost: ${self.total_cost:.2f} / ${self.budget:.2f} (${remaining:.2f} left) | "
            f"Calls: {self.calls} | Avg: ${avg:.4f}/call"
        )

# ==============================================================================
# Configuration
# ==============================================================================

@dataclass
class AgentConfig:
    """Configuration for Grok Agent"""
    
    # API Keys
    OPENROUTER_API_KEYS: List[str] = field(default_factory=lambda: [
        os.getenv('OPENROUTER_API_KEY1', ''),
        os.getenv('OPENROUTER_API_KEY2', ''),
        os.getenv('OPENROUTER_API_KEY3', '')
    ])
    GROK_MODEL: str = "x-ai/grok-4-fast"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    
    # Site info for OpenRouter
    SITE_URL: str = "https://github.com/godmode-artillery"
    SITE_NAME: str = "Godmode Artillery Agent"
    
    # Budget & Cost
    API_BUDGET: float = 50.0
    ALERT_PAUSE: bool = False
    COST_TRACKING: bool = True
    
    # Agentic Features
    TOOLS_ENABLED: bool = False
    REASONING_ENABLED: bool = True
    STRUCTURED_OUTPUT: bool = True
    CODE_GEN_ENABLED: bool = False
    TWEAK_MODE: bool = False
    
    # Batch Processing
    BATCH_SIZE: int = 10
    MAX_BATCHES: int = 20
    MAX_TOKENS: int = 16000
    
    # Output Directories
    PDF_OUTPUT_DIR: str = 'pdf_previews'
    CODE_OUTPUT_DIR: str = 'generated_code'
    GRAPH_OUTPUT_DIR: str = 'graphs'
    OUTPUT_JSON: str = 'enhanced_batch.json'
    
    def validate(self):
        valid_keys = [k for k in self.OPENROUTER_API_KEYS if k]
        if not valid_keys:
            raise ValueError("No valid OpenRouter API keys found")
        logging.info(f"Loaded {len(valid_keys)} OpenRouter API keys")
        
        # Create output directories
        for dir_path in [self.PDF_OUTPUT_DIR, self.CODE_OUTPUT_DIR, self.GRAPH_OUTPUT_DIR]:
            os.makedirs(dir_path, exist_ok=True)

# ==============================================================================
# Grok Client with Cost Tracking
# ==============================================================================

class GrokClient:
    """Enhanced Grok client with cost tracking and tools support"""
    
    def __init__(self, api_keys: List[str], model: str = "x-ai/grok-4-fast", 
                 config: Optional[AgentConfig] = None, cost_logger: Optional[CostLogger] = None):
        self.api_keys = [key for key in api_keys if key]
        if not self.api_keys:
            raise ValueError("No valid OpenRouter API keys")
        
        self.key_cycle = cycle(self.api_keys)
        self.current_key = next(self.key_cycle)
        self.model = model
        self.config = config or AgentConfig()
        self.cost_logger = cost_logger
        self.checkpoint_callback = None
        self.client = self._create_client()
        
        logging.info(f"GrokClient initialized: {len(self.api_keys)} keys, model: {model}")
        if cost_logger:
            logging.info(f"Cost tracking enabled: ${cost_logger.budget} budget")
    
    def _create_client(self):
        """Create OpenAI client configured for OpenRouter"""
        return OpenAI(
            base_url=self.config.OPENROUTER_BASE_URL,
            api_key=self.current_key,
        )
    
    def _get_next_key(self):
        """Rotate to next API key"""
        self.current_key = next(self.key_cycle)
        self.client = self._create_client()
        return self.current_key
    
    def chat_completion(self, messages: List[Dict], max_tokens: int = 16000, 
                       temperature: float = 0.8, top_p: float = 0.95,
                       tools: Optional[List[Dict]] = None, tool_choice: str = "auto",
                       reasoning_enabled: bool = False, response_format: Optional[Dict] = None) -> Dict:
        """
        Call Grok with cost tracking and optional tools/reasoning.
        
        Args:
            messages: List of message dicts
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            top_p: Nucleus sampling parameter
            tools: Optional tool definitions for function calling
            tool_choice: Tool selection strategy ("auto", "none", or specific tool)
            reasoning_enabled: Enable chain-of-thought reasoning
            response_format: Optional response format (e.g., {"type": "json_object"})
            
        Returns:
            Dict with choices, usage, etc.
        """
        max_retries = len(self.api_keys)
        last_error = None
        
        for attempt in range(max_retries):
            try:
                # Build request parameters
                extra_headers = {}
                if self.config.SITE_URL:
                    extra_headers["HTTP-Referer"] = self.config.SITE_URL
                if self.config.SITE_NAME:
                    extra_headers["X-Title"] = self.config.SITE_NAME
                
                # Base parameters
                params = {
                    "model": self.model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "top_p": top_p
                }
                
                # Add optional parameters
                if tools:
                    params["tools"] = tools
                    params["tool_choice"] = tool_choice
                if response_format:
                    params["response_format"] = response_format
                if extra_headers:
                    params["extra_headers"] = extra_headers
                
                # Make API call
                response = self.client.chat.completions.create(**params)
                
                # Extract content
                content = response.choices[0].message.content if response.choices else ""
                
                # Track costs
                usage = {}
                if hasattr(response, 'usage') and response.usage:
                    usage = {
                        'prompt_tokens': response.usage.prompt_tokens,
                        'completion_tokens': response.usage.completion_tokens,
                        'total_tokens': response.usage.total_tokens
                    }
                    
                    logging.info(f"Tokens: {usage['total_tokens']} "
                               f"(in: {usage['prompt_tokens']}, out: {usage['completion_tokens']})")
                    
                    # Cost tracking
                    if self.cost_logger:
                        should_continue = self.cost_logger.add_cost(
                            usage,
                            pause_on_alert=self.config.ALERT_PAUSE,
                            checkpoint_callback=self.checkpoint_callback
                        )
                        if not should_continue:
                            raise KeyboardInterrupt("Budget alert - user requested stop")
                
                # Return response
                return {
                    'choices': [{'message': {'content': content, 'tool_calls': getattr(response.choices[0].message, 'tool_calls', None)}}],
                    'usage': usage
                }
                
            except Exception as e:
                error_str = str(e).lower()
                last_error = str(e)
                
                if 'rate' in error_str or '429' in error_str:
                    logging.warning(f"Rate limited, rotating key (attempt {attempt + 1}/{max_retries})")
                    self._get_next_key()
                    continue
                elif 'auth' in error_str or '401' in error_str:
                    logging.warning(f"Auth error, rotating key (attempt {attempt + 1}/{max_retries})")
                    self._get_next_key()
                    continue
                else:
                    logging.error(f"API error: {e}")
                    if attempt < max_retries - 1:
                        self._get_next_key()
                        continue
        
        raise Exception(f"Grok API failed after {max_retries} attempts: {last_error}")

# ==============================================================================
# Godmode Analyzer
# ==============================================================================

class GodmodeAnalyzer:
    """Enhanced analyzer with tools, code gen, and PDF output"""
    
    def __init__(self, grok: GrokClient, config: AgentConfig):
        self.grok = grok
        self.config = config
    
    async def process_batch(self, entries: List[Dict]) -> tuple[List[Dict], Dict, Dict]:
        """
        Process batch with full godmode features.
        
        Returns:
            (updated_entries, suggestions, graphs)
        """
        # TODO: Implement full processing logic
        # For now, basic structure
        
        messages = [
            {"role": "system", "content": "You are an expert at analyzing UI components and themes."},
            {"role": "user", "content": f"Analyze these repos: {json.dumps(entries[:3], indent=2)}"}
        ]
        
        # Call with tools if enabled
        response = self.grok.chat_completion(
            messages=messages,
            tools=None,  # TODO: Add tool definitions
            reasoning_enabled=self.config.REASONING_ENABLED,
            response_format={"type": "json_object"} if self.config.STRUCTURED_OUTPUT else None
        )
        
        # Basic parsing
        try:
            parsed = json.loads(response['choices'][0]['message']['content'])
        except:
            parsed = {'entries': entries, 'suggestions': {}}
        
        return entries, parsed.get('suggestions', {}), {}
    
    def _detect_lang(self, stencil_type: str) -> str:
        """Detect language from stencil type"""
        if 'vue' in stencil_type.lower():
            return 'vue'
        elif 'react' in stencil_type.lower():
            return 'react'
        elif 'svelte' in stencil_type.lower():
            return 'svelte'
        return 'javascript'
    
    def _gen_pdf_preview(self, tweak: Dict, repo: str):
        """Generate PDF preview for tweak"""
        if not HAS_REPORTLAB:
            logging.warning("reportlab not available - skipping PDF generation")
            return None
        
        filename = f"{self.config.PDF_OUTPUT_DIR}/{repo.replace('/', '_')}_{tweak['name'].replace(' ', '_')}.pdf"
        c = canvas.Canvas(filename, pagesize=letter)
        
        # Header
        c.setFont("Helvetica-Bold", 16)
        c.drawString(100, 750, f"Tweaked: {tweak['name']}")
        
        # Content
        y = 700
        c.setFont("Helvetica", 12)
        for feature in tweak.get('features', [])[:10]:
            c.drawString(120, y, f"• {feature}")
            y -= 20
        
        c.save()
        logging.info(f"PDF preview generated: {filename}")
        return filename

# ==============================================================================
# Main Agent Function
# ==============================================================================

def main_agent():
    """Main entry point for grok agent"""
    parser = argparse.ArgumentParser(description="Grok Agent - Enhanced Theme Analysis")
    parser.add_argument('--input-db', type=str, help="Input SQLite database")
    parser.add_argument('--input-json', type=str, help="Input JSON file")
    parser.add_argument('--max-batches', type=int, default=20, help="Max batches to process")
    parser.add_argument('--budget', type=float, default=50.0, help="API budget in USD")
    parser.add_argument('--alert-pause', action='store_true', help="Pause on budget alerts")
    parser.add_argument('--agentic-whore', action='store_true', help="Enable full agentic mode")
    parser.add_argument('--tweak-god', action='store_true', help="Enable tweak mode")
    parser.add_argument('--code-gen', action='store_true', help="Enable code generation")
    parser.add_argument('--verbose', action='store_true', help="Verbose logging")
    
    args = parser.parse_args()
    
    # Setup logging
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Create config
    config = AgentConfig()
    config.API_BUDGET = args.budget
    config.ALERT_PAUSE = args.alert_pause
    config.TWEAK_MODE = args.tweak_god
    config.CODE_GEN_ENABLED = args.code_gen
    config.MAX_BATCHES = args.max_batches
    config.validate()
    
    # Initialize cost logger
    cost_logger = CostLogger(budget=config.API_BUDGET) if config.COST_TRACKING else None
    
    # Initialize Grok client
    grok = GrokClient(
        config.OPENROUTER_API_KEYS,
        model=config.GROK_MODEL,
        config=config,
        cost_logger=cost_logger
    )
    
    # Initialize analyzer
    analyzer = GodmodeAnalyzer(grok, config)
    
    # Load input
    entries = []
    if args.input_json:
        with open(args.input_json, 'r') as f:
            entries = json.load(f)
        logging.info(f"Loaded {len(entries)} entries from {args.input_json}")
    elif args.input_db:
        # TODO: Load from database
        logging.info(f"Loading from database: {args.input_db}")
    else:
        logging.error("No input specified (--input-db or --input-json)")
        return
    
    # Process batches
    all_results = []
    for i in range(0, min(len(entries), config.MAX_BATCHES * config.BATCH_SIZE), config.BATCH_SIZE):
        batch = entries[i:i+config.BATCH_SIZE]
        logging.info(f"Processing batch {i//config.BATCH_SIZE + 1}/{config.MAX_BATCHES}")
        
        try:
            # Process synchronously for simplicity
            updated, suggestions, graphs = asyncio.run(analyzer.process_batch(batch))
            all_results.extend(updated)
        except KeyboardInterrupt:
            logging.warning("Interrupted - saving partial results")
            break
        except Exception as e:
            logging.error(f"Batch processing error: {e}")
            continue
    
    # Save results
    with open(config.OUTPUT_JSON, 'w') as f:
        json.dump(all_results, f, indent=2)
    logging.info(f"Saved {len(all_results)} results to {config.OUTPUT_JSON}")
    
    # Cost summary
    if cost_logger:
        print("\n" + "="*60)
        print(f"💰 {cost_logger.get_summary()}")
        print("="*60)

if __name__ == "__main__":
    main_agent()
