import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { signup, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  // Passwort-Anforderungen prüfen
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?/`~]/.test(password)
  }

  const allRequirementsMet = Object.values(passwordRequirements).every(req => req)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert('Passwörter stimmen nicht überein!')
      return
    }

    if (!allRequirementsMet) {
      alert('Passwort erfüllt nicht alle Anforderungen!')
      return
    }

    await signup(email, password, username)
    navigate('/dashboard')
  }

  const RequirementCheck = ({ met, text }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
      color: met ? '#28a745' : '#dc3545',
      fontSize: '14px'
    }}>
      <span style={{ fontSize: '18px' }}>
        {met ? '✅' : '❌'}
      </span>
      <span>{text}</span>
    </div>
  )

  return (
    <div style={{
      maxWidth: '450px',
      margin: '50px auto',
      padding: '30px',
      border: '2px solid #4a90e2',
      borderRadius: '10px',
      backgroundColor: '#f8f9ff',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ color: '#4a90e2', textAlign: 'center', marginBottom: '30px' }}>
        🎲 Odds Of Gods - Registrierung
      </h1>

      {error && (
        <p style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          ⚠️ {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        {/* Benutzername */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            👤 Benutzername
          </label>
          <input
            type="text"
            placeholder="z.B. DeinName"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            📧 Email
          </label>
          <input
            type="email"
            placeholder="deine@email.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          />
        </div>

        {/* Passwort */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            🔒 Passwort
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Passwort eingeben"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                boxSizing: 'border-box',
                fontSize: '14px'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Passwort-Anforderungen */}
        {password && (
          <div style={{
            backgroundColor: '#fff',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '15px',
            border: '1px solid #ddd'
          }}>
            <p style={{ fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
              📋 Passwort-Anforderungen:
            </p>
            <RequirementCheck
              met={passwordRequirements.minLength}
              text="Mindestens 8 Zeichen"
            />
            <RequirementCheck
              met={passwordRequirements.hasLowercase}
              text="Mindestens 1 Kleinbuchstabe (a-z)"
            />
            <RequirementCheck
              met={passwordRequirements.hasUppercase}
              text="Mindestens 1 Großbuchstabe (A-Z)"
            />
            <RequirementCheck
              met={passwordRequirements.hasNumber}
              text="Mindestens 1 Zahl (0-9)"
            />
            <RequirementCheck
              met={passwordRequirements.hasSpecial}
              text="Mindestens 1 Sonderzeichen (!@#$%^&* etc.)"
            />
          </div>
        )}

        {/* Passwort wiederholen */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            🔒 Passwort wiederholen
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Passwort wiederholen"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: password === confirmPassword && password ? '2px solid #28a745' : '1px solid #ddd',
              borderRadius: '5px',
              boxSizing: 'border-box',
              fontSize: '14px'
            }}
          />
          {password && confirmPassword && (
            <p style={{
              color: password === confirmPassword ? '#28a745' : '#dc3545',
              fontSize: '12px',
              marginTop: '5px'
            }}>
              {password === confirmPassword ? '✅ Passwörter stimmen überein' : '❌ Passwörter stimmen nicht überein'}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !allRequirementsMet}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: allRequirementsMet ? '#4a90e2' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: allRequirementsMet ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.3s'
          }}
        >
          {isLoading ? '⏳ Wird erstellt...' : '✨ Registrieren'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
          Schon ein Konto? <a href="/login" style={{ color: '#4a90e2', textDecoration: 'none' }}>
            Hier anmelden
          </a>
        </p>
      </form>
    </div>
  )
}