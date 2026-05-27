from playwright.sync_api import sync_playwright
import os, re

BASE = "https://gestor-financeiro-proj.vercel.app"
OUT = os.path.dirname(os.path.abspath(__file__))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # 1. Login page
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "login.png"), full_page=True)
    print("1/7 login.png")

    # 2. Register page - screenshot only, inspect selectors
    page.goto(f"{BASE}/#/register")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "register.png"), full_page=True)
    # find input labels
    inputs = page.locator("input").all()
    for inp in inputs:
        placeholder = inp.get_attribute("placeholder") or ""
        type_attr = inp.get_attribute("type") or ""
        print(f"  input type={type_attr} placeholder='{placeholder}'")

    print("2/7 register.png")

    # 3. Navigate back to login
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "login-full.png"), full_page=True)
    print("3/7 login-full.png")

    browser.close()
    print("Done!")
