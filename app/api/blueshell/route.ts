import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ADMIN_DISCORD_ID, authOptions } from "@/lib/auth";
import { sendBlueShellAlert } from "@/lib/discord";
import { redis } from "@/lib/redis";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  const discordId = (session?.user as { discordId?: string } | undefined)?.discordId;
  return discordId === ADMIN_DISCORD_ID;
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
    const { attacker, victim, penalty, extraConfig } = body;

    if (!attacker || !victim || !penalty) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const attackerKey = attacker.riotId || attacker.name || "Desconocido";
    const victimKey = victim.riotId || victim.name || "Desconocido";

    // 1. Descontar 1 carga al atacante (arrancan desde 0, sumando con las condiciones)
    const usedShells: Record<string, number> = (await redis.get("used_shells")) || {};
    usedShells[attackerKey] = (usedShells[attackerKey] || 0) + 1;
    await redis.set("used_shells", usedShells);

    // 2. Guardar penitencia activa en la víctima (incluyendo el detalle extra si existe)
    const activePenalties: Record<string, any> = (await redis.get("active_penalties")) || {};
    activePenalties[victimKey] = {
      attacker: attackerKey,
      penalty,
      extraConfig: extraConfig || null,
      appliedAt: new Date().toISOString(),
      active: true,
    };
    await redis.set("active_penalties", activePenalties);

    // 3. Notificar por Discord Webhook (le pasamos el extraConfig para que lo imprima el bot)
    await sendBlueShellAlert({ attacker, victim, penalty, extraConfig });

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
    if (!riotId || riotId.length > 100) {
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