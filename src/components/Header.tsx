import Link from 'next/link';
import { LiveTicker } from '@/components/LiveTicker';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/risultati', label: 'Risultati' },
  { href: '/calendario', label: 'Calendario' },
  { href: '/classifiche', label: 'Classifiche' },
  { href: '/marcatori', label: 'Marcatori' },
];

export default function Header() {
  return (
    <>
      <LiveTicker />
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                  <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">Mondiali 2026</h1>
                <p className="text-gray-400 text-xs">USA · Canada · Messico</p>
              </div>
            </Link>
            <nav className="flex items-center gap-1">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
