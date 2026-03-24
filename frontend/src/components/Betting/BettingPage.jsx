import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../services/supabaseClient'

export default function BettingPage() {
  const { profile } = useAuthStore()
  const [games, setGames] = useState([])
  const [bets, setBets] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)

  // Wenn kein Profil → nicht angemeldet
  if (!profile) {
    return <p>Lädt...</p>
  }

  useEffect(() => {
    fetchGames()
  }, [profile])

  const fetchGames = async () => {
  setLoading(true)
  
  // NUR Spiele die noch nicht live gehen, dürfen gewettet werden!
  const { data: gamesData, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .eq('status', 'scheduled')  // ← NUR 'scheduled'!
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
    // Speichere alle Wetten
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
    setTimeout(() => setSubmitted(false), 3000) // Nach 3 Sekunden ausblenden
  }

  if (loading) {
    return <p>Lädt Spiele...</p>
  }

  if (games.length === 0) {
    return <p>Keine Spiele verfügbar zum Wetten.</p>
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>📝 Gib deine Wetten ab</h1>
      
      {submitted && (
        <p style={{ backgroundColor: '#d4edda', padding: '15px', borderRadius: '5px', color: '#155724' }}>
          ✅ Wetten gespeichert!
        </p>
      )}

      <div style={{ marginBottom: '30px' }}>
        {games.map((game) => (
          <div 
            key={game.id} 
            style={{
              border: '1px solid #ddd',
              padding: '15px',
              marginBottom: '15px',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}
          >
            <p style={{ fontSize: '16px', marginBottom: '10px' }}>
              <strong>{game.team_a} vs {game.team_b}</strong>
            </p>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              Spielbeginn: {new Date(game.start_time).toLocaleString('de-DE')}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleBetChange(game.id, game.team_a)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: bets[game.id] === game.team_a ? '#28a745' : '#e9ecef',
                  color: bets[game.id] === game.team_a ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {game.team_a}
              </button>
              <button
                onClick={() => handleBetChange(game.id, game.team_b)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: bets[game.id] === game.team_b ? '#28a745' : '#e9ecef',
                  color: bets[game.id] === game.team_b ? 'white' : 'black',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {game.team_b}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={handleSubmit}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        💾 Alle Wetten speichern
      </button>
    </div>
  )
}