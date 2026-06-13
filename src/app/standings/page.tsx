import { fetchStandings } from '@/lib/api';
import { StandingsGrid } from '@/components/GroupTable';

export const revalidate = 60;

export default async function StandingsPage() {
  const groups = await fetchStandings();

  // Count teams with matches played
  const teamsWithMatches = groups.reduce((acc, g) => {
    return acc + (g.standings?.entries?.filter(e => {
      const gp = e.stats.find(s => s.name === 'gamesPlayed');
      return gp && Number(gp.displayValue) > 0;
    }).length || 0);
  }, 0);

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Classifiche Gironi</h1>
          <p className="text-gray-400 text-sm">
            12 gironi · Prime 2 + migliori 3° posto avanzano agli Ottavi di Finale
          </p>
        </div>
        <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded-full">
          {teamsWithMatches} squadre con partite giocate
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-gray-300">Qualificate (1° e 2°)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500/40" />
          <span className="text-gray-300">3° Posto (possibile qualificazione)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-700" />
          <span className="text-gray-300">4° Posto</span>
        </div>
      </div>

      <StandingsGrid groups={groups} />

      {/* Tournament Format */}
      <div className="mt-10 bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
        <h2 className="text-xl font-bold text-white mb-4">Formato del Torneo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { label: 'Fase a Gironi', value: '12 gironi × 4', sub: '11 Giu – 27 Giu' },
            { label: 'Ottavi di Finale', value: '32 squadre', sub: '28 Giu – 3 Lug' },
            { label: 'Quarti di Finale', value: '16 squadre', sub: '4 Lug – 7 Lug' },
            { label: 'Semifinali', value: '8 squadre', sub: '9 Lug – 11 Lug' },
            { label: 'Finali', value: '4 squadre', sub: '14 Lug – 15 Lug' },
            { label: '3° Posto', value: '2 squadre', sub: '18 Lug' },
            { label: 'Finale', value: '19 Lug', sub: 'MetLife Stadium, NJ' },
            { label: 'Partite Totali', value: '104', sub: '48 squadre' },
          ].map(item => (
            <div key={item.label} className="bg-gray-700/30 rounded-xl p-3 text-center">
              <p className="text-emerald-400 font-bold text-sm">{item.label}</p>
              <p className="text-white text-xs mt-1">{item.value}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
