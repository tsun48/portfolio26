import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'
import supabase from '@/lib/db'
import { refreshAccessToken } from '@/lib/spotify'

const handler = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'user-read-recently-played user-top-read user-read-private',
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
    if (account.provider === 'spotify') {
        const { error } = await supabase.from('users').upsert({
        id: user.id,
        spotify_id: account.providerAccountId,
        display_name: user.name,
        refresh_token: account.refresh_token,
        }, { onConflict: 'id' })

        if (error) console.error('Supabase upsert error:', error)
    }
    return true
    },

    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }

      if (Date.now() < token.expiresAt * 1000) {
        return token
      }

      try {
        const refreshed = await refreshAccessToken(token.refreshToken)
        return {
          ...token,
          accessToken: refreshed.access_token,
          expiresAt: Math.floor(Date.now() / 1000 + refreshed.expires_in),
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        return { ...token, error: 'RefreshTokenError' }
      }
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.userId = token.sub
      session.error = token.error
      return session
    },
  },
})

export { handler as GET, handler as POST }