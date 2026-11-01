const VALID_USERS = [
  { username: 'Yogesh', password: '8329097855' },
  { username: 'ujwaltikhe30@gmail.com', password: 'ootu@420' },
];

const PAGES = {
  login: '/login.html',
  home: '/amazon.html',
  checkout: '/checkout.html',
  orders: '/orders.html',
  payments: '/payments.html',
  tracking: '/tracking.html',
  userDetails: '/user_details.html',
  backpack: '/products/backpack.html',
  basketball: '/products/basketball.html',
};

/**
 * Default cart held in data/cart.js when localStorage is empty:
 * 2 x athletic socks ($10.90) + 1 x basketball ($20.95) = $42.75 across 3 items.
 */
const DEFAULT_CART = [
  { productId: 'e43638ce-6aa0-4b85-b27f-e1d07eb678c6', quantity: 2 },
  { productId: '15b6fc6f-327a-4ec4-896f-486349e85a3d', quantity: 1 },
];

const SOCKS_ID = DEFAULT_CART[0].productId;
const BASKETBALL_ID = DEFAULT_CART[1].productId;

/**
 * The application reports every result through blocking window.alert() dialogs.
 * ChromeDriver dismisses unattended dialogs before the test can read them, so the
 * dialog text is captured into sessionStorage, which survives the same-origin
 * redirects the app performs right after alerting.
 */
async function armDialogCapture() {
  await browser.execute(() => {
    sessionStorage.setItem('__captured_alerts', '[]');
    window.alert = function (message) {
      const alerts = JSON.parse(sessionStorage.getItem('__captured_alerts') || '[]');
      alerts.push(String(message));
      sessionStorage.setItem('__captured_alerts', JSON.stringify(alerts));
    };
    window.confirm = function (message) {
      const alerts = JSON.parse(sessionStorage.getItem('__captured_alerts') || '[]');
      alerts.push('confirm:' + String(message));
      sessionStorage.setItem('__captured_alerts', JSON.stringify(alerts));
      return true;
    };
  });
}

async function alerts() {
  return browser.execute(() => JSON.parse(sessionStorage.getItem('__captured_alerts') || '[]'));
}

async function lastAlert(timeout = 8000) {
  await browser.waitUntil(async () => (await alerts()).length > 0, {
    timeout,
    timeoutMsg: 'No dialog message was raised within the timeout',
  });
  const captured = await alerts();
  return captured[captured.length - 1];
}

const PAGE_MARKERS = {
  login: '#login-btn',
  home: '.js-products-grid .product-container',
  checkout: '.js-order-summary',
  orders: '.buy-again-button',
  payments: '#payment-form',
  tracking: '.order-tracking',
  userDetails: '#details-form',
  backpack: '.product-details',
  basketball: '.product-details',
};

async function visit(page, { capture = true } = {}) {
  const target = PAGES[page] || page;
  await browser.url(target);

  // `url()` can resolve while the previous document is still active; interacting
  // against that stale tree loses keystrokes, so pin the navigation first.
  await browser.waitUntil(async () => (await browser.getUrl()).includes(target.split('?')[0]), {
    timeout: 15000,
    timeoutMsg: `Navigation never settled on ${target}`,
  });

  await waitForDocumentReady(page);
  if (capture) await armDialogCapture();
}

/**
 * `url()` resolves before the inline and module scripts of the new document have
 * attached their listeners, which silently swipes the first click. Wait for the
 * page's own marker element before interacting.
 */
async function waitForDocumentReady(page) {
  await browser.waitUntil(
    async () =>
      browser.execute(() => ['interactive', 'complete'].includes(document.readyState)),
    {
      timeout: 15000,
      timeoutMsg: 'Document never became interactive',
    }
  );

  const marker = PAGE_MARKERS[page];
  if (marker) {
    // `$$` (not `$`) because a marker such as `.buy-again-button` legitimately
    // matches several nodes; a strict single-element lookup would throw.
    await browser.waitUntil(async () => (await browser.$$(marker)).length > 0, {
      timeout: 15000,
      timeoutMsg: `Marker ${marker} never appeared on ${page}`,
    });
  }
}

/** Reloads the current document and re-arms dialog capture afterwards. */
async function reload(page, { capture = true } = {}) {
  await browser.refresh();
  await waitForDocumentReady(page);
  if (capture) await armDialogCapture();
}

/** Types a value and confirms the live document actually holds it. */
async function typeInto(selector, value) {
  const element = await $(selector);
  await element.waitForDisplayed();
  await element.setValue(value);
  await browser.waitUntil(async () => (await $(selector).getValue()) === value, {
    timeout: 5000,
    interval: 150,
    timeoutMsg: `Value for ${selector} did not stick`,
  });
}

async function submitLoginForm(username, password) {
  await visit('login');
  if (username) await typeInto('#username', username);
  if (password) await typeInto('#password', password);
  await $('#login-btn').click();
  return lastAlert();
}

async function loginWithValidCredentials() {
  const user = VALID_USERS[0];
  const message = await submitLoginForm(user.username, user.password);
  await browser.waitUntil(async () => (await browser.getUrl()).includes('amazon.html'), {
    timeout: 10000,
    timeoutMsg: 'Login did not redirect to the catalog page',
  });
  await armDialogCapture();
  return message;
}

/**
 * Writes the cart into localStorage and opens `page` so the ES modules read the
 * seeded state at import time. Passing `null` items uses DEFAULT_CART; passing an
 * empty array produces a genuinely empty cart.
 *
 * localStorage is origin-scoped, so we must be on the app origin before writing;
 * at worker start the browser sits on about:blank and any access throws a
 * SecurityError. Land on the page first, write, then reload so the modules
 * re-import against the seeded cart.
 */
async function seedCart(page, items) {
  await visit(page);
  await browser.execute((payload) => {
    localStorage.setItem('cart', JSON.stringify(payload));
  }, items === null ? DEFAULT_CART : items);
  await reload(page);
}

async function resetCart(page) {
  await visit(page);
  await browser.execute(() => localStorage.removeItem('cart'));
  await reload(page);
}

async function headerCartQuantity() {
  return Number(await $('.js-cart-quantity').getText());
}

async function checkoutLineCount() {
  return (await $$('.js-delete-link')).length;
}

async function addToCartAt(index) {
  const buttons = await $$('.js-add-to-cart');
  await buttons[index].click();
  await browser.pause(200);
}

async function productCardIndexesByName(name) {
  const cards = await $$('.product-container');
  const matches = [];
  for (let index = 0; index < cards.length; index += 1) {
    const text = await cards[index].$('.product-name').getText();
    if (text.includes(name)) matches.push(index);
  }
  return matches;
}

async function setQuantityOnCard(cardIndex, quantity) {
  const card = (await $$('.product-container'))[cardIndex];
  await card.$('select').selectByVisibleText(String(quantity));
}

async function pageSource() {
  return browser.getPageSource();
}

module.exports = {
  BASKETBALL_ID,
  DEFAULT_CART,
  PAGES,
  SOCKS_ID,
  VALID_USERS,
  addToCartAt,
  alerts,
  armDialogCapture,
  checkoutLineCount,
  headerCartQuantity,
  lastAlert,
  loginWithValidCredentials,
  pageSource,
  productCardIndexesByName,
  reload,
  resetCart,
  seedCart,
  setQuantityOnCard,
  submitLoginForm,
  typeInto,
  visit,
};
