#!/usr/bin/env python3
"""Record a demo video of the Fe Etshoob site using Playwright."""

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent.parent
SITE_DIR = ROOT / "site"
VIDEO_DIR = ROOT / "demo-video"
PORT = 8769

def main():
    # Clean and create video directory
    if VIDEO_DIR.exists():
        shutil.rmtree(VIDEO_DIR)
    VIDEO_DIR.mkdir(parents=True)

    # Start HTTP server
    print(f"🌐 Starting server on port {PORT}...")
    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT), "-d", str(SITE_DIR)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(1.5)

    base = f"http://localhost:{PORT}"
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            context = browser.new_context(
                viewport={"width": 1280, "height": 860},
                record_video_dir=str(VIDEO_DIR),
                record_video_size={"width": 1280, "height": 860},
            )
            page = context.new_page()
            page.route("**/*.{woff,woff2,ttf}", lambda r: r.abort())

            print("🎬 Starting demo recording...")

            # 1. Landing page (guest)
            print("  📍 Landing page (guest view)")
            page.goto(f"{base}/index.html?guest=1", wait_until="networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path=VIDEO_DIR / "01-landing-guest.png", full_page=True)

            # 2. Login page
            print("  📍 Login page")
            page.goto(f"{base}/login.html", wait_until="networkidle")
            page.wait_for_timeout(1500)
            page.screenshot(path=VIDEO_DIR / "02-login.png", full_page=True)

            # 3. Home page as student
            print("  📍 Home page (student view)")
            page.goto(f"{base}/index.html", wait_until="networkidle")
            page.wait_for_timeout(2500)
            page.screenshot(path=VIDEO_DIR / "03-home-student.png", full_page=True)

            page.evaluate("window.scrollTo({ top: 800, behavior: 'smooth' })")
            page.wait_for_timeout(1500)
            page.screenshot(path=VIDEO_DIR / "04-home-scroll.png", full_page=True)
            page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
            page.wait_for_timeout(1000)

            # 4. Courses page
            print("  📍 Courses page")
            page.goto(f"{base}/courses.html", wait_until="networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path=VIDEO_DIR / "05-courses.png", full_page=True)

            page.evaluate("""
                const course = document.querySelector('.course');
                if (course) course.scrollIntoView({ behavior: 'smooth' });
            """)
            page.wait_for_timeout(1500)

            # 5. Meditations page
            print("  📍 Meditations page")
            page.goto(f"{base}/meditations.html", wait_until="networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path=VIDEO_DIR / "06-meditations.png", full_page=True)

            page.goto(f"{base}/meditations.html#m1", wait_until="networkidle")
            page.wait_for_timeout(2000)
            page.screenshot(path=VIDEO_DIR / "07-meditation-reader.png", full_page=True)

            # 6. Mobile view
            print("  📍 Mobile view")
            page.set_viewport_size({"width": 390, "height": 844})
            page.goto(f"{base}/index.html", wait_until="networkidle")
            page.wait_for_timeout(1500)
            page.screenshot(path=VIDEO_DIR / "08-mobile.png", full_page=True)

            page.evaluate("window.scrollTo({ top: 600, behavior: 'smooth' })")
            page.wait_for_timeout(1500)
            page.screenshot(path=VIDEO_DIR / "09-mobile-scroll.png", full_page=True)

            # 7. Admin panel
            print("  📍 Admin panel")
            page.set_viewport_size({"width": 1280, "height": 860})
            page.goto(f"{base}/admin.html?role=admin", wait_until="networkidle")
            # Wait for tabs to render - admin.js renders tabs dynamically
            page.wait_for_timeout(4000)
            page.screenshot(path=VIDEO_DIR / "10-admin.png", full_page=True)

            # Just scroll to show the admin panel content
            page.evaluate("window.scrollTo({ top: 300, behavior: 'smooth' })")
            page.wait_for_timeout(1000)
            page.screenshot(path=VIDEO_DIR / "11-admin-scrolled.png", full_page=True)
            page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
            page.wait_for_timeout(500)

            print("✅ Demo recording complete!")
            context.close()
            browser.close()

    finally:
        server.terminate()

    # Find the video file
    videos = list(VIDEO_DIR.glob("*.webm"))
    if videos:
        latest = max(videos, key=lambda p: p.stat().st_mtime)
        print(f"\n📹 Video saved to: {latest}")
        print(f"📁 All screenshots & video in: {VIDEO_DIR}")
    else:
        print("\n⚠️  No video file found (might need a few seconds to finalize)")
        print(f"   Check: {VIDEO_DIR}")

if __name__ == "__main__":
    main()