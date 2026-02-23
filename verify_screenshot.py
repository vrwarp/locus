import re
from playwright.sync_api import sync_playwright

def verify_screenshot():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            page.goto("http://localhost:5173", timeout=60000)

            # Inject credentials
            page.fill('input[placeholder="Application ID"]', "test")
            page.fill('input[placeholder="Secret"]', "test")
            page.wait_for_timeout(3000)

            # Click Family Audit
            page.click('button:has-text("Family Audit")')
            page.wait_for_selector('.modal-content', timeout=10000)

            # Wait for list to render
            page.wait_for_timeout(2000)

            # Take screenshot of modal
            modal = page.locator('.modal-content')
            if modal.is_visible():
                modal.screenshot(path="verification/family_audit_modal.png")
                print("Screenshot saved to verification/family_audit_modal.png")
            else:
                print("Modal not visible for screenshot")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_screenshot()
