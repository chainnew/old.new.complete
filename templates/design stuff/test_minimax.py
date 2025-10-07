#!/usr/bin/env python3
"""
Test script for MiniMax API integration
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Import from the renamed module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from theme_scraper import MiniMaxClient

def test_minimax():
    """Test MiniMax API connection"""
    
    # Load API keys
    api_keys = [
        os.getenv('MINIMAX_API_KEY1', ''),
        os.getenv('MINIMAX_API_KEY2', ''),
        os.getenv('MINIMAX_API_KEY3', ''),
        os.getenv('MINIMAX_API_KEY4', ''),
        os.getenv('MINIMAX_API_KEY5', ''),
    ]
    
    valid_keys = [k for k in api_keys if k]
    
    if not valid_keys:
        print("❌ No MiniMax API keys found in .env file")
        print("Please add MINIMAX_API_KEY1, MINIMAX_API_KEY2, etc. to your .env file")
        return False
    
    print(f"✅ Found {len(valid_keys)} valid API keys")
    
    try:
        client = MiniMaxClient(api_keys)
        print(f"✅ MiniMax client initialized")
        
        # Test a simple completion
        print("\n🧪 Testing API call...")
        response = client.chat_completion(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Hello, MiniMax is working!' and nothing else."}
            ],
            max_tokens=50,
            temperature=0.1
        )
        
        content = response['choices'][0]['message']['content']
        print(f"✅ API Response: {content}")
        
        # Test categorization prompt
        print("\n🧪 Testing categorization prompt...")
        response = client.chat_completion(
            messages=[
                {"role": "system", "content": "You are a helpful assistant that categorizes web themes. Always respond with valid JSON."},
                {"role": "user", "content": """Categorize this theme:
Repo: rbardini/jsonresume-theme-even
Description: A flat JSON Resume theme, compatible with the latest resume schema
Type: jsonresume_theme
Tech: typescript, jsonresume
Keywords: resume, theme, flat, modern

Return JSON with: category, ai_description, ai_features, ai_use_case"""}
            ],
            max_tokens=200,
            temperature=0.7
        )
        
        content = response['choices'][0]['message']['content']
        print(f"✅ Categorization Response:\n{content}")
        
        print("\n✅ All tests passed! MiniMax integration is working correctly.")
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    test_minimax()
