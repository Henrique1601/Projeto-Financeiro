from playwright.sync_api import sync_playwright
import os, random, string

BASE = "https://gestor-financeiro-proj.vercel.app"
OUT = os.path.dirname(os.path.abspath(__file__))
uid = ''.join(random.choices(string.ascii_lowercase, k=6))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})

    # Register + go to dashboard
    page.goto(f"{BASE}/#/register")
    page.wait_for_load_state("networkidle")
    page.fill("input[placeholder='Seu nome']", "User")
    page.fill("input[placeholder='Seu sobrenome']", "Test")
    page.fill("input[placeholder='seu@email.com']", f"teste_{uid}@example.com")
    page.fill("input[placeholder='Mínimo 6 caracteres']", "Teste123!")
    page.click("button[type='submit']")
    page.wait_for_timeout(5000)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "03-dashboard-vazio.png"), full_page=True)
    print("dashboard vazio captured")

    # Click "Nova Transação"
    page.locator("button", has_text="Nova Transação").first.click()
    page.wait_for_timeout(1000)

    # Find all buttons in the modal
    btns = page.locator("button").all()
    for b in btns:
        txt = b.inner_text()
        print(f"  button: '{txt}'")
    inputs = page.locator("input").all()
    for inp in inputs:
        ph = inp.get_attribute("placeholder") or "(no placeholder)"
        print(f"  input placeholder='{ph}'")

    page.screenshot(path=os.path.join(OUT, "debug-modal.png"), full_page=True)
    browser.close()
    print("Debug done")
