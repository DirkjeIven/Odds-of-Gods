import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabaseClient'
import { useAuthStore } from '../../store/authStore'

export default function Standings() {
  const { profile } = useAuthStore()
  const [rankings, setRankings] = useState([])

  useEffect(() => {
    fetchRankings()

    // Real-time Updates
    const subscription = supabase
      .channel('profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchRankings()
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const fetchRankings = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, points, correct_predictions')
      .order('points', { ascending: false })

    setRankings(data || [])
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🏆 Ranking</h1>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Platz</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ccc' }}>Spieler</th>
            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ccc' }}>Punkte</th>
            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ccc' }}>Richtig</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((player, index) => {
            const isCurrentUser = profile && player.id === profile.id
            return (
              <tr
                key={player.id}
                style={{
                  backgroundColor: isCurrentUser ? '#fff3cd' : (index % 2 === 0 ? '#fff' : '#f9f9f9'),
                  fontWeight: isCurrentUser ? 'bold' : 'normal'
                }}
              >
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}
                  #{index + 1}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  {player.username}
                  {isCurrentUser && ' (DU)'}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                  {player.points}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                  {player.correct_predictions}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}