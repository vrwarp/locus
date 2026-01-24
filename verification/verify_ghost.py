import time
from playwright.sync_api import sync_playwright

def verify_ghost(page):
    # Mock API
    def handle_route(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body='''
            {
                "data": [
                    {
                        "id": "1",
                        "type": "Person",
                        "attributes": {
                            "name": "Ghost User",
                            "birthdate": "2000-01-01",
                            "grade": 10,
                            "last_checked_in_at": null
                        }
                    },
                    {
                        "id": "2",
                        "type": "Person",
                        "attributes": {
                            "name": "Active User",
                            "birthdate": "2000-01-01",
                            "grade": 10,
                            "last_checked_in_at": "2024-01-01"
                        }
                    }
                ],
                "links": {},
                "meta": {"total_count": 2, "count": 2}
            }
            '''
        )

    page.route("**/api/people/v2/people*", handle_route)

    page.goto("http://localhost:3000")

    # Fill auth
    page.get_by_placeholder("Application ID").fill("test")
    page.get_by_placeholder("Secret").fill("test")

    # Wait for "Loading..." to disappear (might happen instantly) or just wait for network idle
    # page.wait_for_load_state("networkidle")

    # Click Ghost Protocol
    ghost_btn = page.get_by_text("👻 Ghost Protocol")
    ghost_btn.click()

    # Wait for modal content
    page.wait_for_selector("text=potential ghosts detected")
    page.wait_for_selector("text=Ghost User")

    # Screenshot
    page.screenshot(path="verification/ghost_modal.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_ghost(page)
        finally:
            browser.close()
