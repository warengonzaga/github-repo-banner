/** @param {string} id */
const element = (id) => {
  const node = document.getElementById(`usage-${id}`);
  if (!node) throw new Error(`Missing usage element: ${id}`);
  return node;
};
const refresh = /** @type {HTMLButtonElement} */ (element('refresh'));
const results = element('results');
const report = element('report');
const day = element('day');
const number = new Intl.NumberFormat();
const percent = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });
const utcTime = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
let loading = false;

element('host').textContent = window.location.host;

/** @param {string} title @param {string} description */
function status(title, description) {
  element('state-title').textContent = title;
  element('state-description').textContent = description;
}

// Reject incompatible or malformed data rather than presenting a false zero.
/** @param {{pageViews: {generator: number, documentation: number, usage: number, total: number, firstRecordedAt: string | null}, available: boolean, coverage: string, recordedBannerRequests: number, requestsWithRepositoryReferer: number, estimatedUniqueRepositories: number, repositoryRefererCoverage: number | null, window: {day: string, timezone: string, firstRecordedAt: string | null}}} data */
function validSnapshot(data) {
  const pages = data.pageViews;
  if (!pages) return false;
  const counts = [data.recordedBannerRequests, data.requestsWithRepositoryReferer, data.estimatedUniqueRepositories,
    pages.generator, pages.documentation, pages.usage, pages.total];
  const coverage = data.repositoryRefererCoverage;
  const window = data.window;
  return data.available === true && data.coverage === 'partial' &&
    counts.every((value) => Number.isSafeInteger(value) && value >= 0) &&
    pages.total === pages.generator + pages.documentation + pages.usage &&
    (pages.firstRecordedAt === null || (typeof pages.firstRecordedAt === 'string' && Number.isFinite(Date.parse(pages.firstRecordedAt)))) &&
    data.requestsWithRepositoryReferer <= data.recordedBannerRequests &&
    (data.recordedBannerRequests === 0 ? coverage === null :
      typeof coverage === 'number' && Number.isFinite(coverage) && coverage >= 0 && coverage <= 1) &&
    window?.timezone === 'UTC' && /^\d{4}-\d{2}-\d{2}$/.test(window.day) &&
    (window.firstRecordedAt === null || (typeof window.firstRecordedAt === 'string' && Number.isFinite(Date.parse(window.firstRecordedAt))));
}

async function loadUsage() {
  if (loading) return;
  loading = true;
  refresh.disabled = true;
  refresh.textContent = 'Refreshing…';
  report.setAttribute('aria-busy', 'true');
  results.hidden = true;
  day.textContent = '—';
  day.removeAttribute('datetime');
  status('Loading usage', 'Fetching the latest observations from this instance.');
  try {
    const response = await fetch('/stats', { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error('Statistics unavailable');
    const data = await response.json();
    if (!data || data.schemaVersion !== 2 || typeof data.enabled !== 'boolean') throw new Error('Unsupported statistics');
    if (!data.enabled) {
      status('Usage tracking is off', 'This instance has disabled optional usage tracking. No public counts are available; the banner generator still works.');
      return;
    }
    if (!validSnapshot(data)) throw new Error('Invalid statistics');
    day.textContent = data.window.day;
    day.setAttribute('datetime', data.window.day);
    for (const page of ['generator', 'documentation', 'usage', 'total']) {
      element(`page-${page}`).textContent = number.format(data.pageViews[page]);
    }
    element('pages-window').textContent = data.pageViews.firstRecordedAt
      ? `First recorded page view: ${utcTime.format(new Date(data.pageViews.firstRecordedAt))} UTC.`
      : 'No page views recorded for this UTC day.';
    const exportTotal = Number.isSafeInteger(data.exports?.total) && data.exports.total >= 0 ? data.exports.total : null;
    element('exports').textContent = exportTotal === null ? 'Not available' : number.format(exportTotal);
    element('requests').textContent = number.format(data.recordedBannerRequests);
    element('repositories').textContent = number.format(data.estimatedUniqueRepositories);
    element('referred').textContent = number.format(data.requestsWithRepositoryReferer);
    element('coverage').textContent = data.repositoryRefererCoverage === null ? 'Not available' : percent.format(data.repositoryRefererCoverage);
    element('window').textContent = data.window.firstRecordedAt
      ? `First recorded banner request: ${utcTime.format(new Date(data.window.firstRecordedAt))} UTC. This may cover only part of the day.`
      : 'No banner request has been recorded for this UTC day.';
    element('updated').textContent = `Fetched at ${utcTime.format(new Date())} UTC. Refresh to check for newer observations.`;
    const empty = data.recordedBannerRequests === 0 && data.pageViews.total === 0 && exportTotal === 0;
    status(empty ? 'No observations recorded today' : 'Latest observations loaded',
      empty ? 'Zero recorded requests does not mean zero users. Caches, opt-outs and unrecorded periods affect this view.' : 'Daily observations, not lifetime totals. Includes previews, bots and retries.');
    results.hidden = false;
  } catch {
    status('Statistics are unavailable', 'We could not load a reliable snapshot. Try refreshing in a moment, or use the generator while statistics recover.');
    refresh.textContent = 'Try again';
  } finally {
    loading = false;
    report.setAttribute('aria-busy', 'false');
    refresh.disabled = false;
    if (refresh.textContent !== 'Try again') refresh.textContent = 'Refresh statistics';
  }
}

refresh.addEventListener('click', loadUsage);
loadUsage();
