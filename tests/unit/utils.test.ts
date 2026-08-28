import { describe, expect, it } from 'vitest';
import type { Passage } from '../../src/types';
import { clampLoop, formatTime, makeArchive, nextRampBpm, parseArchive, passagesToCsv, variedBpm } from '../../src/utils';

const passage: Passage = {
  id: 'passage-1', title: 'Bridge run', sourceNote: '', mediaName: 'run.wav', mediaType: 'audio/wav', duration: 12,
  loopStart: 1, loopEnd: 4, playbackRate: 1, planMode: 'ramp', bpm: 60, endBpm: 80, bpmStep: 5, variance: 4,
  targetReps: 5, exitCriterion: 'Three clean passes', createdAt: '2026-08-28T10:00:00Z', updatedAt: '2026-08-28T10:00:00Z',
  sessions: [{ id: 's1', startedAt: '2026-08-28T10:00:00Z', endedAt: '2026-08-28T10:05:00Z', repetitions: 5, bpm: 60, criterionMet: true, reflection: 'Relaxed the thumb', confidence: 4 }],
};

describe('practice utilities', () => {
  it('formats passage time and clamps invalid marker ranges', () => {
    expect(formatTime(62.34)).toBe('1:02.3');
    expect(clampLoop(-2, 99, 10)).toEqual([0, 10]);
    expect(clampLoop(9.95, 2, 10)).toEqual([9.9, 10]);
  });

  it('advances a ramp only after successful sessions and caps it', () => {
    expect(nextRampBpm(passage)).toBe(65);
    expect(nextRampBpm({ ...passage, endBpm: 62 })).toBe(62);
    expect(nextRampBpm({ ...passage, planMode: 'steady' })).toBe(60);
  });

  it('uses a deterministic bounded variability pattern', () => {
    expect([0, 1, 2, 3, 4].map((beat) => variedBpm(60, 4, beat))).toEqual([60, 64, 56, 62, 58]);
    expect(variedBpm(20, 20, 2)).toBe(20);
  });

  it('round-trips archive metadata without embedding media', () => {
    const archive = makeArchive([{ ...passage, media: new Blob(['audio']) }]);
    expect(archive.passages[0]).not.toHaveProperty('media');
    expect(parseArchive(JSON.stringify(archive))[0].title).toBe('Bridge run');
    expect(() => parseArchive('{"version":2}')).toThrow(/not a Practice Loop Notebook/);
  });

  it('exports spreadsheet-safe quoted session evidence', () => {
    const csv = passagesToCsv([passage]);
    expect(csv).toContain('"Bridge run"');
    expect(csv).toContain('"Relaxed the thumb"');
    expect(csv.split('\n')).toHaveLength(2);
  });
});
