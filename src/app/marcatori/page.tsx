import { fetchGoalLeaders, getTeamLogo } from '@/lib/api';
import type { GoalLeader } from '@/lib/types';

export const revalidate = 120;

export default async function MarcatoriPage() {
  let leaders: GoalLeader[] = [];
  try {
    leaders = await fetchGoalLeaders();
  } catch {
    // API might not have data yet
  }

  // Only players with at least 1 goal, sorted descending
  const sorted = [...leaders].filter(l => l.value > 0).sort((a, b) => b.value - a.value);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Marcatori</h1>
        <p className="text-gray-400 text-sm">Classifica cannonieri del torneo</p>
      </div>

      {sorted.length > 0 ? (
        <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/30">
                <th className="text-left pl-4 pr-2 py-3 font-medium w-10">#</th>
                <th className="text-left py-3 px-2 font-medium">Giocatore</th>
                <th className="text-left py-3 px-2 font-medium">Squadra</th>
                <th className="text-center pr-4 pl-2 py-3 font-bold w-16 text-emerald-400">Gol</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((leader, idx) => (
                <tr
                  key={leader.athlete.id}
                  className="border-t border-gray-700/20 hover:bg-gray-700/20 transition-colors"
                >
                  <td className="pl-4 pr-2 py-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-500 text-white' :
                      idx === 1 ? 'bg-gray-400 text-white' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-gray-700/50 text-gray-400'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-white font-medium text-sm">{leader.athlete.displayName}</span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {leader.team?.logos?.length ? (
                        <img src={getTeamLogo(leader.team)} alt="" className="w-5 h-5 object-contain" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-gray-400">{leader.team?.abbreviation || '?'}</span>
                        </div>
                      )}
                      <span className="text-gray-300 text-sm">{leader.team?.abbreviation || '—'}</span>
                    </div>
                  </td>
                  <td className="text-center pr-4 pl-2 py-3">
                    <span className="text-lg font-bold text-emerald-400 tabular-nums">{leader.value}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400">Nessun dato sui marcatori disponibile.</p>
        </div>
      )}
    </main>
  );
}
