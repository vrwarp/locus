from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Listen to console
        page.on("console", lambda msg: print(f"PAGE CONSOLE: {msg.text}"))

        try:
            # 1. Navigate
            print("Navigating to app...")
            page.goto("http://localhost:3000")

            # 2. Login (Mock)
            print("Logging in...")
            page.fill("input[placeholder='Application ID']", "test")
            page.fill("input[placeholder='Secret']", "test")

            # Wait for data to load
            print("Waiting for data to load...")
            # Wait for "Review Mode" button or "Settings" button to ensure header loaded
            # But specifically wait for Graph points?
            # Or just wait for "Review Mode" (which implies anomalies found > data loaded)
            page.wait_for_selector("text=Review Mode", timeout=10000)

            # 3. Open Report
            print("Opening Report...")
            page.click("text=📊 Report")

            # 4. Switch to Recruiting Tab
            print("Switching to Recruiting tab...")
            page.wait_for_selector("text=Data Health Audit")
            page.click("text=Recruiting")

            # 5. Wait for Candidates or Empty State
            print("Waiting for candidates or empty state...")
            try:
                page.wait_for_selector(".recruitment-report")

                # Wait a bit for async processing if needed
                page.wait_for_timeout(2000)

                # Check if empty state
                if page.locator(".empty-state").is_visible():
                    print("No candidates found! Screenshotting...")
                    page.screenshot(path="verification/recruitment_empty.png")
                    # Log why
                    return

                page.wait_for_selector(".candidate-card", timeout=10000)

            except Exception as e:
                print(f"Error waiting for candidates: {e}")
                page.screenshot(path="verification/error_waiting.png")
                raise e

            # 6. View Script
            print("Viewing script...")
            # Pick the first one
            page.click(".candidate-card .btn-script")

            # Wait for textarea
            page.wait_for_selector(".script-textarea")

            # 7. Screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/recruitment_script.png")
            print("Done!")

        except Exception as e:
            print(f"Script failed: {e}")
            page.screenshot(path="verification/failure.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
