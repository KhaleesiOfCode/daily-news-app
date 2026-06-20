import sys, time, json, urllib.request, threading, subprocess, os

# Start Flask in background
flask_proc = subprocess.Popen(
    [sys.executable, 'app.py'],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
    cwd=os.path.dirname(os.path.abspath(__file__)),
)

time.sleep(3)

print("Flask app started on http://127.0.0.1:5000")
print("Creating public tunnel...")

try:
    from flask import Flask, Response
    import requests

    # Try localhost.run (SSH-less approach via HTTP)
    resp = requests.post(
        'https://localtunnel.me/',
        headers={'Content-Type': 'application/json'},
        timeout=10,
    )
    print("localtunnel response:", resp.status_code, resp.text[:200])
except Exception as e:
    print("localtunnel failed:", e)

# Try serveo via subprocess
try:
    import subprocess
    # serveo via SSH won't work easily on Windows
    pass
except:
    pass

print("\n" + "=" * 50)
print("To generate APK, please deploy to Render (free):")
print("1. Go to https://render.com -> Sign up with GitHub")
print("2. New Web Service -> connect daily-news-app repo")
print("3. Start command: gunicorn app:app")
print("4. Deploy -> get URL like https://daily-news.onrender.com")
print("5. Go to https://pwabuilder.com -> enter URL -> download APK")
print("=" * 50)
print("\nOr local APK build (needs Java + Android SDK):")
print("npm install -g @pwabuilder/cli")
print("pwa build --apk")
print("=" * 50)

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    flask_proc.terminate()
    print("\nStopped.")
