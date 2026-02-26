from playwright.sync_api import Page, expect, sync_playwright
import time

def test_volunteer_web(page: Page):
    print("Navigating...")
    page.goto("http://localhost:5173")

    # 1. Login
    print("Logging in...")
    try:
        page.fill('input[placeholder="Application ID"]', "test")
        page.fill('input[placeholder="Secret"]', "test")
        # Wait for API check
        print("Waiting for API check...")
        time.sleep(3)
    except Exception as e:
        print(f"Login input failed: {e}")

    # Check for error
    overlay = page.locator(".auth-overlay")
    if overlay.is_visible():
        print("Overlay still visible.")
        print("Overlay text:", overlay.inner_text())
        page.screenshot(path="verification/error_login.png")
        # Maybe try to click something else?
        # If API check failed, we are stuck.
        # Why would it fail? Mock server should respond 200 to /api/people/v2/people

        # Force reload? No.
        raise Exception("Login failed")

    # 2. Navigate to Volunteer Web
    print("Navigating to Volunteer Web...")
    try:
        page.click("text=Volunteer Web")
    except:
        page.screenshot(path="verification/error_nav.png")
        raise

    # 3. Wait for Graph
    print("Waiting for Graph...")
    try:
        # Wait for header
        expect(page.get_by_text("The Volunteer Web")).to_be_visible(timeout=10000)
    except:
        page.screenshot(path="verification/error_graph.png")
        raise

    # Wait a bit for layout to settle
    time.sleep(3)

    # 4. Screenshot
    print("Screenshotting...")
    page.screenshot(path="verification/volunteer_web.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        try:
            test_volunteer_web(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
