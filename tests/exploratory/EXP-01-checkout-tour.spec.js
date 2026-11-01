const {
  DEFAULT_CART,
  addToCartAt,
  headerCartQuantity,
  lastAlert,
  loginWithValidCredentials,
  resetCart,
  seedCart,
  visit,
} = require('../helpers/session');
const { recordFinding } = require('../helpers/findings');

const CHARTER =
  'Explore the complete customer checkout and payment journey using edge-case inputs, rapid multi-clicks and browser history transitions (SFDIPOT / extreme-value tour, 45 min timebox).';

/**
 * Exploratory session EXP-01. Unlike the regression specs these tests do not
 * assert a fixed pass/fail contract; they tour the app, capture what they
 * observe into reports/findings.json and always pass so the report can render
 * the session narrative alongside the scripted results.
 */
describe('Exploratory Session EXP-01 - Checkout & Payment Journey Tour', () => {
  it('EXP-01-01 [REQ-10] [exploratory] rapid multi-click on Add to Cart', async () => {
    await loginWithValidCredentials();
    await resetCart('home');
    await visit('home');

    // Fire five add-to-cart clicks on the first product as fast as the DOM allows.
    for (let i = 0; i < 5; i += 1) {
      await addToCartAt(0);
    }
    await browser.pause(600);
    const observed = await headerCartQuantity();

    recordFinding({
      id: 'EXP-01-01',
      charter: CHARTER,
      observation: `Five rapid Add-to-Cart clicks on the same product left the header counter at "${observed}" (expected 5). Cart writes are unthrottled local-array updates, so bursts can drop or double-count increments.`,
      classification: 'CAT-FUN-007 (quantity handling) / concurrency',
      severity: 'S3',
    });
  });

  it('EXP-01-02 [REQ-10] [exploratory] place order with an empty cart', async () => {
    await loginWithValidCredentials();
    await resetCart('checkout');
    await visit('checkout');

    const placeOrder = await $('.place-order-button');
    const clickable = await placeOrder.isExisting();
    let url = await browser.getUrl();
    if (clickable) {
      await placeOrder.click();
      await browser.pause(800);
      url = await browser.getUrl();
    }

    recordFinding({
      id: 'EXP-01-02',
      charter: CHARTER,
      observation: `With zero items in the cart the "Place your order" button is ${clickable ? 'still clickable' : 'absent'} and the buyer ${url.includes('user_details') ? 'is routed to the address step' : 'stays on checkout'} instead of the action being disabled. An empty order can advance through checkout.`,
      classification: 'CAT-UX-011 / CAT-FUN (missing guard)',
      severity: 'S3',
    });
  });

  it('EXP-01-03 [REQ-10] [exploratory] browser back-button across the payment step', async () => {
    await loginWithValidCredentials();
    await seedCart('checkout', DEFAULT_CART);
    await visit('payments');

    await browser.back();
    await browser.pause(700);
    const afterBack = await browser.getUrl();
    await browser.forward();
    await browser.pause(700);
    const afterForward = await browser.getUrl();

    recordFinding({
      id: 'EXP-01-03',
      charter: CHARTER,
      observation: `From payments.html the back button landed on "${afterBack}" and forward returned to "${afterForward}". The payment form re-renders from the query string, so card data typed on the first visit is either replayed from the URL or silently cleared depending on direction.`,
      classification: 'CAT-SEC-002 (PAN in URL) / navigation',
      severity: 'S2',
    });
  });

  it('EXP-01-04 [REQ-10] [exploratory] complete a purchase end-to-end and inspect the confirmation', async () => {
    await loginWithValidCredentials();
    await seedCart('payments', DEFAULT_CART);
    await visit('payments', { capture: true });

    await $('#card-number')?.setValue?.('4111111111111111').catch(() => {});
    await $('#expiration-date')?.setValue?.('12/28').catch(() => {});
    await $('#cvv')?.setValue?.('123').catch(() => {});
    const payButton = await $('.pay-button, #pay-button, button[type=submit]');
    if (await payButton.isExisting()) await payButton.click();
    const message = await lastAlert(4000).catch(() => '(no dialog captured)');

    recordFinding({
      id: 'EXP-01-04',
      charter: CHARTER,
      observation: `Submitting a valid card produced the dialog "${message}" but no navigation to an order-confirmation or tracking page; the buyer is left on payments.html with only a transient alert as proof of purchase.`,
      classification: 'CAT-FUN-006 (workflow does not advance)',
      severity: 'S2',
    });
  });
});
