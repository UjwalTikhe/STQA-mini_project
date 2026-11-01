const { lastAlert, typeInto, visit } = require('../helpers/session');

/**
 * REQ-07 Payment Validation — ordered regression script 07.
 * Equivalence partitioning and boundary value analysis over the three card fields.
 */
async function pay(card = '4111111111111112', expiry = '12/28', cvv = '123') {
  await visit('payments');
  if (card !== null) await typeInto('#card-number', card);
  if (expiry !== null) await typeInto('#expiration-date', expiry);
  if (cvv !== null) await typeInto('#cvv', cvv);
  await $('#proceed-button').click();
  return lastAlert();
}

describe('Feature 07 - Payment Card (Boundary)', () => {
  it('TC-PAY-01 [REQ-07] [functional] a well-formed card is accepted', async () => {
    expect(await pay()).toContain('Payment successful');
  });

  it('TC-PAY-02 [REQ-07] [boundary] a 15-digit card number is refused', async () => {
    expect(await pay('411111111111111')).toContain('required fields correctly');
  });

  it('TC-PAY-03 [REQ-07] [boundary] a 17-digit card number is refused', async () => {
    expect(await pay('41111111111111112')).toContain('required fields correctly');
  });

  it('TC-PAY-04 [REQ-07] [boundary] alphabetic characters in the card number are refused', async () => {
    expect(await pay('4111-1111-1111-111a')).toContain('required fields correctly');
  });

  it('TC-PAY-05 [REQ-07] [boundary] a 16-digit card failing the checksum is refused', async () => {
    // isValidCardNumber only tests /^\d{16}$/, so an impossible all-zero PAN passes.
    // Logged as defect CAT-VAL-014.
    expect(await pay('0000000000000000')).toContain('required fields correctly');
  });

  it('TC-PAY-06 [REQ-07] [boundary] expiry month 13 is refused', async () => {
    expect(await pay('4111111111111112', '13/25', '123')).toContain('required fields correctly');
  });

  it('TC-PAY-07 [REQ-07] [boundary] expiry 99/99 is refused', async () => {
    // Same weak expression as TC-PAY-06; retained as the original defect sample.
    expect(await pay('4111111111111112', '99/99', '123')).toContain('required fields correctly');
  });

  it('TC-PAY-08 [REQ-07] [boundary] an expiry date in the past is refused', async () => {
    // No comparison against the current date exists. Logged as defect CAT-VAL-003.
    expect(await pay('4111111111111112', '01/20', '123')).toContain('required fields correctly');
  });

  it('TC-PAY-09 [REQ-07] [boundary] a two-digit CVV is refused', async () => {
    expect(await pay('4111111111111112', '12/28', '12')).toContain('required fields correctly');
  });

  it('TC-PAY-10 [REQ-07] [boundary] a five-digit CVV is refused', async () => {
    expect(await pay('4111111111111112', '12/28', '12345')).toContain('required fields correctly');
  });

  it('TC-PAY-11 [REQ-07] [boundary] a blank required field is refused', async () => {
    expect(await pay(null, null, null)).toContain('required fields correctly');
  });

  it('TC-PAY-12 [REQ-07] [security] the card number never reaches the browser URL', async () => {
    await pay();
    await browser.pause(1500);
    const url = await browser.getUrl();

    // The named inputs submit through GET, so ?card-number=4111111111111112 is written
    // into the address bar, history and any Referer header. Logged as defect CAT-SEC-002.
    expect(url).not.toContain('card-number');
  });

  it('TC-PAY-13 [REQ-07] [workflow] a successful payment shows an order confirmation', async () => {
    await pay();
    await browser.pause(1500);

    // Nothing is persisted and no confirmation page is reached. Logged as defect CAT-FUN-006.
    expect(await browser.getUrl()).toMatch(/orders\.html|tracking\.html/);
  });
});
