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
    .select('artist_name, artist_id')
    .eq('user_id', userId)

  if (from) query = query.gte('played_at', from)
  if (to) query = query.lte('played_at', to)

  const { data, error } = await query

  if (error) return Response.json({ error }, { status: 500 })

  // Count plays per artist
  const counts = {}
  for (const row of data) {
    const key = row.artist_id
    if (!counts[key]) counts[key] = { artist_name: row.artist_name, artist_id: row.artist_id, play_count: 0 }
    counts[key].play_count++
  }

  const sorted = Object.values(counts).sort((a, b) => b.play_count - a.play_count).slice(0, 50)

  return Response.json(sorted)
}