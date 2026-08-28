export type PlanMode = 'steady' | 'ramp' | 'variable';

export interface PracticeSession {
  id: string;
  startedAt: string;
  endedAt: string;
  repetitions: number;
  bpm: number;
  criterionMet: boolean;
  reflection: string;
  confidence: 1 | 2 | 3 | 4 | 5;
}

export interface Passage {
  id: string;
  title: string;
  sourceNote: string;
  mediaName: string;
  mediaType: string;
  media?: Blob;
  duration: number;
  loopStart: number;
  loopEnd: number;
  playbackRate: number;
  planMode: PlanMode;
  bpm: number;
  endBpm: number;
  bpmStep: number;
  variance: number;
  targetReps: number;
  exitCriterion: string;
  sessions: PracticeSession[];
  createdAt: string;
  updatedAt: string;
}

export interface ArchiveFile {
  product: 'practice-loop-notebook';
  version: 1;
  exportedAt: string;
  note: string;
  passages: Omit<Passage, 'media'>[];
}
