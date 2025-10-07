#!/usr/bin/env python3
"""
Setup and diagnostic script for theme scraper
"""

import os
import sys
import subprocess

def check_python_version():
    """Check Python version"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python {version.major}.{version.minor} detected - Need Python 3.8+")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return True

def check_dependencies():
    """Check if required packages are installed"""
    required = [
        'aiohttp',
        'aiosqlite', 
        'dotenv',
        'tenacity',
        'tqdm',
        'requests'
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package if package != 'dotenv' else 'dotenv')
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - MISSING")
            missing.append(package)
    
    return missing

def check_env_file():
    """Check if .env file exists and has required keys"""
    if not os.path.exists('.env'):
        print("❌ .env file not found")
        print("   Copy .env.example to .env and add your API keys")
        return False
    
    print("✅ .env file exists")
    
    from dotenv import load_dotenv
    load_dotenv()
    
    github_token = os.getenv('GITHUB_TOKEN', '')
    minimax_keys = [
        os.getenv(f'MINIMAX_API_KEY{i}', '')
        for i in range(1, 6)
    ]
    
    if not github_token:
        print("⚠️  GITHUB_TOKEN not set (you'll be rate limited to 60 req/hour)")
    else:
        print("✅ GITHUB_TOKEN configured")
    
    valid_minimax = [k for k in minimax_keys if k]
    if not valid_minimax:
        print("⚠️  No MiniMax API keys (AI categorization will be disabled)")
    else:
        print(f"✅ {len(valid_minimax)} MiniMax API key(s) configured")
    
    return True

def install_dependencies(missing):
    """Install missing dependencies"""
    if not missing:
        return True
    
    print(f"\n📦 Installing {len(missing)} missing package(s)...")
    
    try:
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'
        ])
        print("✅ All dependencies installed")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        print("   Try manually: pip install -r requirements.txt")
        return False

def main():
    print("🔧 Theme Scraper Setup\n")
    print("=" * 50)
    
    # Check Python version
    print("\n1️⃣  Checking Python version...")
    if not check_python_version():
        sys.exit(1)
    
    # Check dependencies
    print("\n2️⃣  Checking dependencies...")
    missing = check_dependencies()
    
    if missing:
        response = input(f"\n📦 Install {len(missing)} missing package(s)? (y/n): ")
        if response.lower() == 'y':
            if not install_dependencies(missing):
                sys.exit(1)
            # Check again
            print("\n   Verifying installation...")
            missing = check_dependencies()
            if missing:
                print(f"\n❌ Still missing: {', '.join(missing)}")
                sys.exit(1)
        else:
            print("❌ Cannot continue without dependencies")
            sys.exit(1)
    
    # Check .env
    print("\n3️⃣  Checking configuration...")
    if not check_env_file():
        print("\n📝 To create .env file:")
        print("   cp .env.example .env")
        print("   nano .env  # add your API keys")
        sys.exit(1)
    
    # Test import
    print("\n4️⃣  Testing imports...")
    try:
        from theme_scraper import MiniMaxClient, Config
        print("✅ theme_scraper module loads correctly")
    except Exception as e:
        print(f"❌ Failed to import theme_scraper: {e}")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("\n✅ Setup complete! Ready to run.\n")
    print("Next steps:")
    print("  1. Test MiniMax API: python test_minimax.py")
    print("  2. Run small test:   python theme_scraper.py --max-repos 10")
    print("  3. Full run:         python theme_scraper.py")
    print()

if __name__ == "__main__":
    main()
