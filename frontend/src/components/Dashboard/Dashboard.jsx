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
      padding: '35px 25px',
      borderRadius: '16px',
      color: 'white',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      textAlign: 'center',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      cursor: 'pointer',
      border: '1px solid rgba(255,255,255,0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)'
        e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.25)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '50%'
      }}></div>
      
      <div style={{ fontSize: '48px', marginBottom: '12px', position: 'relative', zIndex: 2 }}>
        {icon}
      </div>
      <p style={{ margin: '0 0 12px 0', fontSize: '13px', opacity: 0.9, fontWeight: '600', letterSpacing: '0.5px', position: 'relative', zIndex: 2 }}>
        {title}
      </p>
      <p style={{ margin: '0', fontSize: '40px', fontWeight: '900', position: 'relative', zIndex: 2 }}>
        {value}
      </p>
    </div>
  )

  const ActionButton = ({ icon, text, onClick, color }) => (
    <button
      onClick={onClick}
      style={{
        flex: '1',
        minWidth: '150px',
        padding: '16px 20px',
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      {text}
    </button>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '30px 20px'
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '18px',
          padding: '35px 30px',
          marginBottom: '35px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '25px',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          {/* Logo + Greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <img 
              src="/images/logo.png"
              alt="Logo"
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '16px',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.25)',
                animation: 'float 4s ease-in-out infinite'
              }}
            />
            <div>
              <h1 style={{ margin: '0 0 8px 0', color: '#1a1a2e', fontSize: '32px', fontWeight: '900' }}>
                Willkommen! 👋
              </h1>
              <p style={{ margin: '0', color: '#667eea', fontSize: '16px', fontWeight: '700' }}>
                {profile.username}
              </p>
              <p style={{ margin: '5px 0 0 0', color: '#999', fontSize: '13px', fontWeight: '500' }}>
                Viel Erfolg beim Tippen! 🍀
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '700',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#c82333'
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#dc3545'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            🚪 Abmelden
          </button>
        </div>

        {/* Stats Card - Nur EINE Zahl */}
        <div style={{ marginBottom: '35px' }}>
          <StatCard
            icon="⭐"
            title="Deine Punkte"
            value={profile.points}
            color="#667eea"
          />
        </div>

        {/* Dein Rang */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '18px',
          padding: '25px 30px',
          marginBottom: '35px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 15px 0', color: '#999', fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px' }}>
            DEINE PLATZIERUNG
          </p>
          <p style={{ margin: '0', color: '#667eea', fontSize: '56px', fontWeight: '900' }}>
            #{userRank}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '35px',
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

        {/* Top 10 Rankings */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '18px',
          padding: '35px 30px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
            <span style={{ fontSize: '32px' }}>🏆</span>
            <h2 style={{ margin: '0', color: '#1a1a2e', fontSize: '28px', fontWeight: '900' }}>
              Top 10 Spieler
            </h2>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #667eea' }}>
                <th style={{
                  padding: '16px 0',
                  textAlign: 'left',
                  color: '#667eea',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.5px'
                }}>PLATZ</th>
                <th style={{
                  padding: '16px 0',
                  textAlign: 'left',
                  color: '#667eea',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.5px'
                }}>SPIELER</th>
                <th style={{
                  padding: '16px 0',
                  textAlign: 'right',
                  color: '#667eea',
                  fontWeight: '700',
                  fontSize: '13px',
                  letterSpacing: '0.5px'
                }}>PUNKTE</th>
              </tr>
            </thead>
            <tbody>
              {rankings.slice(0, 10).map((player, index) => (
                <tr
                  key={player.id}
                  style={{
                    backgroundColor: player.id === profile.id ? 'rgba(102, 126, 234, 0.08)' : (index % 2 === 0 ? '#fff' : '#f9f9f9'),
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <td style={{ padding: '16px 0', fontWeight: '700', color: '#333', fontSize: '15px' }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                    <span style={{ marginLeft: '8px' }}>#{index + 1}</span>
                  </td>
                  <td style={{
                    padding: '16px 0',
                    color: player.id === profile.id ? '#667eea' : '#333',
                    fontWeight: player.id === profile.id ? '700' : '500',
                    fontSize: '15px'
                  }}>
                    {player.username}
                    {player.id === profile.id && ' (DU)'}
                  </td>
                  <td style={{
                    padding: '16px 0',
                    textAlign: 'right',
                    fontWeight: '700',
                    color: '#667eea',
                    fontSize: '16px'
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