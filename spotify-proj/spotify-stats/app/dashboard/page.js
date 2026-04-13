'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DateRangePicker from '../components/DateRangePicker'
import RankedList from '../components/RankedList'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [range, setRange] = useState({ from: null, to: null })
  const [artists, setArtists] = useState([])
  const [tracks, setTracks] = useState([])
  const [albums, setAlbums] = useState([])
  const [genres, setGenres] = useState([])
  const [time, setTime] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
  }, [status])

  useEffect(() => {
    if (!session?.userId) return
    fetchAll()
  }, [session, range])

  async function fetchAll() {
    setLoading(true)
    const userId = session.userId
    const params = new URLSearchParams({ userId })
    if (range.from) params.set('from', range.from)
    if (range.to) params.set('to', range.to)
    const q = params.toString()

    const [a, t, al, g, ti] = await Promise.all([
      fetch(`/api/stats/top-artists?${q}`).then(r => r.json()),
      fetch(`/api/stats/top-tracks?${q}`).then(r => r.json()),
      fetch(`/api/stats/top-albums?${q}`).then(r => r.json()),
      fetch(`/api/stats/top-genres?${q}`).then(r => r.json()),
      fetch(`/api/stats/listening-time?${q}`).then(r => r.json()),
    ])

    setArtists(a)
    setTracks(t)
    setAlbums(al)
    setGenres(g)
    setTime(ti)
    setLoading(false)
  }

  if (status === 'loading') return <p style={{ padding: '2rem' }}>Loading...</p>

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>Your Spotify stats</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary, #666)' }}>{session?.user?.name}</span>
          <button onClick={() => signOut()} style={{ fontSize: '13px' }}>Log out</button>
        </div>
      </div>

      <DateRangePicker from={range.from} to={range.to} onChange={setRange} />

      {time && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '2rem' }}>
          {[
            { label: 'Hours listened', value: time.hours },
            { label: 'Total plays', value: artists.reduce((s, a) => s + a.play_count, 0) },
            { label: 'Unique artists', value: artists.length },
            { label: 'Unique tracks', value: tracks.length },
          ].map(card => (
            <div key={card.label} style={{ background: 'var(--color-background-secondary, #f5f5f5)', borderRadius: '8px', padding: '1rem' }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--color-text-secondary, #666)' }}>{card.label}</p>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: '500' }}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-text-secondary, #666)' }}>Loading stats...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <section>
            <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '1rem' }}>Top artists</h2>
            <RankedList items={artists} nameKey="artist_name" countKey="play_count" countLabel="plays" />
          </section>
          <section>
            <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '1rem' }}>Top tracks</h2>
            <RankedList items={tracks} nameKey="track_name" subKey="artist_name" countKey="play_count" countLabel="plays" />
          </section>
          <section>
            <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '1rem' }}>Top albums</h2>
            <RankedList items={albums} nameKey="album_name" subKey="artist_name" countKey="play_count" countLabel="plays" />
          </section>
          <section>
            <h2 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '1rem' }}>Top genres</h2>
            <RankedList items={genres} nameKey="genre" countKey="play_count" countLabel="plays" />
          </section>
        </div>
      )}
    </main>
  )
}