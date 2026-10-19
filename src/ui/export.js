/** @typedef {{action: 'markdown'|'url'|'svg'|'png', url: string, text: string, filename: string}} Snapshot */

/** @param {Snapshot} snapshot @param {HTMLButtonElement} button */
export async function beginExport(snapshot, button) {
  const feedback = document.getElementById('export-feedback');
  const copying = snapshot.action === 'markdown' || snapshot.action === 'url';
  try {
    if (copying) {
      await navigator.clipboard.writeText(snapshot.text);
      if (feedback) feedback.textContent = 'Copied to clipboard.';
    } else {
      const response = await fetch(snapshot.url, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok || !response.headers.get('Content-Type')?.startsWith('image/svg+xml')) {
        throw new Error('The banner could not be rendered. Try exporting again.');
      }
      let blob = await response.blob();
      if (snapshot.action === 'png') {
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await blob.text())}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 304;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('PNG conversion is unavailable. Try SVG instead.');
        context.drawImage(image, 0, 0);
        blob = await new Promise((resolve, reject) => canvas.toBlob(
          (value) => value ? resolve(value) : reject(new Error('PNG conversion failed. Try SVG instead.')),
          'image/png',
        ));
      }
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `${snapshot.filename}.${snapshot.action}`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      if (feedback) feedback.textContent = 'Download started.';
    }
    button.classList.add('copied');
    setTimeout(() => button.classList.remove('copied'), 2000);
  } catch (error) {
    if (feedback) feedback.textContent = error instanceof Error ? error.message : 'Export failed. Please try again.';
  }
}
