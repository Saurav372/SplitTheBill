from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:8000")
    contact_section = page.locator("#contact")
    contact_section.scroll_into_view_if_needed()
    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()
