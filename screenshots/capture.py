from playwright.sync_api import sync_playwright
import os

BASE = "https://gestor-financeiro-proj.vercel.app"
OUT = os.path.dirname(os.path.abspath(__file__))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # 1. Login page
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "login.png"), full_page=True)
    print("1/5 login.png")

    # 2. Register page
    page.goto(f"{BASE}/#/register")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "register.png"), full_page=True)
    print("2/5 register.png")

    # 3. Register a test user and go to dashboard
    import random, string
    uid = ''.join(random.choices(string.ascii_lowercase, k=6))
    email = f"teste_{uid}@example.com"
    page.fill("input#nome", "Teste")
    page.fill("input#sobrenome", "Screenshot")
    page.fill("input#email", email)
    page.fill("input#senha", "Teste123!")
    page.click("button[type='submit']")
    page.wait_for_timeout(3000)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "dashboard.png"), full_page=True)
    print("3/5 dashboard.png")

    # 4. Add a transaction
    page.click("text=Nova Transação")
    page.wait_for_timeout(500)
    page.fill("input[name='descricao']", "Salário Mensal")
    page.fill("input[name='valor']", "5000")
    page.click("text=Salvar")
    page.wait_for_timeout(1500)
    page.click("text=Nova Transação")
    page.wait_for_timeout(500)
    page.fill("input[name='descricao']", "Supermercado")
    page.fill("input[name='valor']", "-350")
    page.click("select[name='categoria']")
    page.select_option("select[name='categoria']", "Alimentação")
    page.click("text=Salvar")
    page.wait_for_timeout(1500)
    page.screenshot(path=os.path.join(OUT, "dashboard-com-dados.png"), full_page=True)
    print("4/5 dashboard-com-dados.png")

    # 5. Profile page
    page.goto(f"{BASE}/#/perfil")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "perfil.png"), full_page=True)
    print("5/5 perfil.png")

    browser.close()
    print("Done! Screenshots saved to", OUT)
