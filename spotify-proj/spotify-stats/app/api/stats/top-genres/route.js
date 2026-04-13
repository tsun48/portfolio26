import supabase from '@/lib/db'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!userId) {
    return Response.json({ error: 'Missing userId' }, { status: 400 })
  }

  let query = supabase
    .from('plays')
    .select('artist_id')
    .eq('user_id', userId)

  if (from) query = query.gte('played_at', from)
  if (to) query = query.lte('played_at', to)

  const { data: plays, error } = await query
  if (error) return Response.json({ error }, { status: 500 })

  const artistPlayCounts = {}
  for (const row of plays) {
    artistPlayCounts[row.artist_id] = (artistPlayCounts[row.artist_id] ?? 0) + 1
  }

  const artistIds = Object.keys(artistPlayCounts)
  const { data: genreRows } = await supabase
    .from('artist_genres')
    .select('artist_id, genre')
    .in('artist_id', artistIds)

  const genreCounts = {}
  for (const row of genreRows ?? []) {
    const plays = artistPlayCounts[row.artist_id] ?? 0
    genreCounts[row.genre] = (genreCounts[row.genre] ?? 0) + plays
  }

  const sorted = Object.entries(genreCounts)
    .map(([genre, play_count]) => ({ genre, play_count }))
    .sort((a, b) => b.play_count - a.play_count)
    .slice(0, 50)

  return Response.json(sorted)
}