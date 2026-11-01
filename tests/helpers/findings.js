const fs = require('fs');
const path = require('path');

const FINDINGS_FILE = path.resolve(__dirname, '..', '..', 'reports', 'findings.json');

function recordFinding(finding) {
  fs.mkdirSync(path.dirname(FINDINGS_FILE), { recursive: true });
  let findings = readFindings();
  const existingIndex = findings.findIndex((f) => f.id === finding.id);
  if (existingIndex >= 0) {
    findings[existingIndex] = { ...findings[existingIndex], ...finding };
  } else {
    findings.push(finding);
  }
  fs.writeFileSync(FINDINGS_FILE, JSON.stringify(findings, null, 2));
}

function readFindings() {
  try {
    return JSON.parse(fs.readFileSync(FINDINGS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

module.exports = { recordFinding, readFindings, FINDINGS_FILE };
