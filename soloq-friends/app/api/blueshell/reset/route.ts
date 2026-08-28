import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PLAYERS } from "@/lib/players";
import { redis } from "@/lib/redis";

const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID || PLAYERS.find(
  (player) => player.name === "Barry" && player.tag === "24081"
)?.discordId;

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = (session?.user as { discordId?: string } | undefined)?.discordId;

    if (discordId !== ADMIN_DISCORD_ID) {
      return NextResponse.json({ error: "No tienes permiso para reiniciar el torneo." }, { status: 403 });
    }

    // 1. Limpiamos todas las penitencias activas de la tabla
    await redis.set("active_penalties", {});
    // 2. Reseteamos el contador de conchas usadas a 0
    await redis.set("used_shells", {});

    return NextResponse.json({
      success: true,
      message: "¡Base de datos limpia! Todas las penitencias borradas y conchas restauradas.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al resetear" }, { status: 500 });
  }
}
