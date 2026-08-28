import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendBlueShellAlert } from "@/lib/discord";
import { calculateEarnedBlueShells, PENALTIES } from "@/lib/penalties";
import { getRiotId, PLAYERS } from "@/lib/players";
import { redis } from "@/lib/redis";

const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID || PLAYERS.find(
  (player) => player.name === "Barry" && player.tag === "24081"
)?.discordId;

async function getAuthenticatedPlayer() {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as { discordId?: string } | undefined)?.discordId;
  return PLAYERS.find((player) => player.discordId === discordId);
}

async function isAdmin() {
  const player = await getAuthenticatedPlayer();
  return player?.discordId === ADMIN_DISCORD_ID;
}

// GET: Cargar penitencias activas y registro de Blue Shells usadas
export async function GET() {
  try {
    // 🧹 Limpiamos el registro viejo para arrancar en 0
    // (Puedes comentar o borrar estas dos líneas de .del si ya no quieres que se reinicien solos)
    // await redis.del("used_shells");

    const activePenalties = (await redis.get("active_penalties")) || {};
    const usedShells = (await redis.get("used_shells")) || {};
    return NextResponse.json({ activePenalties, usedShells });
  } catch (error) {
    console.error("Error al obtener datos de Redis:", error);
    return NextResponse.json({ activePenalties: {}, usedShells: {} }, { status: 500 });
  }
}

// POST: Registrar el tiro de ruleta, descontar carga y mandar a Discord
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const attacker = await getAuthenticatedPlayer();

    if (!attacker) {
      return NextResponse.json({ error: "Debes iniciar sesión como participante para usar una Blue Shell." }, { status: 401 });
    }

    const victimRiotId = typeof body?.victim?.riotId === "string" ? body.victim.riotId : "";
    const victim = PLAYERS.find((player) => getRiotId(player) === victimRiotId);
    const penaltyId = Number(body?.penalty?.id);
    const penalty = PENALTIES.find((item) => item.id === penaltyId);
    const extraConfig = typeof body?.extraConfig === "string" ? body.extraConfig.trim().slice(0, 250) : null;

    if (!victim || !penalty || victim.discordId === attacker.discordId) {
      return NextResponse.json({ error: "La víctima o el castigo no son válidos." }, { status: 400 });
    }

    const attackerKey = getRiotId(attacker);
    const victimKey = getRiotId(victim);
    const attackerPayload = { ...attacker, riotId: attackerKey };
    const victimPayload = { ...victim, riotId: victimKey };

    // 1. Validar la carga en el servidor, no solo en la interfaz.
    const usedShells: Record<string, number> = (await redis.get("used_shells")) || {};
    const cachedPlayer = await redis.get(`player_cache:${attackerKey}`);
    const earnedShells = calculateEarnedBlueShells(cachedPlayer);
    if (earnedShells - (usedShells[attackerKey] || 0) <= 0) {
      return NextResponse.json({ error: "No tienes Blue Shells disponibles." }, { status: 400 });
    }

    // 2. Descontar una carga al atacante.
    usedShells[attackerKey] = (usedShells[attackerKey] || 0) + 1;
    await redis.set("used_shells", usedShells);

    // 3. Guardar penitencia activa en la víctima.
    const activePenalties: Record<string, any> = (await redis.get("active_penalties")) || {};
    activePenalties[victimKey] = {
      attacker: attackerKey,
      penalty,
      extraConfig,
      appliedAt: new Date().toISOString(),
      active: true,
    };
    await redis.set("active_penalties", activePenalties);

    // 4. Notificar por Discord.
    await sendBlueShellAlert({ attacker: attackerPayload, victim: victimPayload, penalty, extraConfig });

    return NextResponse.json({ success: true, message: "Blue shell ejecutada" });
  } catch (error) {
    console.error("Error al procesar Blue Shell:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE: Quitar manualmente una penitencia activa (solo Barry).
export async function DELETE(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "No tienes permiso para administrar penitencias." }, { status: 403 });
    }

    const riotId = new URL(req.url).searchParams.get("riotId");
    const isParticipant = riotId && PLAYERS.some((player) => getRiotId(player) === riotId);
    if (!isParticipant) {
      return NextResponse.json({ error: "Jugador no válido." }, { status: 400 });
    }

    const activePenalties: Record<string, unknown> = (await redis.get("active_penalties")) || {};
    delete activePenalties[riotId];
    await redis.set("active_penalties", activePenalties);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al borrar la penitencia:", error);
    return NextResponse.json({ error: "Error al borrar la penitencia." }, { status: 500 });
  }
}
