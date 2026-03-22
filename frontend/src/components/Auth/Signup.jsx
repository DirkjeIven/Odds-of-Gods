import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const { signup, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validierung
    if (password !== confirmPassword) {
      alert('Passwörter stimmen nicht überein!')
      return
    }

    if (password.length < 6) {
      alert('Passwort muss mindestens 6 Zeichen lang sein!')
      return
    }

    await signup(email, password, username)
    navigate('/dashboard')
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h1>Odds Of Gods - Registrierung</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Benutzername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            placeholder="Passwort wiederholen"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px' }}
          />
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          style={{ width: '100%', padding: '10px', cursor: 'pointer' }}
        >
          {isLoading ? 'Lädt...' : 'Registrieren'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p>
          Schon ein Konto? <a href="/login">Hier anmelden</a>
        </p>
      </form>
    </div>
  )
}