import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { authService } from './services/authService'

// Komponenten importieren
import Login from './components/Auth/Login'
import Signup from './components/Auth/Signup'
import Dashboard from './components/Dashboard/Dashboard'
import BettingPage from './components/Betting/BettingPage'
import LiveGames from './components/Live/LiveGames'
import AdminPanel from './components/Admin/AdminPanel'
import Standings from './components/Standings/Standings'


// Protected Route - nur angemeldete Benutzer
function ProtectedRoute({ children }) {
  const { user, isInitialized } = useAuthStore()

  // Warte bis Session geladen
  if (!isInitialized) {
    return <p style={{ padding: '20px' }}>Lädt...</p>
  }

  // Wenn nicht angemeldet → zum Login
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { setUser, setProfile, setInitialized } = useAuthStore()

  // Beim Start: Schaue ob Benutzer schon angemeldet ist
  useEffect(() => {
    const checkSession = async () => {
      const session = await authService.getSession()

      if (session) {
        // Benutzer ist angemeldet
        const { data: profile } = await authService.getUserProfile(session.user.id)
        setUser(session.user)
        setProfile(profile)
      }

      // Sag dem App: "Ich bin fertig mit Laden"
      setInitialized(true)
    }

    checkSession()
  }, [setUser, setProfile, setInitialized])

  return (
    <BrowserRouter>
      <Routes>
        {/* Login & Registrierung */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Geschützte Routes (nur mit Login) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bet"
          element={
            <ProtectedRoute>
              <BettingPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/live"
          element={
            <ProtectedRoute>
              <LiveGames />
            </ProtectedRoute>
          }
        />

        <Route
          path="/standings"
          element={
            <ProtectedRoute>
              <Standings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Standard: Gehe zu Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}