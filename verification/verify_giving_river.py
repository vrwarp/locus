from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        try:
            # Login
            page.goto("http://localhost:5173")
            page.fill("input[placeholder='Application ID']", "admin")
            page.fill("input[placeholder='Secret']", "admin")
            page.locator("input[placeholder='Secret']").press("Enter")

            # Wait for auth overlay to disappear
            print("Waiting for auth overlay to disappear...")
            page.wait_for_selector(".auth-overlay", state="hidden", timeout=30000)
            print("Auth overlay gone.")

            # Wait for main content to load
            page.wait_for_timeout(2000)

            print("Clicking Giving River...")
            page.click("text=Giving River")
            page.wait_for_timeout(500)

            # Wait for report to render
            page.wait_for_selector(".giving-river")

            # Take screenshot
            page.screenshot(path="/home/jules/verification/giving_river.png")
            print("Screenshot saved to /home/jules/verification/giving_river.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run()