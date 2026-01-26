from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to app...")
        page.goto("http://localhost:5173")

        # Fill Auth (Demo Mode)
        print("Filling credentials...")
        page.fill('input[placeholder="Application ID"]', "demo_id")
        page.fill('input[placeholder="Secret"]', "demo_secret")

        # Wait for chart to load
        print("Waiting for chart...")
        try:
            page.wait_for_selector(".recharts-scatter-symbol", timeout=20000)
            time.sleep(2)
        except Exception as e:
            print("Timeout waiting for chart symbols. Dumping content.")
            page.screenshot(path="verification/error_state.png")
            raise e

        # Find points
        points = page.locator(".recharts-scatter-symbol")
        count = points.count()
        print(f"Found {count} points.")

        if count == 0:
            print("No points found even after wait!")
            page.screenshot(path="verification/no_points.png")
            return

        # Hover over the first point found
        print("Hovering over a point...")
        point = points.first

        # Take screenshot before hover
        page.screenshot(path="verification/before_hover.png")

        # Force hover
        point.hover(force=True)

        # Wait for tooltip to appear
        print("Waiting for tooltip...")
        # We expect "Age" and "Delta" text in the tooltip
        try:
            expect(page.get_by_text("Age", exact=False)).to_be_visible(timeout=5000)
            expect(page.get_by_text("Delta", exact=False)).to_be_visible(timeout=5000)
        except Exception as e:
            print("Tooltip not visible.")
            page.screenshot(path="verification/tooltip_fail.png")
            raise e

        # Take screenshot
        print("taking screenshot...")
        page.screenshot(path="verification/hover_tooltip.png")

        browser.close()
        print("Done.")

if __name__ == "__main__":
    run()
