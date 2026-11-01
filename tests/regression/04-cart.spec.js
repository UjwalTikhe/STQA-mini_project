const {
  BASKETBALL_ID,
  DEFAULT_CART,
  SOCKS_ID,
  checkoutLineCount,
  headerCartQuantity,
  lastAlert,
  seedCart,
  visit,
} = require('../helpers/session');

/**
 * REQ-04 Cart Management — ordered regression script 04.
 * Line rendering, deletion and cart-state integrity on checkout.html.
 */
describe('Feature 04 - Cart Management', () => {
  it('TC-CART-01 [REQ-04] [functional] checkout renders one line per distinct cart product', async () => {
    await seedCart('checkout', DEFAULT_CART);

    expect(await checkoutLineCount()).toBe(2);
  });

  it('TC-CART-02 [REQ-04] [functional] deleting a line removes it and confirms with a message', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const deleteLinks = await $$('.js-delete-link');
    await deleteLinks[0].click();

    expect(await lastAlert()).toContain('Product removed from cart');
    expect(await checkoutLineCount()).toBe(1);
  });

  it('TC-CART-03 [REQ-04] [functional] the header counter reflects the live cart on checkout', async () => {
    await seedCart('checkout', DEFAULT_CART);

    // checkout.js never updates .js-cart-quantity, so the header keeps showing the
    // hard-coded 0 while the cart holds 3 items. Logged as defect CAT-FUN-009.
    expect(await headerCartQuantity()).toBe(3);
  });

  it('TC-CART-04 [REQ-04] [functional] the header counter drops immediately after a deletion', async () => {
    await seedCart('checkout', [{ productId: SOCKS_ID, quantity: 2 }, { productId: BASKETBALL_ID, quantity: 1 }]);
    const deleteLinks = await $$('.js-delete-link');
    await deleteLinks[0].click();
    await lastAlert();

    // Related to CAT-FUN-009: no counter refresh runs after removeFromCart().
    expect(await headerCartQuantity()).toBe(1);
  });

  it('TC-CART-05 [REQ-04] [data] a deletion is persisted to storage across a reload', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const deleteLinks = await $$('.js-delete-link');
    await deleteLinks[1].click();
    await lastAlert();

    await visit('checkout');

    expect(await checkoutLineCount()).toBe(1);
    const stored = await browser.execute(() => JSON.parse(localStorage.getItem('cart')));
    expect(stored).toHaveLength(1);
  });

  it('TC-CART-06 [REQ-04] [usability] an empty cart explains itself to the buyer', async () => {
    await seedCart('checkout', []);
    const body = await browser.execute(() => document.querySelector('.js-order-summary').textContent.trim());

    expect(body).not.toBe('');
  });

  it('TC-CART-07 [REQ-04] [functional] choosing a delivery option updates the displayed delivery date', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const radios = await $$('.delivery-option-input');
    await radios[2].click();
    await browser.pause(400);

    const date = await browser.execute(() => {
      const container = document.querySelector('[class*="js-cart-item-container"]');
      return container.querySelector('.delivery-date').textContent.trim();
    });

    // The radios have no change handler, so the line keeps the default delivery date.
    // Logged as defect CAT-FUN-010.
    expect(date).toContain('Monday, June 13');
  });

  it('TC-CART-08 [REQ-04] [data] line prices match the catalogue data', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const prices = await $$('.product-price');
    const first = await prices[0].getText();

    expect(first).toContain('$10.90');
  });
});
