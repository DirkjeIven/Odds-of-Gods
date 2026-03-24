import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../services/supabaseClient'

export default function Dashboard() {
  const { profile, logout } = useAuthStore()
  const [rankings, setRankings] = useState([])
  const [userRank, setUserRank] = useState(null)
  const navigate = useNavigate()

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

  const StatCard = ({ icon, title, value, color }) => (
    <div style={{
      background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
      padding: '25px',
      borderRadius: '12px',
      color: 'white',
      boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
      textAlign: 'center',
      transition: 'transform 0.3s, box-shadow 0.3s',
      cursor: 'pointer'
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)'
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ fontSize: '40px', marginBottom: '10px' }}>{icon}</div>
      <p style={{ margin: '0 0 10px 0', fontSize: '14px', opacity: 0.9 }}>
        {title}
      </p>
      <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold' }}>
        {value}
      </p>
    </div>
  )

  const ActionButton = ({ icon, text, onClick, color }) => (
    <button
      onClick={onClick}
      style={{
        flex: '1',
        padding: '15px 20px',
        background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        minHeight: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      {text}
    </button>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '30px 20px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '15px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
  <img 
    src="/images/logo.png"
    alt="Odds Of Gods Logo"
    style={{
      width: '80px',
      height: '80px',
      borderRadius: '10px'
    }}
  />
  <div>
    <h1 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '28px' }}>
      Willkommen, {profile.username}!
    </h1>
    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
      Viel Erfolg beim Tippen! 🍀
    </p>
  </div>
</div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
        >
          🚪 Abmelden
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <StatCard
            icon="⭐"
            title="Deine Punkte"
            value={profile.points}
            color="#667eea"
          />
          <StatCard
            icon="🏆"
            title="Dein Rang"
            value={`#${userRank}`}
            color="#f093fb"
          />
          <StatCard
            icon="✅"
            title="Richtige Tipps"
            value={profile.correct_predictions}
            color="#4facfe"
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '30px',
          flexWrap: 'wrap'
        }}>
          <ActionButton
            icon="📝"
            text="Wetten abgeben"
            onClick={() => navigate('/bet')}
            color="#667eea"
          />
          <ActionButton
            icon="🔴"
            text="Live Spiele"
            onClick={() => navigate('/live')}
            color="#f093fb"
          />
          <ActionButton
            icon="🏆"
            text="Ranking"
            onClick={() => navigate('/standings')}
            color="#4facfe"
          />
          {profile.role === 'admin' && (
            <ActionButton
              icon="⚙️"
              text="Admin Panel"
              onClick={() => navigate('/admin')}
              color="#ff6b6b"
            />
          )}
        </div>

        {/* Rankings */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
  <img 
    src="/images/trophy.png"
    alt="Pokal"
    style={{ width: '40px', height: '40px' }}
  />
  <h2 style={{ margin: '0', color: '#333' }}>
    Top 10 Spieler
  </h2>
</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #667eea' }}>
                <th style={{
                  padding: '15px',
                  textAlign: 'left',
                  color: '#667eea',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Platz
                </th>
                <th style={{
                  padding: '15px',
                  textAlign: 'left',
                  color: '#667eea',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Spieler
                </th>
                <th style={{
                  padding: '15px',
                  textAlign: 'center',
                  color: '#667eea',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Punkte
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.slice(0, 10).map((player, index) => (
                <tr
                  key={player.id}
                  style={{
                    backgroundColor: player.id === profile.id ? '#f0f4ff' : (index % 2 === 0 ? '#fff' : '#f9f9f9'),
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#333' }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                    #{index + 1}
                  </td>
                  <td style={{
                    padding: '15px',
                    color: player.id === profile.id ? '#667eea' : '#333',
                    fontWeight: player.id === profile.id ? '600' : '400'
                  }}>
                    {player.username}
                    {player.id === profile.id && ' (Du)'}
                  </td>
                  <td style={{
                    padding: '15px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#667eea'
                  }}>
                    {player.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}