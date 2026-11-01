#!/usr/bin/env node
/**
 * Legacy Selenium-WebDriver script runner.
 *
 * The 29 scripts under tests/legacy/ are the original hand-written
 * selenium-webdriver programs kept as historical evidence of the manual
 * automation work. Each one builds its own headed Chrome via
 * `require("chromedriver")` and hard-codes http://127.0.0.1:5501, so this
 * runner only needs to guarantee the app server is listening on 5501 and then
 * executes each file serially, capturing its exit status.
 *
 * Usage:  npm run test:legacy
 *         node tests/legacy/run-legacy.js [substring-filter]
 *
 * These scripts open a real browser window and some intentionally exercise
 * failing paths; a non-zero exit is recorded, not fatal.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const { APP_PORT, startProcesses, stopProcesses } = require('../helpers/launcher');

const LEGACY_ROOT = __dirname;
const PER_SCRIPT_TIMEOUT_MS = 90000;

function collectScripts() {
  const out = [];
  for (const entry of fs.readdirSync(LEGACY_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(LEGACY_ROOT, entry.name);
    for (const file of fs.readdirSync(dir).sort()) {
      if (file.endsWith('.js')) out.push(path.join(dir, file));
    }
  }
  return out.sort();
}

function runScript(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [file], {
      cwd: path.resolve(LEGACY_ROOT, '..', '..'),
      env: { ...process.env, PORT: String(APP_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ file, status: 'timeout', stdout, stderr });
    }, PER_SCRIPT_TIMEOUT_MS);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ file, status: code === 0 ? 'pass' : `exit ${code}`, stdout, stderr });
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ file, status: `spawn error: ${err.message}`, stdout, stderr });
    });
  });
}

(async () => {
  const filter = process.argv[2];
  let scripts = collectScripts();
  if (filter) scripts = scripts.filter((s) => s.toLowerCase().includes(filter.toLowerCase()));

  console.log(`Ensuring app server on port ${APP_PORT} ...`);
  await startProcesses();

  console.log(`\nRunning ${scripts.length} legacy selenium-webdriver script(s).\n`);
  const results = [];
  for (const file of scripts) {
    const rel = path.relative(path.resolve(LEGACY_ROOT, '..', '..'), file);
    process.stdout.write(`- ${rel} ... `);
    const result = await runScript(file);
    results.push(result);
    console.log(result.status);
    if (result.status !== 'pass' && result.stderr) {
      console.log(`    ${result.stderr.split('\n')[0].slice(0, 160)}`);
    }
  }

  const pass = results.filter((r) => r.status === 'pass').length;
  console.log(`\nLegacy summary: ${pass}/${results.length} exited cleanly.`);
  console.log('(Legacy scripts are headed and include intentional failing paths;');
  console.log(' the authoritative regression results are the WebdriverIO suite in reports/test-report.html.)');

  await stopProcesses();
})();
