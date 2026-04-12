'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/')
  }, [status])

  if (status === 'loading') return <p>Loading...</p>

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Welcome, {session?.user?.name}</h1>
      <p>You are logged in.</p>
      <button onClick={() => signOut()}>Log out</button>
    </main>
  )
}