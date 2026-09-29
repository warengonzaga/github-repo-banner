/** @typedef {{action: 'markdown'|'url'|'svg'|'png', url: string, text: string, filename: string}} Snapshot */
const official = document.body.dataset.official === 'true';
const dialog = document.createElement('dialog');
dialog.className = 'export-dialog';
dialog.setAttribute('aria-labelledby', 'export-heading');
dialog.innerHTML = `<h2 id="export-heading">Showcase this banner?</h2>
<div class="official-export-info"><p>Help others discover what the community creates. Showcasing adds a public preview to the <a href="/usage">Usage page</a>.</p>
<p>Usage is counted and the exported design is saved for ${Number(document.body.dataset.retention)} days either way. “Export only” keeps the design off the public showcase; it does not turn off tracking.</p>
<p class="muted">GitHub Repo Banner is an open-source project and generated banner URLs are public. Only showcase content you have permission to share, without secrets or personal information. You can remove the showcase later with your removal link. This does not delete the saved export before its retention period ends. <a href="/docs#terms">Terms</a> · <a href="/docs#privacy">Privacy</a></p>
</div><div class="export-actions"><button type="button" data-choice="no" class="page-button" autofocus>Export only</button><button type="button" data-choice="yes" class="page-button">Showcase and export</button></div>
<p class="export-status" role="status" aria-live="polite"></p>
<p class="export-receipt" hidden><a>Save your removal link</a> to withdraw this showcase later. Keep the link secret.</p>
<button type="button" class="page-button export-retry" hidden>Copy now</button>
<button type="button" class="page-button export-close">Cancel</button>`;
document.body.append(dialog);
if (!official) {
  const heading = dialog.querySelector('h2');
  if (heading) heading.textContent = 'Complete your export';
  const info = /** @type {HTMLDivElement} */ (dialog.querySelector('.official-export-info'));
  info.hidden = true;
}
const choices = /** @type {NodeListOf<HTMLButtonElement>} */ (dialog.querySelectorAll('[data-choice]'));
const message = /** @type {HTMLParagraphElement} */ (dialog.querySelector('.export-status'));
const receipt = /** @type {HTMLParagraphElement} */ (dialog.querySelector('.export-receipt'));
const receiptLink = /** @type {HTMLAnchorElement} */ (receipt.querySelector('a'));
const close = /** @type {HTMLButtonElement} */ (dialog.querySelector('.export-close'));
const retry = /** @type {HTMLButtonElement} */ (dialog.querySelector('.export-retry'));
/** @type {{snapshot: Snapshot, button: HTMLButtonElement, id: string, token: string, recorded: boolean, pending: boolean, chosen: boolean|null, showcased: boolean, reason: string}|null} */
let current = null;
let busy = false;

/** @param {string} text */
function showStatus(text) {
  message.textContent = text;
  if (current?.recorded && current.chosen && !current.showcased) {
    message.textContent += current.reason === 'full'
      ? ' Your export was saved, but the showcase is full so it was not published.'
      : ' Your export was saved; this showcase has been removed and was not republished.';
  }
}

/** @param {Snapshot} snapshot @param {HTMLButtonElement} button */
export function beginExport(snapshot, button) {
  if (busy || dialog.open) return;
  current = { snapshot, button, id: '', token: '', recorded: false, pending: false, chosen: null, showcased: false, reason: '' };
  showStatus('');
  receipt.hidden = true;
  retry.hidden = true;
  retry.textContent = 'Copy now';
  close.textContent = 'Cancel';
  choices.forEach(choice => { choice.hidden = false; choice.disabled = false; });
  if (official) dialog.showModal();
  else void finish(false);
}

/** @param {boolean} showcase */
async function record(showcase) {
  if (!current || current.recorded) return;
  if (official && !current.id) {
    current.id = `${Date.now()}-${crypto.randomUUID()}`;
    current.token = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  }
  const {snapshot, id, token} = current;
  const request = official ? { action: snapshot.action, showcase, id, removalToken: token,
    query: Object.fromEntries(new URL(snapshot.url).searchParams), policyVersion: '2026-09-29' } : { action: snapshot.action, showcase };
  const optOut = new URL(snapshot.url).searchParams.get('stats') === 'false' ? '?stats=false' : '';
  const response = await fetch(`/exports${optOut}`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(request), signal: AbortSignal.timeout(15_000) });
  if (!response.ok && response.status < 500) current.pending = false;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Could not record this export. Please try again.');
  if (official && (result.saved !== true || result.id !== id || typeof result.showcased !== 'boolean')) throw new Error('The saved export could not be confirmed. Retry the same choice.');
  current.recorded = true;
  current.pending = false;
  current.showcased = result.showcased === true;
  current.reason = result.showcaseReason || '';
  if (current.showcased) {
    receiptLink.href = `/usage#remove=${id}.${token}`;
    receipt.hidden = false;
    try {
      const stored = JSON.parse(localStorage.getItem('showcase-removal-codes') || '{}');
      if (stored && typeof stored === 'object' && !Array.isArray(stored) && Object.keys(stored).length < 100) {
        stored[id] = token;
        localStorage.setItem('showcase-removal-codes', JSON.stringify(stored));
      }
    } catch { /* The visible removal link also works when storage is unavailable. */ }
  }
}

/** @param {Snapshot} snapshot */
async function download(snapshot) {
  const response = await fetch(snapshot.url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok || !response.headers.get('Content-Type')?.startsWith('image/svg+xml')) throw new Error('The banner could not be rendered. Try exporting again.');
  let blob = await response.blob();
  if (snapshot.action === 'png') {
    const image = new Image();
    // A blob URL for SVG foreignObject content taints the canvas in Chromium.
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await blob.text())}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 304;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('PNG conversion is unavailable. Try SVG instead.');
    context.drawImage(image, 0, 0);
    blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG conversion failed. Try SVG instead.')), 'image/png'));
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = `${snapshot.filename}.${snapshot.action}`;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** @param {boolean} showcase */
async function finish(showcase) {
  if (!current || busy) return;
  busy = true;
  current.chosen = showcase;
  current.pending = official && !current.recorded;
  choices.forEach(choice => { choice.disabled = true; });
  close.disabled = true;
  retry.hidden = true;
  showStatus('Preparing your export…');
  const {snapshot, button} = current;
  const copying = snapshot.action === 'markdown' || snapshot.action === 'url';
  // Start writing within the trusted click. The text resolves after publication/counting.
  const prepared = record(showcase);
  try {
    if (copying && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      const content = prepared.then(() => new Blob([snapshot.text], {type:'text/plain'}));
      await navigator.clipboard.write([new ClipboardItem({'text/plain':content})]);
    } else {
      await prepared;
      if (copying) {
        if (!dialog.open) dialog.showModal();
        retry.hidden = false;
        showStatus('Ready. Select Copy now to finish the export.');
        return;
      }
      await download(snapshot);
    }
    showStatus(copying ? 'Copied to clipboard.' : 'Download started.');
    const feedback = document.getElementById('export-feedback');
    if (feedback) feedback.textContent = message.textContent;
    button.classList.add('copied');
    setTimeout(() => button.classList.remove('copied'), 2000);
    if (!showcase && dialog.open) dialog.close();
  } catch (error) {
    // Observe the preparation promise even if the clipboard rejects first.
    let preparationError;
    try { await prepared; } catch (failure) { preparationError = failure; }
    if (!dialog.open) dialog.showModal();
    showStatus(preparationError instanceof Error ? preparationError.message : error instanceof Error ? error.message : 'Export failed. Please try again.');
    if (current.recorded) { retry.hidden = false; retry.textContent = copying ? 'Copy now' : 'Retry download'; message.textContent += copying ? ' Select Copy now to try the clipboard again.' : ' Retry the download without submitting another showcase.'; }
    if (!official && !current.recorded) { retry.hidden = false; retry.textContent = 'Retry export'; }
    if (current.pending) {
      if (showcase) { receiptLink.href = `/usage#remove=${current.id}.${current.token}`; receipt.hidden = false; }
      message.textContent += ' Saving may have completed. Retry the same choice. If you chose showcasing, you can also use the removal link.';
    }
  } finally {
    busy = false;
    close.disabled = false;
    close.textContent = 'Done';
    choices.forEach(choice => {
      choice.hidden = !official || current?.recorded === true;
      choice.disabled = current?.pending === true && (choice.dataset.choice === 'yes') !== current.chosen;
    });
  }
}
choices.forEach(button => button.addEventListener('click', () => void finish(button.dataset.choice === 'yes')));
retry.addEventListener('click', async () => {
  if (!current || busy) return;
  if (!current.recorded) { await finish(false); return; }
  busy = true; retry.disabled = true; close.disabled = true;
  try {
    const copying = current.snapshot.action === 'markdown' || current.snapshot.action === 'url';
    if (copying) await navigator.clipboard.writeText(current.snapshot.text);
    else await download(current.snapshot);
    showStatus(copying ? 'Copied to clipboard.' : 'Download started.');
    retry.hidden = true;
  } catch (error) { showStatus(error instanceof Error ? error.message : 'Export failed. Please try again.'); }
  finally { busy = false; retry.disabled = false; close.disabled = false; }
});
close.addEventListener('click', () => dialog.close());
dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
