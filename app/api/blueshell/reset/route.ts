import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ADMIN_DISCORD_ID, authOptions } from "@/lib/auth";
import { redis } from "@/lib/redis";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const discordId = (session?.user as { discordId?: string } | undefined)?.discordId;

    if (discordId !== ADMIN_DISCORD_ID) {
      return NextResponse.json({ error: "No tienes permiso para reiniciar el torneo." }, { status: 403 });
    }

    await redis.set("active_penalties", {});
    await redis.set("used_shells", {});

    return NextResponse.json({
      success: true,
      message: "¡Base de datos limpia! Todas las penitencias borradas y conchas restauradas.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Error al resetear" }, { status: 500 });
  }
}
