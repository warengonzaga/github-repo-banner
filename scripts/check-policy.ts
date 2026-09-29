// Run with bun scripts/check-policy.ts; exercises local policy rendering without starting the server.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { marked } from 'marked';
import uiRoute from '../src/routes/ui.js';
const policy = readFileSync(new URL('../CODE_OF_CONDUCT.md', import.meta.url), 'utf8');
const response = await uiRoute.request('/');
assert.equal(response.status, 200);
const html = await response.text();
assert.ok(html.includes(marked.parse(policy, { async: false })));
assert.ok(!html.includes('<!-- repository-document:conduct -->'));
assert.match(html, /id="conduct-tab" role="tab"/);
