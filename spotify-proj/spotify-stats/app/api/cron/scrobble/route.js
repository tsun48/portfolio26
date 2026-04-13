import supabase from '@/lib/db'
import { refreshAccessToken, getRecentlyPlayed } from '@/lib/spotify'

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, refresh_token')

  if (usersError) {
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  const results = []

  for (const user of users) {
    try {
      // Get a fresh access token
      const refreshed = await refreshAccessToken(user.refresh_token)
      const accessToken = refreshed.access_token

      // Update the refresh token in DB if Spotify rotated it
      if (refreshed.refresh_token) {
        await supabase
          .from('users')
          .update({ refresh_token: refreshed.refresh_token })
          .eq('id', user.id)
      }

      // Fetch last 50 plays from Spotify
      const { items } = await getRecentlyPlayed(accessToken)
      if (!items?.length) {
        results.push({ userId: user.id, inserted: 0 })
        continue
      }

      // Find the most recent play we already have
      const { data: lastPlay } = await supabase
        .from('plays')
        .select('played_at')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(1)
        .single()

      const lastSeen = lastPlay?.played_at ?? new Date(0).toISOString()

      // Filter to only new plays
      const newPlays = items.filter(
        item => new Date(item.played_at) > new Date(lastSeen)
      )

      if (!newPlays.length) {
        results.push({ userId: user.id, inserted: 0 })
        continue
      }

      // Insert new plays
      const rows = newPlays.map(item => ({
        user_id: user.id,
        track_id: item.track.id,
        track_name: item.track.name,
        artist_name: item.track.artists[0].name,
        artist_id: item.track.artists[0].id,
        album_name: item.track.album.name,
        album_id: item.track.album.id,
        played_at: item.played_at,
        duration_ms: item.track.duration_ms,
      }))

      const { error: insertError } = await supabase
        .from('plays')
        .upsert(rows, { onConflict: 'user_id,played_at' })

      if (insertError) {
        console.error(`Insert error for user ${user.id}:`, insertError)
      }

    // Store genres for any new artists
    const uniqueArtistIds = [...new Set(newPlays.map(item => item.track.artists[0].id))]
    for (const artistId of uniqueArtistIds) {
    const { data: existing } = await supabase
        .from('artist_genres')
        .select('artist_id')
        .eq('artist_id', artistId)
        .limit(1)
        .single()

    if (!existing) {
        const genres = await getArtistGenres(accessToken, artistId)
        if (genres.length) {
        const genreRows = genres.map(genre => ({ artist_id: artistId, genre }))
        await supabase.from('artist_genres').upsert(genreRows, { onConflict: 'artist_id,genre' })
        }
    }
    }

      results.push({ userId: user.id, inserted: newPlays.length })

    } catch (err) {
      console.error(`Scrobble failed for user ${user.id}:`, err)
      results.push({ userId: user.id, error: err.message })
    }
  }

  return Response.json({ ok: true, results })
}