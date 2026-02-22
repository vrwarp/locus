from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:5173")

        print("Filling credentials...")
        page.fill('input[placeholder="Application ID"]', "test")
        page.fill('input[placeholder="Secret"]', "test")

        # Wait for some data to load (e.g., chart points)
        # Or just wait a bit.
        time.sleep(2)

        print("Opening Report...")
        page.click("button:has-text('📊 Report')")

        print("Waiting for modal...")
        expect(page.get_by_text("Data Health Audit")).to_be_visible()

        print("Clicking Bus Factor tab...")
        page.click("button:has-text('Bus Factor')")

        print("Waiting for data...")
        expect(page.get_by_text('The "Bus Factor" Risk')).to_be_visible()

        # Allow chart to render
        time.sleep(3)

        print("Taking screenshot...")
        page.screenshot(path="verification/bus_factor.png")

        browser.close()
        print("Done.")

if __name__ == "__main__":
    run()
