'use client';
import React, { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const loadData = (isManual = false) => {
    if (isManual) setRefreshing(true);
    fetch('/api/ranking')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setPlayers(d);
        }
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (riotId: string) => {
    setExpandedPlayer(prev => (prev === riotId ? null : riotId));
  };

  const top1 = players[0];
  const top2 = players[1];
  const top3 = players[2];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/80 p-6 rounded-2xl border border-slate-800 gap-4 shadow-lg">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              🏆 SOLOQ CHALLENGE <span className="text-amber-400 text-xs font-bold px-2.5 py-1 bg-amber-400/10 border border-amber-400/20 rounded-md">AMIGOS</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Haz clic en cualquier jugador para ver sus campeones más jugados y su historial</p>
          </div>
          <button 
            onClick={() => loadData(true)} 
            disabled={refreshing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-2"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            {refreshing ? 'Actualizando...' : 'Actualizar ahora'}
          </button>
        </div>

        {loading && players.length === 0 ? (
          <div className="text-center py-24 text-slate-500 animate-pulse font-medium">
            Cargando ranking en vivo desde Riot Games...
          </div>
        ) : (
          <>
            {/* Podio Top 3 */}
            {players.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4 pb-2">
                
                {/* 2DO LUGAR */}
                <div 
                  onClick={() => toggleExpand(top2.riotId)}
                  className="order-2 md:order-1 bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/60 rounded-2xl p-5 text-center relative shadow-lg cursor-pointer hover:border-slate-500 transition"
                >
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-700 text-slate-200 border border-slate-500 text-xs font-black px-3 py-0.5 rounded-full">
                    🥈 2DO LUGAR
                  </span>
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${top2.profileIconId}.png`} 
                    alt="Icon" 
                    className="w-16 h-16 rounded-full mx-auto border-2 border-slate-400 shadow mt-2"
                  />
                  <h3 className="font-bold text-white text-lg mt-2 truncate">{top2.riotId}</h3>
                  <p className="text-xs text-slate-400 font-semibold">{top2.tier} {top2.rank}</p>
                  <p className="text-sm font-mono font-bold text-amber-400 mt-1">{top2.lp} LP</p>
                  <div className="text-xs text-slate-400 mt-2">WR: <span className="text-slate-200 font-bold">{top2.winrate}%</span> ({top2.wins}V - {top2.losses}D)</div>
                </div>

                {/* 1ER LUGAR */}
                <div 
                  onClick={() => toggleExpand(top1.riotId)}
                  className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-900/90 border-2 border-amber-500/50 rounded-2xl p-6 text-center relative shadow-2xl md:-translate-y-2 cursor-pointer hover:border-amber-400 transition"
                >
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-xs px-4 py-1 rounded-full shadow-md">
                    👑 LÍDER DEL TORNEO
                  </span>
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${top1.profileIconId}.png`} 
                    alt="Icon" 
                    className="w-20 h-20 rounded-full mx-auto border-4 border-amber-400 shadow-lg mt-1 ring-4 ring-amber-500/20"
                  />
                  <h3 className="font-extrabold text-white text-xl mt-3 truncate">{top1.riotId}</h3>
                  <p className="text-sm text-amber-300 font-bold">{top1.tier} {top1.rank}</p>
                  <p className="text-base font-mono font-black text-amber-400 mt-1">{top1.lp} LP</p>
                  <div className="text-xs text-slate-300 mt-2 bg-amber-500/10 py-1 px-3 rounded-full inline-block border border-amber-500/20">
                    WR: <span className="text-emerald-400 font-bold">{top1.winrate}%</span> ({top1.wins}V - {top1.losses}D)
                  </div>
                </div>

                {/* 3ER LUGAR */}
                <div 
                  onClick={() => toggleExpand(top3.riotId)}
                  className="order-3 bg-gradient-to-b from-amber-950/20 to-slate-900/90 border border-amber-900/40 rounded-2xl p-5 text-center relative shadow-lg cursor-pointer hover:border-amber-700 transition"
                >
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-800 text-amber-200 border border-amber-700 text-xs font-black px-3 py-0.5 rounded-full">
                    🥉 3ER LUGAR
                  </span>
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${top3.profileIconId}.png`} 
                    alt="Icon" 
                    className="w-16 h-16 rounded-full mx-auto border-2 border-amber-700 shadow mt-2"
                  />
                  <h3 className="font-bold text-white text-lg mt-2 truncate">{top3.riotId}</h3>
                  <p className="text-xs text-slate-400 font-semibold">{top3.tier} {top3.rank}</p>
                  <p className="text-sm font-mono font-bold text-amber-400 mt-1">{top3.lp} LP</p>
                  <div className="text-xs text-slate-400 mt-2">WR: <span className="text-slate-200 font-bold">{top3.winrate}%</span> ({top3.wins}V - {top3.losses}D)</div>
                </div>

              </div>
            )}

            {/* Tabla Principal */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 shadow-xl">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/90">
                    <th className="py-4 px-4 text-center w-16">Pos</th>
                    <th className="py-4 px-4 min-w-[200px]">Jugador</th>
                    <th className="py-4 px-4 min-w-[130px]">Estado</th>
                    <th className="py-4 px-4 min-w-[140px]">Rango & LP</th>
                    <th className="py-4 px-4 text-center min-w-[130px]">Winrate (V/D)</th>
                    <th className="py-4 px-4 min-w-[160px]">Últimas Partidas</th>
                    <th className="py-4 px-4 text-center w-12">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {players.map((p, idx) => {
                    const pos = idx + 1;
                    const isExpanded = expandedPlayer === p.riotId;

                    return (
                      <React.Fragment key={p.riotId}>
                        <tr 
                          onClick={() => toggleExpand(p.riotId)}
                          className={`cursor-pointer transition hover:bg-slate-800/50 ${
                            isExpanded ? 'bg-slate-800/40' : (pos === 1 ? 'bg-amber-500/[0.04]' : '')
                          }`}
                        >
                          <td className="py-4 px-4 text-center font-black">
                            {pos === 1 && <span className="text-lg">👑 1</span>}
                            {pos === 2 && <span className="text-base text-slate-300">🥈 2</span>}
                            {pos === 3 && <span className="text-base text-amber-600">🥉 3</span>}
                            {pos > 3 && <span className="text-slate-500 font-mono text-sm">#{pos}</span>}
                          </td>

                          <td className="py-4 px-4 font-bold text-white">
                            <div className="flex items-center gap-3">
                              <img 
                                src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${p.profileIconId}.png`} 
                                alt="Icon" 
                                className="w-10 h-10 rounded-full border border-slate-700 shadow shrink-0"
                              />
                              <span className="truncate">{p.riotId}</span>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {p.inGame ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> EN PARTIDA
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">Offline / En cola</span>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-200">{p.tier} {p.rank}</div>
                            <div className="text-xs font-mono font-semibold text-amber-400">{p.lp} LP</div>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <div className="font-bold text-slate-200">{p.winrate}%</div>
                            <div className="text-xs text-slate-400">({p.wins}V - {p.losses}D)</div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex gap-1.5 flex-wrap">
                              {p.recentMatches && p.recentMatches.length > 0 ? (
                                p.recentMatches.slice(0, 3).map((m: any, mIdx: number) => (
                                  <div 
                                    key={mIdx} 
                                    className={`px-2 py-0.5 rounded text-xs font-bold border flex items-center gap-1 ${
                                      m.win 
                                        ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' 
                                        : 'bg-rose-950/70 border-rose-800 text-rose-300'
                                    }`}
                                  >
                                    <span>{m.win ? 'V' : 'D'}</span>
                                    <span className="text-slate-400 font-normal text-[10px]">{m.champion}</span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-xs text-slate-600">-</span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-4 text-center text-slate-400">
                            <span className={`inline-block transition-transform duration-200 text-xs ${isExpanded ? 'rotate-180 text-amber-400' : ''}`}>
                              ▼
                            </span>
                          </td>
                        </tr>

                        {/* PANEL DESPLEGABLE */}
                        {isExpanded && (
                          <tr className="bg-slate-950/95 border-b border-slate-800">
                            <td colSpan={7} className="p-6">
                              <div className="space-y-6">
                                
                                {/* SECCIÓN: 3 CAMPEONES */}
                                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                    <span>⚡ 3 Campeones Más Jugados en SoloQ</span>
                                    <span className="text-[11px] text-slate-400 font-normal lowercase">(partidas recientes)</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {p.topPlayedChampions && p.topPlayedChampions.length > 0 ? (
                                      p.topPlayedChampions.map((champ: any, cIdx: number) => (
                                        <div key={cIdx} className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                                          <img 
                                            src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${champ.championName}.png`}
                                            alt={champ.championName}
                                            className="w-12 h-12 rounded-lg border border-slate-700 shadow shrink-0"
                                            onError={(e: any) => { e.target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg'; }}
                                          />
                                          <div className="flex-1">
                                            <div className="font-bold text-white text-sm">{champ.championName}</div>
                                            <div className="text-xs text-slate-300 font-medium">
                                              <span className="text-amber-400 font-bold">{champ.games}</span> {champ.games === 1 ? 'partida' : 'partidas'} ({champ.wins}V - {champ.losses}D)
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                              WR: <span className={champ.winrate >= 50 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{champ.winrate}%</span> • {champ.kda} KDA
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-xs text-slate-500">Sin datos de partidas recientes.</div>
                                    )}
                                  </div>
                                </div>

                                {/* SECCIÓN: HISTORIAL DETALLADO (1-5 a la izquierda | 6-10 a la derecha) */}
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                      Historial Reciente de SoloQ
                                    </div>
                                    <a 
                                      href={`https://www.op.gg/summoners/las/${encodeURIComponent(p.gameName)}-${encodeURIComponent(p.tagLine)}`}
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded hover:bg-blue-600/40 transition font-semibold"
                                    >
                                      Ver en OP.GG ↗
                                    </a>
                                  </div>

                                  {p.recentMatches && p.recentMatches.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                                      
                                      {/* COLUMNA IZQUIERDA: Partidas 1 a 5 (Más recientes) */}
                                      <div className="space-y-2">
                                        {p.recentMatches.slice(0, 5).map((match: any, mIdx: number) => {
                                          const kdaRatio = ((match.kills + match.assists) / Math.max(1, match.deaths)).toFixed(2);
                                          return (
                                            <div 
                                              key={`left-${mIdx}`}
                                              className={`flex items-center justify-between p-3 rounded-xl border ${
                                                match.win 
                                                  ? 'bg-emerald-950/20 border-emerald-800/40' 
                                                  : 'bg-rose-950/20 border-rose-800/40'
                                              }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <div className="relative">
                                                  <img 
                                                    src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${match.champion}.png`}
                                                    alt={match.champion}
                                                    className="w-10 h-10 rounded-lg border border-slate-700 shadow shrink-0"
                                                    onError={(e: any) => { e.target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg'; }}
                                                  />
                                                  <span className={`absolute -bottom-1 -right-1 text-[9px] font-black px-1 rounded ${
                                                    match.win ? 'bg-emerald-500 text-slate-950' : 'bg-rose-600 text-white'
                                                  }`}>
                                                    {match.win ? 'V' : 'D'}
                                                  </span>
                                                </div>
                                                <div>
                                                  <div className="font-bold text-white text-xs">{match.champion}</div>
                                                  <div className="text-[10px] text-slate-400">{match.duration}</div>
                                                </div>
                                              </div>

                                              <div className="text-right">
                                                <div className="font-mono text-xs font-bold text-slate-200">
                                                  <span className="text-emerald-400">{match.kills}</span> / 
                                                  <span className="text-rose-400"> {match.deaths} </span> / 
                                                  <span className="text-amber-400"> {match.assists}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                  <span className="text-slate-300 font-semibold">{kdaRatio} KDA</span> • {match.cs} CS
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* COLUMNA DERECHA: Partidas 6 a 10 */}
                                      <div className="space-y-2">
                                        {p.recentMatches.slice(5, 10).map((match: any, mIdx: number) => {
                                          const kdaRatio = ((match.kills + match.assists) / Math.max(1, match.deaths)).toFixed(2);
                                          return (
                                            <div 
                                              key={`right-${mIdx}`}
                                              className={`flex items-center justify-between p-3 rounded-xl border ${
                                                match.win 
                                                  ? 'bg-emerald-950/20 border-emerald-800/40' 
                                                  : 'bg-rose-950/20 border-rose-800/40'
                                              }`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <div className="relative">
                                                  <img 
                                                    src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/${match.champion}.png`}
                                                    alt={match.champion}
                                                    className="w-10 h-10 rounded-lg border border-slate-700 shadow shrink-0"
                                                    onError={(e: any) => { e.target.src = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/29.jpg'; }}
                                                  />
                                                  <span className={`absolute -bottom-1 -right-1 text-[9px] font-black px-1 rounded ${
                                                    match.win ? 'bg-emerald-500 text-slate-950' : 'bg-rose-600 text-white'
                                                  }`}>
                                                    {match.win ? 'V' : 'D'}
                                                  </span>
                                                </div>
                                                <div>
                                                  <div className="font-bold text-white text-xs">{match.champion}</div>
                                                  <div className="text-[10px] text-slate-400">{match.duration}</div>
                                                </div>
                                              </div>

                                              <div className="text-right">
                                                <div className="font-mono text-xs font-bold text-slate-200">
                                                  <span className="text-emerald-400">{match.kills}</span> / 
                                                  <span className="text-rose-400"> {match.deaths} </span> / 
                                                  <span className="text-amber-400"> {match.assists}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                  <span className="text-slate-300 font-semibold">{kdaRatio} KDA</span> • {match.cs} CS
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                    </div>
                                  ) : (
                                    <div className="text-xs text-slate-500 py-1">No se encontraron partidas recientes de SoloQ.</div>
                                  )}
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}