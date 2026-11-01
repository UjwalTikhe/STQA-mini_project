const path = require('path');
const os = require('os');
const fs = require('fs');
const { BASE_URL, startProcesses, stopProcesses } = require('./tests/helpers/launcher');
const { recordFinding } = require('./tests/helpers/findings');

const IS_HEADED = process.env.HEADED === '1' || process.argv.includes('--headed');
const REPORTS_DIR = path.resolve(__dirname, 'reports');
// A throwaway profile keeps Chrome from ever showing its "Who's using Chrome?" picker.
// Unique per run so a leftover browser can never lock it.
const PROFILE_DIR = path.join(os.tmpdir(), `stqa-wdio-chrome-profile-${process.pid}`);

exports.config = {
  runner: 'local',
  hostname: '127.0.0.1',
  port: Number(process.env.CHROMEDRIVER_PORT || 9515),
  path: '/',

  specs: [
    './tests/regression/**/*.spec.js',
    './tests/exploratory/**/*.spec.js',
  ],
  exclude: [],

  maxInstances: 1,
  capabilities: [{
    browserName: 'chrome',
    pageLoadStrategy: 'eager',
    'goog:chromeOptions': {
      args: [
        ...(IS_HEADED ? [] : ['--headless=new']),
        `--user-data-dir=${PROFILE_DIR}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1440,900',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-features=Translate',
      ],
      prefs: {
        'credentials_enable_service': false,
        'profile.password_manager_enabled': false,
      },
    },
  }],

  logLevel: 'error',
  bail: 0,
  baseUrl: BASE_URL,
  waitforTimeout: 10000,
  connectionRetryTimeout: 60000,
  connectionRetryCount: 1,

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 90000,
  },

  reporters: [
    'spec',
    ['json', { outputDir: REPORTS_DIR, outputFilePrefix: 'wdio' }],
    ['junit', { outputDir: path.join(REPORTS_DIR, 'raw'), outputFileFormat: () => 'junit.xml' }],
  ],

  async onPrepare() {
    fs.mkdirSync(path.join(REPORTS_DIR, 'artifacts'), { recursive: true });
    fs.mkdirSync(path.join(REPORTS_DIR, 'raw'), { recursive: true });
    fs.rmSync(path.join(REPORTS_DIR, 'findings.json'), { force: true });
    const { driverPath } = await startProcesses();
    recordFinding({
      id: 'ENV',
      charter: 'Environment readiness',
      observation: `ChromeDriver resolved at ${driverPath}; application served from ${BASE_URL}.`,
      classification: 'Informational',
      severity: 'N/A',
    });
  },

  async onComplete() {
    stopProcesses();
    fs.rmSync(PROFILE_DIR, { recursive: true, force: true, maxRetries: 3 });
  },

  async afterTest(test) {
    if (test.error) {
      const safeName = `${test.title}`.replace(/[^a-z0-9]+/gi, '-').slice(0, 70);
      const file = path.join(REPORTS_DIR, 'artifacts', `${safeName}.fail.png`);
      try {
        await browser.saveScreenshot(file);
      } catch {}
    }
  },
};
