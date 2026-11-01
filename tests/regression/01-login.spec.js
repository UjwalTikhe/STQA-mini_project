const { VALID_USERS, alerts, lastAlert, pageSource, submitLoginForm, typeInto, visit } = require('../helpers/session');

/**
 * REQ-01 User Authentication — ordered regression script 01.
 * The application gate. Every later script builds on these results.
 */
describe('Feature 01 - Login & Authentication', () => {
  it('TC-LOGIN-01 [REQ-01] [functional] registered username is accepted and redirects to the catalog', async () => {
    const message = await submitLoginForm(VALID_USERS[0].username, VALID_USERS[0].password);
    await browser.waitUntil(async () => (await browser.getUrl()).includes('amazon.html'), {
      timeout: 10000,
      timeoutMsg: 'No redirect to the catalog page',
    });

    expect(message).toContain('Welcome to Amazon');
    expect(await browser.getUrl()).toContain('amazon.html');
  });

  it('TC-LOGIN-02 [REQ-01] [functional] registered email identity is accepted and redirects to the catalog', async () => {
    const user = VALID_USERS[1];
    const message = await submitLoginForm(user.username, user.password);
    await browser.waitUntil(async () => (await browser.getUrl()).includes('amazon.html'), {
      timeout: 10000,
      timeoutMsg: 'No redirect to the catalog page',
    });

    expect(message).toContain(user.username);
    expect(await browser.getUrl()).toContain('amazon.html');
  });

  it('TC-LOGIN-03 [REQ-01] [negative] unknown username with unknown password is rejected', async () => {
    const message = await submitLoginForm('stranger', 'wrongpass');

    expect(message).toContain('Invalid credentials');
    expect(await browser.getUrl()).toContain('login.html');
  });

  it('TC-LOGIN-04 [REQ-01] [negative] blank username and blank password cannot authenticate', async () => {
    const message = await submitLoginForm('', '');

    expect(message).not.toContain('Welcome');
    expect(await browser.getUrl()).toContain('login.html');
  });

  it('TC-LOGIN-05 [REQ-01] [negative] correct password with unknown username reports the username as the problem', async () => {
    const message = await submitLoginForm('nobody', '5555');

    // login.html tests the password before the username, so an unknown account is
    // reported as a password fault. Logged as defect CAT-VAL-005.
    expect(message).toContain('Invalid Username');
  });

  it('TC-LOGIN-06 [REQ-01] [security] quote-based injection payload in the username field is rejected', async () => {
    const message = await submitLoginForm("' or 1=1 --", "anything' OR 'x'='x");

    expect(message).toContain('Invalid');
    expect(await browser.getUrl()).toContain('login.html');
  });

  it('TC-LOGIN-07 [REQ-01] [functional] password field masks its input', async () => {
    await visit('login');

    expect(await $('#password').getAttribute('type')).toBe('password');
  });

  it('TC-LOGIN-08 [REQ-01] [functional] cart link is guarded for an anonymous visitor', async () => {
    await visit('login');
    await $('#cart-link').click();

    expect(await lastAlert()).toContain('Login to access Cart');
  });

  it('TC-LOGIN-09 [REQ-01] [negative] three failed attempts in sequence all stay unauthenticated', async () => {
    await visit('login');
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await typeInto('#username', 'attacker' + attempt);
      await typeInto('#password', 'guess' + attempt);
      await $('#login-btn').click();
      await browser.pause(200);
    }

    const captured = await alerts();
    expect(captured).toHaveLength(3);
    expect(captured.every((message) => message.includes('Invalid'))).toBe(true);
    expect(await browser.getUrl()).toContain('login.html');
  });

  it('TC-LOGIN-10 [REQ-01] [security] login page source does not embed any credential secret', async () => {
    await visit('login');
    const source = await pageSource();

    // Credentials are hard-coded in the inline script of login.html.
    // Logged as defect CAT-SEC-001.
    expect(source).not.toContain('8329097855');
  });
});
