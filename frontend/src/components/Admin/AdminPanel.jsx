import { useState, useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../services/supabaseClient'

export default function AdminPanel() {
  const { profile } = useAuthStore()
  const [games, setGames] = useState([])
  const [selectedGame, setSelectedGame] = useState(null)
  const [winner, setWinner] = useState('')
  const [team_a_goals, setTeamAGoals] = useState(0)
  const [team_b_goals, setTeamBGoals] = useState(0)
  const [team_a_rounds, setTeamARounds] = useState(0)
  const [team_b_rounds, setTeamBRounds] = useState(0)
  const [tab, setTab] = useState('ongoing')
  const [teamStats, setTeamStats] = useState([])
  
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
    fetchTeamStats()
  }, [])

  const fetchGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('start_time', { ascending: true })

    setGames(data || [])
  }

  const fetchTeamStats = async () => {
    const { data } = await supabase
      .from('team_stats')
      .select('*')
      .order('group_name', { ascending: true })
      .order('wins', { ascending: false })

    setTeamStats(data || [])
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

    if (!team_a_goals || !team_b_goals || !team_a_rounds || !team_b_rounds) {
      alert('Bitte alle Werte eingeben (Treffer & Runden)!')
      return
    }

    const loser = selectedGame.team_a === winner ? selectedGame.team_b : selectedGame.team_a

    // 1. Spiel aktualisieren
    await supabase
      .from('games')
      .update({
        winner,
        team_a_goals: parseInt(team_a_goals),
        team_b_goals: parseInt(team_b_goals),
        team_a_rounds: parseInt(team_a_rounds),
        team_b_rounds: parseInt(team_b_rounds),
        status: 'finished'
      })
      .eq('id', selectedGame.id)

    // 2. Team-Stats aktualisieren (nur für Gruppenspiele)
    if (selectedGame.phase === 'group') {
      // Winner Stats
      const { data: winnerStats } = await supabase
        .from('team_stats')
        .select('*')
        .eq('team_name', winner)
        .eq('group_name', selectedGame.group_name)
        .single()

      if (winnerStats) {
        await supabase
          .from('team_stats')
          .update({
            wins: (winnerStats.wins || 0) + 1,
            total_goals: (winnerStats.total_goals || 0) + (winner === selectedGame.team_a ? parseInt(team_a_goals) : parseInt(team_b_goals)),
            total_rounds: (winnerStats.total_rounds || 0) + (winner === selectedGame.team_a ? parseInt(team_a_rounds) : parseInt(team_b_rounds)),
            games_played: (winnerStats.games_played || 0) + 1
          })
          .eq('id', winnerStats.id)
      } else {
        // Neues Team erstellen
        await supabase
          .from('team_stats')
          .insert([{
            team_name: winner,
            group_name: selectedGame.group_name,
            wins: 1,
            total_goals: winner === selectedGame.team_a ? parseInt(team_a_goals) : parseInt(team_b_goals),
            total_rounds: winner === selectedGame.team_a ? parseInt(team_a_rounds) : parseInt(team_b_rounds),
            games_played: 1
          }])
      }

      // Loser Stats
      const { data: loserStats } = await supabase
        .from('team_stats')
        .select('*')
        .eq('team_name', loser)
        .eq('group_name', selectedGame.group_name)
        .single()

      if (loserStats) {
        await supabase
          .from('team_stats')
          .update({
            losses: (loserStats.losses || 0) + 1,
            total_goals: (loserStats.total_goals || 0) + (loser === selectedGame.team_a ? parseInt(team_a_goals) : parseInt(team_b_goals)),
            total_rounds: (loserStats.total_rounds || 0) + (loser === selectedGame.team_a ? parseInt(team_a_rounds) : parseInt(team_b_rounds)),
            games_played: (loserStats.games_played || 0) + 1
          })
          .eq('id', loserStats.id)
      } else {
        // Neues Team erstellen
        await supabase
          .from('team_stats')
          .insert([{
            team_name: loser,
            group_name: selectedGame.group_name,
            wins: 0,
            losses: 1,
            total_goals: loser === selectedGame.team_a ? parseInt(team_a_goals) : parseInt(team_b_goals),
            total_rounds: loser === selectedGame.team_a ? parseInt(team_a_rounds) : parseInt(team_b_rounds),
            games_played: 1
          }])
      }
    }

    // 3. Punkte für Benutzer vergeben
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

    alert('✅ Spiel aktualisiert und Stats gespeichert!')
    setSelectedGame(null)
    setWinner('')
    setTeamAGoals(0)
    setTeamBGoals(0)
    setTeamARounds(0)
    setTeamBRounds(0)
    fetchGames()
    fetchTeamStats()
  }

  // Spiel rückgängig machen
  const resetGameToScheduled = async (game) => {
    const confirmed = window.confirm(
      `Soll ${game.team_a} vs ${game.team_b} wirklich zurückgesetzt werden?\n\nDas entfernt auch Punkte von Spielern und Team-Stats!`
    )

    if (!confirmed) return

    // 1. Benutzer-Punkte zurücksetzen
    const { data: correctBets } = await supabase
      .from('bets')
      .select('user_id')
      .eq('game_id', game.id)
      .eq('is_correct', true)

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

    // 2. Wetten zurücksetzen
    await supabase
      .from('bets')
      .update({ is_correct: null, points_awarded: 0 })
      .eq('game_id', game.id)

    // 3. Team-Stats zurücksetzen (nur für Gruppenspiele)
    if (game.phase === 'group' && game.winner) {
      const winner = game.winner
      const loser = game.team_a === winner ? game.team_b : game.team_a

      const { data: winnerStats } = await supabase
        .from('team_stats')
        .select('*')
        .eq('team_name', winner)
        .eq('group_name', game.group_name)
        .single()

      if (winnerStats) {
        await supabase
          .from('team_stats')
          .update({
            wins: Math.max((winnerStats.wins || 1) - 1, 0),
            total_goals: Math.max((winnerStats.total_goals || game.team_a_goals) - (winner === game.team_a ? game.team_a_goals : game.team_b_goals), 0),
            total_rounds: Math.max((winnerStats.total_rounds || game.team_a_rounds) - (winner === game.team_a ? game.team_a_rounds : game.team_b_rounds), 0),
            games_played: Math.max((winnerStats.games_played || 1) - 1, 0)
          })
          .eq('id', winnerStats.id)
      }

      const { data: loserStats } = await supabase
        .from('team_stats')
        .select('*')
        .eq('team_name', loser)
        .eq('group_name', game.group_name)
        .single()

      if (loserStats) {
        await supabase
          .from('team_stats')
          .update({
            losses: Math.max((loserStats.losses || 1) - 1, 0),
            total_goals: Math.max((loserStats.total_goals || game.team_b_goals) - (loser === game.team_a ? game.team_a_goals : game.team_b_goals), 0),
            total_rounds: Math.max((loserStats.total_rounds || game.team_b_rounds) - (loser === game.team_a ? game.team_a_rounds : game.team_b_rounds), 0),
            games_played: Math.max((loserStats.games_played || 1) - 1, 0)
          })
          .eq('id', loserStats.id)
      }
    }

    // 4. Spiel auf 'scheduled' zurücksetzen
    await supabase
      .from('games')
      .update({
        status: 'scheduled',
        winner: null,
        team_a_goals: 0,
        team_b_goals: 0,
        team_a_rounds: 0,
        team_b_rounds: 0
      })
      .eq('id', game.id)

    alert('✅ Spiel erfolgreich zurückgesetzt!')
    fetchGames()
    fetchTeamStats()
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
            {game.phase === 'group' ? `Gruppe ${game.group_name}` : game.phase === 'semifinals' ? 'Halbfinale' : 'Finale'} | {new Date(game.start_time).toLocaleString('de-DE')}
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
        <div style={{
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '12px',
          borderLeft: '4px solid #28a745'
        }}>
          <p style={{ margin: '0', fontWeight: 'bold', color: '#28a745' }}>
            🏆 {game.winner} gewinnt ({game.team_a_goals}:{game.team_b_goals}) in {game.winner === game.team_a ? game.team_a_rounds : game.team_b_rounds} Runden
          </p>
        </div>
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
              onClick={() => {
                setSelectedGame(game)
                setTeamAGoals(0)
                setTeamBGoals(0)
                setTeamARounds(0)
                setTeamBRounds(0)
              }}
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
              ✅ Gewinner + Stats setzen
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
              ⏮️ Zurücksetzen
            </button>
          )}
        </div>
      )}

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
          <p style={{ color: '#666' }}>Noch keine KO-Spiele erstellt.</p>
        ) : (
          knockoutGames.map(game => <GameCard key={game.id} game={game} />)
        )}
      </div>
    )
  }

  // TAB 2: Team Stats
  const TeamStatsTab = () => {
    const groupA = teamStats.filter(t => t.group_name === 'A')
    const groupB = teamStats.filter(t => t.group_name === 'B')

    const StatsTable = ({ group, teams }) => (
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>
          Gruppe {group}
        </h3>
        {teams.length === 0 ? (
          <p style={{ color: '#666' }}>Keine Teams</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #667eea' }}>TEAM</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #667eea' }}>SPIELE</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #667eea' }}>SIEGE</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #667eea' }}>TREFFER</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #667eea' }}>RUNDEN</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #667eea' }}>EFFIZIENZ</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{team.team_name}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{team.games_played}</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: '#28a745', fontWeight: 'bold' }}>{team.wins}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{team.total_goals}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{team.total_rounds}</td>
                  <td style={{
                    padding: '10px',
                    textAlign: 'center',
                    backgroundColor: '#fff3cd',
                    fontWeight: 'bold',
                    color: '#ff9800',
                    borderRadius: '5px'
                  }}>
                    {team.total_rounds > 0 ? ((team.total_goals * team.total_goals) / team.total_rounds).toFixed(2) : '0.00'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )

    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '25px',
        marginTop: '20px'
      }}>
        <h2 style={{ marginTop: '0', marginBottom: '25px', color: '#333' }}>
          📊 Team Statistiken
        </h2>
        <StatsTable group="A" teams={groupA} />
        <StatsTable group="B" teams={groupB} />
      </div>
    )
  }

  // TAB 3: KO-Spiele erstellen
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
          placeholder="z.B. Gewinner Gruppe A"
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
          placeholder="z.B. Gewinner Gruppe B"
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
            onClick={() => setTab('stats')}
            style={{
              padding: '12px 25px',
              backgroundColor: tab === 'stats' ? '#667eea' : 'white',
              color: tab === 'stats' ? 'white' : '#333',
              border: `2px solid ${tab === 'stats' ? '#667eea' : '#ddd'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
          >
            📊 Team Stats
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
        {tab === 'stats' && <TeamStatsTab />}
        {tab === 'create-knockouts' && <CreateKnockouts />}

        {/* Gewinner + Stats Modal */}
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
              maxWidth: '550px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h2 style={{ marginTop: '0', color: '#333', marginBottom: '20px' }}>
                🏆 Spiel-Ergebnis eingeben
              </h2>
              <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '25px', color: '#667eea' }}>
                {selectedGame.team_a} vs {selectedGame.team_b}
              </p>

              {/* Gewinner wählen */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                  Gewinner:
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
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
              </div>

              {/* Tore eingeben */}
              <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                    Treffer {selectedGame.team_a}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={team_a_goals}
                    onChange={(e) => setTeamAGoals(e.target.value)}
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
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                    Treffer {selectedGame.team_b}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={team_b_goals}
                    onChange={(e) => setTeamBGoals(e.target.value)}
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
              </div>

              {/* Runden eingeben */}
              <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                    Runden {selectedGame.team_a}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={team_a_rounds}
                    onChange={(e) => setTeamARounds(e.target.value)}
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
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                    Runden {selectedGame.team_b}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={team_b_rounds}
                    onChange={(e) => setTeamBRounds(e.target.value)}
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