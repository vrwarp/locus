import time
from playwright.sync_api import sync_playwright

def verify_ghost_analysis(page):
    # Mock People API
    def handle_people(route):
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
                    }
                ],
                "links": {},
                "meta": {"total_count": 1, "count": 1}
            }
            '''
        )

    # Mock Check-Ins API for analysis
    def handle_checkins(route):
        route.fulfill(
            status=200,
            content_type="application/json",
            body='''
            {
                "data": {
                    "type": "Person",
                    "id": "1",
                    "attributes": {
                        "check_in_count": 12
                    }
                }
            }
            '''
        )

    page.route("**/api/people/v2/people*", handle_people)
    page.route("**/api/check-ins/v2/people/1", handle_checkins)

    page.goto("http://localhost:3000")

    # Fill auth
    page.get_by_placeholder("Application ID").fill("test")
    page.get_by_placeholder("Secret").fill("test")

    # Click Ghost Protocol
    ghost_btn = page.get_by_text("👻 Ghost Protocol")
    ghost_btn.click()

    # Wait for modal content
    page.wait_for_selector("text=potential ghosts detected")

    # Click Analyze
    analyze_btn = page.get_by_text("Analyze Check-ins")
    analyze_btn.click()

    # Wait for result
    page.wait_for_selector("text=12 check-ins")

    # Screenshot
    page.screenshot(path="verification/ghost_analysis.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_ghost_analysis(page)
        finally:
            browser.close()
