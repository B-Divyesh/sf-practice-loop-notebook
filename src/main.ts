import './styles.css';
import { deletePassage, getPassages, mergePassages, putPassage } from './db';
import { BILLING_BASE, captureReturnedLicense, CHECKOUT_URL, clearLicense, hasOptimisticUnlock, saveLicense, verifyLicense } from './license';
import type { Passage, PracticeSession } from './types';
import { clampLoop, formatTime, makeArchive, nextRampBpm, parseArchive, passagesToCsv, variedBpm } from './utils';

const app = document.querySelector<HTMLDivElement>('#app')!;
let passages: Passage[] = [];
let selectedId: string | null = null;
let unlocked = false;
let mediaUrl: string | null = null;
let repetitionCount = 0;
let sessionStartedAt = new Date().toISOString();
let metronome: Metronome | null = null;
let globalNotice = '';

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);

class Metronome {
  private context: AudioContext | null = null;
  private timer = 0;
  private beat = 0;
  active = false;

  async start(bpm: () => number, volume: () => number): Promise<void> {
    if (this.active) return;
    this.active = true;
    this.context = this.context ?? new AudioContext();
    await this.context.resume();
    const tick = () => {
      if (!this.active || !this.context) return;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.frequency.value = this.beat % 4 === 0 ? 1040 : 760;
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume() * 0.22), this.context.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.045);
      oscillator.connect(gain).connect(this.context.destination);
      oscillator.start();
      oscillator.stop(this.context.currentTime + 0.05);
      this.beat += 1;
      this.timer = window.setTimeout(tick, 60_000 / bpm());
    };
    tick();
  }

  stop(): void {
    this.active = false;
    window.clearTimeout(this.timer);
  }
}

function shell(content: string, active = 'notebook'): string {
  const offline = navigator.onLine ? '' : '<span class="status-chip offline">Offline · saved locally</span>';
  return `
    <header class="site-header">
      <a class="wordmark" href="/" data-link aria-label="Practice Loop Notebook home"><span aria-hidden="true" class="logo-mark">A↺B</span><span>Loop Notebook</span></a>
      <nav aria-label="Primary">
        <a href="/" data-link ${active === 'notebook' ? 'aria-current="page"' : ''}>Notebook</a>
        <a href="/unlock" data-link ${active === 'unlock' ? 'aria-current="page"' : ''}>${unlocked ? 'Unlocked' : 'Get full archive'}</a>
      </nav>
      ${offline}
    </header>
    ${globalNotice ? `<div class="global-notice" role="status">${escapeHtml(globalNotice)}</div>` : ''}
    ${content}
    <footer>
      <p>Private by design. Your recordings and notes stay on this device.</p>
      <nav aria-label="Legal"><a href="/privacy" data-link>Privacy</a><a href="/terms" data-link>Terms</a></nav>
      <p class="generated-note">Original pixel artwork generated for this product.</p>
    </footer>
    <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>`;
}

function landing(): string {
  const passageItems = passages.length ? passages.map((passage, index) => {
    const canOpen = unlocked || index < 3;
    const progress = Math.min(100, Math.round((nextRampBpm(passage) / Math.max(passage.endBpm, passage.bpm)) * 100));
    return `<li class="passage-row">
      <button class="passage-open" ${canOpen ? `data-open="${passage.id}"` : 'data-locked="true"'}>
        <span class="row-main"><strong>${escapeHtml(passage.title)}</strong><span>${escapeHtml(passage.mediaName || 'Media needs reattaching')}</span></span>
        <span class="row-stats"><span>${passage.sessions.length} session${passage.sessions.length === 1 ? '' : 's'}</span><span>${canOpen ? `${nextRampBpm(passage)} BPM` : 'Full archive · locked'}</span></span>
        <span class="mini-progress" aria-label="Tempo plan ${progress}%"><i style="width:${progress}%"></i></span>
      </button>
      <button class="icon-button danger-button" data-delete="${passage.id}" aria-label="Delete ${escapeHtml(passage.title)}">×</button>
    </li>`;
  }).join('') : `<li class="empty-list"><span aria-hidden="true">□ □ □</span><p>No passages yet. Your first difficult few seconds belong here.</p></li>`;

  return shell(`<main id="main">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">A deliberate-practice loop station</p>
        <h1>Turn a tricky few seconds into a clear next step.</h1>
        <p>Loop your own recording, count focused passes, follow a tempo plan, and leave evidence for tomorrow. Everything stays on this device.</p>
        <a class="button primary" href="#new-passage">Set up a passage <span aria-hidden="true">↓</span></a>
        <div class="hero-facts" aria-label="Product features"><span>Offline</span><span>No account</span><span>Own your export</span></div>
      </div>
      <figure class="hero-art">
        <img src="/assets/loop-desk.webp" width="1152" height="768" alt="Pixel-art rehearsal desk with a cassette player, looping cable, metronome, and practice notebook" fetchpriority="high" decoding="async">
        <figcaption>A passage, a constraint, a trace of progress.</figcaption>
      </figure>
    </section>

    <section class="notebook-grid" aria-labelledby="archive-heading">
      <div class="archive-block">
        <div class="section-heading"><div><p class="eyebrow">Saved locally</p><h2 id="archive-heading">Passage archive</h2></div><span class="count-chip">${passages.length}${unlocked ? ' · full' : ' / 3 free'}</span></div>
        <ul class="passage-list">${passageItems}</ul>
        <div class="archive-actions">
          <button class="button secondary" id="export-json" ${passages.length ? '' : 'disabled'}>Export archive</button>
          <button class="button secondary" id="export-csv" ${passages.some((passage) => passage.sessions.length) ? '' : 'disabled'}>Export CSV</button>
          <label class="button secondary file-button">Import archive<input id="import-json" type="file" accept="application/json,.json"></label>
        </div>
        <p class="microcopy">Archive exports include plans and practice logs, not the original media file.</p>
      </div>

      <section class="new-passage" id="new-passage" aria-labelledby="new-heading">
        <p class="eyebrow">New loop</p><h2 id="new-heading">Set the passage on the stand</h2>
        ${!unlocked && passages.length >= 3 ? `<div class="limit-note"><strong>Your free archive is full.</strong><p>Keep practicing these three, delete one, or unlock unlimited passages once.</p><a class="button primary" href="/unlock" data-link>See the one-time unlock</a></div>` : `
        <form id="new-form" novalidate>
          <div class="field"><label for="passage-title">Passage name</label><input id="passage-title" name="title" required maxlength="80" autocomplete="off"><span class="field-hint">Try “Bridge pickup run” or “Bars 17–20.”</span></div>
          <div class="field"><label for="media-file">Your audio or video file</label><label class="drop-zone" for="media-file"><span class="drop-icon" aria-hidden="true">♪</span><strong>Choose a local recording</strong><span>MP3, WAV, M4A, MP4, or another format your browser plays</span></label><input class="visually-hidden" id="media-file" name="media" type="file" accept="audio/*,video/*" required><output id="file-name" class="selected-file">No file selected</output></div>
          <div class="field"><label for="source-note">Source note <span>(optional)</span></label><input id="source-note" name="sourceNote" maxlength="120" placeholder="My phone recording, rehearsal 28 Aug"></div>
          <p id="form-error" class="form-error" role="alert"></p>
          <button class="button primary wide" type="submit">Create loop</button>
          <p class="privacy-line"><span aria-hidden="true">◆</span> Imported media never leaves this browser.</p>
        </form>`}
      </section>
    </section>
  </main>`);
}

function practice(passage: Passage): string {
  const sessions = passage.sessions.length ? passage.sessions.map((session) => `<li class="session-card">
    <div class="session-date"><strong>${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(session.endedAt))}</strong><span>${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(session.endedAt))}</span></div>
    <div><p>${escapeHtml(session.reflection || 'No reflection added.')}</p><span class="session-meta">${session.repetitions} passes · ${session.bpm} BPM · confidence ${session.confidence}/5</span></div>
    <span class="criterion ${session.criterionMet ? 'met' : ''}">${session.criterionMet ? '✓ criterion met' : '↗ keep working'}</span>
  </li>`).join('') : '<li class="empty-session">No sessions logged yet. This pass can become your baseline.</li>';
  const mediaMissing = !passage.media;
  const bpm = nextRampBpm(passage);
  const passCells = Array.from({ length: Math.min(passage.targetReps, 16) }, (_, index) => `<i data-pass-cell="${index}"></i>`).join('');
  return shell(`<main id="main" class="practice-main">
    <div class="practice-topline"><button class="back-link" id="back-to-archive">← Passage archive</button><span class="save-state" id="save-state">Saved locally</span></div>
    <section class="practice-title"><div><p class="eyebrow">Now looping</p><h1>${escapeHtml(passage.title)}</h1><p>${escapeHtml(passage.sourceNote || passage.mediaName)}</p></div><span class="session-clock" id="session-clock">Session 00:00</span></section>

    <div class="practice-layout">
      <section class="player-panel" aria-labelledby="player-heading">
        <h2 class="visually-hidden" id="player-heading">Loop player</h2>
        ${mediaMissing ? `<div class="media-missing"><span aria-hidden="true">▧</span><h3>Reconnect the recording</h3><p>The plan was imported without media. Choose the original file to keep practicing.</p><label class="button primary file-button">Attach media<input id="reattach-media" type="file" accept="audio/*,video/*"></label></div>` : `<div id="media-mount" class="media-mount ${passage.mediaType.startsWith('video') ? 'video-mount' : 'audio-mount'}"></div>`}
        <div class="timeline-block">
          <input id="timeline" class="timeline" type="range" min="0" max="${passage.duration}" step="0.01" value="${passage.loopStart}" aria-label="Recording position" ${mediaMissing ? 'disabled' : ''}>
          <div class="time-readout"><span id="current-time">${formatTime(passage.loopStart)}</span><span>${formatTime(passage.duration)}</span></div>
        </div>
        <div class="transport">
          <button id="jump-a" class="key-button" ${mediaMissing ? 'disabled' : ''}><kbd>A</kbd><span>Jump to start</span></button>
          <button id="play-toggle" class="play-button" ${mediaMissing ? 'disabled' : ''} aria-label="Play loop"><span aria-hidden="true">▶</span></button>
          <button id="jump-b" class="key-button" ${mediaMissing ? 'disabled' : ''}><kbd>B</kbd><span>Jump near end</span></button>
        </div>
        <form id="loop-form" class="marker-strip">
          <label>A · loop starts <span><input id="loop-start" type="number" min="0" max="${passage.duration}" step="0.1" value="${passage.loopStart.toFixed(1)}"> sec</span></label>
          <span class="loop-length" id="loop-length">↔ ${(passage.loopEnd - passage.loopStart).toFixed(1)}s</span>
          <label>B · loop ends <span><input id="loop-end" type="number" min="0" max="${passage.duration}" step="0.1" value="${passage.loopEnd.toFixed(1)}"> sec</span></label>
          <div class="marker-actions"><button type="button" class="text-button" id="set-a">Set A at playhead</button><button type="button" class="text-button" id="set-b">Set B at playhead</button></div>
        </form>
        <div class="speed-control"><label for="speed">Recording speed</label><input id="speed" type="range" min="0.5" max="1.25" value="${passage.playbackRate}" step="0.05"><output id="speed-output">${Math.round(passage.playbackRate * 100)}%</output></div>
      </section>

      <aside class="plan-panel" aria-labelledby="plan-heading">
        <div class="section-heading"><div><p class="eyebrow">Practice lane</p><h2 id="plan-heading">Today’s constraint</h2></div><button id="edit-plan" class="text-button">Edit plan</button></div>
        <div id="plan-summary" class="plan-summary"><span class="plan-number">${bpm}</span><span>BPM ${passage.planMode === 'ramp' ? `toward ${passage.endBpm}` : passage.planMode}</span></div>
        <form id="plan-form" class="plan-form" hidden>
          <label>Plan<select id="plan-mode"><option value="steady" ${passage.planMode === 'steady' ? 'selected' : ''}>Steady tempo</option><option value="ramp" ${passage.planMode === 'ramp' ? 'selected' : ''}>Ramp after success</option><option value="variable" ${passage.planMode === 'variable' ? 'selected' : ''}>Controlled variability</option></select></label>
          <div class="field-pair"><label>Start BPM<input id="plan-bpm" type="number" min="20" max="300" value="${passage.bpm}"></label><label>End BPM<input id="plan-end-bpm" type="number" min="20" max="300" value="${passage.endBpm}"></label></div>
          <div class="field-pair"><label>Step BPM<input id="plan-step" type="number" min="1" max="30" value="${passage.bpmStep}"></label><label>Variation ± BPM<input id="plan-variance" type="number" min="0" max="30" value="${passage.variance}"></label></div>
          <label>Passes per session<input id="plan-reps" type="number" min="1" max="100" value="${passage.targetReps}"></label>
          <label>Exit criterion<input id="plan-criterion" maxlength="120" value="${escapeHtml(passage.exitCriterion)}"></label>
          <button class="button primary" type="submit">Save plan</button>
        </form>
        <div class="metronome-row"><button id="metronome-toggle" class="button secondary"><span aria-hidden="true">♩</span> Start click</button><label for="click-volume">Click volume</label><input id="click-volume" type="range" min="0" max="1" step="0.1" value="0.7" aria-label="Click volume"></div>
        <div class="pass-counter"><div><span class="counter-label">Clean passes</span><strong id="repetition-count">0 <small>/ ${passage.targetReps}</small></strong></div><div class="pass-cells" id="pass-cells" aria-hidden="true">${passCells}</div><button class="button primary wide" id="add-pass">Count one clean pass</button></div>
        <div class="exit-box"><span>Exit when</span><p>${escapeHtml(passage.exitCriterion)}</p></div>
      </aside>
    </div>

    <section class="reflection-block" aria-labelledby="reflection-heading">
      <div><p class="eyebrow">Close the loop</p><h2 id="reflection-heading">Leave tomorrow a useful note</h2><p>Log what changed while the sound is still in your ear.</p></div>
      <form id="reflection-form">
        <label for="reflection">Short reflection</label><textarea id="reflection" maxlength="280" rows="3" placeholder="What unlocked the passage? What should the next session test?"></textarea>
        <div class="reflection-options"><label>Confidence<select id="confidence"><option value="1">1 · uncertain</option><option value="2">2</option><option value="3" selected>3 · forming</option><option value="4">4</option><option value="5">5 · reliable</option></select></label><label class="check-label"><input id="criterion-met" type="checkbox"><span>I met today’s exit criterion</span></label></div>
        <button class="button primary" type="submit">Save session reflection</button>
      </form>
    </section>

    <section class="history-block" aria-labelledby="history-heading"><div class="section-heading"><div><p class="eyebrow">Evidence trail</p><h2 id="history-heading">Practice history</h2></div><button id="copy-card" class="button secondary" ${passage.sessions.length ? '' : 'disabled'}>Copy latest card</button></div><ol class="session-list">${sessions}</ol></section>
  </main>`);
}

function legal(kind: 'privacy' | 'terms'): string {
  const isPrivacy = kind === 'privacy';
  return shell(`<main id="main" class="prose-page"><p class="eyebrow">Plain-language policy · 28 August 2026</p><h1>${isPrivacy ? 'Privacy that behaves like a paper notebook.' : 'Fair terms for a personal practice tool.'}</h1>${isPrivacy ? `
    <h2>What stays on your device</h2><p>Your imported recordings, passage markers, plans, session counts, and reflections are stored in your browser’s IndexedDB. We do not receive, scan, or host them. Removing site data removes that local archive, so export it before clearing your browser.</p>
    <h2>License verification</h2><p>If you buy or restore the one-time unlock, your license token is stored in this browser. It is sent to Sociobot only to verify the purchase, at most once per day. Sociobot and Dodo act as merchant of record for checkout and refunds.</p>
    <h2>Analytics and third parties</h2><p>This app includes no analytics, advertising, trackers, third-party fonts, or runtime content delivery networks. The billing service is contacted only when you verify a license or follow the checkout link.</p>
    <h2>Your controls</h2><p>Use Export archive and Export CSV to keep your notes. Delete individual passages in the archive. For privacy questions, email <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>` : `
    <h2>Use and ownership</h2><p>You may use this software for personal practice with recordings you have the right to use. You keep ownership of your media and notes. Do not use the app to obtain or redistribute recordings unlawfully.</p>
    <h2>The free and full versions</h2><p>The free version keeps up to three passages. The $12 one-time license unlocks an unlimited passage archive for this product. Core export, accessibility, offline use, and all practice tools remain free. Purchases are handled by Sociobot/Dodo as merchant of record. A refund revokes the associated license.</p>
    <h2>Availability</h2><p>The app is provided “as is” without a promise that every media codec will work in every browser. Keep exports and your original recordings. We may update the software and these terms while preserving reasonable access to purchased features.</p>
    <h2>Contact</h2><p>Questions about these terms can go to <a href="mailto:support@sociobot.in">support@sociobot.in</a>.</p>`}<a class="button secondary" href="/" data-link>Return to notebook</a></main>`, kind);
}

function unlockPage(): string {
  return shell(`<main id="main" class="unlock-page">
    <section class="unlock-hero"><div><p class="eyebrow">One-time full archive</p><h1>${unlocked ? 'Your full archive is unlocked.' : 'Keep every passage. Never rent your notebook.'}</h1><p>The free notebook is complete for three passages. A one-time license removes that archive limit—no account, subscription, or cloud storage.</p></div><div class="price-card"><span class="price">$12</span><span>one time</span><ul><li>Unlimited saved passages</li><li>All future v1 updates</li><li>Same private, offline storage</li></ul>${unlocked ? '<p class="success-line">✓ License active on this device</p><button id="remove-license" class="button secondary">Remove from this device</button>' : `<a class="button primary wide" href="${CHECKOUT_URL}">Buy the full archive</a>`}</div></section>
    <section class="restore-block"><div><h2>Restore a purchase</h2><p>Paste the license from your receipt to use it on this device.</p></div><form id="license-form"><label for="license-token">License token</label><div class="inline-field"><input id="license-token" autocomplete="off" spellcheck="false"><button class="button secondary">Verify license</button></div><p id="license-status" role="status"></p></form></section>
    <p class="legal-line">Checkout and refunds are handled by Sociobot/Dodo, the merchant of record. By buying, you agree to the <a href="/terms" data-link>terms</a> and <a href="/privacy" data-link>privacy policy</a>.</p>
  </main>`, 'unlock');
}

function render(): void {
  revokeMediaUrl();
  const path = location.pathname;
  const params = new URLSearchParams(location.search);
  selectedId = path === '/' ? params.get('passage') : null;
  if (path === '/privacy') app.innerHTML = legal('privacy');
  else if (path === '/terms') app.innerHTML = legal('terms');
  else if (path === '/unlock') app.innerHTML = unlockPage();
  else {
    const passageIndex = passages.findIndex((item) => item.id === selectedId);
    const passage = passageIndex >= 0 && (unlocked || passageIndex < 3) ? passages[passageIndex] : undefined;
    app.innerHTML = passage ? practice(passage) : landing();
    if (passage) setupPractice(passage);
  }
  setupSharedHandlers();
}

function setupSharedHandlers(): void {
  document.querySelectorAll<HTMLAnchorElement>('[data-link]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey) return;
    event.preventDefault();
    history.pushState({}, '', link.href);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-open]').forEach((button) => button.addEventListener('click', () => navigate(`/?passage=${button.dataset.open}`)));
  document.querySelectorAll<HTMLButtonElement>('[data-locked]').forEach((button) => button.addEventListener('click', () => navigate('/unlock')));
  document.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach((button) => button.addEventListener('click', async () => {
    const passage = passages.find((item) => item.id === button.dataset.delete);
    if (!passage || !confirm(`Delete “${passage.title}” and its ${passage.sessions.length} practice sessions from this device?`)) return;
    await deletePassage(passage.id);
    passages = passages.filter((item) => item.id !== passage.id);
    showNotice(`Deleted ${passage.title}.`);
    render();
  }));
  document.querySelector('#new-form')?.addEventListener('submit', createPassage);
  const fileInput = document.querySelector<HTMLInputElement>('#media-file');
  fileInput?.addEventListener('change', () => {
    const output = document.querySelector<HTMLOutputElement>('#file-name');
    if (output) output.textContent = fileInput.files?.[0]?.name ?? 'No file selected';
  });
  document.querySelector('#export-json')?.addEventListener('click', () => download(`loop-notebook-${dateStamp()}.json`, JSON.stringify(makeArchive(passages), null, 2), 'application/json'));
  document.querySelector('#export-csv')?.addEventListener('click', () => download(`practice-log-${dateStamp()}.csv`, passagesToCsv(passages), 'text/csv'));
  document.querySelector<HTMLInputElement>('#import-json')?.addEventListener('change', importArchive);
  document.querySelector('#license-form')?.addEventListener('submit', restoreLicense);
  document.querySelector('#remove-license')?.addEventListener('click', () => { clearLicense(); unlocked = false; render(); });
}

async function createPassage(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const error = document.querySelector<HTMLParagraphElement>('#form-error')!;
  const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim();
  const sourceNote = (form.elements.namedItem('sourceNote') as HTMLInputElement).value.trim();
  const file = (form.elements.namedItem('media') as HTMLInputElement).files?.[0];
  if (!title || !file) { error.textContent = 'Add a passage name and choose a recording to continue.'; return; }
  if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) { error.textContent = 'Choose an audio or video file your browser can play.'; return; }
  error.textContent = 'Reading the recording…';
  try {
    const duration = await readDuration(file);
    const now = new Date().toISOString();
    const passage: Passage = { id: crypto.randomUUID(), title, sourceNote, mediaName: file.name, mediaType: file.type, media: file, duration, loopStart: 0, loopEnd: Math.min(duration, 8), playbackRate: 1, planMode: 'ramp', bpm: 60, endBpm: 100, bpmStep: 5, variance: 4, targetReps: 5, exitCriterion: '3 clean passes without a stop', sessions: [], createdAt: now, updatedAt: now };
    await putPassage(passage);
    passages.unshift(passage);
    navigate(`/?passage=${passage.id}`);
  } catch (reason) {
    error.textContent = reason instanceof Error ? reason.message : 'Could not save this recording. Try a smaller file or another format.';
  }
}

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const element = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
    const url = URL.createObjectURL(file);
    element.preload = 'metadata';
    element.onloadedmetadata = () => { const duration = element.duration; URL.revokeObjectURL(url); Number.isFinite(duration) && duration > 0 ? resolve(duration) : reject(new Error('The recording has no readable duration.')); };
    element.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This browser cannot read that media format. Try MP3, WAV, M4A, or MP4.')); };
    element.src = url;
  });
}

function setupPractice(passage: Passage): void {
  repetitionCount = 0;
  sessionStartedAt = new Date().toISOString();
  metronome = new Metronome();
  let media: HTMLMediaElement | null = null;
  if (passage.media) {
    media = document.createElement(passage.mediaType.startsWith('video/') ? 'video' : 'audio');
    mediaUrl = URL.createObjectURL(passage.media);
    media.src = mediaUrl;
    media.preload = 'auto';
    media.setAttribute('playsinline', '');
    media.setAttribute('aria-label', passage.mediaType.startsWith('video/') ? `Video for ${passage.title}` : `Audio for ${passage.title}`);
    if (media instanceof HTMLVideoElement) media.poster = '/assets/loop-desk.webp';
    document.querySelector('#media-mount')?.append(media);
    media.currentTime = passage.loopStart;
    media.playbackRate = passage.playbackRate;
    let rewinding = false;
    media.addEventListener('timeupdate', () => {
      const timeline = document.querySelector<HTMLInputElement>('#timeline');
      const current = document.querySelector('#current-time');
      if (timeline) timeline.value = String(media!.currentTime);
      if (current) current.textContent = formatTime(media!.currentTime);
      if (!rewinding && media!.currentTime >= passage.loopEnd) {
        rewinding = true;
        media!.currentTime = passage.loopStart;
        countPass(passage);
        requestAnimationFrame(() => { rewinding = false; });
      }
    });
    media.addEventListener('play', updatePlayButton);
    media.addEventListener('pause', updatePlayButton);
  }

  const play = () => media && (media.paused ? media.play().catch(() => showNotice('Playback needs one more press to start.')) : media.pause());
  document.querySelector('#play-toggle')?.addEventListener('click', play);
  document.querySelector('#jump-a')?.addEventListener('click', () => { if (media) media.currentTime = passage.loopStart; });
  document.querySelector('#jump-b')?.addEventListener('click', () => { if (media) media.currentTime = Math.max(passage.loopStart, passage.loopEnd - 1); });
  document.querySelector<HTMLInputElement>('#timeline')?.addEventListener('input', (event) => { if (media) media.currentTime = Number((event.target as HTMLInputElement).value); });
  document.querySelector<HTMLInputElement>('#speed')?.addEventListener('input', async (event) => { passage.playbackRate = Number((event.target as HTMLInputElement).value); if (media) media.playbackRate = passage.playbackRate; document.querySelector('#speed-output')!.textContent = `${Math.round(passage.playbackRate * 100)}%`; await persist(passage); });
  document.querySelector('#set-a')?.addEventListener('click', () => setMarker('a', passage, media));
  document.querySelector('#set-b')?.addEventListener('click', () => setMarker('b', passage, media));
  document.querySelector('#loop-form')?.addEventListener('change', async () => {
    const [a, b] = clampLoop(Number((document.querySelector('#loop-start') as HTMLInputElement).value), Number((document.querySelector('#loop-end') as HTMLInputElement).value), passage.duration);
    passage.loopStart = a; passage.loopEnd = b; syncMarkerUi(passage); await persist(passage);
  });
  document.querySelector('#add-pass')?.addEventListener('click', () => countPass(passage));
  document.querySelector('#edit-plan')?.addEventListener('click', () => { const form = document.querySelector<HTMLFormElement>('#plan-form')!; form.hidden = !form.hidden; if (!form.hidden) (form.querySelector('select') as HTMLSelectElement).focus(); });
  document.querySelector('#plan-form')?.addEventListener('submit', (event) => savePlan(event, passage));
  document.querySelector('#metronome-toggle')?.addEventListener('click', () => toggleMetronome(passage));
  document.querySelector('#reflection-form')?.addEventListener('submit', (event) => saveReflection(event, passage));
  document.querySelector('#back-to-archive')?.addEventListener('click', () => navigate('/'));
  document.querySelector('#copy-card')?.addEventListener('click', () => copyLatestCard(passage));
  document.querySelector<HTMLInputElement>('#reattach-media')?.addEventListener('change', (event) => reattachMedia(event, passage));
  const timer = window.setInterval(() => {
    if (!document.querySelector('#session-clock')) { window.clearInterval(timer); return; }
    const elapsed = Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000);
    document.querySelector('#session-clock')!.textContent = `Session ${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  }, 1000);
  document.addEventListener('keydown', practiceKeys);

  function practiceKeys(event: KeyboardEvent): void {
    if (!document.querySelector('.practice-main')) { document.removeEventListener('keydown', practiceKeys); return; }
    const target = event.target as HTMLElement;
    if (/INPUT|TEXTAREA|SELECT|BUTTON/.test(target.tagName)) return;
    if (event.key === ' ') { event.preventDefault(); play(); }
    if (event.key.toLowerCase() === 'a') setMarker('a', passage, media);
    if (event.key.toLowerCase() === 'b') setMarker('b', passage, media);
    if (event.key === 'ArrowLeft' && media) media.currentTime = Math.max(0, media.currentTime - 1);
    if (event.key === 'ArrowRight' && media) media.currentTime = Math.min(passage.duration, media.currentTime + 1);
  }
  function updatePlayButton(): void {
    const button = document.querySelector<HTMLButtonElement>('#play-toggle');
    if (!button || !media) return;
    button.innerHTML = media.paused ? '<span aria-hidden="true">▶</span>' : '<span aria-hidden="true">Ⅱ</span>';
    button.setAttribute('aria-label', media.paused ? 'Play loop' : 'Pause loop');
  }
}

async function setMarker(which: 'a' | 'b', passage: Passage, media: HTMLMediaElement | null): Promise<void> {
  if (!media) return;
  const [a, b] = clampLoop(which === 'a' ? media.currentTime : passage.loopStart, which === 'b' ? media.currentTime : passage.loopEnd, passage.duration);
  passage.loopStart = a; passage.loopEnd = b; syncMarkerUi(passage); await persist(passage); showNotice(`${which.toUpperCase()} marker set at ${formatTime(which === 'a' ? a : b)}.`);
}

function syncMarkerUi(passage: Passage): void {
  (document.querySelector('#loop-start') as HTMLInputElement).value = passage.loopStart.toFixed(1);
  (document.querySelector('#loop-end') as HTMLInputElement).value = passage.loopEnd.toFixed(1);
  document.querySelector('#loop-length')!.textContent = `↔ ${(passage.loopEnd - passage.loopStart).toFixed(1)}s`;
}

function countPass(passage: Passage): void {
  repetitionCount += 1;
  const count = document.querySelector('#repetition-count');
  if (count) count.innerHTML = `${repetitionCount} <small>/ ${passage.targetReps}</small>`;
  document.querySelectorAll<HTMLElement>('[data-pass-cell]').forEach((cell, index) => cell.classList.toggle('filled', index < repetitionCount));
  if (repetitionCount === passage.targetReps) showNotice('Target reached. Listen once more or close the loop with a reflection.');
}

async function savePlan(event: Event, passage: Passage): Promise<void> {
  event.preventDefault();
  passage.planMode = (document.querySelector('#plan-mode') as HTMLSelectElement).value as Passage['planMode'];
  passage.bpm = Number((document.querySelector('#plan-bpm') as HTMLInputElement).value);
  passage.endBpm = Number((document.querySelector('#plan-end-bpm') as HTMLInputElement).value);
  passage.bpmStep = Number((document.querySelector('#plan-step') as HTMLInputElement).value);
  passage.variance = Number((document.querySelector('#plan-variance') as HTMLInputElement).value);
  passage.targetReps = Number((document.querySelector('#plan-reps') as HTMLInputElement).value);
  passage.exitCriterion = (document.querySelector('#plan-criterion') as HTMLInputElement).value.trim() || '3 clean passes without a stop';
  await persist(passage); render(); showNotice('Practice plan saved.');
}

function toggleMetronome(passage: Passage): void {
  const button = document.querySelector<HTMLButtonElement>('#metronome-toggle')!;
  if (!metronome) return;
  if (metronome.active) { metronome.stop(); button.innerHTML = '<span aria-hidden="true">♩</span> Start click'; button.classList.remove('active'); return; }
  let beat = 0;
  metronome.start(
    () => passage.planMode === 'variable' ? variedBpm(nextRampBpm(passage), passage.variance, beat++) : nextRampBpm(passage),
    () => Number(document.querySelector<HTMLInputElement>('#click-volume')?.value ?? 0.7),
  );
  button.innerHTML = '<span aria-hidden="true">■</span> Stop click'; button.classList.add('active');
}

async function saveReflection(event: Event, passage: Passage): Promise<void> {
  event.preventDefault();
  const reflection = (document.querySelector('#reflection') as HTMLTextAreaElement).value.trim();
  const confidence = Number((document.querySelector('#confidence') as HTMLSelectElement).value) as PracticeSession['confidence'];
  const criterionMet = (document.querySelector('#criterion-met') as HTMLInputElement).checked;
  const now = new Date().toISOString();
  passage.sessions.unshift({ id: crypto.randomUUID(), startedAt: sessionStartedAt, endedAt: now, repetitions: repetitionCount, bpm: nextRampBpm(passage), criterionMet, reflection, confidence });
  passage.updatedAt = now;
  await putPassage(passage);
  passages.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  render(); showNotice('Session saved. Your next tempo is ready.');
}

async function reattachMedia(event: Event, passage: Passage): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try { passage.duration = await readDuration(file); passage.media = file; passage.mediaName = file.name; passage.mediaType = file.type; [passage.loopStart, passage.loopEnd] = clampLoop(passage.loopStart, passage.loopEnd, passage.duration); await persist(passage); render(); showNotice('Recording reattached and saved locally.'); }
  catch (reason) { showNotice(reason instanceof Error ? reason.message : 'Could not attach that recording.'); }
}

async function copyLatestCard(passage: Passage): Promise<void> {
  const latest = passage.sessions[0];
  if (!latest) return;
  const card = `${passage.title}\n${latest.repetitions} passes · ${latest.bpm} BPM · ${latest.criterionMet ? 'criterion met' : 'continuing'}\n${latest.reflection || 'No reflection'}`;
  await navigator.clipboard.writeText(card);
  showNotice('Latest practice card copied.');
}

async function importArchive(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const imported = parseArchive(await file.text());
    const existingIds = new Set(passages.map((passage) => passage.id));
    const openSlots = unlocked ? imported.length : Math.max(0, 3 - passages.length);
    let additions = 0;
    const allowed = imported.filter((passage) => existingIds.has(passage.id) || unlocked || additions++ < openSlots);
    const skipped = imported.length - allowed.length;
    const count = await mergePassages(allowed);
    passages = await getPassages();
    showNotice(`Imported ${count} new or newer passage${count === 1 ? '' : 's'}${skipped ? `; ${skipped} exceeded the free three-passage limit` : ''}. Reattach media when you open one.`);
    render();
  } catch (reason) { showNotice(reason instanceof Error ? reason.message : 'That archive could not be imported.'); input.value = ''; }
}

async function restoreLicense(event: Event): Promise<void> {
  event.preventDefault();
  const input = document.querySelector<HTMLInputElement>('#license-token')!;
  const status = document.querySelector<HTMLParagraphElement>('#license-status')!;
  if (!input.value.trim()) { status.textContent = 'Paste the complete license token from your receipt.'; return; }
  saveLicense(input.value);
  status.textContent = 'Checking the license…';
  try {
    const result = await verifyLicense(true);
    if (result.valid) { unlocked = true; globalNotice = 'Full archive unlocked on this device.'; render(); }
    else { clearLicense(); unlocked = false; status.textContent = `That license is not active (${result.reason.replaceAll('_', ' ')}). Check the token or buy a new license.`; }
  } catch (reason) { unlocked = hasOptimisticUnlock(); status.textContent = reason instanceof Error ? reason.message : 'Could not reach the license service.'; }
}

async function persist(passage: Passage): Promise<void> {
  passage.updatedAt = new Date().toISOString();
  await putPassage(passage);
  const state = document.querySelector('#save-state');
  if (state) { state.textContent = 'Saved locally ✓'; window.setTimeout(() => { if (state) state.textContent = 'Saved locally'; }, 1200); }
}

function download(name: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function navigate(url: string): void { history.pushState({}, '', url); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function showNotice(message: string): void { const toast = document.querySelector<HTMLDivElement>('#toast'); if (!toast) { globalNotice = message; return; } toast.textContent = message; toast.hidden = false; window.setTimeout(() => { toast.hidden = true; }, 5000); }
function revokeMediaUrl(): void { metronome?.stop(); metronome = null; if (mediaUrl) URL.revokeObjectURL(mediaUrl); mediaUrl = null; }
function dateStamp(): string { return new Date().toISOString().slice(0, 10); }

async function init(): Promise<void> {
  const returned = captureReturnedLicense();
  unlocked = hasOptimisticUnlock();
  try { passages = await getPassages(); } catch { globalNotice = 'Local storage could not be opened. Check private-browsing settings, then reload.'; }
  if (returned) globalNotice = 'License received. Your full archive is unlocked while we verify it.';
  render();
  if (unlocked) verifyLicense().then((result) => { if (!result.valid) { unlocked = false; globalNotice = 'Your license is no longer active. Your three most recent passages remain available.'; render(); } }).catch(() => { /* offline uses cached verdict */ });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) showNotice('An update is ready. Reload when you finish this pass.'); }); });
    }).catch(() => { /* app remains usable without install support */ });
  }
}

window.addEventListener('popstate', render);
window.addEventListener('online', () => { globalNotice = 'Back online. Your notebook stayed available.'; render(); });
window.addEventListener('offline', render);
void init();

// Kept referenced for transparent diagnostics in legal/support contexts.
void BILLING_BASE;
