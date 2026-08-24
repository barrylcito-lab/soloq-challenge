import { NextResponse } from 'next/server';

const RIOT_API_KEY = 'RGAPI-4233422f-76fa-4b31-98ae-a51d39c4db13';
const REGION = 'americas';
const PLATFORM = 'la2';

const PLAYERS = [
  { name: 'Barry', tag: '24081' },
  { name: 'Tarikk', tag: 'LAS' },
  { name: 'Bloodme', tag: 'LAS' },
  { name: 'DakaH', tag: 'Saiko' },
  { name: 'Disprezz', tag: 'LAS' },
  { name: 'Wachumeiket', tag: 'LAS' },
  { name: 'Jamie Tarttッ', tag: '999' },
];

const TIER_BASE: Record<string, number> = {
  IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200,
  PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400,
  MASTER: 2800, GRANDMASTER: 2800, CHALLENGER: 2800
};
const DIV_BASE: Record<string, number> = { IV: 0, III: 100, II: 200, I: 300 };

const playerStorage: Record<string, any> = {};
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPlayerData(player: { name: string; tag: string }) {
  const fullRiotId = `${player.name}#${player.tag}`;
  const headers = { 'X-Riot-Token': RIOT_API_KEY };

  try {
    // 1. PUUID
    const accUrl = `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(player.name.trim())}/${encodeURIComponent(player.tag.trim())}`;
    const accRes = await fetch(accUrl, { headers, cache: 'no-store' });
    if (!accRes.ok) return playerStorage[fullRiotId] || getDefaultPlayer(player);
    const account = await accRes.json();
    const puuid = account.puuid;

    // 2. Summoner
    const sumRes = await fetch(`https://${PLATFORM}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`, { headers, cache: 'no-store' });
    const summoner = sumRes.ok ? await sumRes.json() : {};

    // 3. Liga SoloQ
    let leagues: any[] = [];
    const leagueByPuuid = await fetch(`https://${PLATFORM}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`, { headers, cache: 'no-store' });
    if (leagueByPuuid.ok) {
      leagues = await leagueByPuuid.json();
    } else if (summoner.id) {
      const leagueBySummoner = await fetch(`https://${PLATFORM}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`, { headers, cache: 'no-store' });
      if (leagueBySummoner.ok) leagues = await leagueBySummoner.json();
    }
    const soloQ = leagues.find((l: any) => l.queueType === 'RANKED_SOLO_5x5');

    // 4. En Vivo
    const specRes = await fetch(`https://${PLATFORM}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`, { headers, cache: 'no-store' });
    const inGame = specRes.status === 200;

    // 5. Historial SoloQ (10 partidas)
    const matchIdsRes = await fetch(`https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&count=10`, { headers, cache: 'no-store' });
    const matchIds: string[] = matchIdsRes.ok ? await matchIdsRes.json() : [];

    const recentMatchesRaw = await Promise.all(
      matchIds.map(async (mId) => {
        const mRes = await fetch(`https://${REGION}.api.riotgames.com/lol/match/v5/matches/${mId}`, { headers, cache: 'no-store' });
        if (!mRes.ok) return null;
        const mData = await mRes.json();
        const p = mData.info?.participants?.find((part: any) => part.puuid === puuid);
        if (!p) return null;

        const durMin = Math.floor((mData.info?.gameDuration || 0) / 60);
        const durSec = (mData.info?.gameDuration || 0) % 60;
        const timestamp = mData.info?.gameEndTimestamp || mData.info?.gameStartTimestamp || 0;

        return {
          win: p.win,
          champion: p.championName,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          cs: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0),
          duration: `${durMin}m ${durSec}s`,
          timestamp
        };
      })
    );

    // Orden cronológico: Más reciente a más antigua
    const validMatches = (recentMatchesRaw.filter(Boolean) as any[])
      .sort((a, b) => b.timestamp - a.timestamp);

    // 6. Top 3 Campeones más jugados (en base a las 10 partidas)
    const champStats: Record<string, { games: number; wins: number; losses: number; kills: number; deaths: number; assists: number }> = {};

    validMatches.forEach((m) => {
      if (!champStats[m.champion]) {
        champStats[m.champion] = { games: 0, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0 };
      }
      champStats[m.champion].games += 1;
      if (m.win) champStats[m.champion].wins += 1;
      else champStats[m.champion].losses += 1;
      champStats[m.champion].kills += m.kills;
      champStats[m.champion].deaths += m.deaths;
      champStats[m.champion].assists += m.assists;
    });

    const topPlayedChampions = Object.entries(champStats)
      .map(([champName, stats]) => ({
        championName: champName,
        games: stats.games,
        wins: stats.wins,
        losses: stats.losses,
        winrate: Math.round((stats.wins / stats.games) * 100),
        kda: ((stats.kills + stats.assists) / Math.max(1, stats.deaths)).toFixed(2)
      }))
      .sort((a, b) => b.games - a.games || b.winrate - a.winrate)
      .slice(0, 3);

    const tier = soloQ?.tier || 'UNRANKED';
    const rank = soloQ?.rank || '';
    const lp = soloQ?.leaguePoints || 0;
    const wins = soloQ?.wins || 0;
    const losses = soloQ?.losses || 0;
    const total = wins + losses;
    const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

    let score = -1;
    if (tier !== 'UNRANKED') {
      score = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)
        ? (TIER_BASE[tier] || 0) + lp
        : (TIER_BASE[tier] || 0) + (DIV_BASE[rank] || 0) + lp;
    }

    const updatedData = {
      riotId: `${account.gameName}#${account.tagLine}`,
      gameName: account.gameName,
      tagLine: account.tagLine,
      tier,
      rank,
      lp,
      wins,
      losses,
      winrate,
      score,
      profileIconId: summoner.profileIconId || 29,
      inGame,
      topPlayedChampions: topPlayedChampions.length > 0 ? topPlayedChampions : (playerStorage[fullRiotId]?.topPlayedChampions || []),
      recentMatches: validMatches.length > 0 ? validMatches : (playerStorage[fullRiotId]?.recentMatches || [])
    };

    playerStorage[fullRiotId] = updatedData;
    return updatedData;
  } catch (err) {
    return playerStorage[fullRiotId] || getDefaultPlayer(player);
  }
}

function getDefaultPlayer(player: { name: string; tag: string }) {
  return {
    riotId: `${player.name}#${player.tag}`,
    gameName: player.name,
    tagLine: player.tag,
    tier: 'UNRANKED',
    rank: '',
    lp: 0,
    wins: 0,
    losses: 0,
    winrate: 0,
    score: -1,
    profileIconId: 29,
    inGame: false,
    topPlayedChampions: [],
    recentMatches: []
  };
}

let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 1000; // 1 minuto de caché

export async function GET() {
  const now = Date.now();

  if (Object.keys(playerStorage).length === PLAYERS.length && (now - lastFetchTime < CACHE_DURATION_MS)) {
    const list = Object.values(playerStorage).sort((a: any, b: any) => b.score - a.score);
    return NextResponse.json(list);
  }

  for (const p of PLAYERS) {
    await fetchPlayerData(p);
    await delay(60);
  }

  lastFetchTime = now;

  const finalRanking = PLAYERS.map(p => playerStorage[`${p.name}#${p.tag}`] || getDefaultPlayer(p))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json(finalRanking);
}