export interface Penalty {
  id: number;
  text: string;
}

export const PENALTIES: Penalty[] = [
  { id: 1, text: "El atacante puede escoger el campeón" },
  { id: 2, text: "El atacante puede escoger los hechizos del culiao" },
  { id: 3, text: "El culiao debe armarse de 2do item una wea T R O L L (La cual será revisada) (20min. mínimo o no)" },
  { id: 4, text: "Cambia los hechizos de lugar al culiao" },
  { id: 5, text: "Jugar con la sensibilidad del ratón máxima" },
  { id: 6, text: "Limitar los fps a 30" },
  { id: 7, text: "Duo con el faker/Isabel" },
  { id: 8, text: "No comprar item (finalizado) hasta minuto 15" },
  { id: 9, text: "No comprar botas" },
  { id: 10, text: "No poder farmear el cannon hasta minuto 10" },
  { id: 11, text: "No colocar wards hasta minuto 15" },
  { id: 12, text: "Jugar sin audio, PERO, con titanio de omega con volumen al 100 (en loop)" },
  { id: 13, text: "A las 5 muertes, el culiao deberá vender un item (a elección del culiao) el cual no podrá volver a comprar" },
  { id: 14, text: "Auto Fill (No es valido si sale en su linea)" },
  { id: 15, text: "El atacante escoge una serie de skins, de la cual, el culiao tiene que escoger campeón" },
  { id: 16, text: "No poder hacer señales" },
  { id: 17, text: "Comprar 2 pinks por cada back. Puedes volver caminando y se anula (si ya tienes se venden y se compran de nuevo)" },
  { id: 18, text: "No puedes jugar tus 3 campeones más jugados" },
  { id: 19, text: "No puedes backear hasta el minuto 15" },
  { id: 20, text: "No puedes pegarle a inhibidores o nexo enemigo" },
  { id: 21, text: "Reverse y el culiao tiene un escudo de 2 dias para blueshells" },
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