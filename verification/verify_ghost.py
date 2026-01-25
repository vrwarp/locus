from playwright.sync_api import sync_playwright, expect

def verify_ghost_protocol(page):
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    print("Navigating to app...")
    page.goto("http://localhost:5173")

    print("Logging in...")
    page.get_by_placeholder("Application ID").fill("test_id_3")
    page.get_by_placeholder("Secret").fill("test_secret")

    print("Waiting for chart...")
    expect(page.locator(".recharts-surface")).to_be_visible(timeout=15000)

    print("Opening Ghost Protocol...")
    page.get_by_text("👻 Ghost Protocol").click()

    expect(page.locator("h2")).to_contain_text("Ghost Protocol")

    print("Analyzing...")
    analyze_btn = page.get_by_role("button", name="Analyze Candidates")
    expect(analyze_btn).to_be_visible()
    analyze_btn.click()

    # Wait for requests/UI update
    # We can just wait a second or verify the button enables again
    page.wait_for_timeout(2000)

    print("Taking screenshot...")
    page.screenshot(path="verification/ghost_protocol.png")
    print("Screenshot saved.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_ghost_protocol(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
