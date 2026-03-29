import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'

export default function GroupStandings() {
  const [groupA, setGroupA] = useState([])
  const [groupB, setGroupB] = useState([])

  useEffect(() => {
    fetchGroupStandings()

    // Real-time Updates
    const subscription = supabase
      .channel('team_stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_stats' },
        () => fetchGroupStandings()
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const fetchGroupStandings = async () => {
    const { data } = await supabase
      .from('team_stats')
      .select('*')
      .order('group_name', { ascending: true })
      .order('wins', { ascending: false })

    if (data) {
      setGroupA(data.filter((t) => t.group_name === 'A'))
      setGroupB(data.filter((t) => t.group_name === 'B'))
    }
  }

  const calculateEfficiency = (goals, rounds) => {
    if (rounds === 0) return 0
    return ((goals * goals) / rounds).toFixed(2)
  }

  const StandingsTable = ({ group, teams }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '18px',
      padding: '35px 30px',
      marginBottom: '30px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      border: '1px solid rgba(102, 126, 234, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <span style={{ fontSize: '32px' }}>
          {group === 'A' ? '🅰️' : '🅱️'}
        </span>
        <h2 style={{ margin: '0', color: '#1a1a2e', fontSize: '26px', fontWeight: '800' }}>
          Gruppe {group}
        </h2>
      </div>

      {teams.length === 0 ? (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
          Noch keine Teams in dieser Gruppe
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #667eea' }}>
              <th style={{
                padding: '14px 0',
                textAlign: 'left',
                color: '#667eea',
                fontWeight: '700',
                fontSize: '12px',
                letterSpacing: '0.5px'
              }}>TEAM</th>
              <th style={{
                padding: '14px 0',
                textAlign: 'center',
                color: '#667eea',
                fontWeight: '700',
                fontSize: '12px',
                letterSpacing: '0.5px'
              }}>SPIELE</th>
              <th style={{
                padding: '14px 0',
                textAlign: 'center',
                color: '#667eea',
                fontWeight: '700',
                fontSize: '12px',
                letterSpacing: '0.5px'
              }}>SIEGE</th>
              <th style={{
                padding: '14px 0',
                textAlign: 'center',
                color: '#667eea',
                fontWeight: '700',
                fontSize: '12px',
                letterSpacing: '0.5px'
              }}>TREFFER</th>
              <th style={{
                padding: '14px 0',
                textAlign: 'center',
                color: '#667eea',
                fontWeight: '700',
                fontSize: '12px',
                letterSpacing: '0.5px'
              }}>RUNDEN</th>
              <th style={{
                padding: '14px 0',
                textAlign: 'center',
                color: '#667eea',
                fontWeight: '700',
                fontSize: '12px',
                letterSpacing: '0.5px'
              }}>EFFIZIENZ</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr
                key={team.id}
                style={{
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                  borderBottom: '1px solid #eee',
                  transition: 'background-color 0.2s'
                }}
              >
                <td style={{
                  padding: '14px 0',
                  color: '#1a1a2e',
                  fontWeight: '700',
                  fontSize: '15px'
                }}>
                  {team.team_name}
                </td>
                <td style={{
                  padding: '14px 0',
                  textAlign: 'center',
                  color: '#333',
                  fontWeight: '600',
                  fontSize: '15px'
                }}>
                  {team.games_played}
                </td>
                <td style={{
                  padding: '14px 0',
                  textAlign: 'center',
                  color: '#28a745',
                  fontWeight: '700',
                  fontSize: '15px'
                }}>
                  {team.wins}
                </td>
                <td style={{
                  padding: '14px 0',
                  textAlign: 'center',
                  color: '#667eea',
                  fontWeight: '700',
                  fontSize: '15px'
                }}>
                  {team.total_goals}
                </td>
                <td style={{
                  padding: '14px 0',
                  textAlign: 'center',
                  color: '#f093fb',
                  fontWeight: '700',
                  fontSize: '15px'
                }}>
                  {team.total_rounds}
                </td>
                <td style={{
                  padding: '14px 0',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  color: '#ff9800',
                  fontWeight: '800',
                  fontSize: '15px',
                  borderRadius: '6px'
                }}>
                  {calculateEfficiency(team.total_goals, team.total_rounds)}
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
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '30px 20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '18px',
          padding: '40px 30px',
          marginBottom: '35px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '1px solid rgba(102, 126, 234, 0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{
            margin: '0 0 10px 0',
            color: '#1a1a2e',
            fontSize: '40px',
            fontWeight: '900'
          }}>
            📊 Gruppenphase Ranking
          </h1>
          <p style={{
            margin: '0',
            color: '#667eea',
            fontSize: '15px',
            fontWeight: '600'
          }}>
            Team-Statistiken der Gruppenphase
          </p>
        </div>

        {/* Gruppen */}
        <StandingsTable group="A" teams={groupA} />
        <StandingsTable group="B" teams={groupB} />
      </div>
    </div>
  )
}