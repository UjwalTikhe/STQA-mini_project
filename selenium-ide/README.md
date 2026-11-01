# Selenium IDE Project — STQA Amazon Clone

`STQA-AmazonClone.side` is a [Selenium IDE](https://www.selenium.dev/selenium-ide/) project that
mirrors the key regression flows from the WebdriverIO suite in a record-and-playback form.
Selenium IDE is the "Selenium **IDE**" half of the assignment; the WebdriverIO suite under
`tests/regression/` is the "Selenium **WebDriver**" half.

## What is inside

One suite — **Full Regression (bug hunt)** — with seven tests. Tests whose title mentions *bug*
assert the **correct/expected** behaviour, so they **FAIL on purpose** and prove the defect is real
in the IDE exactly as it is in the WebDriver suite.

| Test ID | Maps to | Purpose |
| --- | --- | --- |
| `tc-login-valid` | TC-LOGIN-01 | Valid credentials reach the catalog (passes). |
| `tc-login-invalid` | TC-LOGIN-04 / CAT-VAL-005 | Wrong password is rejected — message names the wrong field (fails = bug). |
| `tc-catalog-add` | TC-CART-01 / CAT-FUN-009 | Add to cart updates the header counter. |
| `tc-checkout-route` | TC-NAV-04 | Place order routes to the address step (passes). |
| `tc-address-workflow` | TC-NAV-08 / CAT-FUN-006, CAT-VAL-013 | Address submit should continue to payment — it does not (fails = bug). |
| `tc-orders-hardcode` | TC-NAV-09 / CAT-NAV-002 | Orders "Buy it again" must not hard-code host:port (fails = bug). |
| `tc-tracking-counter` | TC-TRK-02 / CAT-FUN-016 | Tracking header counter must match the real cart — it is hard-coded (fails = bug). |

## Prerequisites

1. **Google Chrome** (or Firefox) installed.
2. The **Selenium IDE** browser extension:
   - Chrome Web Store → search "Selenium IDE" → *Add to Chrome*, **or**
   - Firefox Add-ons → search "Selenium IDE" → *Add to Firefox*.
3. The app server running. From the repository root:

   ```bash
   npm install
   npm start          # serves the app on http://127.0.0.1:5501
   ```

   Leave `npm start` running in its own terminal while you use the IDE.

## Import and run

1. Click the Selenium IDE extension icon → **Open an existing project**.
2. Select `selenium-ide/STQA-AmazonClone.side`.
3. Set the project **Base URL** (top of the left panel) to `http://127.0.0.1:5501`.
   - If you started the server on a different port, change the base URL to match. All `open`
     commands use relative paths, so only the base URL needs editing.
4. Run a single test: select it in the left panel → **Run test** (▶).
5. Run everything: right-click the **Full Regression (bug hunt)** suite → **Run all tests in suite**.
6. Results appear per-command with green (pass) / red (fail). Red on the intentional-bug tests is
   the expected outcome — the assertion is the "correct" behaviour the app violates.

## Exporting to WebDriver code

Selenium IDE can export any test to a runnable script: right-click the test → **Export** →
choose **JavaScript (Mocha)**, **Python (pytest)**, or **Java (JUnit 4)**. This is useful to show
the examiner that the IDE recording and the hand-written WebdriverIO suite describe the same flows.

## Notes and limitations

- **Native alerts:** login and address validation use `window.alert`. Selenium IDE reads these with
  `assertConfirmation`. The headless WebdriverIO suite cannot read native alerts (ChromeDriver
  auto-dismisses them), so it stubs `window.alert` into `sessionStorage` instead — see the note in
  `reports/test-report.html`. The IDE, running a real headed browser, captures the genuine dialog.
- **Hard-coded port:** if the base URL port and `orders.html`'s absolute `127.0.0.1:5501` URL
  disagree, `tc-orders-hardcode` demonstrates exactly that breakage (CAT-NAV-002).
- The `.side` file is plain JSON — you can diff it, version it, and open it in any text editor.
