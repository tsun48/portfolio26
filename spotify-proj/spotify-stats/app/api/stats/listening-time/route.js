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
    .select('duration_ms')
    .eq('user_id', userId)

  if (from) query = query.gte('played_at', from)
  if (to) query = query.lte('played_at', to)

  const { data, error } = await query
  if (error) return Response.json({ error }, { status: 500 })

  const totalMs = data.reduce((sum, row) => sum + (row.duration_ms ?? 0), 0)
  const hours = Math.round((totalMs / 3600000) * 10) / 10
  const minutes = Math.round(totalMs / 60000)

  return Response.json({ hours, minutes, totalMs })
}