from playwright.sync_api import sync_playwright

def verify_config():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.on('console', lambda msg: print(f'Console: {msg.text}'))
        page.on('pageerror', lambda err: print(f'Page Error: {err}'))

        page.goto('http://localhost:5173/')

        # Click Settings
        page.click('.settings-btn')

        # Wait for modal content
        page.wait_for_selector('.modal-content')

        # Screenshot
        page.screenshot(path='verification/config_modal.png')
        browser.close()

if __name__ == '__main__':
    verify_config()
