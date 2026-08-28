import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis'; // 👈 Usamos tu cliente de Redis existente

const RIOT_API_KEY = 'RGAPI-7e3e9493-e119-4da2-9334-157ae5e3fca0';
const REGION = 'americas';
const PLATFORM = 'la2';

const PLAYERS = [
  { name: 'Barry', tag: '24081', discordId: '410258026608459786' },
  { name: 'Tarikk', tag: 'LAS', discordId: '536261498276937749' },
  { name: 'Bloodme', tag: 'LAS', discordId: '1079568485052579950' },
  { name: 'DakaH', tag: 'Saiko', discordId: '355153243036188682' },
  { name: 'Disprezz', tag: 'LAS', discordId: '436304189447077888' },
  { name: 'Wachumeiket', tag: 'LAS', discordId: '471115606092021763' },
  { name: 'Jamie Tarttッ', tag: '999', discordId: '303957248420347905' },
  { name: 'Nube', tag: 'HXC', discordId: '1098233238859821076' },
];

const TIER_BASE: Record<string, number> = {
  IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200,
  PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400,
  MASTER: 2800, GRANDMASTER: 2800, CHALLENGER: 2800
};
const DIV_BASE: Record<string, number> = { IV: 0, III: 100, II: 200, I: 300 };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPlayerData(player: { name: string; tag: string; discordId?: string }) {
  const fullRiotId = `${player.name}#${player.tag}`;
  const redisKey = `player_cache:${fullRiotId}`;
  const headers = { 'X-Riot-Token': RIOT_API_KEY };

  const cachedData = (await redis.get(redisKey)) as any;

  try {
    // 1. PUUID
    const accUrl = `https://${REGION}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(player.name.trim())}/${encodeURIComponent(player.tag.trim())}`;
    const accRes = await fetch(accUrl, { headers, cache: 'no-store' });
    if (!accRes.ok) {
      if (cachedData) return cachedData;
      return getDefaultPlayer(player);
    }
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

    // 5. Historial SoloQ (15 partidas)
    const matchIdsRes = await fetch(`https://${REGION}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&count=15`, { headers, cache: 'no-store' });
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
          championName: p.championName,
          kills: p.kills,
          deaths: p.deaths,
          assists: p.assists,
          cs: (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0),
          pentaKills: p.pentaKills || 0, // 👈 AQUÍ ESTÁ AGREGADO EL PENTAKILL
          gameDuration: `${durMin}m ${durSec}s`,
          timestamp,
        };
      })
    );

    const validMatches = (recentMatchesRaw.filter(Boolean) as any[])
      .sort((a, b) => b.timestamp - a.timestamp);

    // 6. Top 3 Campeones más jugados
    const champStats: Record<string, { games: number; wins: number; losses: number; kills: number; deaths: number; assists: number }> = {};

    validMatches.forEach((m) => {
      const champ = m.championName;
      if (!champStats[champ]) {
        champStats[champ] = { games: 0, wins: 0, losses: 0, kills: 0, deaths: 0, assists: 0 };
      }
      champStats[champ].games += 1;
      if (m.win) champStats[champ].wins += 1;
      else champStats[champ].losses += 1;
      champStats[champ].kills += m.kills;
      champStats[champ].deaths += m.deaths;
      champStats[champ].assists += m.assists;
    });

    const topPlayedChampions = Object.entries(champStats)
      .map(([champName, stats]) => ({
        championName: champName,
        games: stats.games,
        wins: stats.wins,
        losses: stats.losses,
        winrate: Math.round((stats.wins / stats.games) * 100),
        kda: ((stats.kills + stats.assists) / Math.max(1, stats.deaths)).toFixed(2),
      }))
      .sort((a, b) => b.games - a.games || b.winrate - a.winrate)
      .slice(0, 3);

    const tier = soloQ?.tier || (cachedData?.tier && cachedData.tier !== 'UNRANKED' ? cachedData.tier : 'UNRANKED');
    const rank = soloQ?.rank || (cachedData?.rank || '');
    const lp = soloQ?.leaguePoints !== undefined ? soloQ.leaguePoints : (cachedData?.lp || 0);
    const wins = soloQ?.wins !== undefined ? soloQ.wins : (cachedData?.wins || 0);
    const losses = soloQ?.losses !== undefined ? soloQ.losses : (cachedData?.losses || 0);
    const total = wins + losses;
    const winrate = total > 0 ? Math.round((wins / total) * 100) : 0;

    let score = -1;
    if (tier !== 'UNRANKED') {
      score = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier)
        ? (TIER_BASE[tier] || 0) + lp
        : (TIER_BASE[tier] || 0) + (DIV_BASE[rank] || 0) + lp;
    } else if (cachedData?.score) {
      score = cachedData.score;
    }

    const updatedData = {
      riotId: `${account.gameName}#${account.tagLine}`,
      gameName: account.gameName,
      tagLine: account.tagLine,
      discordId: player.discordId,
      tier,
      rank,
      lp,
      wins,
      losses,
      winrate,
      score,
      profileIconId: summoner.profileIconId || cachedData?.profileIconId || 29,
      inGame,
      topPlayedChampions: topPlayedChampions.length > 0 ? topPlayedChampions : (cachedData?.topPlayedChampions || []),
      recentMatches: validMatches.length > 0 ? validMatches : (cachedData?.recentMatches || []),
    };

    await redis.set(redisKey, updatedData);
    return updatedData;
  } catch (err) {
    if (cachedData) return cachedData;
    return getDefaultPlayer(player);
  }
}

function getDefaultPlayer(player: { name: string; tag: string; discordId?: string }) {
  return {
    riotId: `${player.name}#${player.tag}`,
    gameName: player.name,
    tagLine: player.tag,
    discordId: player.discordId,
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
    recentMatches: [],
  };
}

let lastFetchTime = 0;
// La interfaz consulta el ranking una vez por minuto: conservarlo más tiempo
// hace que los elos parezcan detenidos aunque Riot ya tenga datos nuevos.
const CACHE_DURATION_MS = 60 * 1000;
// Nueva versión para no reutilizar la respuesta incompleta que se guardó antes
// de corregir el historial de partidas.
const GLOBAL_RANKING_CACHE_KEY = 'global_ranking_cache:v2';
const GLOBAL_RANKING_TIME_KEY = 'global_ranking_time:v2';

export async function GET(request: Request) {
  const now = Date.now();
  const forceRefresh = new URL(request.url).searchParams.get('refresh') === '1';

  const cachedList = await redis.get(GLOBAL_RANKING_CACHE_KEY);
  const lastFetch = await redis.get(GLOBAL_RANKING_TIME_KEY);

  if (!forceRefresh && cachedList && lastFetch && (now - Number(lastFetch) < CACHE_DURATION_MS)) {
    return NextResponse.json(cachedList);
  }

  const results = [];
  let index = 0;
  for (const p of PLAYERS) {
    const data = await fetchPlayerData(p);
    results.push(data);
    index++;
    // Cada jugador genera varias solicitudes (perfil, liga y 15 partidas).
    // Darle un segundo a Riot antes del siguiente evita respuestas 429, que
    // dejaban el historial vacío aunque el ranking sí alcanzara a cargarse.
    await delay(1100);
  }

  const finalRanking = results.sort((a, b) => b.score - a.score);

  await redis.set(GLOBAL_RANKING_CACHE_KEY, finalRanking);
  await redis.set(GLOBAL_RANKING_TIME_KEY, now);

  return NextResponse.json(finalRanking);
}
