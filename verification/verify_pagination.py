from playwright.sync_api import sync_playwright, expect
import time

def test_pagination(page):
    print("Navigating to app...")
    page.goto("http://localhost:5173")

    print("Logging in...")
    page.get_by_placeholder("Application ID").fill("123")
    page.get_by_placeholder("Secret").fill("123")

    print("Waiting for data...")
    # Wait for the "Showing X records" text which appears after load
    expect(page.get_by_text("Showing")).to_be_visible(timeout=20000)

    print("Verifying Load More button...")
    load_more = page.get_by_role("button", name="Load More Results")
    load_more.scroll_into_view_if_needed()
    expect(load_more).to_be_visible()

    print("Taking screenshot...")
    page.screenshot(path="verification/pagination.png")

    print("Clicking Load More...")
    initial_text = page.get_by_text("Showing").text_content()
    print(f"Initial: {initial_text}")

    load_more.click()

    # Wait for loading state
    expect(page.get_by_role("button", name="Loading...")).to_be_visible()

    # Wait for new count
    expect(page.get_by_text("Showing")).not_to_have_text(initial_text, timeout=20000)
    final_text = page.get_by_text("Showing").text_content()
    print(f"Final: {final_text}")

    print("Pagination Verified!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            test_pagination(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
