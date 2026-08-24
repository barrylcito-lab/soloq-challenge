export interface Penalty {
  id: number;
  text: string;
}

export const PENALTIES: Penalty[] = [
  { id: 1, text: "Jugar una partida con un campeón que nunca hayas usado este split" },
  { id: 2, text: "No puedes comprar botas durante toda la partida" },
  { id: 3, text: "Jugar la partida con Flash en la otra tecla (si usas D, ponlo en F)" },
  { id: 4, text: "Primer ítem completado debe ser un ítem troll/off-meta para tu campeón" },
  { id: 5, text: "Jugar con la cámara bloqueada toda la partida" },
  { id: 6, text: "No puedes tirar surrender bajo ninguna circunstancia" },
  { id: 7, text: "Tener que escribir 'GG IZI' en el chat de equipo cada vez que mueras" },
  { id: 8, text: "Jugar soporte con un campeón tradicionalmente de Top/Mid" },
  { id: 9, text: "Pickear campeón a ciegas (cerrar los ojos y hacer 3 clicks aleatorios)" },
  { id: 10, text: "No puedes usar tu Ultimate durante los primeros 15 minutos" },
];

// Comprueba cuántas Blue Shells ha ganado por mérito según su historial
export function calculateEarnedBlueShells(player: any): number {
  if (!player || !player.recentMatches || player.recentMatches.length === 0) return 0;

  const tier = (player.tier || "UNRANKED").toUpperCase();
  const isHighElo = ["PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"].includes(tier);
  const requiredStreak = isHighElo ? 3 : 4;

  let earned = 0;

  // 1. Verificar si tiene racha actual activa en sus partidas más recientes
  let currentStreak = 0;
  for (const match of player.recentMatches) {
    if (match.win) {
      currentStreak++;
    } else {
      break;
    }
  }

  if (currentStreak >= requiredStreak) {
    earned += 1;
  }

  // 2. Verificar Pentakill en sus partidas recientes
  const hasPentakill = player.recentMatches.some((m: any) => m.pentaKills > 0 || m.pentakills > 0);
  if (hasPentakill) {
    earned += 1;
  }

  return earned;
}