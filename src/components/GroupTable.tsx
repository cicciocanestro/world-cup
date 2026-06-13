'use client';

import type { GroupStanding } from '@/lib/types';
import { getTeamLogo, getStatValue, getStatNum } from '@/lib/api';

interface GroupTableProps {
  group: GroupStanding;
}

export function GroupTable({ group }: GroupTableProps) {
  const entries = group.standings?.entries || [];
  const sorted = [...entries].sort((a, b) => {
    // Use API rank if available
    const rankA = getStatNum(a.stats, 'rank');
    const rankB = getStatNum(b.stats, 'rank');
    if (rankA && rankB) return rankA - rankB;
    // Fallback: sort by points, GD, GF
    const ptsA = getStatNum(a.stats, 'points');
    const ptsB = getStatNum(b.stats, 'points');
    if (ptsB !== ptsA) return ptsB - ptsA;
    const gdA = getStatNum(a.stats, 'pointDifferential');
    const gdB = getStatNum(b.stats, 'pointDifferential');
    if (gdB !== gdA) return gdB - gdA;
    return getStatNum(b.stats, 'pointsFor') - getStatNum(a.stats, 'pointsFor');
  });

  const maxGames = Math.max(...sorted.map(e => getStatNum(e.stats, 'gamesPlayed')));

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
      <div className="px-3 md:px-4 py-2.5 md:py-3 bg-gray-800/80 border-b border-gray-700/50 flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-sm md:text-lg">{group.name}</h3>
          <p className="text-[10px] md:text-xs text-gray-400">{maxGames} partit{maxGames !== 1 ? 'e' : 'a'} giocat{maxGames !== 1 ? 'he' : 'a'}</p>
        </div>
        <span className="text-[10px] md:text-xs text-gray-500 bg-gray-700/40 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
          4 squadre
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/30">
              <th className="text-left pl-2 md:pl-3 pr-1 py-1.5 md:py-2 font-medium w-5 md:w-6">#</th>
              <th className="text-left py-1.5 md:py-2 px-1 font-medium">Team</th>
              <th className="text-center py-1.5 md:py-2 px-0.5 md:px-1 font-medium w-6 md:w-7">PG</th>
              <th className="text-center py-1.5 md:py-2 px-0.5 md:px-1 font-medium w-6 md:w-7 hidden sm:table-cell">V</th>
              <th className="text-center py-1.5 md:py-2 px-0.5 md:px-1 font-medium w-6 md:w-7 hidden sm:table-cell">P</th>
              <th className="text-center py-1.5 md:py-2 px-0.5 md:px-1 font-medium w-6 md:w-7 hidden sm:table-cell">S</th>
              <th className="text-center py-1.5 md:py-2 px-0.5 md:px-1 font-medium w-6 md:w-7">GF</th>
              <th className="text-center py-1.5 md:py-2 px-0.5 md:px-1 font-medium w-6 md:w-7 hidden sm:table-cell">GS</th>
              <th className="text-center py-1.5 md:py-2 px-0.5 md:px-1 font-medium w-7 md:w-8">DR</th>
              <th className="text-center pr-2 md:pr-3 pl-0.5 md:pl-1 py-1.5 md:py-2 font-bold w-7 md:w-8 text-emerald-400">Pt</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, idx) => {
              const isAdvancing = idx < 2;
              const gd = getStatNum(entry.stats, 'pointDifferential');
              const pts = getStatNum(entry.stats, 'points');
              const gp = getStatNum(entry.stats, 'gamesPlayed');
              return (
                <tr
                  key={entry.team.id}
                  className={`border-t border-gray-700/20 transition-colors hover:bg-gray-700/20 ${
                    isAdvancing && gp > 0 ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  <td className="pl-2 md:pl-3 pr-1 py-2 md:py-2.5">
                    <span className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold ${
                      idx === 0 ? 'bg-emerald-500 text-white' :
                      idx === 1 ? 'bg-emerald-500/30 text-emerald-300' :
                      idx === 2 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-700/50 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2 md:py-2.5 px-1">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      {getTeamLogo(entry.team) ? (
                        <img src={getTeamLogo(entry.team)} alt="" className="w-4 h-4 md:w-5 md:h-5 object-contain flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-[7px] md:text-[8px] font-bold text-gray-400">{entry.team.abbreviation}</span>
                        </div>
                      )}
                      <span className={`text-[11px] md:text-sm font-medium truncate max-w-[80px] sm:max-w-none ${isAdvancing && gp > 0 ? 'text-white' : 'text-gray-300'}`}>
                        {entry.team.displayName}
                      </span>
                      {entry.note && entry.note.description && (
                        <span className="text-[8px] md:text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                          {entry.note.description === 'Advance to Round of 32' ? 'Q' : (entry.note.description === '3rd Place' ? '3° Posto' : entry.note.description)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-center text-[11px] md:text-xs text-gray-400">{getStatValue(entry.stats, 'gamesPlayed')}</td>
                  <td className="text-center text-[11px] md:text-xs text-gray-400 hidden sm:table-cell">{getStatValue(entry.stats, 'wins')}</td>
                  <td className="text-center text-[11px] md:text-xs text-gray-400 hidden sm:table-cell">{getStatValue(entry.stats, 'ties')}</td>
                  <td className="text-center text-[11px] md:text-xs text-gray-400 hidden sm:table-cell">{getStatValue(entry.stats, 'losses')}</td>
                  <td className="text-center text-[11px] md:text-xs text-gray-400">{getStatValue(entry.stats, 'pointsFor')}</td>
                  <td className="text-center text-[11px] md:text-xs text-gray-400 hidden sm:table-cell">{getStatValue(entry.stats, 'pointsAgainst')}</td>
                  <td className={`text-center text-[11px] md:text-xs font-medium tabular-nums ${gd > 0 ? 'text-emerald-400' : gd < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {gd > 0 ? '+' : ''}{gd}
                  </td>
                  <td className="text-center pr-2 md:pr-3 pl-0.5 md:pl-1">
                    <span className={`text-sm md:text-base font-bold tabular-nums ${pts > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>{pts}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface StandingsGridProps {
  groups: GroupStanding[];
}

export function StandingsGrid({ groups }: StandingsGridProps) {
  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Nessun dato sulla classifica disponibile</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {groups.map(group => (
        <GroupTable key={group.id} group={group} />
      ))}
    </div>
  );
}
