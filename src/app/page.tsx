import { fetchScoreboard } from '@/lib/api';
import { MatchCard } from '@/components/MatchCard';
import { format, subDays } from 'date-fns';
import { it } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const events = await fetchScoreboard();

  const live = events.filter(e => e.competitions[0]?.status?.type?.state === 'in');

  const finished = events.filter(e => e.competitions[0]?.status?.type?.completed);
  const upcoming = events.filter(e => e.competitions[0]?.status?.type?.state === 'pre');

  // Today/yesterday for results, today/tomorrow for upcoming
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const tomorrow = format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd');

  const recentFinished = finished.filter(m => {
    const d = format(new Date(m.competitions[0].date), 'yyyy-MM-dd');
    return d === today || d === yesterday;
  });

  const nearUpcoming = upcoming.filter(m => {
    const d = format(new Date(m.competitions[0].date), 'yyyy-MM-dd');
    return d === today || d === tomorrow;
  });

  const groupByDate = (matches: typeof events) => {
    const map = new Map<string, typeof events>();
    for (const m of matches) {
      const date = format(new Date(m.competitions[0].date), 'yyyy-MM-dd');
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(m);
    }
    return map;
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-4 md:py-6 space-y-6 md:space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-gray-900 p-5 md:p-10">
        <div className="absolute top-0 right-0 w-40 h-40 md:w-64 md:h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
            <span className="px-2 md:px-3 py-1 md:py-1 bg-white/10 rounded-full text-[10px] md:text-xs font-semibold text-emerald-200 uppercase tracking-wider whitespace-nowrap">
              Mondiali FIFA 2026™
            </span>
            {live.length > 0 && (
              <span className="px-2 md:px-3 py-1 md:py-1 bg-red-500/20 rounded-full text-[10px] md:text-xs font-semibold text-red-300 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {live.length} Live
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-3xl font-bold text-white mb-1">
            {live.length > 0 ? `${live.length} Partit${live.length > 1 ? 'e' : 'a'} Live Ora` : 'Mondiali FIFA 2026'}
          </h2>
          <p className="text-emerald-200/70 text-xs md:text-sm">
            USA · Canada · Messico · 48 Squadre · 104 Partite · 11 Giugno – 19 Luglio
          </p>
        </div>
      </div>

      {/* Live Matches */}
      {live.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h2 className="text-xl font-bold text-white">Live Ora</h2>
          </div>
          <div className="grid gap-4">
            {live.map(m => <MatchCard key={m.id} match={m} featured />)}
          </div>
        </section>
      )}

      {live.length === 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-gray-600"></span>
            <h2 className="text-xl font-bold text-white">Nessuna partita in corso</h2>
          </div>
          <p className="text-gray-400 text-sm">Non ci sono partite live al momento. Torna a controllare durante le partite!</p>
        </section>
      )}

      {/* Recent Results (today & yesterday) */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">Risultati Recenti</h2>
        {recentFinished.length > 0 ? (
          Array.from(groupByDate(recentFinished).entries()).map(([date, matches]) => (
            <div key={date} className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                {format(new Date(date + 'T00:00:00'), 'EEEE, d MMM', { locale: it })}
              </h3>
              <div className="grid gap-3">
                {matches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm">Nessun risultato recente. Le partite non sono ancora iniziate!</p>
        )}
      </section>

      {/* Upcoming (today & tomorrow) */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">Prossime Partite</h2>
        {nearUpcoming.length > 0 ? (
          Array.from(groupByDate(nearUpcoming).entries()).map(([date, matches]) => (
            <div key={date} className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                {format(new Date(date + 'T00:00:00'), 'EEEE, d MMM', { locale: it })}
              </h3>
              <div className="grid gap-3">
                {matches.map(m => <MatchCard key={m.id} match={m} />)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm">Nessuna partita in programma per oggi o domani.</p>
        )}
      </section>
    </main>
  );
}
