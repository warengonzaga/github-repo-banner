import { MAX_CUSTOM_IMAGES, parseImageLayers } from './image-settings.js';

/** @typedef {{element:HTMLFieldSetElement,src:HTMLInputElement,fields:HTMLInputElement[],fit:HTMLInputElement,placement:HTMLSelectElement,lower:HTMLButtonElement,raise:HTMLButtonElement}} ImageRow */
/** @param {{container:HTMLElement,addButton:HTMLButtonElement,status:HTMLElement,onChange:()=>void,getInlineCount:()=>number}} controls */
export function initImageLayers({ container, addButton, status, onChange, getInlineCount }) {
  /** @type {ImageRow[]} */
  const rows = [];
  let sequence = 0;

  function refreshLimit() {
    const total = rows.length + getInlineCount();
    addButton.disabled = total >= MAX_CUSTOM_IMAGES;
    const summary = `${total} of ${MAX_CUSTOM_IMAGES} custom images used, including inline icons.`;
    if (status.textContent !== summary) status.textContent = summary;
    rows.forEach((row, index) => {
      const peers = rows.filter(other => other.placement.value === row.placement.value);
      row.lower.disabled = peers[0] === row;
      row.raise.disabled = peers.at(-1) === row;
      const legend = row.element.querySelector('legend');
      if (legend && legend.textContent !== `Image ${index + 1}`) legend.textContent = `Image ${index + 1}`;
    });
  }

  function serialize() {
    if (rows.length + getInlineCount() > MAX_CUSTOM_IMAGES) throw new Error('Use at most 5 custom images across the banner and inline icons.');
    const values = rows.map((row, index) => {
      row.src.removeAttribute('aria-invalid');
      row.fields.forEach(field => field.removeAttribute('aria-invalid'));
      if (!row.src.value.trim()) {
        row.src.setAttribute('aria-invalid', 'true');
        throw new Error(`Image ${index + 1}: enter a public HTTPS image URL or remove this image.`);
      }
      /** @type {Record<string,number>} */
      const geometry = {};
      for (const field of row.fields) {
        if (!field.value.trim() || !field.checkValidity()) {
          field.setAttribute('aria-invalid', 'true');
          throw new Error(`Image ${index + 1}: ${field.dataset.label} must be between ${field.min} and ${field.max} ${field.dataset.unit || 'pixels'}.`);
        }
        geometry[field.name] = Number(field.value);
      }
      return { src: row.src.value.trim(), ...geometry, fit: row.fit.checked ? 'contain' : 'stretch', placement: row.placement.value };
    });
    try { return values.length ? JSON.stringify(parseImageLayers(JSON.stringify(values))) : ''; }
    catch (error) {
      const index = error instanceof Error ? /^Image (\d+):/.exec(error.message)?.[1] : undefined;
      if (index) rows[Number(index) - 1]?.src.setAttribute('aria-invalid', 'true');
      throw error;
    }
  }

  /** @param {ImageRow} row @param {number} direction */
  function move(row, direction) {
    const index = rows.indexOf(row);
    const peers = rows.filter(other => other.placement.value === row.placement.value);
    const target = peers[peers.indexOf(row) + direction];
    if (!target) return;
    const targetIndex = rows.indexOf(target);
    [rows[index], rows[targetIndex]] = [rows[targetIndex], rows[index]];
    rows.forEach(entry => container.append(entry.element));
    refreshLimit();
    // Reordering existing nodes preserves input values; restore keyboard focus explicitly.
    const button = direction < 0 ? row.lower : row.raise;
    (button.disabled ? row.src : button).focus();
    onChange();
  }

  addButton.addEventListener('click', () => {
    if (rows.length + getInlineCount() >= MAX_CUSTOM_IMAGES) return;
    const id = `custom-image-${++sequence}`;
    const element = document.createElement('fieldset');
    element.className = 'image-layer';
    element.innerHTML = `<legend></legend>
<label for="${id}-src">Image URL</label><input type="url" id="${id}-src" placeholder="https://example.com/logo.png" maxlength="512" required autocomplete="off" aria-describedby="design-error" />
<div class="image-geometry">${[['x','X position',0,1280,0],['y','Y position',0,304,0],['w','Width',1,1280,128],['h','Height',1,304,128]].map(([name,label,min,max,value]) => `<label for="${id}-${name}">${label} <span>(px)</span><input type="number" id="${id}-${name}" name="${name}" data-label="${label}" min="${min}" max="${max}" step="1" value="${value}" required aria-describedby="design-error" /></label>`).join('')}</div>
<label for="${id}-rotation">Rotation (degrees)</label><input type="number" id="${id}-rotation" name="rotation" data-label="Rotation" data-unit="degrees" min="0" max="360" step="1" value="0" required aria-describedby="${id}-rotation-help design-error" />
<p id="${id}-rotation-help">Turns clockwise around the image’s center. Set 0° to reset; 360° is a full turn.</p>
<label class="image-preserve"><input type="checkbox" id="${id}-fit" checked /> Preserve proportions</label>
<label for="${id}-placement">Position relative to text</label><select id="${id}-placement"><option value="behind">Behind text</option><option value="front">In front of text</option></select>
<div class="image-layer-actions"><button type="button" data-action="lower">Lower layer</button><button type="button" data-action="raise">Raise layer</button><button type="button" data-action="remove">Remove image</button></div>`;
    const row = {
      element,
      src: /** @type {HTMLInputElement} */ (element.querySelector('input[type="url"]')),
      fields: /** @type {HTMLInputElement[]} */ (Array.from(element.querySelectorAll('input[type="number"]'))),
      fit: /** @type {HTMLInputElement} */ (element.querySelector('input[type="checkbox"]')),
      placement: /** @type {HTMLSelectElement} */ (element.querySelector('select')),
      lower: /** @type {HTMLButtonElement} */ (element.querySelector('[data-action="lower"]')),
      raise: /** @type {HTMLButtonElement} */ (element.querySelector('[data-action="raise"]')),
    };
    rows.push(row);
    container.append(element);
    element.addEventListener('input', () => { refreshLimit(); onChange(); });
    row.lower.addEventListener('click', () => move(row, -1));
    row.raise.addEventListener('click', () => move(row, 1));
    element.querySelector('[data-action="remove"]')?.addEventListener('click', () => {
      const index = rows.indexOf(row);
      rows.splice(index, 1);
      element.remove();
      refreshLimit();
      (rows[index]?.src || rows[index - 1]?.src || addButton).focus();
      onChange();
    });
    refreshLimit();
    row.src.focus();
    onChange();
  });

  function reset() {
    rows.splice(0).forEach(row => row.element.remove());
    refreshLimit();
  }
  refreshLimit();
  return { serialize, reset, refreshLimit };
}
