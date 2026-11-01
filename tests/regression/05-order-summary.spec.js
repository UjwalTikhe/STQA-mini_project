const { DEFAULT_CART, addToCartAt, lastAlert, seedCart, visit } = require('../helpers/session');

/**
 * REQ-05 Order Summary & Money Handling — ordered regression script 05.
 * The payment-summary panel on checkout.html is checked against the live cart.
 */
const SUMMARY = () =>
  browser.execute(() =>
    Array.from(document.querySelectorAll('.payment-summary-row')).map((row) => ({
      label: row.children[0].textContent.trim(),
      money: row.querySelector('.payment-summary-money').textContent.trim(),
    }))
  );

const cents = (money) => Math.round(Number(money.replace('$', '')) * 100);

describe('Feature 05 - Order Summary', () => {
  it('TC-SUM-01 [REQ-05] [functional] the item count label matches the cart quantity', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const rows = await SUMMARY();
    const totalUnits = DEFAULT_CART.reduce((sum, item) => sum + item.quantity, 0);

    expect(rows[0].label).toBe(`Items (${totalUnits}):`);
  });

  it('TC-SUM-02 [REQ-05] [functional] the items amount equals the cart subtotal', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const rows = await SUMMARY();

    // 2 x 1090 + 1 x 2095 = 4275 cents
    expect(cents(rows[0].money)).toBe(4275);
  });

  it('TC-SUM-03 [REQ-05] [functional] total before tax is items plus shipping', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const rows = await SUMMARY();

    expect(cents(rows[2].money)).toBe(cents(rows[0].money) + cents(rows[1].money));
  });

  it('TC-SUM-04 [REQ-05] [functional] estimated tax is ten percent of the subtotal', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const rows = await SUMMARY();
    const expected = Math.round(cents(rows[2].money) * 0.1);

    expect(Math.abs(cents(rows[3].money) - expected)).toBeLessThanOrEqual(1);
  });

  it('TC-SUM-05 [REQ-05] [functional] order total is subtotal plus tax', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const rows = await SUMMARY();

    expect(cents(rows[4].money)).toBe(cents(rows[2].money) + cents(rows[3].money));
  });

  it('TC-SUM-06 [REQ-05] [functional] the summary recalculates after a cart line is deleted', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const before = cents((await SUMMARY())[0].money);

    const deleteLinks = await $$('.js-delete-link');
    await deleteLinks[1].click();
    await lastAlert();

    expect(before).toBeGreaterThan(0);
    expect(cents((await SUMMARY())[0].money)).toBe(2180);
  });

  it('TC-SUM-07 [REQ-05] [functional] the summary counts an item added from the catalogue', async () => {
    await seedCart('home', DEFAULT_CART);
    await addToCartAt(0);
    await visit('checkout');
    const rows = await SUMMARY();

    // The panel is static markup, so it still claims three items. Logged as defect CAT-FUN-011.
    expect(rows[0].label).toBe('Items (4):');
  });

  it('TC-SUM-08 [REQ-05] [functional] shipping charged matches the pre-selected delivery option', async () => {
    await seedCart('checkout', DEFAULT_CART);
    const rows = await SUMMARY();
    const selectedPrice = await browser.execute(() => {
      const checked = document.querySelector('.delivery-option-input:checked');
      const option = checked.closest('.delivery-option');
      return option.querySelector('.delivery-option-price').textContent.trim();
    });

    // The first radio is FREE Shipping while the summary charges $4.99.
    // Logged as defect CAT-MON-012.
    expect(selectedPrice).toContain('FREE');
    expect(cents(rows[1].money)).toBe(0);
  });
});
