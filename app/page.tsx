'use client';
import React, { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import RouletteModal from './RouletteModal';
import Logo from './Logo';

export default function Leaderboard() {
  const { data: session, status } = useSession();

  const [players, setPlayers] = useState<any[]>([]);
  const [penalties, setPenalties] = useState<Record<string, any>>({});
  const [usedShells, setUsedShells] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [attackerPlayer, setAttackerPlayer] = useState<any>(null);
  const [victimPlayer, setVictimPlayer] = useState<any>(null);
  const [isFlyingShell, setIsFlyingShell] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setErrorMsg(null);

    try {
      const [resRank, resShellData] = await Promise.all([
        fetch('/api/ranking').then(async (r) => {
          if (!r.ok) throw new Error(`Error API (${r.status})`);
          return r.json();
        }),
        fetch('/api/blueshell')
          .then((r) => r.json())
          .catch(() => ({ activePenalties: {}, usedShells: {} })),
      ]);

      if (Array.isArray(resRank) && resRank.length > 0) {
        setPlayers(resRank);
      } else {
        setErrorMsg("No se recibieron datos de invocadores. Verifica tu RIOT_API_KEY.");
      }

      if (resShellData) {
        setPenalties(resShellData.activePenalties || {});
        setUsedShells(resShellData.usedShells || {});
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setErrorMsg("Error cargando los datos. ¿Expiró la RIOT_API_KEY en .env.local?");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (riotId: string) => {
    setExpandedPlayer((prev) => (prev === riotId ? null : riotId));
  };

  // MODO TEST: 10 conchas garantizadas para pruebas
  const getAvailableShells = (player: any) => {
    if (!player) return 0;
    const earned = 10;
    const used = usedShells[player.riotId] || 0;
    return Math.max(0, earned - used);
  };

  const currentDiscordId = (session?.user as any)?.discordId;
  const me = currentDiscordId ? players.find((p) => p.discordId === currentDiscordId) : null;
  const myShells = getAvailableShells(me);

  const handleLaunchBlueShell = (targetVictim: any) => {
    if (!session) {
      signIn('discord');
      return;
    }
    if (!me) {
      alert('⚠️ Tu cuenta de Discord no está registrada como participante en el torneo.');
      return;
    }
    if (myShells <= 0) {
      alert('⚠️ No tienes Blue Shells disponibles. ¡Consigue racha de victorias o Pentakill!');
      return;
    }

    setAttackerPlayer(me);
    setVictimPlayer(targetVictim);
    
    setIsFlyingShell(true);
    setTimeout(() => {
      setIsFlyingShell(false);
      setIsRouletteOpen(true);
    }, 1200);
  };

  const top1 = players[0];
  const top2 = players[1];
  const top3 = players[2];

  const getOpGgUrl = (riotId: string) => {
    if (!riotId) return 'https://las.op.gg';
    const parts = riotId.split('#');
    const name = encodeURIComponent(parts[0] || '');
    const tag = encodeURIComponent(parts[1] || 'LAS');
    return `https://www.op.gg/summoners/las/${name}-${tag}`;
  };

  const formatChampionName = (name: any) => {
    if (!name || typeof name !== 'string') return 'Aatrox';
    let cleaned = name.replace(/['\s.]/g, '');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  return (
    <main className="min-h-screen text-slate-100 p-4 sm:p-6 md:p-10 font-sans relative overflow-x-hidden selection:bg-blue-500 selection:text-white bg-[#030712]">
      
      {/* ANIMACIÓN DE PROYECTIL BLUE SHELL */}
      {isFlyingShell && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center overflow-hidden">
          <div className="absolute animate-shellFly text-5xl filter drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
            🐚💥
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes shellFly {
          0% { transform: translateX(-10vw) translateY(20vh) scale(0.5) rotate(-30deg); opacity: 0; }
          20% { opacity: 1; scale: 1.2; }
          80% { opacity: 1; scale: 1.5; }
          100% { transform: translateX(110vw) translateY(-20vh) scale(2) rotate(360deg); opacity: 0; }
        }
        .animate-shellFly {
          animation: shellFly 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>

      {/* FONDO WILLEM DAFOE NÍTIDO */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-top bg-no-repeat opacity-50 transition-opacity duration-700"
        style={{ backgroundImage: `url('/willem.png'), url('/willem.jpg')` }}
      />
      
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#030712]/40 via-[#030712]/60 to-[#030712]/90 backdrop-blur-[0.5px]" />
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse duration-1000" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse duration-1000" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* CABECERA PRINCIPAL */}
        <header className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0a0f1d]/85 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/60 shadow-[0_8px_32px_rgba(0,0,0,0.5)] gap-4 transition-all duration-300 hover:border-slate-500">
          <div className="flex items-center gap-4">
            <Logo className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 transition-transform duration-300 hover:scale-105" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                  SOLOQ CHALLENGE
                </h1>
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 bg-amber-400/15 text-amber-300 border border-amber-400/40 rounded-xl shadow-[0_0_12px_rgba(251,191,36,0.2)] animate-pulse">
                  TORNEO SOLOQUM
                </span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 flex items-center gap-2 font-medium">
                <span>Consigue Blue Shells con racha de 4 wins o Pentakill</span>
                <span className="text-blue-400 font-bold">🐚💥</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {status === 'loading' ? (
              <span className="text-xs text-slate-400 animate-pulse font-medium">Verificando...</span>
            ) : session ? (
              <div className="flex items-center gap-3 bg-[#050811]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-blue-500/40 shadow-lg shadow-blue-500/10 transition-transform duration-200 hover:scale-[1.02]">
                {session.user?.image ? (
                  <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full border border-blue-400/60 shadow" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">LoL</div>
                )}
                <div className="text-left">
                  <p className="text-xs font-black text-white leading-tight">{me ? me.riotId : session.user?.name}</p>
                  <p className="text-[11px] text-blue-400 font-bold leading-tight flex items-center gap-1">
                    <span>🐚 x{myShells}</span>
                    <span className="text-[10px] text-slate-400 font-normal">listas</span>
                  </p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-slate-400 hover:text-rose-400 ml-2 font-black transition p-1 hover:bg-slate-800 rounded-lg"
                  title="Cerrar sesión"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('discord')}
                className="px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] active:scale-95 text-white text-xs font-black rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-[#5865F2]/30 hover:shadow-[#5865F2]/50 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Iniciar con Discord</span>
              </button>
            )}

            <button 
              onClick={() => loadData(true)} 
              disabled={refreshing}
              title="Actualizar datos en vivo"
              className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0a0f1d]/90 hover:bg-slate-800 active:scale-95 border border-slate-700/80 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              <svg
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-all ${
                  refreshing ? 'animate-spin text-amber-400' : 'group-hover:rotate-180 duration-500'
                }`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span className="hidden sm:inline">{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </header>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg">
            <span>⚠️ {errorMsg}</span>
            <button
              onClick={() => loadData(true)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg shrink-0 transition"
            >
              Reintentar
            </button>
          </div>
        )}

        {loading && players.length === 0 ? (
          <div className="text-center py-28 text-slate-400 animate-pulse font-bold text-sm tracking-wide">
            ⚡ Conectando con Riot Games y sincronizando clasificaciones...
          </div>
        ) : (
          <>
            {/* PODIO TOP 3 */}
            {players.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4 pb-2">
                <div 
                  onClick={() => toggleExpand(top2.riotId)}
                  className="order-2 md:order-1 bg-[#0a0f1d]/85 backdrop-blur-md border border-slate-700/85 hover:border-slate-300 rounded-3xl p-6 text-center relative shadow-2xl cursor-pointer hover:-translate-y-2.5 transition-all duration-300 group"
                >
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-950 font-black text-[11px] px-3.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                    🥈 2DO LUGAR
                  </span>
                  <div className="relative w-20 h-20 mx-auto mt-2">
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${top2.profileIconId}.png`} 
                      alt="Icon" 
                      className="w-full h-full rounded-full border-2 border-slate-300 shadow-md group-hover:scale-110 transition-transform duration-300"
                      onError={(e: any) => { e.target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg'; }}
                    />
                  </div>
                  <h3 className="font-black text-white text-lg mt-3 truncate">{top2.riotId}</h3>
                  <div className="inline-block mt-1 px-3 py-0.5 rounded-xl text-[11px] font-extrabold border border-slate-700 bg-[#050811] uppercase tracking-wide text-slate-200">
                    {top2.tier} {top2.rank}
                  </div>
                  <p className="text-base font-mono font-black text-amber-400 mt-1">{top2.lp} LP</p>
                  <div className="text-xs text-slate-300 mt-2 bg-[#050811]/80 py-1 px-3 rounded-full inline-block border border-slate-800">
                    WR: <span className="text-white font-bold">{top2.winrate}%</span> ({top2.wins}V - {top2.losses}D)
                  </div>
                </div>

                <div 
                  onClick={() => toggleExpand(top1.riotId)}
                  className="order-1 md:order-2 bg-[#0a0f1d]/90 backdrop-blur-md border-2 border-amber-500/80 hover:border-amber-400 rounded-3xl p-7 text-center relative shadow-[0_0_40px_rgba(251,191,36,0.2)] md:-translate-y-4 cursor-pointer hover:-translate-y-7 transition-all duration-300 group"
                >
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-xs px-5 py-1 rounded-full shadow-lg shadow-amber-500/40 uppercase tracking-wider flex items-center gap-1 animate-pulse">
                    👑 LÍDER DEL TORNEO
                  </span>
                  <div className="relative w-24 h-24 mx-auto mt-2">
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${top1.profileIconId}.png`} 
                      alt="Icon" 
                      className="w-full h-full rounded-full border-4 border-amber-400 shadow-xl ring-4 ring-amber-500/30 group-hover:scale-110 transition-transform duration-300"
                      onError={(e: any) => { e.target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg'; }}
                    />
                  </div>
                  <h3 className="font-black text-white text-xl mt-3 truncate">{top1.riotId}</h3>
                  <div className="inline-block mt-1 px-3 py-0.5 rounded-xl text-xs font-black border uppercase tracking-wide text-amber-300 border-amber-500/50 bg-amber-500/10">
                    {top1.tier} {top1.rank}
                  </div>
                  <p className="text-lg font-mono font-black text-amber-400 mt-1">{top1.lp} LP</p>
                  <div className="text-xs text-slate-200 mt-2 bg-[#050811]/80 py-1 px-4 rounded-full inline-block border border-amber-500/40 shadow-inner">
                    WR: <span className="text-emerald-400 font-extrabold">{top1.winrate}%</span> ({top1.wins}V - {top1.losses}D)
                  </div>
                </div>

                <div 
                  onClick={() => toggleExpand(top3.riotId)}
                  className="order-3 bg-[#0a0f1d]/85 backdrop-blur-md border border-amber-900/80 hover:border-amber-700 rounded-3xl p-6 text-center relative shadow-2xl cursor-pointer hover:-translate-y-2.5 transition-all duration-300 group"
                >
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-100 font-black text-[11px] px-3.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                    🥉 3ER LUGAR
                  </span>
                  <div className="relative w-20 h-20 mx-auto mt-2">
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${top3.profileIconId}.png`} 
                      alt="Icon" 
                      className="w-full h-full rounded-full border-2 border-amber-700 shadow-md group-hover:scale-110 transition-transform duration-300"
                      onError={(e: any) => { e.target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg'; }}
                    />
                  </div>
                  <h3 className="font-black text-white text-lg mt-3 truncate">{top3.riotId}</h3>
                  <div className="inline-block mt-1 px-3 py-0.5 rounded-xl text-[11px] font-extrabold border border-slate-700 bg-[#050811] uppercase tracking-wide text-slate-200">
                    {top3.tier} {top3.rank}
                  </div>
                  <p className="text-base font-mono font-black text-amber-400 mt-1">{top3.lp} LP</p>
                  <div className="text-xs text-slate-300 mt-2 bg-[#050811]/80 py-1 px-3 rounded-full inline-block border border-slate-800">
                    WR: <span className="text-white font-bold">{top3.winrate}%</span> ({top3.wins}V - {top3.losses}D)
                  </div>
                </div>
              </div>
            )}

            {/* TABLA PRINCIPAL */}
            <div className="rounded-3xl border border-slate-700/80 bg-[#0a0f1d]/90 backdrop-blur-xl shadow-2xl shadow-black/90 p-4 sm:p-6 space-y-3">
              <div className="grid grid-cols-9 text-[11px] font-black text-slate-400 uppercase tracking-wider px-4 py-2 border-b border-slate-800/80">
                <div className="text-center">Pos</div>
                <div className="col-span-2">Jugador</div>
                <div>Estado</div>
                <div>Rango & LP</div>
                <div className="text-center">Winrate</div>
                <div className="text-center">Blue Shells</div>
                <div className="text-center">Castigo Activo</div>
                <div className="text-center">Acción</div>
              </div>

              <div className="space-y-2.5">
                {players.map((p, idx) => {
                  const pos = idx + 1;
                  const isExpanded = expandedPlayer === p.riotId;
                  const activePen = penalties[p.riotId];
                  const playerEarnedShells = getAvailableShells(p);
                  const isMyself = me?.riotId === p.riotId;

                  const rawMatches = Array.isArray(p.recentMatches) ? p.recentMatches.slice(0, 10) : [];

                  const leftCol = rawMatches.slice(0, 5);
                  const rightCol = rawMatches.slice(5, 10);
                  const orderedMatches: any[] = [];
                  for (let i = 0; i < 5; i++) {
                    if (leftCol[i]) orderedMatches.push(leftCol[i]);
                    if (rightCol[i]) orderedMatches.push(rightCol[i]);
                  }

                  const champCounts: Record<string, { wins: number; losses: number; kills: number; deaths: number; assists: number; games: number }> = {};
                  rawMatches.forEach((m: any) => {
                    const cName = m.championName || m.champion || m.champName || 'Desconocido';
                    if (!champCounts[cName]) {
                      champCounts[cName] = { wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0, games: 0 };
                    }
                    champCounts[cName].games += 1;
                    if (m.win) champCounts[cName].wins += 1;
                    else champCounts[cName].losses += 1;
                    champCounts[cName].kills += (m.kills || 0);
                    champCounts[cName].deaths += (m.deaths || 0);
                    champCounts[cName].assists += (m.assists || 0);
                  });

                  const computedTopChamps = Object.keys(champCounts)
                    .map((name) => ({
                      championName: name,
                      games: champCounts[name].games,
                      wins: champCounts[name].wins,
                      losses: champCounts[name].losses,
                      winrate: Math.round((champCounts[name].wins / champCounts[name].games) * 100),
                      kda: ((champCounts[name].kills + champCounts[name].assists) / Math.max(1, champCounts[name].deaths)).toFixed(2),
                    }))
                    .sort((a, b) => b.games - a.games)
                    .slice(0, 3);

                  const displayTopChamps = (p.topPlayedChampions && p.topPlayedChampions.length > 0) 
                    ? p.topPlayedChampions 
                    : computedTopChamps;

                  return (
                    <React.Fragment key={p.riotId}>
                      <div 
                        onClick={() => toggleExpand(p.riotId)}
                        className={`grid grid-cols-9 items-center px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 border transform hover:scale-[1.01] ${
                          isExpanded 
                            ? 'bg-slate-800/60 border-blue-500/70 shadow-xl' 
                            : pos === 1 
                            ? 'bg-amber-500/[0.04] border-amber-500/30 hover:border-amber-400/80' 
                            : 'bg-[#050811]/70 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-500'
                        } ${isMyself ? 'border-l-4 border-l-blue-500 bg-blue-950/30' : ''}`}
                      >
                        <div className="text-center font-black">
                          {pos === 1 && <span className="text-xl">👑 1</span>}
                          {pos === 2 && <span className="text-lg text-slate-300">🥈 2</span>}
                          {pos === 3 && <span className="text-lg text-amber-600">🥉 3</span>}
                          {pos > 3 && <span className="text-slate-400 font-mono text-sm">#{pos}</span>}
                        </div>

                        <div className="col-span-2 font-bold text-white flex items-center gap-3">
                          <img 
                            src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${p.profileIconId}.png`} 
                            alt="Icon" 
                            className="w-10 h-10 rounded-full border border-slate-700 shadow shrink-0 transition-transform duration-200 hover:scale-110"
                            onError={(e: any) => { e.target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg'; }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate text-sm font-black text-white">{p.riotId}</span>
                            {isMyself && <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">(Tú)</span>}
                          </div>
                        </div>

                        <div>
                          {p.inGame ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              EN PARTIDA
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">Offline</span>
                          )}
                        </div>

                        <div>
                          <div className="font-black text-slate-100 text-xs uppercase">{p.tier} {p.rank}</div>
                          <div className="text-xs font-mono font-black text-amber-400 mt-0.5">{p.lp} LP</div>
                        </div>

                        <div className="text-center">
                          <div className="font-black text-white">{p.winrate}%</div>
                          <div className="text-[10px] text-slate-400">({p.wins}V - {p.losses}D)</div>
                        </div>

                        <div className="text-center">
                          {playerEarnedShells > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/40 shadow-sm animate-pulse">
                              🐚 x{playerEarnedShells}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600 font-mono">0</span>
                          )}
                        </div>

                        <div className="text-center flex items-center justify-center">
                          {activePen ? (
                            <div className="relative group/pen inline-block" onClick={(e) => e.stopPropagation()}>
                              <div className="cursor-help bg-blue-950/80 hover:bg-blue-900 border border-blue-500/50 hover:border-blue-400 text-blue-200 px-2.5 py-1 rounded-xl text-[11px] font-medium inline-flex items-center gap-1 max-w-[150px] truncate shadow-sm transition-all">
                                <span className="shrink-0">🐚 ⚠️</span>
                                <span className="truncate">
                                  <strong className="text-blue-400 font-bold">#{activePen.penalty.id}:</strong> {activePen.penalty.text}
                                </span>
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/pen:flex flex-col w-64 p-3 bg-[#050811] border border-blue-500/40 rounded-xl shadow-2xl z-50 pointer-events-none text-left">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                                    Penitencia #{activePen.penalty.id}
                                  </span>
                                  {activePen.attacker && (
                                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                      Por: <strong className="text-slate-200">{activePen.attacker}</strong>
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-white font-semibold leading-relaxed">
                                  "{activePen.penalty.text}"
                                  {activePen.extraConfig && (
                                    <span className="block mt-1 text-amber-300 font-bold">Detalle: {activePen.extraConfig}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium italic bg-slate-900/60 px-2.5 py-1 rounded-xl border border-slate-800">
                              Sin castigos aún ✨
                            </span>
                          )}
                        </div>

                        <div className="text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={!session || !me || myShells <= 0 || isMyself || isFlyingShell}
                            onClick={() => handleLaunchBlueShell(p)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-20 disabled:hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-95 flex items-center gap-1 mx-auto uppercase tracking-wider hover:shadow-blue-500/30"
                          >
                            <span>🐚</span>
                            <span>Tirar</span>
                          </button>
                        </div>
                      </div>

                      {/* PANEL EXPANDIBLE ORDENADO */}
                      {isExpanded && (
                        <div className="bg-[#050811] border border-slate-800 p-6 rounded-2xl mx-2 shadow-inner my-1 space-y-6 transition-all duration-300">
                          
                          {/* Enlace a OP.GG */}
                          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Acceso Externo</span>
                            <a 
                              href={getOpGgUrl(p.riotId)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5"
                            >
                              <span>🌐</span> Ver perfil completo en OP.GG
                            </a>
                          </div>

                          {/* Top 3 Campeones */}
                          <div>
                            <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                              <span>⚡ Top 3 Campeones Más Jugados (De sus últimas 10 partidas)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {displayTopChamps && displayTopChamps.length > 0 ? (
                                displayTopChamps.map((champ: any, cIdx: number) => {
                                  const formattedName = formatChampionName(champ.championName);
                                  return (
                                    <div key={cIdx} className="flex items-center gap-3 bg-[#0a0f1d] p-3.5 rounded-xl border border-slate-800 transition-transform duration-200 hover:scale-[1.02]">
                                      <img 
                                        src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${formattedName}.png`}
                                        alt={champ.championName}
                                        className="w-12 h-12 rounded-xl border border-slate-700 shadow shrink-0 object-cover"
                                        onError={(e: any) => { e.target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg'; }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-extrabold text-white text-sm truncate">{champ.championName}</div>
                                        <div className="text-xs text-slate-300 font-medium mt-0.5">
                                          <span className="text-amber-400 font-bold">{champ.games}</span> part. ({champ.wins}V - {champ.losses}D)
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                          WR: <span className={champ.winrate >= 50 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{champ.winrate}%</span> • {champ.kda} KDA
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-xs text-slate-500 font-medium">Sin datos de campeones recientes.</div>
                              )}
                            </div>
                          </div>

                          {/* Historial de las 10 Partidas */}
                          <div>
                            <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">
                              📜 Historial Reciente de SoloQ ({rawMatches.length} Partidas)
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {orderedMatches.length > 0 ? (
                                orderedMatches.map((match: any, mIdx: number) => {
                                  const isWin = match.win;
                                  const rawChampName = match.championName || match.champion || match.champName || 'Aatrox';
                                  const formattedChamp = formatChampionName(rawChampName);
                                  const champImg = `https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${formattedChamp}.png`;

                                  return (
                                    <div 
                                      key={mIdx} 
                                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                                        isWin 
                                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
                                          : 'bg-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-500/5'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="relative shrink-0">
                                          <img 
                                            src={champImg} 
                                            alt={rawChampName} 
                                            className="w-11 h-11 rounded-xl border border-slate-700 object-cover shadow"
                                            onError={(e: any) => { e.target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg'; }}
                                          />
                                          <span className={`absolute -bottom-1 -right-1 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center text-slate-950 uppercase ${
                                            isWin ? 'bg-emerald-400' : 'bg-rose-500 text-white'
                                          }`}>
                                            {isWin ? 'V' : 'D'}
                                          </span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="font-extrabold text-white text-xs truncate">{rawChampName}</span>
                                          <span className="text-[10px] text-slate-400 font-mono">{match.gameDuration || '30m'}</span>
                                        </div>
                                      </div>

                                      <div className="flex flex-col items-end text-right shrink-0">
                                        <div className="text-xs font-black text-slate-200 font-mono">
                                          {match.kills} / <span className="text-rose-400">{match.deaths}</span> / {match.assists}
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                          <span className="text-amber-400 font-bold">{match.kda ? `${match.kda} KDA` : ''}</span> • {match.cs !== undefined ? `${match.cs} CS` : ''}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-xs text-slate-500 font-medium italic col-span-2">No hay registros detallados de partidas recientes en la API.</div>
                              )}
                            </div>
                          </div>

                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {victimPlayer && (
          <RouletteModal
            isOpen={isRouletteOpen}
            onClose={() => {
              setIsRouletteOpen(false);
              loadData(false);
            }}
            victim={victimPlayer}
            attacker={attackerPlayer}
            onFinish={() => {
              setTimeout(() => {
                loadData(false);
              }, 1200);
            }}
          />
        )}
      </div>
    </main>
  );
}