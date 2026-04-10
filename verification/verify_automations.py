from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173") # Assuming vite default port
    page.wait_for_timeout(2000)

    # Fill auth to bypass AuthOverlay
    page.get_by_placeholder("Application ID").fill("admin")
    page.get_by_placeholder("Secret").fill("admin")
    page.keyboard.press("Enter")

    page.wait_for_selector(".auth-overlay", state="hidden")
    page.wait_for_timeout(1000)

    # Navigate to Emergency Alerts
    page.evaluate("document.querySelector('.sidebar-nav').scrollBy(0, 1000)")
    page.wait_for_timeout(1000)
    page.locator('button', has_text="Emergency Alerts").click()
    page.wait_for_timeout(1000)

    # Interact with Emergency Alerts
    page.get_by_placeholder("Type your emergency alert message here...").fill("This is a test emergency alert.")
    page.wait_for_timeout(1000)
    page.get_by_role("button", name="Send SMS Blast").click()
    page.wait_for_timeout(2000) # wait for success message

    # Screenshot of Emergency Alerts page
    page.screenshot(path="/home/jules/verification/screenshots/emergency2.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
