import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'

export default function LiveGames() {
  const [liveGames, setLiveGames] = useState([])
  const [upcomingGames, setUpcomingGames] = useState([])
  const [finishedGames, setFinishedGames] = useState([])

  useEffect(() => {
    fetchGames()

    // Real-time Updates
    const subscription = supabase
      .channel('games')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        () => fetchGames()
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const fetchGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('start_time', { ascending: true })

    if (data) {
      setLiveGames(data.filter((g) => g.status === 'live'))
      setUpcomingGames(data.filter((g) => g.status === 'scheduled'))
      setFinishedGames(data.filter((g) => g.status === 'finished'))
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeUntil = (dateString) => {
    const now = new Date()
    const gameTime = new Date(dateString)
    const diffMs = gameTime - now
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) return `in ${diffDays}d`
    if (diffHours > 0) return `in ${diffHours}h`
    if (diffMins > 0) return `in ${diffMins}m`
    return 'Gleich!'
  }

  const GameCard = ({ game, status = 'upcoming' }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '14px',
      padding: '20px',
      marginBottom: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      border: status === 'live' ? '2px solid #ffc107' : status === 'finished' ? '2px solid #28a745' : '1px solid #e0e0e0',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
    }}
    >
      {/* Status Badge */}
      <div style={{
        position: 'absolute',
        top: '15px',
        right: '15px',
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '0.5px',
        backgroundColor: status === 'live' ? '#ffc107' : status === 'finished' ? '#28a745' : '#e0e0e0',
        color: status === 'finished' ? 'white' : 'black'
      }}>
        {status === 'live' ? '🔴 LIVE' : status === 'finished' ? '✅ FERTIG' : '⏳ GEPLANT'}
      </div>

      {/* Teams */}
      <div style={{ marginBottom: '15px' }}>
        <p style={{
          fontSize: '18px',
          fontWeight: '800',
          margin: '0',
          color: '#1a1a2e'
        }}>
          {game.team_a} vs {game.team_b}
        </p>
      </div>

      {/* Gewinner (wenn fertig) */}
      {status === 'finished' && game.winner && (
        <div style={{
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          padding: '12px',
          borderRadius: '10px',
          marginBottom: '12px',
          borderLeft: '4px solid #28a745'
        }}>
          <p style={{ margin: '0', fontSize: '14px', fontWeight: '700', color: '#28a745' }}>
            🏆 Gewinner: <strong>{game.winner}</strong>
          </p>
        </div>
      )}

      {/* Zeit Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
        color: '#666',
        fontWeight: '500'
      }}>
        <span>📅 {formatTime(game.start_time)}</span>
        {status === 'upcoming' && (
          <span style={{
            backgroundColor: '#667eea',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: '700',
            fontSize: '12px'
          }}>
            {getTimeUntil(game.start_time)}
          </span>
        )}
      </div>

      {/* Phase Badge */}
      <div style={{
        marginTop: '12px',
        display: 'inline-block',
        padding: '4px 12px',
        backgroundColor: game.phase === 'group' ? '#f093fb' : '#4facfe',
        color: 'white',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.5px'
      }}>
        {game.phase === 'group' ? '⚽ GRUPPE' : game.phase === 'semifinals' ? '🥈 HALBFINALE' : '🏆 FINALE'}
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '30px 20px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '18px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{
            margin: '0',
            color: '#1a1a2e',
            fontSize: '36px',
            fontWeight: '900'
          }}>
            🎮 Live Spiele
          </h1>
          <p style={{
            margin: '10px 0 0 0',
            color: '#667eea',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Alle Spiele im Überblick
          </p>
        </div>

        {/* Live Games */}
        {liveGames.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <span style={{ fontSize: '28px' }}>🔴</span>
              <h2 style={{ margin: '0', color: '#1a1a2e', fontSize: '24px', fontWeight: '800' }}>
                Jetzt Live ({liveGames.length})
              </h2>
            </div>
            {liveGames.map((game) => (
              <GameCard key={game.id} game={game} status="live" />
            ))}
          </section>
        )}

        {/* Upcoming Games - Sortiert */}
        {upcomingGames.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <span style={{ fontSize: '28px' }}>⏱️</span>
              <h2 style={{ margin: '0', color: '#1a1a2e', fontSize: '24px', fontWeight: '800' }}>
                Kommende Spiele ({upcomingGames.length})
              </h2>
            </div>
            {upcomingGames.map((game) => (
              <GameCard key={game.id} game={game} status="upcoming" />
            ))}
          </section>
        )}

        {/* Finished Games */}
        {finishedGames.length > 0 && (
          <section style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <span style={{ fontSize: '28px' }}>✅</span>
              <h2 style={{ margin: '0', color: '#1a1a2e', fontSize: '24px', fontWeight: '800' }}>
                Abgeschlossene Spiele ({finishedGames.length})
              </h2>
            </div>
            {finishedGames.map((game) => (
              <GameCard key={game.id} game={game} status="finished" />
            ))}
          </section>
        )}

        {/* Empty State */}
        {liveGames.length === 0 && upcomingGames.length === 0 && finishedGames.length === 0 && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '18px',
            padding: '60px 30px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 15px 0' }}>🎲</p>
            <p style={{ color: '#999', fontSize: '16px', fontWeight: '500' }}>
              Noch keine Spiele hinzugefügt
            </p>
          </div>
        )}
      </div>
    </div>
  )
}