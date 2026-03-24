import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../services/supabaseClient'

export default function AdminPanel() {
  const { profile } = useAuthStore()
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  const [winner, setWinner] = useState('')
  const [tab, setTab] = useState('ongoing')
  
  // Für KO-Runde erstellen
  const [team1, setTeam1] = useState('')
  const [team2, setTeam2] = useState('')
  const [knockoutPhase, setKnockoutPhase] = useState('semifinals')

  if (!profile || profile.role !== 'admin') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: 'red', fontSize: '18px' }}>
          ❌ Du hast keine Admin-Rechte!
        </p>
      </div>
    )
  }

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('start_time', { ascending: true })

    setGames(data || [])
  }

  const updateGameStatus = async (gameId, status) => {
    await supabase
      .from('games')
      .update({ status })
      .eq('id', gameId)

    fetchGames()
  }

  const setGameWinner = async () => {
    if (!selectedGame || !winner) {
      alert('Spiel und Gewinner auswählen!')
      return
    }

    const loser = selectedGame.team_a === winner ? selectedGame.team_b : selectedGame.team_a

    await supabase
      .from('games')
      .update({
        winner,
        status: 'finished'
      })
      .eq('id', selectedGame.id)

    // Punkte vergeben
    const { data: correctBets } = await supabase
      .from('bets')
      .select('user_id')
      .eq('game_id', selectedGame.id)
      .eq('predicted_winner', winner)

    if (correctBets && correctBets.length > 0) {
      for (const bet of correctBets) {
        await supabase
          .from('bets')
          .update({ is_correct: true, points_awarded: 1 })
          .eq('user_id', bet.user_id)
          .eq('game_id', selectedGame.id)

        const { data: userProfile } = await supabase
          .from('profiles')
          .select('points, correct_predictions')
          .eq('id', bet.user_id)
          .single()

        if (userProfile) {
          await supabase
            .from('profiles')
            .update({
              points: (userProfile.points || 0) + 1,
              correct_predictions: (userProfile.correct_predictions || 0) + 1
            })
            .eq('id', bet.user_id)
        }
      }
    }

    alert('✅ Spiel aktualisiert! Punkte vergeben!')
    setSelectedGame(null)
    setWinner('')
    fetchGames()
  }

  // ✅ NEUER CODE: Spiel rückgängig machen
  const resetGameToScheduled = async (game) => {
    const confirmed = window.confirm(
      `Soll ${game.team_a} vs ${game.team_b} wirklich zurückgesetzt werden?\n\nDas entfernt auch Punkte von Spielern, die richtig getippt haben!`
    )

    if (!confirmed) return

    // 1. Finde alle Benutzer die Punkte für dieses Spiel bekommen haben
    const { data: correctBets } = await supabase
      .from('bets')
      .select('user_id')
      .eq('game_id', game.id)
      .eq('is_correct', true)

    // 2. Entferne ihre Punkte
    if (correctBets && correctBets.length > 0) {
      for (const bet of correctBets) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('points, correct_predictions')
          .eq('id', bet.user_id)
          .single()

        if (userProfile) {
          await supabase
            .from('profiles')
            .update({
              points: Math.max((userProfile.points || 1) - 1, 0),
              correct_predictions: Math.max((userProfile.correct_predictions || 1) - 1, 0)
            })
            .eq('id', bet.user_id)
        }
      }
    }

    // 3. Setze Wetten zurück
    await supabase
      .from('bets')
      .update({ is_correct: null, points_awarded: 0 })
      .eq('game_id', game.id)

    // 4. Setze Spiel auf 'scheduled' zurück
    await supabase
      .from('games')
      .update({
        status: 'scheduled',
        winner: null
      })
      .eq('id', game.id)

    alert('✅ Spiel erfolgreich zurückgesetzt!')
    fetchGames()
  }

  // Neue KO-Runde erstellen
  const createKnockoutGame = async () => {
    if (!team1 || !team2) {
      alert('Beide Teams eingeben!')
      return
    }

    if (team1 === team2) {
      alert('Teams dürfen nicht gleich sein!')
      return
    }

    const { error } = await supabase
      .from('games')
      .insert([
        {
          team_a: team1,
          team_b: team2,
          phase: knockoutPhase,
          status: 'scheduled',
          start_time: new Date().toISOString()
        }
      ])

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      alert(`✅ ${knockoutPhase === 'semifinals' ? 'Halbfinale' : 'Finale'} erstellt!`)
      setTeam1('')
      setTeam2('')
      fetchGames()
    }
  }

  const GameCard = ({ game, finished = false }) => (
    <div style={{
      border: `3px solid ${game.status === 'live' ? '#ffc107' : game.status === 'finished' ? '#28a745' : '#ddd'}`,
      padding: '20px',
      marginBottom: '15px',
      borderRadius: '10px',
      backgroundColor: game.status === 'live' ? '#fffbea' : game.status === 'finished' ? '#f0f9f6' : '#f9f9f9'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
            {game.team_a} vs {game.team_b}
          </p>
          <p style={{ fontSize: '12px', color: '#666', margin: '0' }}>
            {game.phase.toUpperCase()} | {new Date(game.start_time).toLocaleString('de-DE')}
          </p>
        </div>
        <div style={{
          backgroundColor: game.status === 'live' ? '#ffc107' : game.status === 'finished' ? '#28a745' : '#6c757d',
          color: 'white',
          padding: '5px 15px',
          borderRadius: '20px',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          {game.status === 'live' ? '🔴 LIVE' : game.status === 'finished' ? '✅ FERTIG' : '⏳ GEPLANT'}
        </div>
      </div>

      {game.status === 'finished' && game.winner && (
        <p style={{ color: '#28a745', fontSize: '16px', margin: '10px 0', fontWeight: 'bold' }}>
          🏆 Gewinner: {game.winner}
        </p>
      )}

      {game.status !== 'finished' && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {game.status === 'scheduled' && (
            <button
              onClick={() => updateGameStatus(game.id, 'live')}
              style={{
                padding: '8px 15px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              🔴 Starten
            </button>
          )}
          {game.status === 'live' && (
            <button
              onClick={() => setSelectedGame(game)}
              style={{
                padding: '8px 15px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              ✅ Gewinner setzen
            </button>
          )}
          {game.status === 'live' && (
            <button
              onClick={() => updateGameStatus(game.id, 'scheduled')}
              style={{
                padding: '8px 15px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              ⏮️ Zu "Geplant" zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* ✅ NEUER BUTTON: Spiel komplett zurücksetzen */}
      {game.status === 'finished' && (
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => resetGameToScheduled(game)}
            style={{
              padding: '8px 15px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            🔄 Komplett zurücksetzen
          </button>
        </div>
      )}
    </div>
  )

  // TAB 1: Laufende Spiele
  const OngoingGames = () => {
    const groupGames = games.filter(g => g.phase === 'group')
    const knockoutGames = games.filter(g => g.phase !== 'group')

    return (
      <div>
        <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#333' }}>
          ⚽ Gruppenspielen ({groupGames.length})
        </h2>
        {groupGames.length === 0 ? (
          <p style={{ color: '#666' }}>Keine Gruppenspielen</p>
        ) : (
          groupGames.map(game => <GameCard key={game.id} game={game} />)
        )}

        <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#333' }}>
          🏆 KO-Spiele ({knockoutGames.length})
        </h2>
        {knockoutGames.length === 0 ? (
          <p style={{ color: '#666' }}>Noch keine KO-Spiele erstellt. Gehe zum Tab "KO-Spiele erstellen"</p>
        ) : (
          knockoutGames.map(game => <GameCard key={game.id} game={game} />)
        )}
      </div>
    )
  }

  // TAB 2: KO-Spiele erstellen
  const CreateKnockouts = () => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '25px',
      maxWidth: '600px',
      margin: '20px auto'
    }}>
      <h2 style={{ marginTop: '0', marginBottom: '20px', color: '#333' }}>
        ➕ Neue KO-Runde erstellen
      </h2>

      <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
        Erstelle hier die Halbfinale und das Finale, nachdem die Gruppenspielen beendet sind!
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Spiel-Typ:
        </label>
        <select
          value={knockoutPhase}
          onChange={(e) => setKnockoutPhase(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        >
          <option value="semifinals">🥈 Halbfinale</option>
          <option value="final">🏆 Finale</option>
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Team 1:
        </label>
        <input
          type="text"
          placeholder="z.B. Team 1"
          value={team1}
          onChange={(e) => setTeam1(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
          Team 2:
        </label>
        <input
          type="text"
          placeholder="z.B. Team 2"
          value={team2}
          onChange={(e) => setTeam2(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '2px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <button
        onClick={createKnockoutGame}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background-color 0.3s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#764ba2'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#667eea'}
      >
        ✨ Spiel erstellen
      </button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '30px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
          ⚙️ Admin-Panel
        </h1>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setTab('ongoing')}
            style={{
              padding: '12px 25px',
              backgroundColor: tab === 'ongoing' ? '#667eea' : 'white',
              color: tab === 'ongoing' ? 'white' : '#333',
              border: `2px solid ${tab === 'ongoing' ? '#667eea' : '#ddd'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
          >
            🎮 Laufende Spiele
          </button>
          <button
            onClick={() => setTab('create-knockouts')}
            style={{
              padding: '12px 25px',
              backgroundColor: tab === 'create-knockouts' ? '#667eea' : 'white',
              color: tab === 'create-knockouts' ? 'white' : '#333',
              border: `2px solid ${tab === 'create-knockouts' ? '#667eea' : '#ddd'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
          >
            ➕ KO-Spiele erstellen
          </button>
        </div>

        {/* Tab Inhalt */}
        {tab === 'ongoing' && <OngoingGames />}
        {tab === 'create-knockouts' && <CreateKnockouts />}

        {/* Gewinner-Modal */}
        {selectedGame && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: '1000'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '15px',
              padding: '30px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}>
              <h2 style={{ marginTop: '0', color: '#333', marginBottom: '20px' }}>
                🏆 Gewinner für:
              </h2>
              <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '25px', color: '#667eea' }}>
                {selectedGame.team_a} vs {selectedGame.team_b}
              </p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => setWinner(selectedGame.team_a)}
                  style={{
                    flex: 1,
                    padding: '15px',
                    backgroundColor: winner === selectedGame.team_a ? '#28a745' : '#e9ecef',
                    color: winner === selectedGame.team_a ? 'white' : 'black',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.3s'
                  }}
                >
                  {selectedGame.team_a}
                </button>
                <button
                  onClick={() => setWinner(selectedGame.team_b)}
                  style={{
                    flex: 1,
                    padding: '15px',
                    backgroundColor: winner === selectedGame.team_b ? '#28a745' : '#e9ecef',
                    color: winner === selectedGame.team_b ? 'white' : 'black',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.3s'
                  }}
                >
                  {selectedGame.team_b}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={setGameWinner}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  ✅ Speichern
                </button>
                <button
                  onClick={() => setSelectedGame(null)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  ✕ Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}