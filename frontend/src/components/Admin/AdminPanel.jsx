import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../services/supabaseClient'

export default function AdminPanel() {
  const { profile } = useAuthStore()
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  const [winner, setWinner] = useState('')

  // Nur Admin darf hier rein
  if (!profile || profile.role !== 'admin') {
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ color: 'red', fontSize: '18px' }}>❌ Du hast keine Admin-Rechte!</p>
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

    // 1. Spiel als fertig markieren
    await supabase
      .from('games')
      .update({
        winner,
        status: 'finished'
      })
      .eq('id', selectedGame.id)

    // 2. Benutzer mit richtigen Tipps Punkte geben
    const { data: correctBets } = await supabase
      .from('bets')
      .select('user_id')
      .eq('game_id', selectedGame.id)
      .eq('predicted_winner', winner)

    if (correctBets) {
      for (const bet of correctBets) {
        // Wette als richtig markieren
        await supabase
          .from('bets')
          .update({ is_correct: true, points_awarded: 1 })
          .eq('user_id', bet.user_id)
          .eq('game_id', selectedGame.id)

        // Punkte im Profil erhöhen
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

    alert('✅ Spiel aktualisiert!')
    setSelectedGame(null)
    setWinner('')
    fetchGames()
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🔧 Admin-Panel</h1>

      <div style={{ marginBottom: '30px' }}>
        <h2>Alle Spiele</h2>
        {games.map((game) => (
          <div
            key={game.id}
            style={{
              border: '2px solid #ddd',
              padding: '15px',
              marginBottom: '10px',
              borderRadius: '8px',
              backgroundColor:
                game.status === 'live'
                  ? '#fff3cd'
                  : game.status === 'finished'
                  ? '#d4edda'
                  : '#e7e7e7'
            }}
          >
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {game.team_a} vs {game.team_b}
            </p>
            <p>
              Status: <strong>{game.status}</strong>
              {game.status === 'finished' && ` | Gewinner: ${game.winner}`}
            </p>

            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {game.status !== 'finished' && (
                <>
                  <button
                    onClick={() => updateGameStatus(game.id, 'live')}
                    style={{ padding: '8px 12px', backgroundColor: '#ffc107', cursor: 'pointer', border: 'none', borderRadius: '5px' }}
                  >
                    🔴 Starten
                  </button>
                  {game.status === 'live' && (
                    <button
                      onClick={() => setSelectedGame(game)}
                      style={{ padding: '8px 12px', backgroundColor: '#28a745', color: 'white', cursor: 'pointer', border: 'none', borderRadius: '5px' }}
                    >
                      ✅ Gewinner setzen
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedGame && (
        <div style={{
          border: '3px solid #28a745',
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: '#d4edda',
          marginBottom: '20px'
        }}>
          <h2>Gewinner für: {selectedGame.team_a} vs {selectedGame.team_b}</h2>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={() => setWinner(selectedGame.team_a)}
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: winner === selectedGame.team_a ? '#28a745' : '#e9ecef',
                color: winner === selectedGame.team_a ? 'white' : 'black',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
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
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
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
                borderRadius: '5px',
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
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}