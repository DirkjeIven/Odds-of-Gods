import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'

export default function TeamDetails() {
  const [groupA, setGroupA] = useState([])
  const [groupB, setGroupB] = useState([])
  const [expandedTeam, setExpandedTeam] = useState(null)
  const [teamGames, setTeamGames] = useState({})

  useEffect(() => {
    fetchTeamsWithGames()
  }, [])

  const fetchTeamsWithGames = async () => {
    // Hole alle Teams
    const { data: teamStats } = await supabase
      .from('team_stats')
      .select('*')
      .order('group_name', { ascending: true })

    if (teamStats) {
      setGroupA(teamStats.filter(t => t.group_name === 'A'))
      setGroupB(teamStats.filter(t => t.group_name === 'B'))

      // Für jedes Team: Hole die Spiele
      for (const team of teamStats) {
        const { data: games } = await supabase
          .from('games')
          .select('*')
          .eq('phase', 'group')
          .eq('group_name', team.group_name)
          .or(`team_a.eq.${team.team_name},team_b.eq.${team.team_name}`)
          .eq('status', 'finished')
          .order('start_time', { ascending: true })

        if (games) {
          setTeamGames(prev => ({
            ...prev,
            [team.team_name]: games
          }))
        }
      }
    }
  }

  const calculateTrefferQuoteForGame = (team, game) => {
    if (team === game.team_a) {
      return game.team_a_rounds === 0 ? 0 : (game.team_a_goals / game.team_a_rounds).toFixed(2)
    } else {
      return game.team_b_rounds === 0 ? 0 : (game.team_b_goals / game.team_b_rounds).toFixed(2)
    }
  }

  const calculateAvgTrefferQuote = (team, games) => {
    if (games.length === 0) return 0

    let totalGoals = 0
    let totalRounds = 0

    games.forEach(game => {
      if (team === game.team_a) {
        totalGoals += game.team_a_goals || 0
        totalRounds += game.team_a_rounds || 0
      } else {
        totalGoals += game.team_b_goals || 0
        totalRounds += game.team_b_rounds || 0
      }
    })

    return totalRounds === 0 ? 0 : (totalGoals / totalRounds).toFixed(2)
  }

  const TeamCard = ({ team, games = [] }) => {
    const isExpanded = expandedTeam === team.team_name

    return (
      <div
        key={team.id}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          marginBottom: '12px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Header */}
        <div
          onClick={() => setExpandedTeam(isExpanded ? null : team.team_name)}
          style={{
            padding: '16px',
            backgroundColor: '#f9f9f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            borderBottom: isExpanded ? '2px solid #667eea' : 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f4ff'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
        >
          <div>
            <p style={{ margin: '0', fontWeight: '700', fontSize: '16px', color: '#1a1a2e' }}>
              {team.team_name}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#999' }}>
              {team.games_played} Spiele • {team.wins} Siege • ⌀ Quote: {calculateAvgTrefferQuote(team.team_name, games)}
            </p>
          </div>
          <span style={{
            fontSize: '20px',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}>
            ▼
          </span>
        </div>

        {/* Expanded Content */}
        {isExpanded && games.length > 0 && (
          <div style={{ padding: '20px', backgroundColor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
            <p style={{ margin: '0 0 15px 0', fontWeight: '700', color: '#333' }}>Spiele der Gruppenphase:</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd', backgroundColor: '#f0f4ff' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: '700', color: '#667eea' }}>GEGNER</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: '#667eea' }}>TREFFER</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: '#667eea' }}>RUNDEN</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: '#667eea' }}>QUOTE</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontWeight: '700', color: '#667eea' }}>ERGEBNIS</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game, idx) => {
                  const opponent = team.team_name === game.team_a ? game.team_b : game.team_a
                  const teamGoals = team.team_name === game.team_a ? game.team_a_goals : game.team_b_goals
                  const teamRounds = team.team_name === game.team_a ? game.team_a_rounds : game.team_b_rounds
                  const isWin = game.winner === team.team_name
                  const quote = calculateTrefferQuoteForGame(team.team_name, game)

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <td style={{ padding: '8px', color: '#333' }}>{opponent}</td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#667eea' }}>
                        {teamGoals}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#f093fb' }}>
                        {teamRounds}
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fontWeight: '700',
                        color: '#667eea',
                        borderRadius: '4px'
                      }}>
                        {quote}
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        fontWeight: '700',
                        color: isWin ? '#28a745' : '#dc3545'
                      }}>
                        {isWin ? '✅ Win' : '❌ Loss'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ margin: '0', fontWeight: '700', color: '#667eea' }}>
                ⌀ Trefferquote: <strong>{calculateAvgTrefferQuote(team.team_name, games)}</strong>
              </p>
            </div>
          </div>
        )}

        {isExpanded && games.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            Noch keine Spiele gespielt
          </div>
        )}
      </div>
    )
  }

  const GroupSection = ({ group, teams }) => (
    <div style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#1a1a2e', marginBottom: '15px', fontSize: '20px', fontWeight: '800' }}>
        {group === 'A' ? '🅰️' : '🅱️'} Gruppe {group}
      </h2>
      {teams.map(team => (
        <TeamCard key={team.id} team={team} games={teamGames[team.team_name] || []} />
      ))}
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
        📊 Team Details & Spiele
      </h2>
      <GroupSection group="A" teams={groupA} />
      <GroupSection group="B" teams={groupB} />
    </div>
  )
}