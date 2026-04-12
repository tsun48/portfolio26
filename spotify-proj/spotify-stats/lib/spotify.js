export async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Failed to refresh token: ${data.error}`)
  }

  return data
}

export async function getRecentlyPlayed(accessToken) {
  const res = await fetch(
    'https://api.spotify.com/v1/me/player/recently-played?limit=50',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Spotify API error: ${data.error?.message}`)
  }

  return data
}