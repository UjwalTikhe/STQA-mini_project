const { lastAlert, typeInto, visit } = require('../helpers/session');

/**
 * REQ-06 Shipping Address Validation — ordered regression script 06.
 * Boundary value analysis against user_details.html (mandatory fields, zipcode format).
 */
async function fillAddress(overrides = {}) {
  const values = {
    address: '221B Baker Street',
    country: 'United States',
    city: 'New York',
    zipcode: '10001',
    ...overrides,
  };
  await visit('userDetails');
  if (values.address !== null) await typeInto('#address', values.address);
  if (values.country !== null) await typeInto('#country', values.country);
  if (values.city !== null) await typeInto('#city', values.city);
  if (values.zipcode !== null) await typeInto('#zipcode', values.zipcode);
  await $('#proceed-button').click();
  return lastAlert();
}

describe('Feature 06 - Shipping Address (Boundary)', () => {
  it('TC-ADR-01 [REQ-06] [functional] a complete address is accepted', async () => {
    expect(await fillAddress()).toContain('User details entered successfully');
  });

  it('TC-ADR-02 [REQ-06] [boundary] an empty street address is refused', async () => {
    expect(await fillAddress({ address: null })).toContain('Please fill out all fields');
  });

  it('TC-ADR-03 [REQ-06] [boundary] an entirely empty form is refused', async () => {
    expect(await fillAddress({ address: null, country: null, city: null, zipcode: null })).toContain(
      'Please fill out all fields'
    );
  });

  it('TC-ADR-04 [REQ-06] [boundary] a whitespace-only address is refused', async () => {
    expect(await fillAddress({ address: '   ' })).toContain('Please fill out all fields');
  });

  it('TC-ADR-05 [REQ-06] [boundary] a non-numeric zipcode is refused', async () => {
    // user_details.html never constrains the zipcode, so letters are accepted.
    // Logged as defect CAT-VAL-013.
    expect(await fillAddress({ zipcode: 'ABCDE' })).toContain('Please fill out all fields');
  });

  it('TC-ADR-06 [REQ-06] [boundary] a zipcode shorter than the 5-digit minimum is refused', async () => {
    expect(await fillAddress({ zipcode: '90' })).toContain('Please fill out all fields');
  });

  it('TC-ADR-07 [REQ-06] [boundary] a zipcode longer than 10 characters is refused', async () => {
    expect(await fillAddress({ zipcode: '1'.repeat(12) })).toContain('Please fill out all fields');
  });

  it('TC-ADR-08 [REQ-06] [workflow] an accepted address advances to payment without a reload', async () => {
    await fillAddress();
    await browser.pause(1500);

    // The button is a bare submit input, so the form performs a native GET reload
    // instead of routing on. Logged as defect CAT-FUN-006.
    expect(await browser.getUrl()).toContain('payments.html');
  });

  it('TC-ADR-09 [REQ-06] [security] markup typed into the address is not executed', async () => {
    await fillAddress({ address: '<img src=x onerror=alert("XSS")>' });
    await browser.pause(500);
    const captured = await browser.execute(() => JSON.parse(sessionStorage.getItem('__captured_alerts') || '[]'));

    expect(captured.filter((message) => message === 'XSS')).toHaveLength(0);
  });
});
