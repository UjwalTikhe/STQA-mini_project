/**
 * Aggregates the WebdriverIO JSON reporter output, the exploratory findings log and
 * the defect register into a single self-contained HTML test report plus a normalised
 * results.json and an RTM csv. Run with: npm run report
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORTS = path.join(ROOT, 'reports');
const DEFECTS_FILE = path.join(ROOT, 'docs', 'defects.json');
const FINDINGS_FILE = path.join(REPORTS, 'findings.json');

const REQUIREMENTS = {
  'REQ-01': 'User authentication & login validation',
  'REQ-02': 'Navigation, routing & page integrity',
  'REQ-03': 'Product catalogue rendering & add-to-cart',
  'REQ-04': 'Cart management & persistence',
  'REQ-05': 'Order summary & money handling',
  'REQ-06': 'Shipping address validation (boundary analysis)',
  'REQ-07': 'Payment card validation (boundary analysis)',
  'REQ-08': 'Order history & delivery tracking',
  'REQ-09': 'Access control, session guard & data protection',
  'REQ-10': 'Exploratory testing charters (session based)',
};

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function collectRawResults() {
  const files = fs
    .readdirSync(REPORTS)
    .filter((name) => /^wdio-.*\.json$/.test(name))
    .sort();

  const tests = [];
  for (const file of files) {
    const payload = readJson(path.join(REPORTS, file), null);
    if (!payload) continue;
    const suites = Array.isArray(payload) ? payload : payload.suites || [];
    walk(suites, [], file);
  }
  return tests;

  function walk(suites, parents, file) {
    for (const suite of suites) {
      const chain = parents.concat(suite.name || suite.title || '');
      for (const test of suite.tests || []) {
        tests.push({
          suite: chain.join(' > '),
          title: test.name || test.title,
          state: test.state,
          duration: test.duration || 0,
          error: test.error ? (test.error.message || String(test.error)).split('\n')[0] : null,
          file: file,
        });
      }
      walk(suite.suites || [], chain, file);
    }
  }
}

const TITLE_PATTERN = /^(TC-[A-Z]+-\d+|EXP-\d+-\d+) \[([^\]]+)\] \[([^\]]+)\] (.*)$/;

function parseTitle(title) {
  const match = TITLE_PATTERN.exec(title);
  if (!match) return { tc: null, req: null, type: 'unclassified', description: title };
  return { tc: match[1], req: match[2], type: match[3], description: match[4] };
}

function classify(test, defectsByTc) {
  if (test.state === 'passed') return 'PASS';
  const mapped = defectsByTc[test.tc] || [];
  return mapped.length ? 'FAIL-DEFECT' : 'FAIL-NEW';
}

function main() {
  const raw = collectRawResults();
  const defects = readJson(DEFECTS_FILE, []);
  const findings = readJson(FINDINGS_FILE, []);

  const defectsByTc = {};
  for (const defect of defects) {
    for (const tc of defect.detectedBy || []) {
      defectsByTc[tc] = defectsByTc[tc] || [];
      defectsByTc[tc].push(defect.id);
    }
  }

  const tests = raw.map((test) => {
    const parsed = parseTitle(test.title);
    return {
      ...test,
      ...parsed,
      defects: defectsByTc[parsed.tc] || [],
      verdict: classify({ ...test, tc: parsed.tc }, defectsByTc),
    };
  });

  const totals = {
    total: tests.length,
    pass: tests.filter((t) => t.verdict === 'PASS').length,
    failDefect: tests.filter((t) => t.verdict === 'FAIL-DEFECT').length,
    failNew: tests.filter((t) => t.verdict === 'FAIL-NEW').length,
    durationMs: tests.reduce((sum, t) => sum + t.duration, 0),
  };

  const byRequirement = Object.keys(REQUIREMENTS).map((req) => ({
    id: req,
    title: REQUIREMENTS[req],
    tests: tests.filter((t) => t.req === req),
  }));

  const artifacts = fs.existsSync(path.join(REPORTS, 'artifacts'))
    ? fs.readdirSync(path.join(REPORTS, 'artifacts')).filter((name) => name.endsWith('.png'))
    : [];

  const results = {
    generatedAt: new Date().toISOString(),
    application: 'Amazon Clone (STQA mini project)',
    baseUrl: process.env.BASE_URL || 'http://127.0.0.1:5501',
    framework: 'WebdriverIO v10 + ChromeDriver (Selenium WebDriver protocol)',
    totals,
    tests,
    defects,
    exploratory: findings,
    artifacts,
  };

  fs.writeFileSync(path.join(REPORTS, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(REPORTS, 'rtm.csv'), renderRtm(byRequirement, defectsByTc));
  fs.writeFileSync(path.join(REPORTS, 'test-report.html'), renderHtml(results, byRequirement));

  console.log(`Report written: ${path.join(REPORTS, 'test-report.html')}`);
  console.log(`  total=${totals.total} pass=${totals.pass} fail-defect=${totals.failDefect} fail-new=${totals.failNew}`);
}

function renderRtm(byRequirement, defectsByTc) {
  const lines = ['Requirement,Requirement title,Test case,Type,Linked defects'];
  for (const group of byRequirement) {
    for (const test of group.tests) {
      lines.push(
        [group.id, csv(group.title), test.tc || '', test.type, csv((defectsByTc[test.tc] || []).join('; '))].join(',')
      );
    }
  }
  return lines.join('\n') + '\n';
}

function csv(value) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHtml(results, byRequirement) {
  const { totals } = results;
  const defectCards = results.defects
    .map(
      (d) => `
    <div class="defect ${d.severity}">
      <h4>${escapeHtml(d.id)} &mdash; ${escapeHtml(d.title)}</h4>
      <p class="meta">${escapeHtml(d.category)} &middot; severity ${escapeHtml(d.severity)} &middot; priority ${escapeHtml(
        d.priority
      )} &middot; status ${escapeHtml(d.status)}</p>
      <p><strong>Expected:</strong> ${escapeHtml(d.expected)}</p>
      <p><strong>Actual:</strong> ${escapeHtml(d.actual)}</p>
      <p><strong>Repro:</strong> ${escapeHtml(d.repro)}</p>
      <p><strong>Root cause:</strong> ${escapeHtml(d.rootCause)}</p>
      <p class="meta">Detected by: ${(d.detectedBy || []).map(escapeHtml).join(', ')}</p>
    </div>`
    )
    .join('\n');

  const requirementSections = byRequirement
    .map((group) => {
      if (!group.tests.length) return '';
      const rows = group.tests
        .map(
          (t) => `
        <tr class="${t.verdict}">
          <td>${escapeHtml(t.tc || '')}</td>
          <td>${escapeHtml(t.description)}</td>
          <td>${escapeHtml(t.type)}</td>
          <td>${escapeHtml(t.verdict)}</td>
          <td>${escapeHtml((t.defects || []).join(', '))}</td>
          <td class="num">${(t.duration / 1000).toFixed(2)}s</td>
        </tr>`
        )
        .join('');
      return `
    <h3>${escapeHtml(group.id)} &mdash; ${escapeHtml(group.title)}</h3>
    <table>
      <thead><tr><th>ID</th><th>Test case</th><th>Type</th><th>Verdict</th><th>Defects</th><th>Time</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
    })
    .join('\n');

  const exploratoryRows = results.exploratory
    .map(
      (f) => `
      <tr>
        <td>${escapeHtml(f.id)}</td>
        <td>${escapeHtml(f.charter)}</td>
        <td>${escapeHtml(f.observation)}</td>
        <td>${escapeHtml(f.classification)}</td>
        <td>${escapeHtml(f.severity)}</td>
      </tr>`
    )
    .join('');

  const artifactRows = results.artifacts
    .map((name) => `<li><a href="artifacts/${escapeHtml(name)}">${escapeHtml(name)}</a></li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>STQA Mini Project &mdash; Regression Test Report</title>
<style>
  body { font-family: "Segoe UI", Roboto, Arial, sans-serif; margin: 0; background: #f4f6f8; color: #1c2733; }
  header { background: #131a22; color: #fff; padding: 28px 40px; }
  header h1 { margin: 0 0 6px; font-size: 24px; }
  header p { margin: 2px 0; color: #aeb9c4; font-size: 13px; }
  main { padding: 28px 40px 60px; max-width: 1200px; margin: 0 auto; }
  .cards { display: flex; gap: 14px; flex-wrap: wrap; margin: 22px 0; }
  .card { background: #fff; border-radius: 8px; padding: 16px 22px; min-width: 150px; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  .card .value { font-size: 30px; font-weight: 700; }
  .card.pass .value { color: #1a7f37; }
  .card.fail .value { color: #b42318; }
  .card.warn .value { color: #b54708; }
  table { border-collapse: collapse; width: 100%; background: #fff; margin: 10px 0 26px; font-size: 13px; }
  th, td { border: 1px solid #d8dee4; padding: 7px 10px; text-align: left; vertical-align: top; }
  th { background: #eef2f5; }
  tr.PASS td:nth-child(4) { color: #1a7f37; font-weight: 600; }
  tr.FAIL-DEFECT td:nth-child(4) { color: #b54708; font-weight: 600; }
  tr.FAIL-NEW td:nth-child(4) { color: #b42318; font-weight: 600; }
  td.num { text-align: right; white-space: nowrap; }
  .defect { background: #fff; border-left: 5px solid #b42318; border-radius: 6px; padding: 14px 18px; margin: 12px 0; box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  .defect.S2 { border-left-color: #b54708; }
  .defect.S3 { border-left-color: #175cd3; }
  .defect.S4 { border-left-color: #667085; }
  .defect h4 { margin: 0 0 6px; }
  .defect p { margin: 4px 0; font-size: 13px; }
  .meta { color: #667085; font-size: 12px; }
  h2 { margin-top: 34px; border-bottom: 2px solid #d8dee4; padding-bottom: 6px; }
  .note { background: #fff8e6; border: 1px solid #f0d48a; border-radius: 6px; padding: 12px 16px; font-size: 13px; }
</style>
</head>
<body>
<header>
  <h1>Regression Test Report &mdash; Amazon Clone (STQA Mini Project)</h1>
  <p>Generated ${escapeHtml(results.generatedAt)} &middot; framework ${escapeHtml(results.framework)}</p>
  <p>Application under test ${escapeHtml(results.baseUrl)} &middot; Selenium WebDriver protocol via ChromeDriver</p>
</header>
<main>
  <div class="cards">
    <div class="card"><div class="value">${totals.total}</div>executed</div>
    <div class="card pass"><div class="value">${totals.pass}</div>passed</div>
    <div class="card warn"><div class="value">${totals.failDefect}</div>failed &rarr; logged defect</div>
    <div class="card fail"><div class="value">${totals.failNew}</div>failed &rarr; unmapped</div>
    <div class="card"><div class="value">${results.defects.length}</div>defects in register</div>
  </div>

  <div class="note">
    <strong>Reading this report.</strong> Every test asserts the <em>required</em> behaviour from the test plan.
    A row marked <em>FAIL &rarr; logged defect</em> is a confirmed bug: the application deviates from its
    requirement and the failure is linked to an entry in the defect register below. Rows marked
    <em>FAIL &rarr; unmapped</em> are new failures that must be triaged before the next regression cycle.
    Dialog text (the application reports everything through <code>alert()</code>) is captured through a
    sessionStorage-backed stub because ChromeDriver dismisses unattended native dialogs in headless mode;
    the same assertions hold in headed mode where the dialogs are visible.
  </div>

  <h2>1. Results by requirement (traceability)</h2>
  ${requirementSections}

  <h2>2. Defect register (bug taxonomy applied)</h2>
  ${defectCards || '<p>No defects recorded.</p>'}

  <h2>3. Exploratory testing sessions</h2>
  <table>
    <thead><tr><th>Finding</th><th>Charter</th><th>Observation</th><th>Classification</th><th>Severity</th></tr></thead>
    <tbody>${exploratoryRows || '<tr><td colspan="5">No exploratory findings recorded.</td></tr>'}</tbody>
  </table>

  <h2>4. Failure evidence (screenshots)</h2>
  ${artifactRows ? `<ul>${artifactRows}</ul>` : '<p>No failure screenshots were produced in this run.</p>'}
</main>
</body>
</html>
`;
}

main();
