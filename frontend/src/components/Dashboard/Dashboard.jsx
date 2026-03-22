import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../services/supabaseClient'

export default function Dashboard() {
  const { profile, logout } = useAuthStore()
  const [rankings, setRankings] = useState([])
  const [userRank, setUserRank] = useState(null)
  const navigate = useNavigate()

  // Wenn kein Profil → noch nicht angemeldet
  if (!profile) {
    return <p>Lädt...</p>
  }

  useEffect(() => {
    fetchRankings()
  }, [profile])

  const fetchRankings = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, points')
      .order('points', { ascending: false })

    if (!error && data) {
      setRankings(data)
      const rank = data.findIndex((p) => p.id === profile.id) + 1
      setUserRank(rank)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1>Willkommen, {profile.username}! 👋</h1>
        <button onClick={handleLogout}>Abmelden</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h3>Deine Punkte</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{profile.points}</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h3>Dein Rang</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>#{userRank}</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
          <h3>Richtige Tipps</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{profile.correct_predictions}</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <button onClick={() => navigate('/bet')} style={{ padding: '10px 20px', marginRight: '10px' }}>
          📝 Wetten abgeben
        </button>
        <button onClick={() => navigate('/live')} style={{ padding: '10px 20px', marginRight: '10px' }}>
          🔴 Live Spiele
        </button>
        <button onClick={() => navigate('/standings')} style={{ padding: '10px 20px' }}>
          🏆 Ranking
        </button>
      </div>

      <h2>Top 10 Spieler</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Platz</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Spieler</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ccc' }}>Punkte</th>
          </tr>
        </thead>
        <tbody>
          {rankings.slice(0, 10).map((player, index) => (
            <tr key={player.id} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <td style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>#{index + 1}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
                {player.username} {player.id === profile.id && ' (Du)'}
              </td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ccc', fontWeight: 'bold' }}>
                {player.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}