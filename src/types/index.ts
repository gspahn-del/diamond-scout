// ─── Database row types ───────────────────────────────────────────────────────

export interface Season {
  id: number;
  name: string;
  year: number;
  startDate: string | null;
  endDate: string | null;
  isActive: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface MyTeam {
  id: number;
  name: string;
  seasonId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OpponentTeam {
  id: number;
  name: string;
  league: string | null;
  notes: string | null;
  seasonId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OpponentPlayer {
  id: number;
  teamId: number | null;
  firstName: string;
  lastName: string;
  jerseyNumber: string | null;
  bats: string | null;
  throws: string | null;
  primaryPosition: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Game {
  id: number;
  seasonId: number | null;
  myTeamId: number | null;
  opponentTeamId: number | null;
  gameDate: string;
  location: string | null;
  homeAway: string | null;
  myScore: number | null;
  opponentScore: number | null;
  status: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PlateAppearance {
  id: number;
  gameId: number | null;
  playerId: number | null;
  inning: number;
  paNumber: number;
  pitchCount: number | null;
  result: string | null;
  resultDetail: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Pitch {
  id: number;
  plateAppearanceId: number | null;
  gameId: number | null;
  pitcherId: number | null;
  batterId: number | null;
  sequenceNumber: number;
  pitchType: PitchType;
  pitchResult: PitchResult;
  locationX: number | null;
  locationY: number | null;
  velocity: number | null;
  createdAt: string | null;
}

export interface BattedBall {
  id: number;
  plateAppearanceId: number | null;
  gameId: number | null;
  batterId: number | null;
  hitType: HitType;
  hitResult: HitResult;
  fieldLocation: FieldLocation;
  sprayX: number | null;
  sprayY: number | null;
  exitAngle: number | null;
  outByPositions: string | null;
  rbiCount: number | null;
  createdAt: string | null;
}

export interface ScoutingNote {
  id: number;
  playerId: number | null;
  gameId: number | null;
  seasonId: number | null;
  noteType: string | null;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface GameLineup {
  id: number;
  gameId: number | null;
  playerId: number | null;
  battingOrder: number;
  position: string | null;
  createdAt: string | null;
}

// ─── Enum-like string unions ──────────────────────────────────────────────────

export type PitchType =
  | 'fastball'
  | 'curveball'
  | 'slider'
  | 'changeup'
  | 'knuckleball'
  | 'cutter'
  | 'sinker'
  | 'splitter'
  | 'other';

export type PitchResult =
  | 'ball'
  | 'called_strike'
  | 'swinging_strike'
  | 'foul'
  | 'foul_tip'
  | 'in_play'
  | 'hit_by_pitch'
  | 'intentional_ball';

export type HitType = 'ground_ball' | 'fly_ball' | 'line_drive' | 'bunt' | 'popup';

export type HitResult =
  | 'single'
  | 'double'
  | 'triple'
  | 'homerun'
  | 'out'
  | 'error'
  | 'fielders_choice'
  | 'double_play'
  | 'sacrifice';

export type FieldLocation =
  | 'LF'
  | 'LC'
  | 'CF'
  | 'RC'
  | 'RF'
  | '1B'
  | '2B'
  | 'SS'
  | '3B'
  | 'P'
  | 'C';

export type PAResult =
  | 'single'
  | 'double'
  | 'triple'
  | 'homerun'
  | 'walk'
  | 'strikeout_swinging'
  | 'strikeout_looking'
  | 'hbp'
  | 'sac_fly'
  | 'sac_bunt'
  | 'fielders_choice'
  | 'error'
  | 'double_play'
  | 'triple_play'
  | 'reach_on_error'
  | 'pop_out'
  | 'fly_out'
  | 'ground_out'
  | 'line_out';

export type GameStatus = 'upcoming' | 'in_progress' | 'completed';
export type HomeAway = 'home' | 'away';
export type BatHand = 'R' | 'L' | 'S';
export type ThrowHand = 'R' | 'L';

export type NoteType = 'general' | 'hitting' | 'pitching' | 'fielding' | 'baserunning' | 'mental';

// ─── Derived / calculated types ───────────────────────────────────────────────

export interface PlayerStats {
  playerId: number;
  playerName: string;
  jerseyNumber: string | null;
  primaryPosition: string | null;
  pa: number;
  ab: number;
  h: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  bb: number;
  hbp: number;
  k: number;
  sf: number;
  rbi: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
}

export interface TeamStats {
  teamId: number;
  teamName: string;
  gamesPlayed: number;
  pa: number;
  ab: number;
  h: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  bb: number;
  k: number;
  rbi: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
}

export interface Tendencies {
  playerId: number;
  totalBattedBalls: number;
  pullPct: number;
  centerPct: number;
  oppoPct: number;
  gbPct: number;
  fbPct: number;
  ldPct: number;
  buntPct: number;
  popupPct: number;
  chaseRate: number;
  whiffRate: number;
  firstPitchSwingPct: number;
  avgByCount: Record<string, number>;
  avgByPitchType: Record<string, number>;
  whiffByPitchType: Record<string, number>;
}

export interface FieldZoneStat {
  location: FieldLocation;
  label: string;
  abs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  outs: number;
  avg: number;
}

export interface SprayDot {
  id: number;
  sprayX: number;
  sprayY: number;
  hitType: HitType;
  hitResult: HitResult;
  fieldLocation: FieldLocation;
  gameDate: string;
  pitchType?: string;
  outByPositions?: string | null;
  rbiCount?: number | null;
}

export interface PitchHeatMapDot {
  id: number;
  locationX: number;
  locationY: number;
  pitchType: PitchType;
  pitchResult: PitchResult;
  velocity: number | null;
  gameDate: string;
  sequenceNumber: number;
}

// ─── Extended types with joins ─────────────────────────────────────────────────

export interface GameWithTeams extends Game {
  opponentTeamName?: string;
  myTeamName?: string;
}

export interface PlateAppearanceWithPitches extends PlateAppearance {
  pitches: Pitch[];
  battedBall?: BattedBall;
  playerName?: string;
  jerseyNumber?: string;
}

export interface GameFullData extends Game {
  opponentTeam?: OpponentTeam;
  myTeam?: MyTeam;
  lineup?: (GameLineup & { player: OpponentPlayer })[];
  plateAppearances?: PlateAppearanceWithPitches[];
}

// ─── Game Tracking State ──────────────────────────────────────────────────────

export interface CurrentCount {
  balls: number;
  strikes: number;
  fouls: number;
}

export interface UndoAction {
  type: 'pitch' | 'plate_appearance';
  pitchId?: number;
  plateAppearanceId?: number;
  battedBallId?: number;
  pitchIds?: number[];
}

export interface LiveGameState {
  gameId: number | null;
  currentInning: number;
  currentHalfInning: 'top' | 'bottom';
  outs: number;
  currentBatterIndex: number;
  lineup: (GameLineup & { player: OpponentPlayer })[];
  currentPAId: number | null;
  currentPitches: Pitch[];
  undoStack: UndoAction[];
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface SprayChartFilters {
  gameId?: number;
  hitTypes?: HitType[];
  hitResults?: HitResult[];
  pitchTypes?: PitchType[];
}

export interface PitchChartFilters {
  pitchTypes?: PitchType[];
  pitchResults?: PitchResult[];
}
