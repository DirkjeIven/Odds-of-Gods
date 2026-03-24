import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const { login, isLoading, error } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result) {
      navigate('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Animierte Hintergrund-Elemente */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.4); }
          50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.8); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .floating-element {
          position: absolute;
          border-radius: 50%;
          opacity: 0.1;
        }
        .element-1 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          top: -100px;
          left: -100px;
          animation: float 6s ease-in-out infinite;
        }
        .element-2 {
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #f093fb, #f5576c);
          bottom: -50px;
          right: -50px;
          animation: float 8s ease-in-out infinite;
        }
      `}</style>

      {/* Hintergrund-Elemente */}
      <div className="floating-element element-1"></div>
      <div className="floating-element element-2"></div>

      {/* Haupt-Container */}
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(102, 126, 234, 0.2)',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        position: 'relative',
        zIndex: '10',
        animation: 'glow 3s ease-in-out infinite'
      }}>
        {/* HEADER - Mit Logo */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          padding: '50px 30px',
          textAlign: 'center',
          color: 'white',
          position: 'relative'
        }}>
          {/* Dekoration oben */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '60px',
            height: '60px',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '10px',
            transform: 'rotate(45deg)'
          }}></div>
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: '40px',
            height: '40px',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '50%'
          }}></div>

          {/* Logo */}
          <img 
            src="/images/logo.png"
            alt="Odds Of Gods Logo"
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '15px',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              marginBottom: '20px',
              transition: 'transform 0.3s ease',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              animation: 'float 4s ease-in-out infinite'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05) rotateY(5deg)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          />

          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '32px',
            fontWeight: '800',
            letterSpacing: '-0.5px'
          }}>
            Odds Of Gods
          </h1>
          <p style={{
            margin: '0',
            fontSize: '14px',
            opacity: 0.9,
            fontWeight: '500',
            letterSpacing: '0.5px'
          }}>
            FLUNKY-TURNIER TIPP-PLATTFORM
          </p>
        </div>

        {/* FORM SECTION */}
        <div style={{
          padding: '45px 35px'
        }}>
          {/* Heading */}
          <h2 style={{
            color: '#1a1a2e',
            marginBottom: '10px',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            Willkommen zurück! 👋
          </h2>
          <p style={{
            color: '#666',
            textAlign: 'center',
            marginBottom: '30px',
            fontSize: '13px',
            fontWeight: '500'
          }}>
            Melde dich an, um deine Wetten zu verwalten
          </p>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              color: '#e74c3c',
              padding: '14px 16px',
              borderRadius: '10px',
              marginBottom: '25px',
              fontSize: '13px',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              animation: 'slideDown 0.3s ease'
            }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {/* Email Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '700',
                color: '#1a1a2e',
                fontSize: '13px',
                letterSpacing: '0.3px'
              }}>
                📧 EMAIL-ADRESSE
              </label>
              <input
                type="email"
                placeholder="deine@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: focusedField === 'email' ? '2px solid #667eea' : '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  outline: 'none',
                  backgroundColor: focusedField === 'email' ? 'rgba(102, 126, 234, 0.05)' : '#fff',
                  fontWeight: '500'
                }}
              />
            </div>

            {/* Password Input */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '700',
                color: '#1a1a2e',
                fontSize: '13px',
                letterSpacing: '0.3px'
              }}>
                🔒 PASSWORT
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Dein Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 50px 14px 16px',
                    border: focusedField === 'password' ? '2px solid #667eea' : '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    backgroundColor: focusedField === 'password' ? 'rgba(102, 126, 234, 0.05)' : '#fff',
                    fontWeight: '500'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    padding: '5px 8px',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-50%) scale(1.1)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(-50%)'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: isLoading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: '16px',
                letterSpacing: '0.5px',
                boxShadow: isLoading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => !isLoading && (e.target.style.backgroundColor = '#764ba2')}
              onMouseLeave={(e) => !isLoading && (e.target.style.backgroundColor = '#667eea')}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                  Wird angemeldet...
                </span>
              ) : (
                '🚀 ANMELDEN'
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '25px 0',
            color: '#ccc'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
            <span style={{ fontSize: '13px', color: '#999' }}>ODER</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e0e0e0' }}></div>
          </div>

          {/* Signup Link */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: 'rgba(102, 126, 234, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
            <p style={{
              margin: '0 0 10px 0',
              fontSize: '13px',
              color: '#666',
              fontWeight: '500'
            }}>
              Du hast noch kein Konto?
            </p>
            <Link to="/signup" style={{
              color: '#667eea',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '14px',
              display: 'inline-block',
              transition: 'all 0.3s ease',
              padding: '8px 16px',
              borderRadius: '8px',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'
              e.target.style.transform = 'translateX(3px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.transform = 'translateX(0)'
            }}>
              ✨ JETZT REGISTRIEREN
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px',
          textAlign: 'center',
          borderTop: '1px solid #f0f0f0',
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          fontSize: '12px',
          color: '#999'
        }}>
          🎲 Viel Erfolg beim Flunky-Turnier!
        </div>
      </div>
    </div>
  )
}