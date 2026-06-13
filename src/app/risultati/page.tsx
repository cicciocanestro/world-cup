import { fetchScoreboard } from '@/lib/api';
import { MatchCard } from '@/components/MatchCard';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export const revalidate = 30;

export default async function RisultatiPage() {
  const events = await fetchScoreboard();
  const finished = events.filter(e => e.competitions[0]?.status?.type?.completed);
  finished.sort((a, b) => new Date(b.competitions[0].date).getTime() - new Date(a.competitions[0].date).getTime());

  const groupByDate = (matches: typeof events) => {
    const map = new Map<string, typeof events>();
    for (const m of matches) {
      const date = format(new Date(m.competitions[0].date), 'yyyy-MM-dd');
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(m);
    }
    return map;
  };

  const totalGoals = finished.reduce((acc, m) => {
    const homeScore = Number(m.competitions[0].competitors.find(c => c.homeAway === 'home')?.score || 0);
    const awayScore = Number(m.competitions[0].competitors.find(c => c.homeAway === 'away')?.score || 0);
    return acc + homeScore + awayScore;
  }, 0);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Risultati</h1>
          <p className="text-gray-400 text-sm">Tutte le partite giocate finora</p>
        </div>
        <div className="flex gap-3">
          <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded-full">
            {finished.length} partite
          </span>
          <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1.5 rounded-full">
            {totalGoals} gol
          </span>
        </div>
      </div>

      {finished.length > 0 ? (
        Array.from(groupByDate(finished).entries()).map(([date, matches]) => (
          <div key={date} className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              {format(new Date(date + 'T00:00:00'), 'EEEE, d MMMM yyyy', { locale: it })}
            </h3>
            <div className="grid gap-3">
              {matches.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400">Nessun risultato disponibile.</p>
        </div>
      )}
    </main>
  );
}
