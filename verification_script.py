from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Go to app
            page.goto("http://localhost:3001")

            # Login
            page.fill("input[placeholder='Application ID']", "test")
            page.fill("input[placeholder='Secret']", "test")

            # Wait for data load (scatter plot)
            page.wait_for_selector(".recharts-surface", timeout=10000)

            # Wait for anomalies calculation
            page.wait_for_timeout(2000)

            # Check for "Review Mode" button
            # Review Mode (X)
            review_btn = page.get_by_role("button", name="Review Mode")

            if review_btn.count() > 0:
                print("Anomalies found. Entering Review Mode.")
                review_btn.click()

                # Wait for modal content
                page.wait_for_selector(".review-mode-overlay")

                # Check for "Fix Phone" tab.
                fix_phone_tab = page.get_by_role("button", name="Fix Phone")
                if fix_phone_tab.count() > 0:
                     fix_phone_tab.click()
                     print("Clicked Fix Phone tab")

                     # Check for Suggested Phone input
                     # Wait for input to appear
                     page.wait_for_selector("input#review-phone", timeout=5000)

                     # Take screenshot
                     page.screenshot(path="verification_phone_fix.png")
                     print("Screenshot saved to verification_phone_fix.png")
                else:
                     print("Fix Phone tab not found?")
                     page.screenshot(path="verification_no_phone_tab.png")
            else:
                print("No anomalies found. Taking screenshot of main page.")
                page.screenshot(path="verification_no_anomalies.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
