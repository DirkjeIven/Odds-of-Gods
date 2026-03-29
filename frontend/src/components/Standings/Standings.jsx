import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useAuthStore } from '../../store/authStore'

export default function Standings() {
  const { profile } = useAuthStore()
  const [rankings, setRankings] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [tab, setTab] = useState('players') // 'players' oder 'groups'

  useEffect(() => {
    fetchPlayerRankings()
  }, [])

  const fetchPlayerRankings = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, points')
      .order('points', { ascending: false })

    if (data) {
      setRankings(data)
      const rank = data.findIndex((p) => p.id === profile?.id) + 1
      setUserRank(rank)
    }
  }

  const getMedalEmoji = (index) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return ''
  }

  const getRankColor = (index) => {
    if (index === 0) return { bg: 'rgba(255, 193, 7, 0.1)', border: '2px solid #ffc107', color: '#ff9800' }
    if (index === 1) return { bg: 'rgba(192, 192, 192, 0.1)', border: '2px solid #c0c0c0', color: '#9e9e9e' }
    if (index === 2) return { bg: 'rgba(205, 127, 50, 0.1)', border: '2px solid #cd7f32', color: '#cd7f32' }
    return { bg: 'transparent', border: '1px solid #e0e0e0', color: '#333' }
  }

  // PLAYER RANKINGS TAB
  const PlayerRankingsTab = () => (
    <div>
      {/* Top 3 - Special Cards */}
      {rankings.length >= 3 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '35px'
        }}>
          {rankings.slice(0, 3).map((player, index) => {
            const rankInfo = getRankColor(index)
            return (
              <div
                key={player.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '30px 25px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  border: rankInfo.border,
                  background: rankInfo.bg,
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  ...(player.id === profile?.id && {
                    boxShadow: '0 0 30px rgba(102, 126, 234, 0.5)',
                    transform: 'scale(1.02)'
                  })
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = player.id === profile?.id ? 'scale(1.05)' : 'translateY(-8px)'
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = player.id === profile?.id ? 'scale(1.02)' : 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                }}
              >
                {/* Medal */}
                <div style={{
                  fontSize: '60px',
                  marginBottom: '15px',
                  animation: index === 0 ? 'pulse 2s ease-in-out infinite' : 'none'
                }}>
                  <style>{`
                    @keyframes pulse {
                      0%, 100% { transform: scale(1); }
                      50% { transform: scale(1.1); }
                    }
                  `}</style>
                  {getMedalEmoji(index)}
                </div>

                {/* Rank Number */}
                <p style={{
                  margin: '0 0 10px 0',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: rankInfo.color,
                  letterSpacing: '0.5px'
                }}>
                  PLATZ #{index + 1}
                </p>

                {/* Username */}
                <p style={{
                  margin: '0 0 15px 0',
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#1a1a2e'
                }}>
                  {player.username}
                  {player.id === profile?.id && ' (DU)'}
                </p>

                {/* Points */}
                <p style={{
                  margin: '0',
                  fontSize: '32px',
                  fontWeight: '900',
                  color: rankInfo.color
                }}>
                  {player.points} <span style={{ fontSize: '18px' }}>⭐</span>
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Rest of Rankings - Table */}
      {rankings.length > 3 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '18px',
          padding: '35px 30px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <h2 style={{
            margin: '0 0 25px 0',
            color: '#1a1a2e',
            fontSize: '20px',
            fontWeight: '800'
          }}>
            Plätze 4+
          </h2>

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
                }}>PLATZ</th>
                <th style={{
                  padding: '14px 0',
                  textAlign: 'left',
                  color: '#667eea',
                  fontWeight: '700',
                  fontSize: '12px',
                  letterSpacing: '0.5px'
                }}>SPIELER</th>
                <th style={{
                  padding: '14px 0',
                  textAlign: 'right',
                  color: '#667eea',
                  fontWeight: '700',
                  fontSize: '12px',
                  letterSpacing: '0.5px'
                }}>PUNKTE</th>
              </tr>
            </thead>
            <tbody>
              {rankings.slice(3).map((player, index) => (
                <tr
                  key={player.id}
                  style={{
                    backgroundColor: player.id === profile?.id ? 'rgba(102, 126, 234, 0.08)' : (index % 2 === 0 ? '#fff' : '#f9f9f9'),
                    borderBottom: '1px solid #eee',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <td style={{
                    padding: '14px 0',
                    fontWeight: '700',
                    color: '#333',
                    fontSize: '15px'
                  }}>
                    #{index + 4}
                  </td>
                  <td style={{
                    padding: '14px 0',
                    color: player.id === profile?.id ? '#667eea' : '#333',
                    fontWeight: player.id === profile?.id ? '700' : '500',
                    fontSize: '15px'
                  }}>
                    {player.username}
                    {player.id === profile?.id && ' (DU)'}
                  </td>
                  <td style={{
                    padding: '14px 0',
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
      )}

      {rankings.length === 0 && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '18px',
          padding: '60px 30px',
          textAlign: 'center',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          border: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <p style={{ fontSize: '48px', margin: '0 0 15px 0' }}>👥</p>
          <p style={{ color: '#999', fontSize: '16px', fontWeight: '500' }}>
            Noch keine Spieler registriert
          </p>
        </div>
      )}
    </div>
  )

  // GROUP STANDINGS TAB
  const GroupStandingsTab = () => {
    const [groupA, setGroupA] = useState([])
    const [groupB, setGroupB] = useState([])
    const [loadingGroups, setLoadingGroups] = useState(true)

    useEffect(() => {
      fetchGroupStandings()
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
      setLoadingGroups(false)
    }

    const calculateAvgTrefferQuote = (goals, rounds) => {
      if (rounds === 0) return 0
      return (goals / rounds).toFixed(2)
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
          <span style={{
            marginLeft: 'auto',
            backgroundColor: '#667eea',
            color: 'white',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
          </span>
        </div>

        {teams.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', padding: '40px 0', margin: 0 }}>
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
                }}>⌀ TREFFERQUOTE</th>
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
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''} {team.team_name}
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
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    fontWeight: '800',
                    fontSize: '15px',
                    borderRadius: '6px'
                  }}>
                    {calculateAvgTrefferQuote(team.total_goals, team.total_rounds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    )

    if (loadingGroups) return <p>Lädt Gruppen...</p>

    return (
      <div>
        <StandingsTable group="A" teams={groupA} />
        <StandingsTable group="B" teams={groupB} />
      </div>
    )
  }

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
            🏆 Statistiken
          </h1>
          <p style={{
            margin: '0',
            color: '#667eea',
            fontSize: '15px',
            fontWeight: '600'
          }}>
            Spieler & Team Rankings
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '35px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setTab('players')}
            style={{
              padding: '14px 28px',
              backgroundColor: tab === 'players' ? '#667eea' : 'white',
              color: tab === 'players' ? 'white' : '#333',
              border: `2px solid ${tab === 'players' ? '#667eea' : '#ddd'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              boxShadow: tab === 'players' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
            }}
          >
            👥 Spieler Ranking
          </button>
          <button
            onClick={() => setTab('groups')}
            style={{
              padding: '14px 28px',
              backgroundColor: tab === 'groups' ? '#667eea' : 'white',
              color: tab === 'groups' ? 'white' : '#333',
              border: `2px solid ${tab === 'groups' ? '#667eea' : '#ddd'}`,
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              boxShadow: tab === 'groups' ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
            }}
          >
            🅰️ Gruppen Ranking
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'players' && <PlayerRankingsTab />}
        {tab === 'groups' && <GroupStandingsTab />}
      </div>
    </div>
  )
}