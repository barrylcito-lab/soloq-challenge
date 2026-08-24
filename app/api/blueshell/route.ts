import { NextResponse } from "next/server";
import { sendBlueShellAlert } from "@/lib/discord";
import { redis } from "@/lib/redis";

// GET: Cargar penitencias activas y registro de Blue Shells usadas
export async function GET() {
  try {
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
    const { attacker, victim, penalty } = body;

    if (!attacker || !victim || !penalty) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const attackerKey = attacker.riotId || attacker.name || "Desconocido";
    const victimKey = victim.riotId || victim.name || "Desconocido";

    // 1. Descontar 1 carga al atacante
    const usedShells: Record<string, number> = (await redis.get("used_shells")) || {};
    usedShells[attackerKey] = (usedShells[attackerKey] || 0) + 1;
    await redis.set("used_shells", usedShells);

    // 2. Guardar penitencia activa en la víctima
    const activePenalties: Record<string, any> = (await redis.get("active_penalties")) || {};
    activePenalties[victimKey] = {
      attacker: attackerKey,
      penalty,
      appliedAt: new Date().toISOString(),
      active: true,
    };
    await redis.set("active_penalties", activePenalties);

    // 3. Notificar por Discord Webhook
    await sendBlueShellAlert({ attacker, victim, penalty });

    return NextResponse.json({ success: true, message: "Blue shell ejecutada" });
  } catch (error) {
    console.error("Error al procesar Blue Shell:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}