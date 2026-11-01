const { DEFAULT_CART, SOCKS_ID, seedCart, visit } = require('../helpers/session');

/**
 * REQ-08 Orders & Delivery Tracking — ordered regression script 08.
 */
describe('Feature 08 - Orders & Tracking', () => {
  it('TC-ORD-01 [REQ-08] [functional] the orders page lists every past purchase', async () => {
    await visit('orders');

    expect(await $$('.buy-again-button')).toHaveLength(3);
    expect(await $$('.track-package-button')).toHaveLength(3);
  });

  it('TC-ORD-02 [REQ-08] [functional] each order shows name, delivery date and quantity', async () => {
    await visit('orders');
    const counts = await browser.execute(() => ({
      names: document.querySelectorAll('.product-name').length,
      dates: document.querySelectorAll('.product-delivery-date').length,
      quantities: document.querySelectorAll('.product-quantity').length,
    }));

    expect(counts.names).toBe(3);
    expect(counts.dates).toBe(3);
    expect(counts.quantities).toBe(3);
  });

  it('TC-ORD-03 [REQ-08] [functional] buy-it-again returns the item to the cart', async () => {
    await seedCart('orders', []);
    const storedBefore = await browser.execute(() => localStorage.getItem('cart'));
    await $('#product-1').click();
    await browser.pause(600);
    const storedAfter = await browser.execute(() => JSON.parse(localStorage.getItem('cart') || '[]'));

    // #product-1 and #product-2 have no handler at all; only #product-3 reacts and it
    // navigates to the address form. Logged as defect CAT-FUN-015.
    expect(storedAfter).not.toEqual(JSON.parse(storedBefore));
  });

  it('TC-ORD-04 [REQ-08] [functional] track package routes to the tracking page', async () => {
    await visit('orders');
    await $$('.track-package-button')[0].click();
    await browser.waitUntil(async () => (await browser.getUrl()).includes('tracking.html'), { timeout: 10000 });

    expect(await browser.getTitle()).toBe('Order Tracking');
  });

  it('TC-TRK-01 [REQ-08] [functional] tracking highlights the current shipment stage', async () => {
    await visit('tracking');
    const current = await $('.progress-label.current-status').getText();

    expect(current).toBe('Shipped');
  });

  it('TC-TRK-02 [REQ-08] [data] the header counter matches the real cart on the tracking page', async () => {
    await seedCart('tracking', [{ productId: SOCKS_ID, quantity: 1 }]);
    const shown = await browser.execute(() => document.querySelector('.cart-quantity').textContent.trim());

    // tracking.html hard-codes <div class="cart-quantity">3</div> with no js- hook.
    // Logged as defect CAT-FUN-016.
    expect(shown).toBe('1');
  });

  it('TC-TRK-03 [REQ-08] [data] the tracked product image resolves', async () => {
    await visit('tracking');
    const broken = await browser.execute(() =>
      Array.from(document.querySelectorAll('img')).filter((img) => img.complete && img.naturalWidth === 0).length
    );

    expect(broken).toBe(0);
  });

  it('TC-ORD-05 [REQ-08] [data] the default cart keeps three units across the flow', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const units = await browser.execute(() => JSON.parse(localStorage.getItem('cart')).reduce((s, i) => s + i.quantity, 0));

    expect(units).toBe(3);
  });
});
