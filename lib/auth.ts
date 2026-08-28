import type { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const ADMIN_DISCORD_ID =
  process.env.ADMIN_DISCORD_ID || "410258026608459786";

export const authOptions: AuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { discordId?: string }).discordId = token.sub;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
