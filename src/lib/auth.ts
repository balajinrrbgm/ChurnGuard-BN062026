import { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getDb } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request offline access for refresh tokens
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      // Upsert the user in Aurora DSQL on every sign-in
      if (!user.email) return false
      try {
        const db = getDb()
        await db`
          INSERT INTO tenant_users (email, name, image, role)
          VALUES (${user.email}, ${user.name ?? ''}, ${user.image ?? null}, 'member')
          ON CONFLICT (email) DO UPDATE
            SET name  = EXCLUDED.name,
                image = EXCLUDED.image,
                last_login_at = NOW()
        `
      } catch {
        // Non-fatal — user can still sign in even if DB write fails
      }
      return true
    },

    async session({ session, token }) {
      // Attach the DB user id to the session so API routes can use it
      if (token.sub && session.user) {
        (session.user as typeof session.user & { id: string }).id = token.sub
      }
      return session
    },

    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },

  pages: {
    signIn: '/auth/signin',
    error:  '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}
