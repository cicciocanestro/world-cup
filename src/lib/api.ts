// src/lib/api.ts

import type { MatchEvent, GroupStanding, MatchSummary, NewsItem, GoalLeader } from './types';

const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const STANDINGS_URL = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings';
const SUMMARY_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const NEWS_URL = 'https://now.core.api.espn.com/v1/sports/news';
const TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams';

// Cache for team logos
let teamLogosCache: Map<string, string> | null = null;

async function getTeamLogosMap(): Promise<Map<string, string>> {
  if (teamLogosCache) return teamLogosCache;

  const res = await fetch(TEAMS_URL, { next: { revalidate: 3600 } });
  if (!res.ok) return new Map();

  const data = await res.json();
  const teams = data?.sports?.[0]?.leagues?.[0]?.teams || [];
  const map = new Map<string, string>();

  for (const t of teams) {
    const team = t.team;
    if (team?.id && team?.logos?.length) {
      const full = team.logos.find((l: { rel?: string[] }) => l.rel?.includes('full'));
      const logo = full?.href || team.logos[0].href;
      map.set(team.id, logo);
      // Also map by abbreviation for fallback
      if (team.abbreviation) {
        map.set(team.abbreviation, logo);
      }
    }
  }

  teamLogosCache = map;
  return map;
}

function enrichTeamWithLogo(team: { id: string; abbreviation: string; logos?: { href: string }[] }): { id: string; abbreviation: string; logos?: { href: string }[] } {
  // If team already has logos, return as-is
  if (team.logos?.length) return team;
  return team;
}

export async function fetchScoreboard(): Promise<MatchEvent[]> {
  // ESPN scoreboard API doesn't support date ranges with startDate/endDate for completed games.
  // We need to query each day individually from the tournament start (June 11) to today + 3 days.
  const tournamentStart = new Date('2026-06-11');
  const end = new Date('2026-07-19'); // Tournament final

  const fmt = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

  const dates: string[] = [];
  const cursor = new Date(tournamentStart);
  while (cursor <= end) {
    dates.push(fmt(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  // Fetch all dates in parallel
  const results = await Promise.allSettled(
    dates.map(date =>
      fetch(`${SCOREBOARD_URL}?dates=${date}`, { next: { revalidate: 60 } })
        .then(res => res.ok ? res.json() : { events: [] })
    )
  );

  const allEvents: MatchEvent[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const event of (result.value?.events || [])) {
        if (!seen.has(event.id)) {
          seen.add(event.id);
          allEvents.push(event);
        }
      }
    }
  }

  // Enrich teams with logos from the teams endpoint
  const logosMap = await getTeamLogosMap();
  for (const event of allEvents) {
    for (const comp of event.competitions || []) {
      for (const competitor of comp.competitors || []) {
        if (competitor.team && !competitor.team.logos?.length) {
          const logo = logosMap.get(competitor.team.id) || logosMap.get(competitor.team.abbreviation);
          if (logo) {
            competitor.team.logos = [{ href: logo }];
          }
        }
      }
    }
  }

  return allEvents;
}

export async function fetchScoreboardByDate(date: string): Promise<MatchEvent[]> {
  // date format: YYYYMMDD
  const res = await fetch(`${SCOREBOARD_URL}?dates=${date}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error('Failed to fetch scoreboard');
  const data = await res.json();
  return data.events || [];
}

export async function fetchStandings(): Promise<GroupStanding[]> {
  const res = await fetch(STANDINGS_URL, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error('Failed to fetch standings');
  const data = await res.json();
  return data.children || [];
}

export async function fetchMatchSummary(eventId: string): Promise<MatchSummary> {
  const res = await fetch(`${SUMMARY_BASE}?event=${eventId}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error('Failed to fetch match summary');
  const data = await res.json();

  // Enrich teams with logos
  const logosMap = await getTeamLogosMap();
  for (const comp of data?.header?.competitions || []) {
    for (const competitor of comp.competitors || []) {
      if (competitor.team && !competitor.team.logos?.length) {
        const logo = logosMap.get(competitor.team.id) || logosMap.get(competitor.team.abbreviation);
        if (logo) {
          competitor.team.logos = [{ href: logo }];
        }
      }
    }
  }

  // The summary API doesn't include venue for upcoming matches.
  // Fetch it from the scoreboard if missing.
  const comp = data?.header?.competitions?.[0];
  if (comp && !comp.venue?.fullName) {
    try {
      const scoreboardRes = await fetch(`${SCOREBOARD_URL}?dates=20260611to20260719`, { next: { revalidate: 60 } });
      if (scoreboardRes.ok) {
        const sbData = await scoreboardRes.json();
        const matchEvent = sbData?.events?.find((e: { id: string }) => e.id === eventId);
        const sbVenue = matchEvent?.competitions?.[0]?.venue;
        if (sbVenue?.fullName && data?.header?.competitions?.[0]) {
          data.header.competitions[0].venue = sbVenue;
        }
      }
    } catch {
      // ignore
    }
  }

  return data;
}

export async function fetchNews(limit = 10): Promise<NewsItem[]> {
  const res = await fetch(`${NEWS_URL}?leagues=fifa.world&limit=${limit}`, { next: { revalidate: 120 } });
  if (!res.ok) throw new Error('Failed to fetch news');
  const data = await res.json();
  return data.articles || [];
}

const STATISTICS_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/statistics';

export async function fetchGoalLeaders(): Promise<GoalLeader[]> {
  const res = await fetch(STATISTICS_URL, { next: { revalidate: 120 } });
  if (!res.ok) throw new Error('Failed to fetch statistics');
  const data = await res.json();
  const goalsStat = data.stats?.find((s: { name: string }) => s.name === 'goalsLeaders');
  const leaders: GoalLeader[] = goalsStat?.leaders || [];

  // The statistics API doesn't include team info per player.
  // We need to cross-reference with match summaries to find which team each scorer belongs to.
  // Build a map: athleteId -> team abbreviation from finished matches.
  const playerTeamMap = new Map<string, { id: string; displayName: string; abbreviation: string; logos?: { href: string; rel?: string[] }[] }>();

  try {
    const events = await fetchScoreboard();
    const finishedEvents = events.filter(e => e.competitions[0]?.status?.type?.completed);

    // Fetch summaries in parallel for finished matches
    const summaries = await Promise.allSettled(
      finishedEvents.map(e => fetchMatchSummary(e.id))
    );

    for (const result of summaries) {
      if (result.status !== 'fulfilled') continue;
      const summary = result.value;
      const comp = summary.header?.competitions?.[0];
      if (!comp) continue;

      // Build a map of teamId -> team info for this match
      const teamInfoMap = new Map<string, { id: string; displayName: string; abbreviation: string; logos?: { href: string; rel?: string[] }[] }>();
      for (const c of comp.competitors) {
        if (c.team) {
          teamInfoMap.set(c.team.id, {
            id: c.team.id,
            displayName: c.team.displayName,
            abbreviation: c.team.abbreviation,
            logos: c.team.logos,
          });
        }
      }

      // Find goal events and map player -> team
      for (const evt of (summary.keyEvents || [])) {
        if (!evt.scoringPlay) continue;
        const scoringTeamId = evt.team?.id;
        if (!scoringTeamId) continue;
        const teamInfo = teamInfoMap.get(scoringTeamId);
        if (!teamInfo) continue;

        for (const p of (evt.participants || [])) {
          const athleteId = p.athlete?.id;
          if (athleteId && !playerTeamMap.has(athleteId)) {
            playerTeamMap.set(athleteId, teamInfo);
          }
        }
      }
    }
  } catch {
    // If cross-reference fails, return leaders without team info
  }

  // Enrich leaders with team info
  return leaders.map(leader => ({
    ...leader,
    team: playerTeamMap.get(leader.athlete.id) || leader.team,
  }));
}

export function getTeamLogo(team: { logos?: { href: string; rel?: string[] }[] }): string {
  if (!team.logos || team.logos.length === 0) return '';
  const full = team.logos.find(l => l.rel?.includes('full'));
  return full?.href || team.logos[0].href;
}

export function getStatValue(
  stats: { name: string; abbreviation: string; displayValue: string }[],
  name: string
): string {
  return stats.find(s => s.name === name || s.abbreviation === name)?.displayValue || '0';
}

export function getStatNum(
  stats: { name: string; abbreviation: string; value: number }[],
  name: string
): number {
  return stats.find(s => s.name === name || s.abbreviation === name)?.value ?? 0;
}
