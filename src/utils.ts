import type { ArchiveFile, Passage } from './types';

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00.0';
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${minutes}:${remainder.toFixed(1).padStart(4, '0')}`;
}

export function clampLoop(start: number, end: number, duration: number): [number, number] {
  const safeDuration = Math.max(0.2, duration || 0.2);
  const a = Math.max(0, Math.min(start, safeDuration - 0.1));
  const b = Math.max(a + 0.1, Math.min(end, safeDuration));
  return [a, b];
}

export function nextRampBpm(passage: Pick<Passage, 'planMode' | 'bpm' | 'endBpm' | 'bpmStep' | 'sessions'>): number {
  if (passage.planMode !== 'ramp') return passage.bpm;
  const successful = passage.sessions.filter((session) => session.criterionMet).length;
  return Math.min(passage.endBpm, passage.bpm + successful * passage.bpmStep);
}

export function variedBpm(base: number, variance: number, beat: number): number {
  const pattern = [0, 1, -1, 0.5, -0.5];
  return Math.max(20, Math.round(base + pattern[beat % pattern.length] * variance));
}

export function makeArchive(passages: Passage[]): ArchiveFile {
  return {
    product: 'practice-loop-notebook',
    version: 1,
    exportedAt: new Date().toISOString(),
    note: 'Media files are not embedded. Reattach your original local recording after import.',
    passages: passages.map(({ media: _media, ...passage }) => passage),
  };
}

export function parseArchive(value: string): Omit<Passage, 'media'>[] {
  const parsed = JSON.parse(value) as Partial<ArchiveFile>;
  if (parsed.product !== 'practice-loop-notebook' || parsed.version !== 1 || !Array.isArray(parsed.passages)) {
    throw new Error('This is not a Practice Loop Notebook v1 archive.');
  }
  for (const passage of parsed.passages) {
    if (!passage.id || !passage.title || !Array.isArray(passage.sessions)) {
      throw new Error('The archive contains an incomplete passage.');
    }
  }
  return parsed.passages;
}

export function passagesToCsv(passages: Passage[]): string {
  const quote = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [['Passage', 'Date', 'Repetitions', 'Tempo', 'Criterion met', 'Confidence', 'Reflection']];
  passages.forEach((passage) => passage.sessions.forEach((session) => rows.push([
    passage.title,
    session.endedAt,
    String(session.repetitions),
    String(session.bpm),
    session.criterionMet ? 'Yes' : 'No',
    String(session.confidence),
    session.reflection,
  ])));
  return rows.map((row) => row.map(quote).join(',')).join('\n');
}
