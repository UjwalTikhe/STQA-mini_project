const { typeInto, visit } = require('../helpers/session');

/**
 * REQ-02 Navigation & Page Routing — ordered regression script 02.
 * Header links and inter-page routing, verified before any data-driven feature
 * because every later script reaches its page through these links.
 */
describe('Feature 02 - Navigation & Routing', () => {
  it('TC-NAV-01 [REQ-02] [functional] catalog header logo returns to the homepage', async () => {
    await visit('home');
    await $('.amazon-header-left-section .header-link').click();
    await browser.waitUntil(async () => (await browser.getUrl()).includes('amazon.html'), { timeout: 10000 });

    expect(await browser.getTitle()).toBe('Amazon Homepage');
  });

  it('TC-NAV-02 [REQ-02] [functional] Returns & Orders opens the orders page', async () => {
    await visit('home');
    await $('.orders-link').click();
    await browser.waitUntil(async () => (await browser.getUrl()).includes('orders.html'), { timeout: 10000 });

    expect(await browser.getTitle()).toBe('Orders');
  });

  it('TC-NAV-03 [REQ-02] [functional] Cart link opens the checkout page', async () => {
    await visit('home');
    await $('.cart-link').click();
    await browser.waitUntil(async () => (await browser.getUrl()).includes('checkout.html'), { timeout: 10000 });

    expect(await browser.getTitle()).toBe('Cart');
  });

  it('TC-NAV-04 [REQ-02] [functional] place-order button moves the buyer to the address step', async () => {
    await visit('checkout');
    await $('.place-order-button').click();
    await browser.waitUntil(async () => (await browser.getUrl()).includes('user_details.html'), { timeout: 10000 });

    expect(await browser.getTitle()).toBe('User Details');
  });

  it('TC-NAV-05 [REQ-02] [functional] track package opens the tracking page', async () => {
    await visit('orders');
    await $$('.track-package-button')[0].click();
    await browser.waitUntil(async () => (await browser.getUrl()).includes('tracking.html'), { timeout: 10000 });

    expect(await browser.getTitle()).toBe('Order Tracking');
  });

  it('TC-NAV-06 [REQ-02] [functional] tracking page links back to the order list', async () => {
    await visit('tracking');
    await $('.back-to-orders-link').click();
    await browser.waitUntil(async () => (await browser.getUrl()).includes('orders.html'), { timeout: 10000 });

    expect((await browser.getTitle()).length).toBeGreaterThan(0);
  });

  it('TC-NAV-07 [REQ-02] [usability] login page header logo is a keyboard-reachable link', async () => {
    await visit('login');
    const href = await $('#header-link').getAttribute('href');

    // login.html renders the logo as an anchor without href, so it cannot receive
    // keyboard focus. Logged as defect CAT-UX-006.
    expect(href).not.toBeNull();
  });

  it('TC-NAV-08 [REQ-02] [workflow] completing the address step continues to payment', async () => {
    await visit('userDetails');
    await typeInto('#address', '221B Baker Street');
    await typeInto('#country', 'United States');
    await typeInto('#city', 'New York');
    await typeInto('#zipcode', '10001');
    await $('#proceed-button').click();
    await browser.pause(1200);

    // The success handler only alerts; the form then performs a native GET reload,
    // so the buyer never reaches payments.html. Logged as defect CAT-FUN-006.
    expect(await browser.getUrl()).toContain('payments.html');
  });

  it('TC-NAV-09 [REQ-02] [portability] no link or handler hard-codes the host and port', async () => {
    await visit('orders');
    const offenders = await browser.execute(() =>
      Array.from(document.querySelectorAll('[href],[onclick]'))
        .map((el) => (el.getAttribute('onclick') || '') + ' ' + (el.getAttribute('href') || ''))
        .filter((value) => /127\.0\.0\.1|localhost/.test(value))
    );

    // orders.html drives "Buy it again" with an absolute http://127.0.0.1:5501 URL.
    // Logged as defect CAT-NAV-002.
    expect(offenders).toHaveLength(0);
  });

  it('TC-NAV-10 [REQ-02] [regression] login redirect is origin relative (fix for CAT-NAV-002 in login.html)', async () => {
    await visit('login');
    const source = await browser.getPageSource();
    const loginHandler = source.match(/window\.location\.href\s*=\s*'([^']+)'/);

    expect(loginHandler).not.toBeNull();
    expect(loginHandler[1]).toBe('amazon.html');
  });
});
