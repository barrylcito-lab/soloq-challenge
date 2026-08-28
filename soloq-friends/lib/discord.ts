export async function sendBlueShellAlert({
  attacker,
  victim,
  penalty,
}: {
  attacker: any;
  victim: any;
  penalty: any;
}) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("⚠️ DISCORD_WEBHOOK_URL no configurado en .env.local");
    return;
  }

  // Diccionario de Discord IDs para la mención
  const DISCORD_IDS: Record<string, string> = {
    "Barry#24081": "410258026608459786",
    "Tarikk#LAS": "536261498276937749",
    "Bloodme#LAS": "1079568485052579950",
    "DakaH#Saiko": "355153243036188682",
    "Disprezz#LAS": "436304189447077888",
    "Wachumeiket#LAS": "471115606092021763",
    "Jamie Tarttッ#999": "303957248420347905",
  };

  const attackerRiotId = attacker.riotId || attacker.name || "Invocador";
  const victimRiotId = victim.riotId || victim.name || "Invocador";

  const attackerDiscordId = attacker.discordId || DISCORD_IDS[attackerRiotId];
  const victimDiscordId = victim.discordId || DISCORD_IDS[victimRiotId];

  // Mención con @ exclusiva para la notificación de afuera
  const attackerMention = attackerDiscordId ? `<@${attackerDiscordId}>` : `**${attackerRiotId}**`;
  const victimMention = victimDiscordId ? `<@${victimDiscordId}>` : `**${victimRiotId}**`;

  const payload = {
    // Texto exterior: genera la notificación y el ping sonoro con @
    content: `🚨 ¡Atención ${victimMention}!${attackerMention} te acaba de tirar una **Blue Shell** 🐚💥`,
    embeds: [
      {
        title: "🐚💥 ¡BLUE SHELL IMPACTÓ EN EL TORNEO!",
        // Texto interior: Nombres de Invocador de LoL (Riot ID)
        description: `**${attackerRiotId}** le ha lanzado una **Blue Shell** a **${victimRiotId}**.\n\nLa ruleta del destino ha dictado su sentencia:`,
        color: 0x3b82f6,
        fields: [
          {
            name: "🎯 Víctima Castigada",
            value: `\`${victimRiotId}\``,
            inline: true,
          },
          {
            name: "⚡ Atacante",
            value: `\`${attackerRiotId}\``,
            inline: true,
          },
          {
            name: `📜 Penitencia Asignada (#${penalty.id})`,
            value: `>>> **${penalty.text}**`,
            inline: false,
          },
        ],
        footer: {
          text: "SoloQ Challenge • Sistema Blue Shell",
        },
        timestamp: new Date().toISOString(),
      },
    ],
    allowed_mentions: {
      parse: ["users"],
    },
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Error al enviar webhook a Discord:", error);
  }
}