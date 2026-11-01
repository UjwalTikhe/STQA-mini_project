# tests/ — Selenium WebDriver Test Code (the important part)

This folder is the heart of the assignment: the **Selenium WebDriver** automation that identifies the
bugs. Everything else in the repo (the HTML app, the docs, the report generator) supports what lives
here.

```
tests/
├── regression/     ★ THE TEST CASES — 80 ordered WebdriverIO specs (TC-*). Start here.
├── exploratory/    ★ exploratory testing tours (EXP-*) that record findings for the report
├── helpers/        shared WebDriver plumbing (launcher, session, findings)
└── legacy/         original hand-written selenium-webdriver scripts (historical evidence)
```

The runner config that drives all of it is [`../wdio.conf.js`](../wdio.conf.js) (WebdriverIO v10 →
ChromeDriver → Chrome, i.e. the Selenium WebDriver API).

---

## ★ regression/ — the test cases, in execution order

Each file is one feature. They run in numeric order because later features depend on earlier ones
(login → navigate → catalog → cart → summary → address → payment → orders → security).

| # | File | Feature (Req) | Tests | Test IDs |
| :-: | :-- | :-- | :-: | :-- |
| 01 | [`01-login.spec.js`](./regression/01-login.spec.js) | Login & Authentication (REQ-01) | 10 | TC-LOGIN-01 … 10 |
| 02 | [`02-navigation.spec.js`](./regression/02-navigation.spec.js) | Navigation & Routing (REQ-02) | 10 | TC-NAV-01 … 10 |
| 03 | [`03-catalog.spec.js`](./regression/03-catalog.spec.js) | Product Catalog (REQ-03) | 9 | TC-CAT-01 … 09 |
| 04 | [`04-cart.spec.js`](./regression/04-cart.spec.js) | Cart / Checkout (REQ-04) | 8 | TC-CART-01 … 08 |
| 05 | [`05-order-summary.spec.js`](./regression/05-order-summary.spec.js) | Order Summary (REQ-05) | 8 | TC-SUM-01 … 08 |
| 06 | [`06-address.spec.js`](./regression/06-address.spec.js) | Shipping Address (REQ-06) | 9 | TC-ADR-01 … 09 |
| 07 | [`07-payment.spec.js`](./regression/07-payment.spec.js) | Payment Card (REQ-07) | 13 | TC-PAY-01 … 13 |
| 08 | [`08-orders-tracking.spec.js`](./regression/08-orders-tracking.spec.js) | Orders & Tracking (REQ-08) | 8 | TC-ORD-01…05, TC-TRK-01…03 |
| 09 | [`09-security.spec.js`](./regression/09-security.spec.js) | Security & Access (REQ-09) | 10 | TC-SEC-01 … 10 |

**Total: 80 regression test cases.**

### Reading a test title
Every test is named `TC-XXX-nn [REQ-nn] [type] description`, e.g.

```
TC-PAY-12 [REQ-07] [security] the card number never reaches the browser URL
```

- `TC-PAY-12` — test-case id (payment feature, #12)
- `[REQ-07]` — the requirement it traces to (used to build the RTM)
- `[security]` — test type (functional / negative / security / boundary / data / workflow / usability / portability / regression)
- the rest — plain-English intent

### Which test finds which bug
A test asserts the **correct** behaviour, so a *failing* test is the bug. These are the failures that
map to a confirmed defect in [`../docs/defects.json`](../docs/defects.json):

| Test | Defect | Sev | What it proves |
| :-- | :-- | :-: | :-- |
| TC-SEC-01…07 | CAT-SEC-001 | S1 | Buyer pages are served to anonymous visitors — no session guard. |
| TC-PAY-12 | CAT-SEC-002 | S1 | Full card number leaks into the browser URL. |
| TC-LOGIN-10 | CAT-SEC-003 | S2 | Credentials are hard-coded in client-side source. |
| TC-SEC-08 | CAT-SEC-004 | S3 | Numeric-only password accepted against policy. |
| TC-PAY-06/07/08 | CAT-VAL-003 | S2 | Expiry validation accepts impossible/past dates. |
| TC-LOGIN-05 | CAT-VAL-005 | S3 | Failure message blames the wrong field. |
| TC-ADR-05/06/07 | CAT-VAL-013 | S3 | Zipcode accepts any character/length. |
| TC-PAY-05 | CAT-VAL-014 | S3 | Card number accepted with no checksum. |
| TC-NAV-09 | CAT-NAV-002 | S2 | Host:port hard-coded in an onclick handler. |
| TC-CAT-06/07 | CAT-FUN-004 | S2 | Header search disabled / unimplemented. |
| TC-NAV-08, TC-ADR-08, TC-PAY-13 | CAT-FUN-006 | S2 | Successful submissions dead-end instead of advancing. |
| TC-CAT-05 | CAT-FUN-007 | S2 | Quantity selector ignored on add-to-cart. |
| TC-CAT-08 | CAT-FUN-008 | S2 | Product detail page loads a missing script (404). |
| TC-CART-03/04 | CAT-FUN-009 | S3 | Checkout header counter never synchronised. |
| TC-CART-07 | CAT-FUN-010 | S3 | Delivery-option radios have no effect. |
| TC-SUM-06/07 | CAT-FUN-011 | S2 | Order summary panel is static markup. |
| TC-ORD-03 | CAT-FUN-015 | S3 | Buy-it-again buttons inert / misrouted. |
| TC-TRK-02 | CAT-FUN-016 | S4 | Tracking page hard-codes the cart counter. |
| TC-CAT-09 | CAT-FUN-017 | S3 | Catalogue header counter not synced on page load. |
| TC-SUM-08 | CAT-MON-012 | S2 | Shipping charge contradicts the delivery option. |
| TC-NAV-07 | CAT-UX-006 | S4 | Login logo anchor not keyboard-reachable. |
| TC-CART-06 | CAT-UX-011 | S3 | Empty cart renders a blank review page. |

---

## ★ exploratory/ — session-based tours (REQ-10)

| File | Charter | Steps |
| :-- | :-- | :-: |
| [`EXP-01-checkout-tour.spec.js`](./exploratory/EXP-01-checkout-tour.spec.js) | Checkout & payment journey: rapid multi-click, empty-cart ordering, back/forward across payment, end-to-end purchase | 4 |
| [`EXP-02-data-security-tour.spec.js`](./exploratory/EXP-02-data-security-tour.spec.js) | Data & access control: symbolic zipcode, reflected-input escaping, direct URL access, client-side cart tampering | 4 |

These do not assert a fixed pass/fail contract. Each step *tours* the app and writes what it observed
into `reports/findings.json` via `helpers/findings.js`; the report renders them in the exploratory
findings table.

---

## helpers/ — shared WebDriver plumbing

| File | Role |
| :-- | :-- |
| [`launcher.js`](./helpers/launcher.js) | Finds ChromeDriver, starts/reuses the app server (5501) and ChromeDriver (9515), tears them down. |
| [`session.js`](./helpers/session.js) | Login, navigation, dialog capture, cart seeding, and the page-marker waits every spec relies on. |
| [`findings.js`](./helpers/findings.js) | Read/write `reports/findings.json` for the exploratory sessions. |

---

## legacy/ — original selenium-webdriver scripts (historical)

The 29 hand-written `selenium-webdriver` programs that predate the WebdriverIO suite, kept as evidence
of the manual automation work. They open a **real headed Chrome** and hard-code port 5501. Run them
with `npm run test:legacy` (see [`legacy/run-legacy.js`](./legacy/run-legacy.js)). They are **not**
part of the authoritative report — that comes from `regression/` + `exploratory/`.

---

## How to run

From the repository root:

```bash
npm install     # once
npm test        # regression + exploratory, then builds reports/test-report.html
```

Full runbook (prereqs, headed mode, IDE, troubleshooting): [`../docs/PRACTICAL_STEPS.md`](../docs/PRACTICAL_STEPS.md).
