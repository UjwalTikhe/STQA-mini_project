const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CHROMEDRIVER_PORT = Number(process.env.CHROMEDRIVER_PORT || 9515);
const APP_PORT = Number(process.env.APP_PORT || 5501);
const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${APP_PORT}`;
const LOG_FILE = path.join(ROOT, 'reports', 'raw', 'processes.log');

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function waitForHttp(url, timeoutMs = 30000) {
  const http = require('http');
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const probe = () => {
      const request = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      request.on('error', () => retry());
      request.setTimeout(2000, () => request.destroy());

      function retry() {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(probe, 200);
      }
    };
    probe();
  });
}

/**
 * Never shell out to chrome.exe on Windows: `--version` there launches the browser
 * (and its profile picker) instead of printing a version. The npm chromedriver
 * package already tracks the Chrome major version, so use that as the hint.
 */
function preferredDriverMajor() {
  if (process.env.CHROME_MAJOR) return process.env.CHROME_MAJOR;
  try {
    return require('chromedriver/package.json').version.split('.')[0];
  } catch {
    return null;
  }
}

function byVersionDescending(a, b) {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let i = 0; i < 4; i += 1) {
    if ((left[i] || 0) !== (right[i] || 0)) return (right[i] || 0) - (left[i] || 0);
  }
  return 0;
}

function findChromedriver() {
  if (process.env.CHROMEDRIVER_PATH && fs.existsSync(process.env.CHROMEDRIVER_PATH)) {
    return process.env.CHROMEDRIVER_PATH;
  }

  const candidates = [];
  const npmBinary = path.join(ROOT, 'node_modules', 'chromedriver', 'lib', 'chromedriver', process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver');
  if (fs.existsSync(npmBinary)) candidates.push(npmBinary);

  try {
    const npmPath = require('chromedriver').path;
    if (npmPath && fs.existsSync(npmPath)) candidates.push(npmPath);
  } catch {}

  const cacheRoot = path.join(os.homedir(), '.cache', 'selenium', 'chromedriver');
  if (fs.existsSync(cacheRoot)) {
    const major = preferredDriverMajor();
    for (const platform of fs.readdirSync(cacheRoot)) {
      const platformRoot = path.join(cacheRoot, platform);
      const versions = fs
        .readdirSync(platformRoot)
        .filter((version) => !major || version.startsWith(`${major}.`))
        .sort(byVersionDescending);
      for (const version of versions) {
        candidates.push(path.join(platformRoot, version, process.platform === 'win32' ? 'chromedriver.exe' : 'chromedriver'));
      }
    }
  }

  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function logLine(message) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${message}\n`);
}

const spawned = [];

async function startProcesses() {
  fs.rmSync(LOG_FILE, { force: true });
  const reused = { app: false, driver: false };

  if (await isPortOpen(APP_PORT)) {
    reused.app = true;
    logLine(`Reusing application server already listening on port ${APP_PORT}`);
  } else {
    const child = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(APP_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', (chunk) => logLine(`server: ${chunk}`.trimEnd()));
    child.stderr.on('data', (chunk) => logLine(`server ERROR: ${chunk}`.trimEnd()));
    child.on('exit', (code) => logLine(`server exited with code ${code}`));
    spawned.push(child);
  }

  const driverPath = findChromedriver();
  if (!driverPath) {
    throw new Error('ChromeDriver binary not found. Run `npm install` and retry.');
  }
  logLine(`ChromeDriver binary: ${driverPath}`);

  if (await isPortOpen(CHROMEDRIVER_PORT)) {
    reused.driver = true;
    logLine(`Reusing ChromeDriver already listening on port ${CHROMEDRIVER_PORT}`);
  } else {
    const child = spawn(driverPath, ['--port=' + CHROMEDRIVER_PORT], { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (chunk) => logLine(`chromedriver: ${chunk}`.trimEnd()));
    child.stderr.on('data', (chunk) => logLine(`chromedriver ERROR: ${chunk}`.trimEnd()));
    child.on('exit', (code) => logLine(`chromedriver exited with code ${code}`));
    spawned.push(child);
  }

  await Promise.all([
    waitForHttp(new URL(BASE_URL).origin + '/login.html'),
    waitForHttp(`http://127.0.0.1:${CHROMEDRIVER_PORT}/status`),
  ]);

  return { driverPath, reused };
}

function stopProcesses() {
  for (const child of spawned.splice(0)) {
    if (child.exitCode === null) child.kill();
  }
}

module.exports = {
  APP_PORT,
  BASE_URL,
  CHROMEDRIVER_PORT,
  LOG_FILE,
  findChromedriver,
  isPortOpen,
  startProcesses,
  stopProcesses,
};
