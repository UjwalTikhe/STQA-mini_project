/**
 * Runs the WebdriverIO suite and then ALWAYS generates the report, even when the
 * suite exits non-zero. The suite is expected to fail: many tests assert required
 * behaviour that the application deliberately violates (see docs/defects.json), so a
 * non-zero exit is the normal outcome, not an error. Chaining with "&&" in npm would
 * short-circuit and skip report generation, which is why this wrapper exists.
 *
 * The WDIO CLI is invoked through its JS entry point with the current Node binary
 * rather than the node_modules/.bin shim, so it works cross-platform and tolerates a
 * project path that contains spaces.
 */
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const wdioCli = path.join(ROOT, 'node_modules', '@wdio', 'cli', 'bin', 'wdio.js');
const reportScript = path.join(ROOT, 'scripts', 'generate-report.js');
const extraArgs = process.argv.slice(2);

const suite = spawnSync(process.execPath, [wdioCli, 'run', 'wdio.conf.js', ...extraArgs], {
  cwd: ROOT,
  stdio: 'inherit',
});

const report = spawnSync(process.execPath, [reportScript], { cwd: ROOT, stdio: 'inherit' });

const suiteStatus = suite.status == null ? 1 : suite.status;
const reportStatus = report.status == null ? 1 : report.status;

// Preserve the suite's exit code so CI still sees failures, but never mask the report.
process.exit(suiteStatus || reportStatus);
