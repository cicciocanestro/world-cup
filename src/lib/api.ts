// src/lib/api.ts

import type { MatchEvent, GroupStanding, MatchSummary, NewsItem, GoalLeader } from './types';

const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
const STANDINGS_URL = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings';
const SUMMARY_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary';
const NEWS_URL = 'https://now.core.api.espn.com/v1/sports/news';
const TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams';
const STATISTICS_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/statistics';

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

export async function fetchScoreboard(): Promise<MatchEvent[]> {
  const res = await fetch(
    `${SCOREBOARD_URL}?dates=20260611-20260719`,
    { next: { revalidate: 15 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const allEvents: MatchEvent[] = data.events || [];

  // Enrich teams with logos from the teams endpoint
  const logosMap = await getTeamLogosMap();
  for (const event of allEvents) {
    for (const comp of event.competitions || []) {
      for (const competitor of comp.competitors || []) {
        if (competitor.team && !competitor.team.logos?.length) {
          const logo = logosMap.get(String(competitor.team.id)) || logosMap.get(competitor.team.abbreviation);
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
  const res = await fetch(`${SCOREBOARD_URL}?dates=${date}`, { next: { revalidate: 15 } });
  if (!res.ok) throw new Error('Failed to fetch scoreboard');
  const data = await res.json();
  return data.events || [];
}

export async function fetchStandings(): Promise<GroupStanding[]> {
  const res = await fetch(STANDINGS_URL, { next: { revalidate: 15 } });
  if (!res.ok) throw new Error('Failed to fetch standings');
  const data = await res.json();
  return data.children || [];
}

export async function fetchMatchSummary(eventId: string): Promise<MatchSummary> {
  const res = await fetch(`${SUMMARY_BASE}?event=${eventId}`, { next: { revalidate: 15 } });
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
      const scoreboardRes = await fetch(`${SCOREBOARD_URL}?dates=20260611-20260719`, { next: { revalidate: 60 } });
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

export async function fetchGoalLeaders(): Promise<GoalLeader[]> {
  const res = await fetch(STATISTICS_URL, { next: { revalidate: 15 } });
  if (!res.ok) throw new Error('Failed to fetch statistics');
  const data = await res.json();
  const goalsStat = data.stats?.find((s: { name: string }) => s.name === 'goalsLeaders');
  const leaders: GoalLeader[] = goalsStat?.leaders || [];

  // If API already includes team info, return immediately
  if (leaders.some(l => l.team?.abbreviation)) return leaders;

  // Build athlete→team map by fetching finished match summaries directly
  const playerTeamMap = new Map<string, { id: string; displayName: string; abbreviation: string; logos?: { href: string; rel?: string[] }[] }>();

  try {
    // Pre-fetch team logos (single call, cached)
    const logosMap = await getTeamLogosMap();

    // Fetch all finished matches' summaries
    const sbRes = await fetch(`${SCOREBOARD_URL}?dates=20260611-20260719`, { next: { revalidate: 15 } });
    if (!sbRes.ok) return leaders;
    const sbData = await sbRes.json();
    const finished: MatchEvent[] = (sbData.events || []).filter(
      (e: MatchEvent) => e.competitions?.[0]?.status?.type?.completed
    );

    // Fetch all summaries in parallel (direct fetch — no logo/venue overhead)
    const summaries = await Promise.allSettled(
      finished.map(e =>
        fetch(`${SUMMARY_BASE}?event=${e.id}`, { next: { revalidate: 15 } })
          .then(r => r.ok ? r.json() : null)
      )
    );

    for (const result of summaries) {
      if (result.status !== 'fulfilled' || !result.value) continue;
      const summary = result.value as MatchSummary;
      const comp = summary.header?.competitions?.[0];
      if (!comp) continue;

      // Build teamId→teamInfo for this match (enrich logos from cache)
      const teamMap = new Map<string, { id: string; displayName: string; abbreviation: string; logos?: { href: string; rel?: string[] }[] }>();
      for (const c of comp.competitors) {
        if (c.team) {
          const logo = logosMap.get(String(c.team.id)) || logosMap.get(c.team.abbreviation);
          teamMap.set(c.team.id, {
            id: c.team.id,
            displayName: c.team.displayName,
            abbreviation: c.team.abbreviation,
            logos: logo ? [{ href: logo }] : c.team.logos,
          });
        }
      }

      // Map each goal scorer to their team
      for (const evt of (summary.keyEvents || [])) {
        if (!evt.scoringPlay) continue;
        const teamInfo = teamMap.get(evt.team?.id);
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
