import { fetchMatchSummary } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { MatchSummary, GoalEvent } from '@/lib/types';

export const revalidate = 30;

const statLabels: Record<string, string> = {
  'totalShots': 'Tiri Totali',
  'shotsOnTarget': 'Tiri in Porta',
  'shotPct': 'Precisione Tiri',
  'blockedShots': 'Tiri Bloccati',
  'possessionPct': 'Possesso Palla %',
  'totalPasses': 'Passaggi Totali',
  'accuratePasses': 'Passaggi Riusciti',
  'passPct': 'Precisione Passaggi',
  'totalCrosses': 'Cross Totali',
  'accurateCrosses': 'Cross Riusciti',
  'crossPct': 'Precisione Cross',
  'totalLongBalls': 'Lunghi Totali',
  'accurateLongBalls': 'Lunghi Riusciti',
  'longballPct': 'Precisione Lunghi',
  'wonCorners': 'Calci d\'Angolo',
  'offsides': 'Fuorigioco',
  'foulsCommitted': 'Falli Commessi',
  'yellowCards': 'Cartellini Gialli',
  'redCards': 'Cartellini Rossi',
  'saves': 'Parate',
  'totalTackles': 'Contrasti Totali',
  'effectiveTackles': 'Contrasti Riusciti',
  'tacklePct': 'Precisione Contrasti',
  'interceptions': 'Intercetti',
  'totalClearance': 'Spazzate Totali',
  'effectiveClearance': 'Spazzate Riuscite',
  'penaltyKickGoals': 'Rigori Segnati',
  'penaltyKickShots': 'Rigori Tentati',
};

const venueCapacityMap: Record<string, string> = {
  'Estadio Azteca': '87,523',
  'Estadio Banorte': '63,200',
  'Estadio Akron': '51,000',
  'Estadio BBVA': '53,500',
  'Estadio Corona': '34,000',
  'Estadio Universitario': '41,886',
  'Estadio Jalisco': '56,713',
  'Estadio Cuauhtémoc': '51,726',
  'Estadio Hidalgo': '27,512',
  'Estadio León': '31,297',
  'Estadio Corregidora': '33,162',
  'Estadio Víctor Manuel Reyna': '29,001',
  'Estadio Olímpico Universitario': '72,000',
  'Estadio de la Unidad Deportiva': '23,000',
  'SoFi Stadium': '70,240',
  'MetLife Stadium': '82,500',
  'AT&T Stadium': '80,000',
  'NRG Stadium': '72,220',
  'Levi\'s Stadium': '68,500',
  'Mercedes-Benz Stadium': '71,000',
  'Hard Rock Stadium': '65,326',
  'Lincoln Financial Field': '69,796',
  'Lumen Field': '69,000',
  'BC Place': '54,500',
  'BMO Field': '30,000',
  'Stade de France': '80,000',
  'Stade Vélodrome': '67,394',
  'Allianz Arena': '75,024',
  'Signal Iduna Park': '81,365',
  'Santiago Bernabéu': '81,044',
  'Camp Nou': '99,354',
  'Wembley Stadium': '90,000',
  'Tottenham Hotspur Stadium': '62,850',
  'Old Trafford': '74,310',
  'Anfield': '53,394',
  'Stadio Olimpico': '70,634',
  'San Siro': '75,923',
  'Juventus Stadium': '41,507',
  'Stade Pierre-Mauroy': '50,186',
  'Parc Olympique Lyonnais': '59,186',
  'Stade Geoffroy-Guichard': '41,965',
  'Stade de la Beaujoire': '35,322',
  'Stade Bollaert-Delelis': '38,223',
  'Stade Auguste-Delaune': '21,684',
  'Stade Océane': '25,000',
  'Stade de la Mosson': '32,900',
};

interface Props {
  params: Promise<{ id: string }>;
}

function getTeamLogo(team: { logos?: { href: string; rel?: string[] }[] }): string {
  if (!team.logos || team.logos.length === 0) return '';
  const full = team.logos.find(l => l.rel?.includes('full'));
  return full?.href || team.logos[0].href;
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  let summary: MatchSummary;
  try {
    summary = await fetchMatchSummary(id);
  } catch {
    notFound();
  }

  const comp = summary.header?.competitions?.[0];
  if (!comp) notFound();

  // Fetch venue from scoreboard if missing (upcoming matches) — we know the match date from comp.date
  if (!comp.venue?.fullName && comp.date) {
    const matchDate = new Date(comp.date);
    const fmt = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const dateStr = fmt(matchDate);
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`,
        { next: { revalidate: 300 } }
      );
      if (res.ok) {
        const data = await res.json();
        const match = data?.events?.find((e: { id: string }) => e.id === id);
        if (match?.competitions?.[0]?.venue?.fullName) {
          comp.venue = match.competitions[0].venue;
        }
      }
    } catch {}
  }

  const home = comp.competitors.find(c => c.homeAway === 'home');
  const away = comp.competitors.find(c => c.homeAway === 'away');
  const statusType = comp.status.type;
  const isLive = statusType.name === 'STATUS_IN_PROGRESS' || statusType.name === 'STATUS_HALFTIME';
  const isFinished = statusType.completed;
  const isUpcoming = statusType.state === 'pre';
  const matchDate = new Date(comp.date);

  const goals: GoalEvent[] = (summary.keyEvents || []).filter(e => e.scoringPlay);
  const cards = (summary.keyEvents || []).filter(e => e.type.text.includes('Card'));
  const subs = (summary.keyEvents || []).filter(e => e.type.text.includes('Substitution'));

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Torna alle partite
      </Link>

      {/* Scoreboard */}
      <div className="relative bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 overflow-hidden mb-8">
        {isLive && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 animate-pulse" />}

        <div className="p-6 md:p-10">
          {/* Status */}
          <div className="text-center mb-6">
            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${
              isLive ? 'bg-red-500/20 text-red-400' :
              isFinished ? 'bg-gray-700/50 text-gray-400' :
              'bg-emerald-500/20 text-emerald-400'
            }`}>
              {isLive && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              {isLive ? (statusType.name === 'STATUS_HALFTIME' ? 'Intervallo' : `Live - ${comp.status.displayClock}`) :
               isFinished ? 'Finita' :
               format(matchDate, 'EEEE, d MMMM yyyy · HH:mm', { locale: it })}
            </span>
          </div>

          {/* Teams & Score */}
          <div className="flex items-center justify-center gap-6 md:gap-12">
            <div className="text-center flex-1">
              {home?.team && getTeamLogo(home.team) ? (
                <img src={getTeamLogo(home.team)} alt={home.team.displayName} className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 object-contain" />
              ) : (
                <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 rounded-full bg-gray-700/50 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-400">{home?.team.abbreviation}</span>
                </div>
              )}
              <h2 className="text-white font-bold text-lg md:text-xl">{home?.team.displayName}</h2>
            </div>

            <div className="text-center">
              {!isUpcoming ? (
                <div className="flex items-center gap-4">
                  <span className={`text-5xl md:text-7xl font-bold tabular-nums ${home?.winner ? 'text-emerald-400' : 'text-white'}`}>{home?.score ?? '0'}</span>
                  <span className="text-3xl text-gray-600 font-light">-</span>
                  <span className={`text-5xl md:text-7xl font-bold tabular-nums ${away?.winner ? 'text-emerald-400' : 'text-white'}`}>{away?.score ?? '0'}</span>
                </div>
              ) : (
                <span className="text-3xl text-gray-500 font-light">VS</span>
              )}
            </div>

            <div className="text-center flex-1">
              {away?.team && getTeamLogo(away.team) ? (
                <img src={getTeamLogo(away.team)} alt={away.team.displayName} className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 object-contain" />
              ) : (
                <div className="w-20 h-20 md:w-28 md:h-28 mx-auto mb-3 rounded-full bg-gray-700/50 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-400">{away?.team.abbreviation}</span>
                </div>
              )}
              <h2 className="text-white font-bold text-lg md:text-xl">{away?.team.displayName}</h2>
            </div>
          </div>

          {/* Venue */}
          {comp.venue && (
            <div className="text-center mt-6 pt-6 border-t border-gray-700/50">
              <p className="text-gray-400 text-sm">{comp.venue.fullName}</p>
              {comp.venue.address && (
                <p className="text-gray-500 text-xs">{comp.venue.address.city}, {comp.venue.address.country}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Stadio per partite future */}
      {isUpcoming && comp.venue && venueCapacityMap[comp.venue.fullName] && (
        <section className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Info Stadio</h3>
          <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Stadio</p>
                <p className="text-white font-medium">{comp.venue.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Città</p>
                <p className="text-white font-medium">{comp.venue.address?.city || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Paese</p>
                <p className="text-white font-medium">{comp.venue.address?.country || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Capienza</p>
                <p className="text-white font-medium">{venueCapacityMap[comp.venue.fullName]}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cronologia Gol */}
      {goals.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </span>
            Gol
          </h3>
          <div className="space-y-3">
            {goals.map(goal => {
              const isHome = goal.team.id === home?.team.id;
              return (
                <div key={goal.id} className={`flex items-center gap-4 ${isHome ? '' : 'flex-row-reverse'}`}>
                  <div className={`flex-1 ${isHome ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-flex items-center gap-3 bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-700/50 ${isHome ? 'flex-row-reverse' : ''}`}>
                      <div className={`text-2xl ${isHome ? 'text-right' : 'text-left'}`}>⚽</div>
                      <div>
                        <p className="text-white font-medium text-sm">{goal.participants[0]?.athlete.displayName}</p>
                        {goal.participants[1] && (
                          <p className="text-gray-400 text-xs">Assist: {goal.participants[1].athlete.displayName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{goal.clock.displayValue}</span>
                  </div>
                  <div className="flex-1" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Eventi Partita */}
      {(cards.length > 0 || subs.length > 0) && (
        <section className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Eventi Partita</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.length > 0 && (
              <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Cartellini</h4>
                <div className="space-y-2">
                  {cards.map(card => (
                    <div key={card.id} className="flex items-center gap-3 text-sm">
                      <span className={`w-3 h-4 rounded-sm ${card.type.text.includes('Yellow') ? 'bg-yellow-400' : 'bg-red-500'}`} />
                      <span className="text-gray-300">{card.participants?.[0]?.athlete?.displayName || card.shortText}</span>
                      <span className="text-gray-500 ml-auto text-xs">{card.clock.displayValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {subs.length > 0 && (
              <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Sostituzioni</h4>
                <div className="space-y-2">
                  {subs.slice(0, 10).map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 text-sm">
                      <span className="text-emerald-400">↔</span>
                      <span className="text-gray-300 text-xs">{sub.shortText || sub.text}</span>
                      <span className="text-gray-500 ml-auto text-xs">{sub.clock.displayValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Formazioni */}
      {summary.boxscore?.players && summary.boxscore.players.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Formazioni</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.boxscore.players.map(teamPlayers => (
              <div key={teamPlayers.team.id} className="bg-gray-800/60 rounded-2xl border border-gray-700/50 p-4">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  {getTeamLogo(teamPlayers.team) && (
                    <img src={getTeamLogo(teamPlayers.team)} alt="" className="w-5 h-5 object-contain" />
                  )}
                  {teamPlayers.team.abbreviation}
                </h4>
                <div className="space-y-1.5">
                  {teamPlayers.athletes.map(p => (
                    <div key={p.athlete.id} className="flex items-center gap-2 text-sm">
                      {p.starter && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      <span className={`${p.starter ? 'text-white' : 'text-gray-400'}`}>{p.athlete.displayName}</span>
                      {p.athlete.position && (
                        <span className="text-gray-500 text-xs ml-auto">{p.athlete.position.abbreviation}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Statistiche Partita (solo per partite finite) */}
      {!isUpcoming && summary.boxscore?.teams && summary.boxscore.teams.length > 0 && (
        <section>
          <h3 className="text-lg font-bold text-white mb-4">Statistiche Partita</h3>
          <div className="bg-gray-800/60 rounded-2xl border border-gray-700/50 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-gray-800/80 border-b border-gray-700/50 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span className="text-left">{home?.team.abbreviation}</span>
              <span className="text-center">Statistica</span>
              <span className="text-right">{away?.team.abbreviation}</span>
            </div>
            <div className="p-4 space-y-4">
              {summary.boxscore.teams[0]?.statistics?.map((stat, idx) => {
                const awayStat = summary.boxscore!.teams![1]?.statistics?.[idx];
                const homeVal = parseFloat(stat.displayValue) || 0;
                const awayVal = parseFloat(awayStat?.displayValue || '0') || 0;
                const total = homeVal + awayVal || 1;
                const homePct = (homeVal / total) * 100;
                const translated = statLabels[stat.name] || stat.name;
                return (
                  <div key={stat.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-white font-medium w-10 text-left">{stat.displayValue}</span>
                      <span className="text-gray-400 text-xs text-center flex-1">{translated}</span>
                      <span className="text-white font-medium w-10 text-right">{awayStat?.displayValue || '0'}</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-700">
                      <div className="bg-emerald-500 transition-all" style={{ width: `${homePct}%` }} />
                      <div className="bg-blue-500 transition-all" style={{ width: `${100 - homePct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
