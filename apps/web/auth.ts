import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { credentialsSchema } from "@sentinel/shared";
import { API_URL } from "@/lib/config";

interface LoginResponse {
  token: string;
  user: { id: string; email: string };
}

/**
 * Credentials auth that delegates verification to the API. On success we keep
 * the API's HS256 JWT in the session so the browser can call the API + WS.
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as LoginResponse;
        return { id: data.user.id, email: data.user.email, apiToken: data.token };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.apiToken = (user as { apiToken?: string }).apiToken;
      }
      return token;
    },
    session({ session, token }) {
      const uid = token.uid as string | undefined;
      if (uid) session.user.id = uid;
      session.apiToken = token.apiToken as string | undefined;
      return session;
    },
  },
});
