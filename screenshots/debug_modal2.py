from playwright.sync_api import sync_playwright
import os, random, string

BASE = "https://gestor-financeiro-proj.vercel.app"
OUT = os.path.dirname(os.path.abspath(__file__))
uid = ''.join(random.choices(string.ascii_lowercase, k=6))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto(f"{BASE}/#/register")
    page.wait_for_load_state("networkidle")
    page.fill("input[placeholder='Seu nome']", "User")
    page.fill("input[placeholder='Seu sobrenome']", "Test")
    page.fill("input[placeholder='seu@email.com']", f"teste_{uid}@example.com")
    page.fill("input[placeholder='Mínimo 6 caracteres']", "Teste123!")
    page.click("button[type='submit']")
    page.wait_for_timeout(5000)
    page.wait_for_load_state("networkidle")

    page.locator("button", has_text="Nova Transação").first.click()
    page.wait_for_timeout(1000)

    html = page.inner_html("body")
    with open(os.path.join(OUT, "modal_html.txt"), "w", encoding="utf-8") as f:
        f.write(html)
    print("Modal HTML saved")

    # Search for tipo/entrada/saida related elements
    elements = page.locator("[class*='tipo'], [class*='entrada'], [class*='saida'], [class*='Tipo']").all()
    print(f"Tipo elements found: {len(elements)}")
    for el in elements:
        print(f"  tag={el.evaluate('e => e.tagName')} class={el.get_attribute('class')} text='{el.inner_text()[:50]}'")

    browser.close()
