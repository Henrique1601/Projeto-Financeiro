from playwright.sync_api import sync_playwright
import os, random, string

BASE = "https://gestor-financeiro-proj.vercel.app"
OUT = os.path.dirname(os.path.abspath(__file__))
uid = ''.join(random.choices(string.ascii_lowercase, k=6))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    # 1. Login
    page.goto(BASE)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "01-login.png"), full_page=True)
    print("1/7 login")

    # 2. Register
    page.goto(f"{BASE}/#/register")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "02-register.png"), full_page=True)
    print("2/7 register")

    # 3. Register + dashboard empty
    page.fill("input[placeholder='Seu nome']", "Usuário")
    page.fill("input[placeholder='Seu sobrenome']", "Teste")
    page.fill("input[placeholder='seu@email.com']", f"teste_{uid}@example.com")
    page.fill("input[placeholder='Mínimo 6 caracteres']", "Teste123!")
    page.click("button[type='submit']")
    page.wait_for_timeout(5000)
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "03-dashboard-vazio.png"), full_page=True)
    print("3/7 dashboard vazio")

    # 4. Add income transaction
    page.locator("button", has_text="Nova Transação").first.click()
    page.wait_for_timeout(800)
    page.fill("input#formDescricao", "Salário Mensal")
    page.fill("input#formValor", "5000")
    page.select_option("select#formTipo", "entrada")
    page.click("button#cancelForm")
    page.wait_for_timeout(500)

    # Add via navbar
    page.locator("button.nav-item", has_text="Nova Transação").click()
    page.wait_for_timeout(800)
    page.fill("input#formDescricao", "Salário Mensal")
    page.fill("input#formValor", "5000")
    page.select_option("select#formTipo", "entrada")
    page.click("button[type='submit']")
    page.wait_for_timeout(2000)

    # 5. Add expense transaction
    page.locator("button.nav-item", has_text="Nova Transação").click()
    page.wait_for_timeout(800)
    page.fill("input#formDescricao", "Supermercado")
    page.fill("input#formValor", "350")
    page.select_option("select#formTipo", "saida")
    page.click("button[type='submit']")
    page.wait_for_timeout(2000)
    page.screenshot(path=os.path.join(OUT, "04-dashboard-dados.png"), full_page=True)
    print("4/7 dashboard com dados")

    # 6. Perfil
    page.goto(f"{BASE}/#/perfil")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "05-perfil.png"), full_page=True)
    print("5/7 perfil")

    # 7. Mobile login
    mobile = browser.new_context(viewport={"width": 390, "height": 844})
    mpage = mobile.new_page()
    mpage.goto(BASE)
    mpage.wait_for_load_state("networkidle")
    mpage.screenshot(path=os.path.join(OUT, "06-mobile-login.png"), full_page=True)
    print("6/7 mobile login")
    mobile.close()

    # 8. Forgot password
    page.goto(f"{BASE}/#/forgot-password")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=os.path.join(OUT, "07-forgot-password.png"), full_page=True)
    print("7/7 forgot password")

    browser.close()
    print("All done!")
