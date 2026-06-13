// src/lib/types.ts

export interface Team {
  id: string;
  uid?: string;
  location?: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName?: string;
  logos?: { href: string; width?: number; height?: number; alt?: string; rel?: string[] }[];
  color?: string;
  alternateColor?: string;
  isNational?: boolean;
  isActive?: boolean;
}

export interface CompetitionStatus {
  clock?: number;
  displayClock?: string;
  period: number;
  type: {
    id: string;
    name: string;
    state: string;
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
}

export interface Venue {
  id: string;
  fullName: string;
  address?: {
    city: string;
    state?: string;
    country: string;
  };
}

export interface Competitor {
  id: string;
  uid?: string;
  type: string;
  order: number;
  homeAway: string;
  team: Team;
  score?: string;
  winner?: boolean;
  logo?: string;
  linescores?: { value: number; displayValue: string }[];
  statistics?: { name: string; displayValue: string; abbreviation: string }[];
  record?: { wins: number; losses: number; ties: number; displayValue: string }[];
}

export interface Competition {
  id: string;
  uid?: string;
  date: string;
  startDate: string;
  attendance?: number;
  timeValid: boolean;
  status: CompetitionStatus;
  venue: Venue;
  format?: { regulation: { periods: number } };
  competitors: Competitor[];
  notes?: { type: string; text: string }[];
  broadcasts?: { market: string; names: string[] }[];
}

export interface MatchEvent {
  id: string;
  uid?: string;
  date: string;
  startDate?: string;
  name: string;
  shortName: string;
  season?: { year: number; type: number; slug: string };
  competitions: Competition[];
  status?: CompetitionStatus;
  group?: { id: string; name: string; abbreviation: string };
}

export interface StandingEntry {
  team: Team;
  note?: { color: string; description: string; rank: number };
  stats: {
    name: string;
    displayName: string;
    abbreviation: string;
    value: number;
    displayValue: string;
  }[];
}

export interface GroupStanding {
  uid: string;
  id: string;
  name: string;
  abbreviation: string;
  standings: {
    id: string;
    name: string;
    displayName: string;
    entries: StandingEntry[];
  };
}

export interface GoalEvent {
  id: string;
  type: { id: string; text: string };
  text: string;
  shortText: string;
  period: { number: number };
  clock: { value: number; displayValue: string };
  scoringPlay: boolean;
  team: { id: string; displayName: string };
  participants: { athlete: { id: string; displayName: string } }[];
}

export interface MatchSummary {
  id: string;
  boxscore?: {
    teams?: {
      team: Team;
      statistics?: { name: string; displayValue: string; abbreviation: string }[];
      displayOrder?: number;
    }[];
    players?: {
      team: Team;
      athletes: {
        athlete: { id: string; displayName: string; position?: { abbreviation: string } };
        stats: { name: string; displayValue: string }[];
        starter: boolean;
        played: boolean;
      }[];
      displayOrder?: number;
    }[];
  };
  keyEvents?: GoalEvent[];
  rosters?: Record<string, { team: Team; athletes: { athlete: { id: string; displayName: string; position?: { abbreviation: string } } }[] }>;
  header?: { competitions: Competition[] };
  venue?: Venue;
  formations?: unknown[];
}

export interface NewsItem {
  headline: string;
  description: string;
  published: string;
  links?: { web?: { href: string } };
  images?: { url: string; width: number; height: number }[];
}

export interface GoalLeader {
  athlete: {
    id: string;
    displayName: string;
    shortName: string;
  };
  team?: {
    id: string;
    displayName: string;
    abbreviation: string;
    logos?: { href: string; rel?: string[] }[];
  };
  value: number;
  displayValue: string;
}
