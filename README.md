# Software Testing & Quality Assurance (STQA) Mini Project
**Automated Regression Testing & Bug Identification of an E-Commerce Web Application (Amazon Clone)**
*Semester 7 — Computer Engineering*

---

## Project Overview

This repository contains a small web-based application (a multi-page **Amazon Clone**) together with a
complete quality-assurance layer built for it: an IEEE-829 style **Test Plan & Bug Taxonomy**, an
ordered **regression suite**, **Selenium IDE** recordings, an **exploratory testing** session, and an
automated **test report** generator.

The application is plain HTML/CSS/JavaScript served by a Node.js HTTP server. Testing is automated
with **WebdriverIO v10** driving **ChromeDriver** (the Selenium WebDriver API), plus a
**Selenium IDE** `.side` project for record-and-playback coverage.

---

## Mapping to the Assignment Statement

| Assignment requirement | Where it is satisfied |
| --- | --- |
| *Create a small web-based application (environment / platform / languages)* | The Amazon Clone app: [`amazon.html`](./amazon.html), [`login.html`](./login.html), [`checkout.html`](./checkout.html), [`orders.html`](./orders.html), [`payments.html`](./payments.html), [`tracking.html`](./tracking.html), [`user_details.html`](./user_details.html) served by [`server.js`](./server.js). Node.js + HTML5/CSS3/ES6. |
| *Narrate a concise Test Plan (features to be tested) and bug taxonomy* | [`docs/TEST_PLAN_AND_BUG_TAXONOMY.md`](./docs/TEST_PLAN_AND_BUG_TAXONOMY.md) — IEEE-829 aligned plan, 5-category / 4-severity / 4-priority taxonomy, RTM, exploratory charter. Machine-readable defect register: [`docs/defects.json`](./docs/defects.json). |
| *Narrate scripts to perform regression tests* | Ordered WebdriverIO regression specs in [`tests/regression/`](./tests/regression) (TC-LOGIN, TC-NAV, TC-CAT, TC-CART, TC-SUM, TC-ADR, TC-PAY, TC-ORD/TRK, TC-SEC). Original hand-written `selenium-webdriver` scripts preserved in [`tests/legacy/`](./tests/legacy). |
| *Identify bugs using Selenium WebDriver and IDE* | WebDriver: the regression suite (`npm test`). IDE: [`selenium-ide/STQA-AmazonClone.side`](./selenium-ide/STQA-AmazonClone.side) — see [`selenium-ide/README.md`](./selenium-ide/README.md). |
| *Generate test reports encompassing exploratory testing* | [`scripts/generate-report.js`](./scripts/generate-report.js) produces `reports/test-report.html`, `reports/results.json`, `reports/rtm.csv` and JUnit XML. Exploratory sessions in [`tests/exploratory/`](./tests/exploratory) record findings into `reports/findings.json`, rendered in the report. |

---

## System Environment & Technologies

- **Operating System:** Windows 10/11 x64 (also runs on macOS/Linux)
- **Runtime:** Node.js v18+ & npm
- **Automation:** WebdriverIO v10 + `@wdio/mocha-framework`, driving Chrome via ChromeDriver (Selenium WebDriver API)
- **Record & playback:** Selenium IDE browser extension (`.side` project)
- **Frontend:** HTML5, CSS3, JavaScript (ES6 modules)
- **Application server:** Node.js HTTP server at `http://127.0.0.1:5501/`

---

## Repository Structure

```
STQA mini/
├── amazon.html / login.html / checkout.html / orders.html
├── payments.html / tracking.html / user_details.html   # the application under test
├── server.js                        # local HTTP server (port 5501, override with PORT)
├── wdio.conf.js                     # WebdriverIO runner configuration
├── package.json                     # dependencies & npm scripts
├── backend/  data/  scripts/  styles/  products/  images/   # app assets & logic
├── docs/
│   ├── TEST_PLAN_AND_BUG_TAXONOMY.md   # IEEE-829 test plan + bug taxonomy + RTM + charter
│   ├── defects.json                    # machine-readable defect register (22 defects)
│   └── PRACTICAL_STEPS.md              # step-by-step runbook for the practical
├── selenium-ide/
│   ├── STQA-AmazonClone.side           # Selenium IDE project (import into the extension)
│   └── README.md                       # how to import & run the IDE suite
├── tests/
│   ├── regression/                     # ordered WebdriverIO regression specs (authoritative)
│   ├── exploratory/                    # session-based exploratory tours (EXP-01, EXP-02)
│   ├── helpers/                        # launcher, session, findings helpers
│   └── legacy/                         # original selenium-webdriver scripts + run-legacy.js
├── scripts/generate-report.js          # HTML/JSON/CSV/JUnit report generator
└── reports/                            # generated output (test-report.html, results.json, ...)
```

---

## Getting Started

Full detail lives in [`docs/PRACTICAL_STEPS.md`](./docs/PRACTICAL_STEPS.md). The short version:

```bash
# 1. install dependencies (WebdriverIO + matching ChromeDriver)
npm install

# 2. run the full regression + exploratory suite, then build the report
npm test

# 3. open the generated report
#    reports/test-report.html
```

Other useful commands:

```bash
npm run test:headed     # same suite in a visible browser window
npm run report          # rebuild the report from the latest run
npm start               # just serve the app on http://127.0.0.1:5501
npm run test:legacy     # run the original selenium-webdriver scripts (headed)
```

The runner starts the app server and ChromeDriver automatically, reuses them if they are already
listening, and shuts them down afterwards — you do not need to launch anything by hand.

---

## Test Reports & Verdict Semantics

`reports/test-report.html` summarises every scripted test and exploratory finding. Each test asserts
the **required** behaviour, so a test that fails is evidence of a defect. Failures are classified:

- **PASS** — required behaviour observed.
- **FAIL-DEFECT** — failure maps to a known defect in `docs/defects.json` (a confirmed bug).
- **FAIL-NEW** — failure with no known mapping (a regression or new issue to triage).

> **Native dialogs:** ChromeDriver auto-dismisses `window.alert` in headless mode, so the suite stubs
> `window.alert` into `sessionStorage` to capture messages. The Selenium IDE runs a real headed
> browser and captures the genuine dialog with `assertConfirmation`. This limitation is noted in the
> report.

---

## Test Execution Highlights

| 1. Authentication Portal | 2. Product Catalog & Cart Counter |
| :---: | :---: |
| ![Login Page](./screenshots/01_login_page.png) | ![Catalog](./screenshots/03_homepage_catalog.png) |
| **3. Order Review & Checkout** | **4. Payment Gateway Form** |
| ![Checkout](./screenshots/05_checkout_page.png) | ![Payments](./screenshots/07_payments_page.png) |
| **5. Shipping Address Form** | **6. Shipment Status & Tracking** |
| ![Address](./screenshots/06_user_details_address.png) | ![Tracking](./screenshots/09_tracking_page.png) |

---

## Bug Taxonomy & Defects Identified

The defect register ([`docs/defects.json`](./docs/defects.json)) classifies 22 defects across the
categories Security (`CAT-SEC`), Validation (`CAT-VAL`), Navigation (`CAT-NAV`), Functional
(`CAT-FUN`), Monetary (`CAT-MON`) and Usability (`CAT-UX`), on a four-tier severity scale (S1
Blocker → S4 Minor). Examples:

- **CAT-SEC-001 (S1):** client-side-only authentication; protected pages reachable without a session.
- **CAT-SEC-002 (S2):** full card number (PAN) leaks into the browser URL after payment.
- **CAT-NAV-002 (S2):** `orders.html` hard-codes `http://127.0.0.1:5501/...`, breaking any other host/port.
- **CAT-VAL-003 (S2):** permissive expiry-month regex accepts invalid dates such as `99/99`.
- **CAT-FUN-006 (S2):** the address step never advances to payment; the buyer is stranded.

Full descriptions, reproduction steps and root-cause analysis are in
[`docs/TEST_PLAN_AND_BUG_TAXONOMY.md`](./docs/TEST_PLAN_AND_BUG_TAXONOMY.md) and `docs/defects.json`.

---

## References & Acknowledgements
- [Selenium WebDriver Documentation](https://www.selenium.dev/documentation/webdriver/)
- [WebdriverIO Documentation](https://webdriver.io/)
- [Selenium IDE](https://www.selenium.dev/selenium-ide/)
- [ChromeDriver Chromium Guide](https://chromedriver.chromium.org/getting-started)
- Frontend design inspired by the SuperSimpleDev JavaScript curriculum.
