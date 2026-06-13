# Mondiali 2026 — Web App Risultati Live, Classifiche e Calendario

## Panoramica

Crea una web app moderna per seguire i **Mondiali FIFA 2026** (USA, Canada, Messico) in tempo reale. L'app mostra risultati live, calendario partite, classifiche gironi, marcatori e dettagli di ogni partita, usando i dati delle API pubbliche di ESPN.

## Stack Tecnologico

- **Framework**: Next.js 16 (App Router)
- **Linguaggio**: TypeScript
- **Styling**: Tailwind CSS v4
- **Date**: date-fns con locale italiana
- **Font**: Geist (Sans + Mono) via `next/font`
- **Deploy**: Static/Serverless-ready (SSR/ISR)

## API di Riferimento

- **Scoreboard**: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD`
- **Standings**: `https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings`
- **Match Summary**: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event={id}`
- **Teams**: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams`
- **Statistics (marcatori)**: `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/statistics`
- **News**: `https://now.core.api.espn.com/v1/sports/news?leagues=fifa.world`

## Struttura del Progetto

```
src/
├── app/
│   ├── layout.tsx              # Root layout con Header, footer, font, metadata
│   ├── page.tsx                # Homepage: partite live, risultati recenti, prossime
│   ├── globals.css             # Stili globali Tailwind + animazioni custom
│   ├── api/
│   │   └── scoreboard/
│   │       └── route.ts        # API route per fetch lato client (LiveTicker)
│   ├── risultati/
│   │   └── page.tsx            # Tutte le partite finite, raggruppate per data
│   ├── calendario/
│   │   └── page.tsx            # Tutte le partite future, raggruppate per data
│   ├── classifiche/
│   │   └── page.tsx            # Classifiche gironi + formato torneo
│   ├── standings/
│   │   └── page.tsx            # (alias) Classifiche gironi
│   ├── marcatori/
│   │   └── page.tsx            # Classifica cannonieri con medaglie
│   └── matches/
│       └── [id]/
│           └── page.tsx        # Dettaglio partita: risultato, gol, eventi, statistiche, formazioni
├── components/
│   ├── Header.tsx              # Navbar sticky con logo, navigazione, LiveTicker
│   ├── LiveTicker.tsx          # Barra scorrevole con partite live in tempo reale
│   ├── MatchCard.tsx           # Card partita (home/away, punteggio, status, stadio, gruppo)
│   └── GroupTable.tsx          # Tabella classifica girone + griglia gironi
└── lib/
    ├── types.ts                # Tutti i tipi TypeScript (Team, MatchEvent, Competition, ecc.)
    └── api.ts                  # Funzioni fetch: scoreboard, standings, summary, news, goal leaders
```

## Funzionalità Implementate

### 1. Homepage (`/`)
- Hero section con countdown visivo e badge "Live"
- Sezione **Live Ora**: partite in corso con indicatore pulsante
- Sezione **Risultati Recenti**: partite finite oggi e ieri, raggruppate per data
- Sezione **Prossime Partite**: partite in programma oggi e domani
- ISR con `revalidate = 30` secondi

### 2. Risultati (`/risultati`)
- Tutte le partite finite, ordinate dalla più recente
- Raggruppate per data con formato italiano (es. "sabato, 14 giugno 2026")
- Contatori: numero partite e gol totali

### 3. Calendario (`/calendario`)
- Tutte le partite future, ordinate cronologicamente
- Raggruppate per data

### 4. Classifiche Gironi (`/classifiche`, `/standings`)
- Griglia responsive (1/2/3 colonne) con 12 gironi
- Tabella: #, Team, PG, V, P, S, GF, GS, DR, Pt
- Ordinamento per punti, differenza reti, gol fatti
- Evidenziazione visiva: 1° (verde), 2° (verde chiaro), 3° (giallo), 4° (grigio)
- Legenda qualificazione
- Sezione "Formato del Torneo" con card riassuntive

### 5. Marcatori (`/marcatori`)
- Classifica cannonieri con medaglie (oro/argento/bronzo)
- Tabella: #, Giocatore, Squadra (con logo), Gol
- Cross-reference tra API statistics e match summaries per associare giocatori alle squadre

### 6. Dettaglio Partita (`/matches/[id]`)
- Scoreboard hero con loghi squadre grandi e punteggio
- Status: Live (con timer), Finita, o data/ora
- Info stadio con capienza (mappa di capacità)
- **Cronologia Gol**: timeline con minuto, marcatore, assist
- **Eventi Partita**: cartellini gialli/rossi e sostituzioni
- **Formazioni**: titolari (pallino verde) e panchina, per squadra
- **Statistiche Partita**: barre comparative (possesso, tiri, passaggi, falli, ecc.) con traduzione italiana

### 7. Live Ticker (globale)
- Barra sticky in alto con scorrimento infinito delle partite live
- Polling ogni 30 secondi via API route `/api/scoreboard`
- Mostra logo, nome, punteggio e minuto per ogni partita live
- Link diretto al dettaglio partita

### 8. Header
- Logo con icona personalizzata (pallone da calcio in SVG)
- Navigazione: Home, Risultati, Calendario, Classifiche, Marcatori
- Sticky con sfondo scuro

### 9. API Route (`/api/scoreboard`)
- Proxy server-side per il LiveTicker client-side
- Cache ISR 30 secondi

## Pattern e Dettagli Tecnici

- **Fetch scoreboard**: interroga ogni giorno dal 11 Giugno al 19 Luglio in parallelo, deduplica per ID
- **Cache loghi squadre**: `Map<string, string>` condiviso, popolato da API teams, usato per arricchire tutti i dati
- **Cross-reference marcatori**: dopo aver fetchato i goal leaders, analizza le partite finite per associare ogni giocatore alla sua squadra
- **Recupero venue**: per partite future, il summary API non include lo stadio → fallback su scoreboard API
- **Locale italiana**: date formattate con `date-fns/locale/it`
- **Tema scuro**: sfondo `gray-950`, card `gray-800/60`, accenti `emerald`
- **Animazioni**: pulse per live, ping per indicatore, scroll infinito per ticker, gradienti
- **Responsive**: griglie adattive (1/2/3 colonne), dimensioni testo variabili

## Design System

- **Colori**: Base `gray-950`, card `gray-800/60`, accenti `emerald-500/600`, live `red-500`
- **Bordi**: `border-gray-700/50` con `backdrop-blur-sm` per effetto vetro
- **Tipografia**: Geist Sans per testi, Geist Mono per numeri (`tabular-nums`)
- **Stati**: Live (rosso pulsante), Finita (grigio), In programma (verde)
- **Icone**: SVG inline minimaliste

## Note sul Torneo

- 48 squadre, 12 gironi da 4
- 104 partite totali
- Prime 2 + migliori 3° posto avanzano agli Ottavi (32 squadre)
- Date: 11 Giugno – 19 Luglio 2026
- Sedi: USA, Canada, Messico