# Practical Runbook — STQA Mini Project

Step-by-step instructions to run the complete practical: the WebdriverIO regression suite, the
exploratory sessions, the report generator, and the Selenium IDE project. Follow the sections in
order. Every command is run from the repository root (`D:\Assignments\STQA mini`).

---

## 0. Prerequisites (one-time)

1. **Node.js v18 or newer** and **npm**. Check with:
   ```bash
   node -v      # expect v18.x or higher
   npm -v
   ```
2. **Google Chrome** installed (the suite drives Chrome through ChromeDriver).
3. **ChromeDriver must match your Chrome major version.** The project pins `chromedriver@^156`
   (Chrome 156). To check your Chrome version: open Chrome → `chrome://version` → note the first
   number. If it is not 156, install the matching driver before running:
   ```bash
   npm install --save-dev chromedriver@<your-chrome-major>
   ```
   A mismatch produces `session not created: This version of ChromeDriver only supports Chrome version NN`.
4. **Selenium IDE** browser extension (only for the IDE portion, section 5):
   Chrome Web Store or Firefox Add-ons → search "Selenium IDE" → install.

---

## 1. Install dependencies

```bash
npm install
```

This installs WebdriverIO v10, the Mocha framework, the reporters, and the matching ChromeDriver
binary into `node_modules/chromedriver/`.

---

## 2. Run the full automated suite (WebDriver)

```bash
npm test
```

What happens automatically — you do **not** start anything by hand:

1. The runner starts the app server on **port 5501** (reuses it if already listening).
2. It starts **ChromeDriver on port 9515** (reuses it if already listening).
3. It launches **headless Chrome** with a unique temporary profile (so no "Who's using Chrome?"
   picker appears) and runs, in order:
   - `tests/regression/01..09-*.spec.js` — the ordered regression suite.
   - `tests/exploratory/EXP-01..02-*.spec.js` — the exploratory tours.
4. On failure it saves a screenshot to `reports/artifacts/<test-title>.fail.png`.
5. It shuts the server and ChromeDriver down and deletes the temporary profile.
6. `npm test` then chains `npm run report` to build the HTML report.

A typical run takes a couple of minutes. Console output shows a per-spec pass/fail line.

### Run it in a visible browser (optional, good for the viva demo)

```bash
npm run test:headed
```

Same suite, but Chrome windows are visible so you can watch the flows execute.

---

## 3. Read the generated report

After the run, these files exist under `reports/`:

| File | What it is |
| --- | --- |
| `reports/test-report.html` | The main deliverable — open it in a browser. Summary cards, per-requirement tables, defect cards, exploratory findings, artifact links. |
| `reports/results.json` | Machine-readable results (every test, its verdict, mapped defects). |
| `reports/rtm.csv` | Requirements Traceability Matrix (open in Excel). |
| `reports/findings.json` | Exploratory session findings. |
| `reports/raw/junit.xml` | JUnit XML (for CI tools). |
| `reports/raw/processes.log` | Server + ChromeDriver stdout/stderr for debugging. |
| `reports/artifacts/*.fail.png` | Screenshots captured at each failure. |

Open the report:
```bash
start reports\test-report.html      # Windows
# or just double-click the file in Explorer
```

### Verdict semantics (important for explaining results)

Every test asserts the **required/correct** behaviour. Therefore:

- **PASS** — the app did the right thing.
- **FAIL-DEFECT** — the test failed and the failure maps to a known bug in `docs/defects.json`.
  This is a *confirmed defect*, i.e. the test succeeded at finding the bug.
- **FAIL-NEW** — a failure with no known mapping; treat as a regression or a new bug to triage.

So a healthy run shows many PASS plus a set of FAIL-DEFECT entries — the FAIL-DEFECT rows **are**
the bugs the assignment asks you to identify. If you see FAIL-NEW rows, read
`reports/raw/processes.log` and the error column; they usually mean an environment issue
(wrong ChromeDriver version, port already in use) rather than a product bug.

To rebuild the report from the most recent run without re-running the browser:
```bash
npm run report
```

---

## 4. Run the original Selenium-WebDriver scripts (legacy evidence)

The 29 hand-written `selenium-webdriver` programs are kept under `tests/legacy/` as historical
evidence. They open a **real, headed** Chrome and hard-code `http://127.0.0.1:5501`.

```bash
npm run test:legacy
```

The runner ensures the app server is up on 5501, executes each script serially, and prints a
summary. Some legacy scripts intentionally exercise failing paths, so a non-zero exit is recorded,
not fatal. To run a single legacy script by hand:
```bash
npm start                                   # terminal 1: serve the app on 5501
node tests/legacy/login/login.test1.js      # terminal 2: run one script
```

---

## 5. Run the Selenium IDE project (the "IDE" half of the assignment)

1. Start the app server and leave it running:
   ```bash
   npm start        # serves http://127.0.0.1:5501
   ```
2. Open the **Selenium IDE** extension → **Open an existing project**.
3. Select `selenium-ide/STQA-AmazonClone.side`.
4. Set the project **Base URL** (top-left panel) to `http://127.0.0.1:5501`.
5. Run one test (select it → ▶ **Run test**) or the whole **Full Regression (bug hunt)** suite
   (right-click the suite → **Run all tests in suite**).
6. Red steps on the tests whose names mention *bug* are the **expected** outcome — those assertions
   state the correct behaviour the app violates.

Full detail: [`selenium-ide/README.md`](../selenium-ide/README.md).

---

## 6. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `session not created: This version of ChromeDriver only supports Chrome version NN` | ChromeDriver/Chrome major mismatch — `npm install --save-dev chromedriver@<your-major>` (section 0.3). |
| `EADDRINUSE` / port 5501 or 9515 already in use | Another run is active. Close it, or the runner will reuse the live process. To force-kill on Windows: `netstat -ano | findstr :5501` then `taskkill /PID <pid> /F`. |
| "Who's using Chrome?" profile picker pops up | Should not happen — the runner uses a unique temp profile. If it does, close all Chrome windows and re-run. |
| Many `FAIL-NEW` with `SecurityError: Failed to read the 'localStorage'` | Stale reports from an older run. Re-run `npm test`; the current helper lands on the origin before touching localStorage. |
| Report shows 0 tests | No `reports/wdio-*.json` present — the suite did not complete. Check `reports/raw/processes.log`. |
| Headless run never finishes a page load | Expected to be handled: the config uses `pageLoadStrategy: 'eager'` because the app waits on external Google Fonts. If you edit the config, keep `eager`. |

---

## 7. Deliverables checklist

- [ ] `npm install` completed without ERESOLVE errors.
- [ ] `npm test` ran; console shows per-spec results.
- [ ] `reports/test-report.html` opens and shows PASS + FAIL-DEFECT rows.
- [ ] `reports/rtm.csv` and `reports/results.json` generated.
- [ ] `reports/artifacts/` contains failure screenshots.
- [ ] Selenium IDE `.side` imported and the suite runs (section 5).
- [ ] `docs/TEST_PLAN_AND_BUG_TAXONOMY.md` and `docs/defects.json` reviewed for the write-up.
