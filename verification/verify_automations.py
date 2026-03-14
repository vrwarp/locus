from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="/home/jules/verification/video")
        page = context.new_page()

        try:
            # Login
            page.goto("http://localhost:5173")
            page.fill("input[placeholder='Application ID']", "admin")
            page.fill("input[placeholder='Secret']", "admin")
            page.locator("input[placeholder='Secret']").press("Enter")

            # Wait for auth overlay to disappear
            page.wait_for_selector(".auth-overlay", state="hidden")

            # Wait for main content to load
            page.wait_for_timeout(2000)

            page.click("text=Automations")
            page.wait_for_timeout(500)

            # Wait for Automations report to render
            page.wait_for_selector(".automations-report")

            # Scroll down slightly to see the background check lanes if needed
            page.evaluate("window.scrollBy(0, 300)")
            page.wait_for_timeout(1000)

            # Take screenshot
            page.screenshot(path="/home/jules/verification/automations.png")
            print("Screenshot saved to /home/jules/verification/automations.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run()
