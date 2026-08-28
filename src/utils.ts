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
  let parsed: Partial<ArchiveFile>;
  try {
    parsed = JSON.parse(value) as Partial<ArchiveFile>;
  } catch {
    throw new Error('Archive rejected: the file is not valid JSON. No data was imported.');
  }
  if (parsed.product !== 'practice-loop-notebook' || parsed.version !== 1 || !Array.isArray(parsed.passages)) {
    throw new Error('Archive rejected: choose a Practice Loop Notebook v1 export. No data was imported.');
  }
  if (parsed.passages.length > 10_000) {
    throw new Error('Archive rejected: it contains too many passages. No data was imported.');
  }
  return parsed.passages.map((candidate, index) => validatePassage(candidate, index));
}

function validatePassage(candidate: unknown, index: number): Omit<Passage, 'media'> {
  const p = asRecord(candidate, `passage ${index + 1}`);
  const label = `passage ${index + 1}`;
  const duration = numberField(p, 'duration', label, 0.2, 86_400);
  const loopStart = numberField(p, 'loopStart', label, 0, duration - 0.1);
  const loopEnd = numberField(p, 'loopEnd', label, loopStart + 0.1, duration);
  const planMode = stringField(p, 'planMode', label, 12);
  if (!['steady', 'ramp', 'variable'].includes(planMode)) invalid(label, 'planMode');
  const sessionsValue = p.sessions;
  if (!Array.isArray(sessionsValue) || sessionsValue.length > 10_000) invalid(label, 'sessions');
  const sessions = sessionsValue.map((candidateSession, sessionIndex) => {
    const sessionLabel = `${label}, session ${sessionIndex + 1}`;
    const session = asRecord(candidateSession, sessionLabel);
    return {
      id: stringField(session, 'id', sessionLabel, 100),
      startedAt: dateField(session, 'startedAt', sessionLabel),
      endedAt: dateField(session, 'endedAt', sessionLabel),
      repetitions: integerField(session, 'repetitions', sessionLabel, 0, 100_000),
      bpm: integerField(session, 'bpm', sessionLabel, 20, 300),
      criterionMet: booleanField(session, 'criterionMet', sessionLabel),
      reflection: stringField(session, 'reflection', sessionLabel, 280, true),
      confidence: integerField(session, 'confidence', sessionLabel, 1, 5) as 1 | 2 | 3 | 4 | 5,
    };
  });
  return {
    id: stringField(p, 'id', label, 100),
    title: stringField(p, 'title', label, 80),
    sourceNote: stringField(p, 'sourceNote', label, 120, true),
    mediaName: stringField(p, 'mediaName', label, 255, true),
    mediaType: stringField(p, 'mediaType', label, 100, true),
    duration,
    loopStart,
    loopEnd,
    playbackRate: numberField(p, 'playbackRate', label, 0.5, 1.25),
    planMode: planMode as Passage['planMode'],
    bpm: integerField(p, 'bpm', label, 20, 300),
    endBpm: integerField(p, 'endBpm', label, 20, 300),
    bpmStep: integerField(p, 'bpmStep', label, 1, 30),
    variance: integerField(p, 'variance', label, 0, 30),
    targetReps: integerField(p, 'targetReps', label, 1, 100),
    exitCriterion: stringField(p, 'exitCriterion', label, 120),
    sessions,
    createdAt: dateField(p, 'createdAt', label),
    updatedAt: dateField(p, 'updatedAt', label),
  };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(label, 'record');
  return value as Record<string, unknown>;
}

function stringField(record: Record<string, unknown>, field: string, label: string, max: number, allowEmpty = false): string {
  const value = record[field];
  if (typeof value !== 'string' || value.length > max || (!allowEmpty && value.trim().length === 0)) invalid(label, field);
  return value as string;
}

function numberField(record: Record<string, unknown>, field: string, label: string, min: number, max: number): number {
  const value = record[field];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) invalid(label, field);
  return value as number;
}

function integerField(record: Record<string, unknown>, field: string, label: string, min: number, max: number): number {
  const value = numberField(record, field, label, min, max);
  if (!Number.isInteger(value)) invalid(label, field);
  return value;
}

function booleanField(record: Record<string, unknown>, field: string, label: string): boolean {
  if (typeof record[field] !== 'boolean') invalid(label, field);
  return record[field] as boolean;
}

function dateField(record: Record<string, unknown>, field: string, label: string): string {
  const value = stringField(record, field, label, 40);
  if (!Number.isFinite(Date.parse(value))) invalid(label, field);
  return value;
}

function invalid(label: string, field: string): never {
  throw new Error(`Archive rejected: ${label} has an invalid ${field} field. No data was imported.`);
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
