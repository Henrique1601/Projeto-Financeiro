import sys, json
from playwright.sync_api import sync_playwright

API_URL = 'http://localhost:3000'
APP_URL = 'http://localhost:5173'

TEST_USER = {
  'nome': 'Teste',
  'sobrenome': 'E2E',
  'email': 'teste-e2e-' + str(hash(str(sys.argv))) + '@test.com',
  'senha': 'Teste123!'
}

def main():
  with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    failures = []

    def check(step, ok):
      if not ok:
        failures.append(step)
        print(f'  FAIL {step}')
      else:
        print(f'  PASS {step}')

    # 1. Register user via API
    print('\n1. Register')
    resp = page.request.post(API_URL + '/api/register', data=TEST_USER)
    data = resp.json()
    ok = resp.ok and 'token' in data
    check('POST /api/register returns token', ok)

    # 2. Login via API
    print('\n2. Login')
    resp = page.request.post(API_URL + '/api/login', data={
      'email': TEST_USER['email'], 'senha': TEST_USER['senha']
    })
    data = resp.json()
    ok = resp.ok and 'token' in data
    check('POST /api/login returns token', ok)

    # 3. Set token and load dashboard
    print('\n3. Dashboard load')
    page.goto(APP_URL + '/')
    page.wait_for_load_state('networkidle')
    page.evaluate(f"localStorage.setItem('token', '{data['token']}')")
    page.goto(APP_URL + '/#/dashboard')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    ok = page.locator('.stats-grid').count() > 0
    check('Dashboard shows stats grid', ok)

    # 4. Create a transaction
    print('\n4. Create transaction')
    page.evaluate("window.dispatchEvent(new CustomEvent('app-shortcut', { detail: 'nova-transacao' }))")
    page.wait_for_timeout(500)
    page.fill('#formDescricao', 'Test E2E Transaction')
    page.fill('#formValor', '100')
    page.select_option('#formTipo', 'entrada')
    today = page.evaluate("new Date().toISOString().split('T')[0]")
    page.fill('#formData', today)
    page.click('button[type="submit"]')
    page.wait_for_timeout(2000)
    toast = page.locator('.toastify')
    ok = toast.count() > 0
    check('Transaction created successfully', ok)

    # 5. Navigate to Perfil
    print('\n5. Perfil page')
    page.goto(APP_URL + '/#/perfil')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    ok = page.locator('.profile-name').count() > 0
    check('Perfil page loads with name', ok)

    # 6. Navigate to Recorrentes
    print('\n6. Recorrentes page')
    page.goto(APP_URL + '/#/recorrentes')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    ok = page.locator('.recorrentes-page').count() > 0
    check('Recorrentes page loads', ok)

    # 7. Check health endpoint
    print('\n7. Health check')
    resp = page.request.get(API_URL + '/api/health')
    data = resp.json()
    check('API health returns OK', data.get('status') == 'OK' and data.get('database') == 'connected')

    browser.close()
    print(f'\n{"="*40}')
    print(f'Results: {len(failures)} failures, {7 - len(failures)} passed')
    if failures:
      print(f'Failed: {failures}')
      sys.exit(1)
    else:
      print('All tests passed!')

if __name__ == '__main__':
  main()
