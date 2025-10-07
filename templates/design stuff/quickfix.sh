#!/bin/bash
# Quick fix for your current directory

echo "🔧 Quick Setup..."

# Create venv
python3 -m venv venv
source venv/bin/activate

# Install deps
pip install --upgrade pip -q
pip install aiohttp tenacity tqdm groq python-dotenv -q

# Create .env
cat > .env << 'EOF'
GITHUB_TOKEN=
GROQ_API_KEY=
EOF

# Create requirements.txt
cat > requirements.txt << 'EOF'
aiohttp>=3.9.0
tenacity>=8.2.0
tqdm>=4.66.0
groq>=0.4.0
python-dotenv>=1.0.0
EOF

# Create run script
cat > run.sh << 'EOF'
#!/bin/bash
source venv/bin/activate
python3 latex_agent.py "$@"
EOF

chmod +x run.sh

echo "✅ Done!"
echo ""
echo "Run: ./run.sh --max-repos 100"
