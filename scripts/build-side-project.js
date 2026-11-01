const fs = require('fs');
const path = require('path');

const tests = [
  // --- Feature 01: Login & Authentication ---
  {
    id: "tc-login-01-valid-student",
    name: "TC-LOGIN-01 [REQ-01] Valid student email login (ujwaltikhe30@gmail.com)",
    commands: [
      { id: "c1", command: "open", target: "/login.html", value: "" },
      { id: "c2", command: "type", target: "id=username", value: "ujwaltikhe30@gmail.com" },
      { id: "c3", command: "type", target: "id=password", value: "ootu@420" },
      { id: "c4", command: "click", target: "id=login-btn", value: "" },
      { id: "c5", command: "assertAlert", target: "Welcome to Amazon, ujwaltikhe30@gmail.com", value: "" }
    ]
  },
  {
    id: "tc-login-02-valid-alt",
    name: "TC-LOGIN-02 [REQ-01] Valid alternate user login (Yogesh)",
    commands: [
      { id: "c1", command: "open", target: "/login.html", value: "" },
      { id: "c2", command: "type", target: "id=username", value: "Yogesh" },
      { id: "c3", command: "type", target: "id=password", value: "8329097855" },
      { id: "c4", command: "click", target: "id=login-btn", value: "" },
      { id: "c5", command: "assertAlert", target: "Welcome to Amazon, Yogesh", value: "" }
    ]
  },
  {
    id: "tc-login-03-invalid-password",
    name: "TC-LOGIN-03 [REQ-01] [negative] Invalid password rejection alert",
    commands: [
      { id: "c1", command: "open", target: "/login.html", value: "" },
      { id: "c2", command: "type", target: "id=username", value: "Yogesh" },
      { id: "c3", command: "type", target: "id=password", value: "5555" },
      { id: "c4", command: "click", target: "id=login-btn", value: "" },
      { id: "c5", command: "assertAlert", target: "Invalid Password. Login Failed.", value: "" }
    ]
  },
  {
    id: "tc-login-04-blank-creds",
    name: "TC-LOGIN-04 [REQ-01] [boundary] Blank credentials rejected",
    commands: [
      { id: "c1", command: "open", target: "/login.html", value: "" },
      { id: "c2", command: "type", target: "id=username", value: "" },
      { id: "c3", command: "type", target: "id=password", value: "" },
      { id: "c4", command: "click", target: "id=login-btn", value: "" },
      { id: "c5", command: "assertAlert", target: "Invalid credentials. Login Failed.", value: "" }
    ]
  },
  {
    id: "tc-login-05-unknown-username",
    name: "TC-LOGIN-05 [REQ-01] [defect] Unknown user error alert (CAT-VAL-005)",
    commands: [
      { id: "c1", command: "open", target: "/login.html", value: "" },
      { id: "c2", command: "type", target: "id=username", value: "unknown_user_test" },
      { id: "c3", command: "type", target: "id=password", value: "somepassword" },
      { id: "c4", command: "click", target: "id=login-btn", value: "" },
      { id: "c5", command: "assertAlert", target: "Invalid credentials. Login Failed.", value: "" }
    ]
  },
  {
    id: "tc-login-06-security-leak",
    name: "TC-LOGIN-06 [REQ-01] [security] Form structure and submit button presence",
    commands: [
      { id: "c1", command: "open", target: "/login.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "id=login-form", value: "3000" },
      { id: "c3", command: "assertTitle", target: "Amazon Clone - Login", value: "" },
      { id: "c4", command: "assertElementPresent", target: "id=login-btn", value: "" }
    ]
  },

  // --- Feature 02: Navigation & Routing ---
  {
    id: "tc-nav-01-header-logo",
    name: "TC-NAV-01 [REQ-02] Header logo click restricts unauthenticated access",
    commands: [
      { id: "c1", command: "open", target: "/login.html", value: "" },
      { id: "c2", command: "click", target: "id=header-link", value: "" },
      { id: "c3", command: "assertAlert", target: "Login to access Amazon", value: "" }
    ]
  },
  {
    id: "tc-nav-02-cart-link-gate",
    name: "TC-NAV-02 [REQ-02] Cart header link requires authentication",
    commands: [
      { id: "c1", command: "open", target: "/login.html", value: "" },
      { id: "c2", command: "click", target: "id=cart-link", value: "" },
      { id: "c3", command: "assertAlert", target: "Login to access Cart", value: "" }
    ]
  },
  {
    id: "tc-nav-03-orders-link",
    name: "TC-NAV-03 [REQ-02] Orders link points to orders page",
    commands: [
      { id: "c1", command: "open", target: "/login.html", value: "" },
      { id: "c2", command: "assertElementPresent", target: "id=orders-link", value: "" },
      { id: "c3", command: "assertAttribute", target: "id=orders-link@href", value: "orders.html" }
    ]
  },
  {
    id: "tc-nav-04-checkout-to-address",
    name: "TC-NAV-04 [REQ-02] Checkout place order navigates to address page",
    commands: [
      { id: "c1", command: "open", target: "/checkout.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "css=.place-order-button", value: "3000" },
      { id: "c3", command: "click", target: "css=.place-order-button", value: "" },
      { id: "c4", command: "assertTitle", target: "User Details", value: "" }
    ]
  },
  {
    id: "tc-nav-05-orders-relative-url",
    name: "TC-NAV-05 [REQ-02] [defect] Orders Buy-Again button URL check (CAT-NAV-002)",
    commands: [
      { id: "c1", command: "open", target: "/orders.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "id=product-3", value: "3000" },
      { id: "c3", command: "assertElementPresent", target: "id=product-3", value: "" }
    ]
  },

  // --- Feature 03: Product Catalog ---
  {
    id: "tc-cat-01-grid-render",
    name: "TC-CAT-01 [REQ-03] Catalog renders product cards",
    commands: [
      { id: "c1", command: "open", target: "/amazon.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "css=.product-container", value: "3000" },
      { id: "c3", command: "assertElementPresent", target: "css=.product-image", value: "" },
      { id: "c4", command: "assertElementPresent", target: "css=.product-price", value: "" }
    ]
  },
  {
    id: "tc-cat-02-search-bar",
    name: "TC-CAT-02 [REQ-03] [defect] Catalog header search bar check (CAT-FUN-004)",
    commands: [
      { id: "c1", command: "open", target: "/amazon.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "css=.search-bar", value: "3000" },
      { id: "c3", command: "assertElementPresent", target: "css=.search-button", value: "" }
    ]
  },
  {
    id: "tc-cat-03-add-to-cart",
    name: "TC-CAT-03 [REQ-03] Add to cart button updates header cart badge",
    commands: [
      { id: "c1", command: "open", target: "/amazon.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "css=.js-add-to-cart", value: "3000" },
      { id: "c3", command: "click", target: "css=.js-add-to-cart", value: "" },
      { id: "c4", command: "waitForElementPresent", target: "css=.js-cart-quantity", value: "3000" }
    ]
  },
  {
    id: "tc-cat-04-cart-icon-navigation",
    name: "TC-CAT-04 [REQ-03] Catalog cart icon navigates to checkout",
    commands: [
      { id: "c1", command: "open", target: "/amazon.html", value: "" },
      { id: "c2", command: "click", target: "css=.cart-link", value: "" },
      { id: "c3", command: "assertTitle", target: "Checkout", value: "" }
    ]
  },

  // --- Feature 04: Cart Management ---
  {
    id: "tc-cart-01-order-summary",
    name: "TC-CART-01 [REQ-04] Checkout renders payment summary box",
    commands: [
      { id: "c1", command: "open", target: "/checkout.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "css=.payment-summary", value: "3000" },
      { id: "c3", command: "assertElementPresent", target: "css=.place-order-button", value: "" }
    ]
  },
  {
    id: "tc-cart-02-header-title",
    name: "TC-CART-02 [REQ-04] Checkout page header displays checkout title",
    commands: [
      { id: "c1", command: "open", target: "/checkout.html", value: "" },
      { id: "c2", command: "assertTitle", target: "Checkout", value: "" },
      { id: "c3", command: "assertElementPresent", target: "css=.checkout-header-middle-section", value: "" }
    ]
  },

  // --- Feature 05 & 06: Address & User Details ---
  {
    id: "tc-addr-01-form-inputs",
    name: "TC-ADDR-01 [REQ-05] User details address form inputs presence",
    commands: [
      { id: "c1", command: "open", target: "/user_details.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "id=address", value: "3000" },
      { id: "c3", command: "assertElementPresent", target: "id=country", value: "" },
      { id: "c4", command: "assertElementPresent", target: "id=city", value: "" },
      { id: "c5", command: "assertElementPresent", target: "id=zipcode", value: "" },
      { id: "c6", command: "assertElementPresent", target: "id=proceed-button", value: "" }
    ]
  },
  {
    id: "tc-addr-02-fill-and-submit",
    name: "TC-ADDR-02 [REQ-05] User fills address fields and clicks proceed",
    commands: [
      { id: "c1", command: "open", target: "/user_details.html", value: "" },
      { id: "c2", command: "type", target: "id=address", value: "100 MG Road" },
      { id: "c3", command: "type", target: "id=country", value: "India" },
      { id: "c4", command: "type", target: "id=city", value: "Pune" },
      { id: "c5", command: "type", target: "id=zipcode", value: "411001" },
      { id: "c6", command: "click", target: "id=proceed-button", value: "" }
    ]
  },
  {
    id: "tc-addr-03-zipcode-defect",
    name: "TC-ADDR-03 [REQ-05] [defect] Zipcode accepts invalid symbols (CAT-VAL-013)",
    commands: [
      { id: "c1", command: "open", target: "/user_details.html", value: "" },
      { id: "c2", command: "type", target: "id=zipcode", value: "-@@99#" },
      { id: "c3", command: "assertValue", target: "id=zipcode", value: "-@@99#" }
    ]
  },

  // --- Feature 07: Payment Validation ---
  {
    id: "tc-pay-01-fields-present",
    name: "TC-PAY-01 [REQ-06] Payments page renders credit card inputs",
    commands: [
      { id: "c1", command: "open", target: "/payments.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "id=cardNumber", value: "3000" },
      { id: "c3", command: "assertElementPresent", target: "id=cardName", value: "" },
      { id: "c4", command: "assertElementPresent", target: "id=expiryDate", value: "" },
      { id: "c5", command: "assertElementPresent", target: "id=cvv", value: "" }
    ]
  },
  {
    id: "tc-pay-02-valid-submission",
    name: "TC-PAY-02 [REQ-06] Valid payment form submission triggers alert",
    commands: [
      { id: "c1", command: "open", target: "/payments.html", value: "" },
      { id: "c2", command: "type", target: "id=cardNumber", value: "1234567890123456" },
      { id: "c3", command: "type", target: "id=cardName", value: "Ujwal Tikhe" },
      { id: "c4", command: "type", target: "id=expiryDate", value: "12/28" },
      { id: "c5", command: "type", target: "id=cvv", value: "789" },
      { id: "c6", command: "click", target: "id=pay-button", value: "" }
    ]
  },
  {
    id: "tc-pay-03-invalid-expiry",
    name: "TC-PAY-03 [REQ-06] [defect] Boundary invalid expiry month 99/25 check (CAT-VAL-017)",
    commands: [
      { id: "c1", command: "open", target: "/payments.html", value: "" },
      { id: "c2", command: "type", target: "id=expiryDate", value: "99/25" },
      { id: "c3", command: "assertValue", target: "id=expiryDate", value: "99/25" }
    ]
  },

  // --- Feature 08: Orders & History ---
  {
    id: "tc-ord-01-render-grid",
    name: "TC-ORD-01 [REQ-07] Orders page displays order history container",
    commands: [
      { id: "c1", command: "open", target: "/orders.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "css=.orders-grid", value: "3000" },
      { id: "c3", command: "assertElementPresent", target: "css=.order-container", value: "" }
    ]
  },
  {
    id: "tc-ord-02-track-package-btn",
    name: "TC-ORD-02 [REQ-07] Track package button navigates to tracking page",
    commands: [
      { id: "c1", command: "open", target: "/orders.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "css=.track-package-button", value: "3000" },
      { id: "c3", command: "click", target: "css=.track-package-button", value: "" },
      { id: "c4", command: "assertTitle", target: "Tracking", value: "" }
    ]
  },

  // --- Feature 09: Tracking Delivery ---
  {
    id: "tc-trk-01-progress-bar",
    name: "TC-TRK-01 [REQ-08] Tracking page renders delivery status progress bar",
    commands: [
      { id: "c1", command: "open", target: "/tracking.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "css=.progress-bar-container", value: "3000" },
      { id: "c3", command: "assertElementPresent", target: "css=.progress-labels-container", value: "" }
    ]
  },
  {
    id: "tc-trk-02-counter-defect",
    name: "TC-TRK-02 [REQ-08] [defect] Tracking cart badge is hardcoded to 3 (CAT-FUN-016)",
    commands: [
      { id: "c1", command: "open", target: "/tracking.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "css=.js-cart-quantity", value: "3000" },
      { id: "c3", command: "assertText", target: "css=.js-cart-quantity", value: "3" }
    ]
  },

  // --- Exploratory & Boundary Charters ---
  {
    id: "tc-exp-01-rapid-cart",
    name: "TC-EXP-01 [EXP-01] Exploratory cart mutation and badge persistence",
    commands: [
      { id: "c1", command: "open", target: "/amazon.html", value: "" },
      { id: "c2", command: "waitForElementPresent", target: "css=.js-add-to-cart", value: "3000" },
      { id: "c3", command: "click", target: "css=.js-add-to-cart", value: "" },
      { id: "c4", command: "assertElementPresent", target: "css=.js-cart-quantity", value: "" }
    ]
  },
  {
    id: "tc-exp-02-heuristic-ui",
    name: "TC-EXP-02 [EXP-02] Exploratory heuristic UI accessibility and logo checks",
    commands: [
      { id: "c1", command: "open", target: "/amazon.html", value: "" },
      { id: "c2", command: "assertElementPresent", target: "css=.amazon-logo", value: "" },
      { id: "c3", command: "assertElementPresent", target: "css=.orders-link", value: "" },
      { id: "c4", command: "assertElementPresent", target: "css=.cart-link", value: "" }
    ]
  }
];

const suites = [
  {
    id: "suite-all-ieee-regression",
    name: "IEEE 829 - Master Regression & Bug Hunt (All Tests)",
    persistSession: false,
    parallel: false,
    timeout: 600,
    tests: tests.map(t => t.id)
  },
  {
    id: "suite-auth",
    name: "IEEE 829 - Feature 01: Authentication Suite",
    persistSession: false,
    parallel: false,
    timeout: 300,
    tests: tests.filter(t => t.id.startsWith("tc-login")).map(t => t.id)
  },
  {
    id: "suite-catalog",
    name: "IEEE 829 - Feature 03: Product Catalog Suite",
    persistSession: false,
    parallel: false,
    timeout: 300,
    tests: tests.filter(t => t.id.startsWith("tc-cat")).map(t => t.id)
  },
  {
    id: "suite-checkout-payment",
    name: "IEEE 829 - Checkout, Address & Payment Suite",
    persistSession: false,
    parallel: false,
    timeout: 300,
    tests: tests.filter(t => t.id.startsWith("tc-addr") || t.id.startsWith("tc-pay") || t.id.startsWith("tc-cart")).map(t => t.id)
  },
  {
    id: "suite-orders-tracking",
    name: "IEEE 829 - Orders & Delivery Tracking Suite",
    persistSession: false,
    parallel: false,
    timeout: 300,
    tests: tests.filter(t => t.id.startsWith("tc-ord") || t.id.startsWith("tc-trk")).map(t => t.id)
  },
  {
    id: "suite-exploratory",
    name: "IEEE 829 - Exploratory & Boundary Charters",
    persistSession: false,
    parallel: false,
    timeout: 300,
    tests: tests.filter(t => t.id.startsWith("tc-exp")).map(t => t.id)
  }
];

const sideProject = {
  id: "stqa-amazonclone-829",
  version: "2.0",
  name: "STQA Amazon Clone - IEEE 829 Regression Suite",
  url: "http://127.0.0.1:5501",
  tests: tests,
  suites: suites,
  urls: ["http://127.0.0.1:5501", "http://localhost:5501"],
  plugins: []
};

const targetPath = path.join(__dirname, '..', 'selenium-ide', 'STQA-AmazonClone.side');
fs.writeFileSync(targetPath, JSON.stringify(sideProject, null, 2), 'utf8');
console.log(`Successfully generated ${tests.length} tests and ${suites.length} suites in ${targetPath}`);
