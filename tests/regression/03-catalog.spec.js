const {
  DEFAULT_CART,
  addToCartAt,
  headerCartQuantity,
  productCardIndexesByName,
  seedCart,
  setQuantityOnCard,
  visit,
} = require('../helpers/session');

/**
 * REQ-03 Product Catalog — ordered regression script 03.
 * Catalog rendering, media integrity and add-to-cart behaviour.
 */
describe('Feature 03 - Product Catalog', () => {
  it('TC-CAT-01 [REQ-03] [functional] the grid renders the full product catalogue', async () => {
    await seedCart('home', DEFAULT_CART);
    const cards = await $$('.product-container');

    expect(cards).toHaveLength(42);
  });

  it('TC-CAT-02 [REQ-03] [functional] every card exposes name, rating and price', async () => {
    await visit('home');
    const missing = await browser.execute(() =>
      Array.from(document.querySelectorAll('.product-container')).filter(
        (card) =>
          !card.querySelector('.product-name') ||
          !card.querySelector('.product-rating-count') ||
          !card.querySelector('.product-price')
      ).length
    );

    expect(missing).toBe(0);
  });

  it('TC-CAT-03 [REQ-03] [data] all catalogue images resolve without a broken source', async () => {
    await visit('home');
    const broken = await browser.execute(() =>
      Array.from(document.querySelectorAll('.product-container img'))
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.getAttribute('src'))
    );

    expect(broken).toEqual([]);
  });

  it('TC-CAT-04 [REQ-03] [functional] add to cart raises the header counter by one', async () => {
    // Seed an empty cart so the hard-coded 0 in amazon.html is the correct baseline.
    // This isolates the click increment from the load-sync defect CAT-FUN-017.
    await seedCart('home', []);
    const before = await headerCartQuantity();

    await addToCartAt(0);

    expect(await headerCartQuantity()).toBe(before + 1);
  });

  it('TC-CAT-05 [REQ-03] [functional] the chosen product quantity is added to the cart', async () => {
    await seedCart('home', DEFAULT_CART);
    const [socksCard] = await productCardIndexesByName('Athletic Cotton Socks');
    const before = await headerCartQuantity();

    await setQuantityOnCard(socksCard, 5);
    await addToCartAt(socksCard);

    // amazon.js reads only data-product-id and always increments by one, ignoring
    // the quantity <select>. Logged as defect CAT-FUN-007.
    expect(await headerCartQuantity()).toBe(before + 5);
  });

  it('TC-CAT-06 [REQ-03] [functional] the header search control is enabled', async () => {
    await visit('home');

    // The button is rendered with the disabled attribute. Logged as defect CAT-FUN-004.
    expect(await $('.search-button').isEnabled()).toBe(true);
  });

  it('TC-CAT-07 [REQ-03] [functional] searching filters the grid to matching products', async () => {
    await visit('home');
    await $('.search-bar').setValue('basketball');
    if (await $('.search-button').isEnabled()) {
      await $('.search-button').click();
    }
    await browser.pause(500);

    const names = await $$('.product-name');
    expect(names.length).toBeLessThan(42);
  });

  it('TC-CAT-08 [REQ-03] [functional] product detail page can add its item to the cart', async () => {
    await seedCart('home', []);
    await visit('backpack');
    const before = await headerCartQuantity();

    await $('.add-to-cart').click();
    await browser.pause(500);

    // products/*.html load ../scripts/product-details.js, which does not exist (HTTP 404),
    // so both detail-page buttons are inert. Logged as defect CAT-FUN-008.
    expect(await headerCartQuantity()).toBeGreaterThan(before);
  });

  it('TC-CAT-09 [REQ-03] [data] the cart survives a page reload', async () => {
    await seedCart('home', DEFAULT_CART);

    // The cart data does persist in localStorage, but amazon.js calls
    // updateCartQuantity() only inside the click handler and never on load, so the
    // header keeps the hard-coded 0 from amazon.html instead of the 3 stored units.
    // Logged as defect CAT-FUN-017.
    expect(await headerCartQuantity()).toBe(3);
  });
});
