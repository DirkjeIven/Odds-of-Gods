import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../services/supabaseClient'

export default function BettingPage() {
  const { profile } = useAuthStore()
  const [games, setGames] = useState([])
  const [bets, setBets] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  if (!profile) {
    return <p>Lädt...</p>
  }

  useEffect(() => {
    fetchGames()
  }, [profile])

  const fetchGames = async () => {
    setLoading(true)
    
    const { data: gamesData, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'scheduled')
      .order('start_time', { ascending: true })

    if (!gamesError && gamesData) {
      setGames(gamesData)

      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', profile.id)

      if (!betsError && betsData) {
        const betMap = {}
        betsData.forEach((bet) => {
          betMap[bet.game_id] = bet.predicted_winner
        })
        setBets(betMap)
      }
    }
    
    setLoading(false)
  }

  const handleBetChange = (gameId, team) => {
    setBets((prev) => ({
      ...prev,
      [gameId]: team
    }))
  }

  const handleSubmit = async () => {
    for (const [gameId, team] of Object.entries(bets)) {
      await supabase
        .from('bets')
        .upsert({
          user_id: profile.id,
          game_id: parseInt(gameId),
          predicted_winner: team
        })
    }
    
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  if (loading) {
    return <p>Lädt Spiele...</p>
  }

  if (games.length === 0) {
    return <p>Keine Spiele verfügbar zum Wetten.</p>
  }

  // Spiele nach Phase sortieren
  const groupGamesA = games.filter(g => g.phase === 'group' && g.group_name === 'A').sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  const groupGamesB = games.filter(g => g.phase === 'group' && g.group_name === 'B').sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  const semiFinalGames = games.filter(g => g.phase === 'semifinals').sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  const finalGames = games.filter(g => g.phase === 'final').sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  const BetCard = ({ game }) => (
    <div 
      style={{
        border: '2px solid #ddd',
        padding: '18px',
        marginBottom: '12px',
        borderRadius: '12px',
        backgroundColor: '#f9f9f9',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#667eea'
        e.currentTarget.style.backgroundColor = '#f0f4ff'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#ddd'
        e.currentTarget.style.backgroundColor = '#f9f9f9'
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 6px 0', color: '#1a1a2e' }}>
          {game.team_a} vs {game.team_b}
        </p>
        <p style={{ fontSize: '12px', color: '#999', margin: '0', fontWeight: '500' }}>
          📅 {new Date(game.start_time).toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => handleBetChange(game.id, game.team_a)}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: bets[game.id] === game.team_a ? '#667eea' : '#e9ecef',
            color: bets[game.id] === game.team_a ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '13px',
            transition: 'all 0.2s',
            boxShadow: bets[game.id] === game.team_a ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
          }}
        >
          {game.team_a}
        </button>
        <button
          onClick={() => handleBetChange(game.id, game.team_b)}
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: bets[game.id] === game.team_b ? '#667eea' : '#e9ecef',
            color: bets[game.id] === game.team_b ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '13px',
            transition: 'all 0.2s',
            boxShadow: bets[game.id] === game.team_b ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
          }}
        >
          {game.team_b}
        </button>
      </div>
    </div>
  )

  const GroupSection = ({ title, icon, games }) => {
    if (games.length === 0) return null

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '1px solid rgba(102, 126, 234, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span style={{ fontSize: '28px' }}>{icon}</span>
          <h2 style={{ margin: '0', color: '#1a1a2e', fontSize: '22px', fontWeight: '800' }}>
            {title}
          </h2>
          <span style={{
            backgroundColor: '#667eea',
            color: 'white',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: '700',
            marginLeft: 'auto'
          }}>
            {games.length} {games.length === 1 ? 'Spiel' : 'Spiele'}
          </span>
        </div>

        {games.map((game) => (
          <BetCard key={game.id} game={game} />
        ))}
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '30px 20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '18px',
          padding: '35px 30px',
          marginBottom: '30px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{
            margin: '0 0 10px 0',
            color: '#1a1a2e',
            fontSize: '36px',
            fontWeight: '900'
          }}>
            📝 Wetten abgeben
          </h1>
          <p style={{
            margin: '0',
            color: '#667eea',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Tippt auf deine favorisierten Teams!
          </p>
        </div>

        {submitted && (
          <div style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '25px',
            border: '1px solid #c3e6cb',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            ✅ Wetten erfolgreich gespeichert!
          </div>
        )}

        {/* Gruppe A */}
        <GroupSection
          title="Gruppe A"
          icon="🅰️"
          games={groupGamesA}
        />

        {/* Gruppe B */}
        <GroupSection
          title="Gruppe B"
          icon="🅱️"
          games={groupGamesB}
        />

        {/* Halbfinale */}
        <GroupSection
          title="Halbfinale"
          icon="🥈"
          games={semiFinalGames}
        />

        {/* Finale */}
        <GroupSection
          title="Finale"
          icon="🏆"
          games={finalGames}
        />

        {/* Submit Button */}
        <button 
          onClick={handleSubmit}
          style={{
            width: '100%',
            padding: '18px',
            backgroundColor: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '800',
            cursor: 'pointer',
            marginBottom: '30px',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#764ba2'
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#667eea'
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)'
          }}
        >
          💾 Alle Wetten speichern
        </button>
      </div>
    </div>
  )
}