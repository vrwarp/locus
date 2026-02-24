from playwright.sync_api import Page, expect, sync_playwright
import time

def test_velocity_chart(page: Page):
  # 1. Arrange: Go to the app
  page.goto("http://localhost:5173")

  # 2. Login
  # Find inputs by placeholder
  app_id_input = page.get_by_placeholder("Application ID")
  secret_input = page.get_by_placeholder("Secret")

  app_id_input.fill("test")
  secret_input.fill("test")

  # 3. Wait for data to load
  # The "Loading..." text should disappear
  expect(page.get_by_text("Loading...")).not_to_be_visible(timeout=10000)

  # Wait for the scatter plot or report button to be enabled/visible
  # The report button is always visible but might be behind loading?
  report_btn = page.get_by_text("📊 Report")
  expect(report_btn).to_be_visible()

  # 4. Open Report
  report_btn.click()

  # 5. Wait for Report Modal
  expect(page.get_by_text("Data Health Audit")).to_be_visible()

  # 6. Click Velocity Tab
  velocity_tab = page.get_by_text("Velocity")
  velocity_tab.click()

  # 7. Wait for Chart
  # "The "Check-in Velocity"" title
  expect(page.get_by_text("The \"Check-in Velocity\"")).to_be_visible()

  # Wait a bit for animation
  time.sleep(2)

  # 8. Screenshot
  page.screenshot(path="verification/velocity_chart.png")

if __name__ == "__main__":
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
      test_velocity_chart(page)
    finally:
      browser.close()
