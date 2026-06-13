'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { MatchEvent } from '@/lib/types';
import { getTeamLogo } from '@/lib/api';

interface MatchCardProps {
  match: MatchEvent;
  featured?: boolean;
}

export function MatchCard({ match, featured }: MatchCardProps) {
  const comp = match.competitions[0];
  const home = comp.competitors.find(c => c.homeAway === 'home');
  const away = comp.competitors.find(c => c.homeAway === 'away');
  const statusType = comp.status.type;
  const isLive = statusType.name === 'STATUS_IN_PROGRESS' || statusType.name === 'STATUS_HALFTIME';
  const isFinished = statusType.completed;
  const isUpcoming = statusType.state === 'pre';

  const matchDate = new Date(comp.date);

  return (
    <Link href={`/matches/${match.id}`}>
      <div className={`group relative bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden ${featured ? 'p-6' : 'p-4 hover:bg-gray-800/80'}`}>
        {isLive && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 animate-pulse" />
        )}

        {/* Status bar */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            isLive ? 'bg-red-500/20 text-red-400' :
            isFinished ? 'bg-gray-700/50 text-gray-400' :
            'bg-emerald-500/20 text-emerald-400'
          }`}>
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {comp.status.type.name === 'STATUS_HALFTIME' ? 'Intervallo' : comp.status.displayClock || 'Live'}
              </span>
            ) : isFinished ? (statusType.shortDetail === 'FT' ? 'Finita' : statusType.shortDetail) : format(matchDate, 'HH:mm', { locale: it })}
          </span>
          <span className="text-xs text-gray-500">
            {format(matchDate, 'd MMM yyyy', { locale: it })}
          </span>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {home?.team && (
              <>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center overflow-hidden">
                  {getTeamLogo(home.team) ? (
                    <img src={getTeamLogo(home.team)} alt={home.team.displayName} className="w-6 h-6 object-contain" />
                  ) : (
                    <span className="text-xs font-bold text-gray-400">{home.team.abbreviation}</span>
                  )}
                </div>
                <span className={`font-medium truncate ${featured ? 'text-lg' : 'text-sm'} ${home.winner ? 'text-white' : 'text-gray-300'}`}>
                  {home.team.displayName}
                </span>
              </>
            )}
          </div>

          <div className={`mx-4 flex items-center gap-3 ${featured ? 'text-3xl' : 'text-xl'} font-bold tabular-nums`}>
            {!isUpcoming ? (
              <>
                <span className={home?.winner ? 'text-emerald-400' : 'text-white'}>{home?.score ?? '0'}</span>
                <span className="text-gray-600 text-sm font-normal">-</span>
                <span className={away?.winner ? 'text-emerald-400' : 'text-white'}>{away?.score ?? '0'}</span>
              </>
            ) : (
              <span className="text-gray-500 text-sm font-normal">VS</span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            {away?.team && (
              <>
                <span className={`font-medium truncate ${featured ? 'text-lg' : 'text-sm'} ${away.winner ? 'text-white' : 'text-gray-300'}`}>
                  {away.team.displayName}
                </span>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center overflow-hidden">
                  {getTeamLogo(away.team) ? (
                    <img src={getTeamLogo(away.team)} alt={away.team.displayName} className="w-6 h-6 object-contain" />
                  ) : (
                    <span className="text-xs font-bold text-gray-400">{away.team.abbreviation}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Venue */}
        {comp.venue && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <p className="text-xs text-gray-500 truncate">
              {comp.venue.fullName}
              {comp.venue.address ? ` · ${comp.venue.address.city}` : ''}
            </p>
          </div>
        )}

        {match.group && (
          <div className="mt-2">
            <span className="text-xs text-gray-500 bg-gray-700/30 px-2 py-0.5 rounded">
              Group {match.group.abbreviation}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

interface MatchListProps {
  matches: MatchEvent[];
  emptyMessage?: string;
}

export function MatchList({ matches, emptyMessage = 'Nessuna partita trovata' }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {matches.map(match => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
