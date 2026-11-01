const { loginWithValidCredentials, submitLoginForm, visit } = require('../helpers/session');

/**
 * REQ-09 Access Control & Data Protection — ordered regression script 09.
 * Runs last so the functional results above are already recorded.
 */
describe('Feature 09 - Security & Session Guard', () => {
  const anonymousTargets = [
    { tc: 'TC-SEC-01', page: 'home', file: 'amazon.html', name: 'catalog' },
    { tc: 'TC-SEC-02', page: 'checkout', file: 'checkout.html', name: 'cart' },
    { tc: 'TC-SEC-03', page: 'orders', file: 'orders.html', name: 'order history' },
    { tc: 'TC-SEC-04', page: 'userDetails', file: 'user_details.html', name: 'address step' },
    { tc: 'TC-SEC-05', page: 'payments', file: 'payments.html', name: 'payment step' },
    { tc: 'TC-SEC-06', page: 'tracking', file: 'tracking.html', name: 'delivery tracking' },
  ];

  for (const target of anonymousTargets) {
    it(`${target.tc} [REQ-09] [security] an anonymous visitor is refused the ${target.name} page`, async () => {
      await visit(target.page);
      const landed = (await browser.getUrl()).includes(target.file);

      // No page in the application verifies an authenticated session; every buyer
      // screen is served directly. Logged as defect CAT-SEC-001.
      expect(landed).toBe(false);
    });
  }

  it('TC-SEC-07 [REQ-09] [security] login issues a session marker the pages can verify', async () => {
    await loginWithValidCredentials();
    const keys = await browser.execute(() => {
      const local = Object.keys(localStorage);
      const session = Object.keys(sessionStorage).filter((key) => !key.startsWith('__captured'));
      return local.concat(session);
    });

    // CAT-SEC-001 is possible because no session token is ever created.
    expect(keys.some((key) => /session|token|auth/i.test(key))).toBe(true);
  });

  it('TC-SEC-08 [REQ-09] [security] a numeric-only password does not meet the documented policy', async () => {
    const message = await submitLoginForm('Yogesh', '8329097855');

    // The test plan (REQ-09.3) requires 8+ characters with mixed character classes;
    // the account authenticates with a bare phone number. Logged as defect CAT-SEC-004.
    expect(message).toContain('Invalid');
  });

  it('TC-SEC-09 [REQ-09] [data] the catalogue feed exposes no personal data or secrets', async () => {
    await visit('home');
    const body = await browser.execute(async () => {
      const response = await fetch('backend/products.json');
      return response.ok ? await response.text() : '';
    });

    expect(body).not.toMatch(/password|token|secret/i);
  });

  it('TC-SEC-10 [REQ-09] [functional] the catalog is reachable through a normal login', async () => {
    await loginWithValidCredentials();

    expect(await browser.getTitle()).toBe('Amazon Homepage');
  });
});
