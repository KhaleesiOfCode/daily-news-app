import sys
import os

# Add project root to path so imports work
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root not in sys.path:
    sys.path.insert(0, root)

# Change working directory to project root so relative paths work
os.chdir(root)

from app import app

# Vercel expects a variable named 'handler' or 'app'
handler = app
