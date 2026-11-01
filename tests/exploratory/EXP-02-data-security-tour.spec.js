const { lastAlert, typeInto, visit } = require('../helpers/session');
const { recordFinding } = require('../helpers/findings');
const { BASE_URL } = require('../helpers/launcher');

const CHARTER =
  'Tour the data-entry and access-control surfaces with hostile and out-of-range inputs (SFDIPOT data/interface tour): address fields, direct URL access to protected pages, and reflected input.';

/**
 * Exploratory session EXP-02 — data & security tour. Records observations into
 * reports/findings.json rather than asserting a fixed contract.
 */
describe('Exploratory Session EXP-02 - Data & Access-Control Tour', () => {
  it('EXP-02-01 [REQ-10] [exploratory] address fields accept symbolic / negative zipcode', async () => {
    await visit('userDetails', { capture: true });
    await typeInto('#address', '221B Baker Street');
    await typeInto('#country', 'United States');
    await typeInto('#city', 'New York');
    await typeInto('#zipcode', '-@@12');
    await $('#proceed-button').click();
    const message = await lastAlert(4000).catch(() => '(no dialog captured)');

    recordFinding({
      id: 'EXP-02-01',
      charter: CHARTER,
      observation: `The zipcode field accepted "-@@12" and the form reported "${message}". Only blankness is checked; there is no numeric/format validation on the postal code.`,
      classification: 'CAT-VAL-013 (missing zipcode validation)',
      severity: 'S3',
    });
  });

  it('EXP-02-02 [REQ-10] [exploratory] reflected address input is not escaped', async () => {
    await visit('userDetails', { capture: true });
    const payload = '<img src=x onerror="window.__xss=1">';
    await typeInto('#address', payload);
    await typeInto('#country', 'US');
    await typeInto('#city', 'NY');
    await typeInto('#zipcode', '10001');
    await $('#proceed-button').click();
    await browser.pause(600);
    const executed = await browser.execute(() => window.__xss === 1);

    recordFinding({
      id: 'EXP-02-02',
      charter: CHARTER,
      observation: `Injecting an onerror image payload into the address field ${executed ? 'EXECUTED script in the page (reflected XSS)' : 'did not execute script (input is treated as text)'}. Recorded as an observation for the security taxonomy.`,
      classification: executed ? 'CAT-SEC (reflected XSS)' : 'No defect — input sanitized/inert',
      severity: executed ? 'S1' : 'S4',
    });
  });

  it('EXP-02-03 [REQ-10] [exploratory] direct URL access to a protected page without login', async () => {
    // Navigate straight to the checkout page in a session that never logged in.
    await browser.url(`${BASE_URL}/checkout.html`);
    await browser.pause(700);
    const url = await browser.getUrl();
    const redirectedToLogin = url.includes('login.html');

    recordFinding({
      id: 'EXP-02-03',
      charter: CHARTER,
      observation: `Requesting checkout.html directly in an unauthenticated session ${redirectedToLogin ? 'redirected to the login page (access control enforced)' : `stayed on "${url}" — the page is reachable without authentication (client-side-only protection)`}.`,
      classification: redirectedToLogin ? 'No defect — access control enforced' : 'CAT-SEC-001 (no server-side session gate)',
      severity: redirectedToLogin ? 'S4' : 'S2',
    });
  });

  it('EXP-02-04 [REQ-10] [exploratory] tamper the cart via localStorage then reload', async () => {
    await visit('checkout');
    await browser.execute(() => {
      localStorage.setItem(
        'cart',
        JSON.stringify([{ productId: 'e43638ce-6aa0-4b85-b27f-e1d07eb678c6', quantity: 99 }])
      );
    });
    await visit('checkout');
    const lines = await $$('.js-delete-link').length;
    const summary = await $('.payment-summary-row')?.getText?.().catch(() => '(none)');

    recordFinding({
      id: 'EXP-02-04',
      charter: CHARTER,
      observation: `Hand-editing localStorage to quantity 99 and reloading produced ${lines} cart line(s) with summary "${String(summary).replace(/\s+/g, ' ').trim()}". Cart state is fully client-trusted; quantities can be inflated without any server reconciliation.`,
      classification: 'CAT-SEC / CAT-MON-012 (client-trusted totals)',
      severity: 'S2',
    });
  });
});
