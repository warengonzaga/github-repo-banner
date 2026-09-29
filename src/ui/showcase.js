const section = document.getElementById('community-showcase');
if (section && document.body.dataset.official === 'true') {
  section.hidden = false;
  const grid = /** @type {HTMLUListElement} */ (document.getElementById('showcase-grid'));
  const status = /** @type {HTMLParagraphElement} */ (document.getElementById('showcase-status'));
  const more = /** @type {HTMLButtonElement} */ (document.getElementById('showcase-more'));
  const form = /** @type {HTMLFormElement} */ (document.getElementById('showcase-remove'));
  const code = /** @type {HTMLInputElement} */ (document.getElementById('showcase-code'));
  const removalStatus = /** @type {HTMLParagraphElement} */ (document.getElementById('showcase-removal-status'));
  const submit = /** @type {HTMLButtonElement} */ (form.querySelector('button'));
  const seen = new Set();
  /** @type {string|null} */
  let cursor = null;
  let loading = false;
  const pattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.[a-f0-9]{64}$/;
  const fragment = new URLSearchParams(location.hash.slice(1)).get('remove');
  if (fragment && pattern.test(fragment)) {
    code.value = fragment;
    form.closest('details')?.setAttribute('open', '');
    history.replaceState(null, '', location.pathname + location.search);
  }
  /** @returns {Record<string,string>} */
  function savedCodes() {
    try {
      const codes = JSON.parse(localStorage.getItem('showcase-removal-codes') || '{}');
      return codes && typeof codes === 'object' && !Array.isArray(codes) ? codes : {};
    } catch { return {}; }
  }
  async function load() {
    if (loading) return;
    loading = true; more.disabled = true;
    status.textContent = 'Loading community designs…';
    try {
      const response = await fetch('/showcase' + (cursor ? `?before=${encodeURIComponent(cursor)}` : ''), {cache:'no-store', signal:AbortSignal.timeout(10_000)});
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data.enabled !== true || !Array.isArray(data.entries) || data.entries.length > 12 ||
        !(data.nextCursor === null || /^\d{13}:[a-f0-9-]{36}$/.test(data.nextCursor)) ||
        data.entries.some(/** @param {{id:string,createdAt:number,previewUrl:string}} entry */ entry =>
          !/^[a-f0-9-]{36}$/.test(entry.id) || !Number.isSafeInteger(entry.createdAt) || entry.createdAt < 0 || entry.previewUrl !== `/showcase/${entry.id}.svg`)) throw new Error();
      const codes = savedCodes();
      for (const entry of data.entries) {
        if (seen.has(entry.id)) continue;
        seen.add(entry.id);
        const item = document.createElement('li'); item.dataset.id = entry.id;
        const image = document.createElement('img');
        image.src = entry.previewUrl; image.width = 1280; image.height = 304;
        image.alt = 'Community banner design'; image.loading = 'lazy'; image.decoding = 'async';
        const caption = document.createElement('p');
        const time = document.createElement('time');
        time.dateTime = new Date(entry.createdAt).toISOString();
        time.textContent = `Shared ${new Date(entry.createdAt).toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'})}`;
        caption.append(time); item.append(image, caption);
        image.addEventListener('error', () => { image.hidden = true; caption.prepend('Preview unavailable. '); });
        if (typeof codes[entry.id] === 'string' && pattern.test(`${entry.id}.${codes[entry.id]}`)) {
          const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'page-button'; remove.textContent = 'Remove your showcase';
          remove.addEventListener('click', () => {
            code.value = `${entry.id}.${codes[entry.id]}`;
            form.closest('details')?.setAttribute('open', '');
            submit.focus();
          });
          caption.append(remove);
        }
        grid.append(item);
      }
      cursor = data.nextCursor;
      more.hidden = cursor === null;
      status.textContent = seen.size ? `${seen.size} shared designs loaded. Only designs submitted for showcasing appear here.` : 'No shared designs yet. Create a banner and choose Showcase and export to be the first.';
    } catch {
      status.textContent = 'We could not load the showcase. Try again in a moment.';
      more.hidden = false; more.textContent = 'Try again';
    } finally { loading = false; more.disabled = false; }
  }
  more.addEventListener('click', () => { more.textContent = 'Load more designs'; void load(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    let value = code.value.trim();
    if (value.includes('#remove=')) value = value.split('#remove=')[1];
    if (!pattern.test(value)) { removalStatus.textContent = 'Paste the complete removal link or code given after showcasing.'; return; }
    const [id, token] = value.split('.');
    submit.disabled = true; removalStatus.textContent = 'Removing this design…';
    try {
      const response = await fetch(`/showcase/${id}`, {method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({removalToken:token}), signal:AbortSignal.timeout(10_000)});
      if (!response.ok) throw new Error((await response.json()).error);
      const codes = savedCodes(); delete codes[id];
      try { localStorage.setItem('showcase-removal-codes', JSON.stringify(codes)); } catch { /* Removal still succeeded. */ }
      grid.querySelector(`[data-id="${id}"]`)?.remove(); seen.delete(id);
      code.value = '';
      removalStatus.textContent = 'Removed from the showcase. Existing copies held by others cannot be recalled.';
      status.textContent = seen.size ? `${seen.size} shared designs loaded.` : 'No shared designs are displayed. Reload to check for new submissions.';
    } catch (error) { removalStatus.textContent = error instanceof Error ? error.message : 'Removal failed. Please try again.'; }
    finally { submit.disabled = false; }
  });
  void load();
}
