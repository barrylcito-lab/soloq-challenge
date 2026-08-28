import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
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