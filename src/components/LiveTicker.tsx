'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LiveMatch {
  id: string;
  home: { name: string; abbr: string; score: string; logo: string };
  away: { name: string; abbr: string; score: string; logo: string };
  status: string;
  clock: string;
  isLive: boolean;
}

async function fetchLiveMatches(): Promise<LiveMatch[]> {
  try {
    const res = await fetch('/api/scoreboard');
    if (!res.ok) return [];
    const events = await res.json();
    return events
      .filter((e: { competitions: { status: { type: { name: string; state: string } } }[] }) => {
        return e.competitions?.[0]?.status?.type?.state === 'in';
      })
      .map((e: { id: string; competitions: { competitors: { homeAway: string; team: { displayName: string; abbreviation: string; logos: { href: string }[] }; score: string }[]; status: { displayClock: string; type: { name: string; state: string } } }[] }) => {
        const comp = e.competitions[0];
        const home = comp.competitors.find((c: { homeAway: string }) => c.homeAway === 'home');
        const away = comp.competitors.find((c: { homeAway: string }) => c.homeAway === 'away');
        return {
          id: e.id,
          home: { name: home?.team.displayName || '', abbr: home?.team.abbreviation || '', score: home?.score || '0', logo: home?.team?.logos?.[0]?.href || '' },
          away: { name: away?.team.displayName || '', abbr: away?.team.abbreviation || '', score: away?.score || '0', logo: away?.team?.logos?.[0]?.href || '' },
          status: comp.status.type.name === 'STATUS_HALFTIME' ? 'HT' : comp.status.displayClock || '',
          clock: comp.status.displayClock || '',
          isLive: comp.status.type.state === 'in' && comp.status.type.name !== 'STATUS_HALFTIME',
        };
      });
  } catch {
    return [];
  }
}

export function LiveTicker() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);

  useEffect(() => {
    fetchLiveMatches().then(setMatches);
    const interval = setInterval(() => fetchLiveMatches().then(setMatches), 30000);
    return () => clearInterval(interval);
  }, []);

  if (matches.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white overflow-hidden">
      <div className="flex items-center h-8 md:h-auto">
        <div className="flex-shrink-0 px-2 md:px-4 py-1 md:py-2 bg-emerald-700 font-bold text-[10px] md:text-sm flex items-center gap-1 md:gap-2">
          <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-red-500"></span>
          </span>
          LIVE
        </div>
        <div className="overflow-hidden flex-1">
          <div className="flex animate-scroll">
            {[...matches, ...matches].map((m, i) => (
              <Link key={`${m.id}-${i}`} href={`/matches/${m.id}`} className="flex items-center gap-1.5 md:gap-3 px-3 md:px-6 py-1 md:py-2 hover:bg-emerald-600/50 transition-colors whitespace-nowrap text-[11px] md:text-sm">
                <div className="flex items-center gap-1 md:gap-2">
                  {m.home.logo && <img src={m.home.logo} alt="" className="w-3.5 h-3.5 md:w-5 md:h-5 object-contain" />}
                  <span className="font-medium truncate max-w-[60px] md:max-w-none">{m.home.abbr}</span>
                  <span className="font-bold text-sm md:text-lg">{m.home.score}</span>
                </div>
                <span className="text-emerald-200 text-[9px] md:text-xs font-bold px-1 md:px-2 py-0.5 rounded bg-emerald-700/50">{m.isLive ? m.clock : m.status}</span>
                <div className="flex items-center gap-1 md:gap-2">
                  <span className="font-bold text-sm md:text-lg">{m.away.score}</span>
                  <span className="font-medium truncate max-w-[60px] md:max-w-none">{m.away.abbr}</span>
                  {m.away.logo && <img src={m.away.logo} alt="" className="w-3.5 h-3.5 md:w-5 md:h-5 object-contain" />}
                </div>
                <span className="text-emerald-300 mx-1 md:mx-2 hidden md:inline">|</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
