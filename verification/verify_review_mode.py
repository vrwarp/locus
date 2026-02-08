from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to app
    print("Navigating to app...")
    page.goto("http://localhost:5173")

    # Login
    print("Logging in...")
    page.fill("input[placeholder='Application ID']", "test-app-id")
    page.fill("input[placeholder='Secret']", "test-secret")

    # Wait for data to load
    print("Waiting for data...")
    page.wait_for_selector(".recharts-surface", timeout=10000)

    # Wait for "Review Mode" button
    print("Waiting for Review Mode button...")
    try:
        # Check if button exists
        # Use a regex or text match
        review_btn = page.wait_for_selector("button:has-text('Review Mode')", timeout=5000)
        print("Clicking Review Mode button...")
        review_btn.click()

        # Wait for Review Mode
        print("Waiting for Review Mode modal...")
        page.wait_for_selector(".review-card")

        # Screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/verification.png")
        print("Review Mode verified.")

    except Exception as e:
        print(f"Failed to verify Review Mode: {e}")
        # Take a screenshot anyway to debug
        page.screenshot(path="verification/debug.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
