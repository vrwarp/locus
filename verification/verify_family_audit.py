from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.on("console", lambda msg: print(f"Console: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PageError: {err}"))

    try:
        # 1. Navigate to App
        print("Navigating...")
        page.goto("http://localhost:5173", timeout=60000)
        print("Navigated.")

        # 2. Login
        print("Filling inputs...")
        page.get_by_placeholder("Application ID").fill("test-app-id", timeout=10000)
        page.get_by_placeholder("Secret").fill("test-secret")

        # 3. Wait for data to load
        expect(page.locator(".recharts-wrapper")).to_be_visible(timeout=20000)

        # 4. Click Family Audit
        # Use specific button locator
        page.get_by_role("button", name="Family Audit").click()

        # 5. Wait for Modal Header
        expect(page.get_by_role("heading", name="Family Audit")).to_be_visible()
        expect(page.get_by_text("potential anomalies detected")).to_be_visible()

        # 6. Screenshot
        page.screenshot(path="verification/family_audit.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
