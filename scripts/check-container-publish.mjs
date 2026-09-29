// Run the workflow's actual stale-release guard with a local GitHub CLI fixture.
// No credentials, registry pushes, or GitHub requests are used.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const workflow = readFileSync(new URL('../.github/workflows/build-flow.yml', import.meta.url), 'utf8');
const step = workflow.split('      - name: Reject superseded release\n')[1]?.split('\n      - name:')[0];
assert.ok(step, 'publishing must guard against superseded releases');
const script = step.split('        run: |\n')[1]?.replace(/^          /gm, '');
assert.ok(script);
const directory = mkdtempSync(join(tmpdir(), 'ghrb-publish-'));
try {
  writeFileSync(join(directory, 'gh'), '#!/bin/sh\n[ "$1" = api ] || exit 2\n[ "$2" = repos/fixture/banner/releases/latest ] || exit 2\n[ "$3" = --jq ] && [ "$4" = .tag_name ] || exit 2\n[ "$FIXTURE_FAIL" != true ] || exit 1\nprintf "%s\\n" "$FIXTURE_LATEST"\n', { mode: 0o700 });
  for (const [release, latest, failure, expected] of [
    ['v1.5.1', 'v1.5.1', false, 0],
    ['v1.5.0', 'v1.5.1', false, 1],
    ['', '', false, 1],
    ['v1.5.1', '', true, 1],
  ]) {
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', script], {
      env: { PATH: directory + ':' + process.env.PATH, GITHUB_REPOSITORY: 'fixture/banner', RELEASE_TAG: release, FIXTURE_LATEST: latest, FIXTURE_FAIL: String(failure) },
      encoding: 'utf8',
    });
    assert.equal(result.status, expected, result.stderr || result.stdout);
  }
  console.log('PASS: current release may publish; superseded, missing, and unreadable release states fail closed');
} finally {
  rmSync(directory, { recursive: true, force: true });
}
