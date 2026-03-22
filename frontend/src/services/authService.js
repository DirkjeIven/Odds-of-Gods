import { supabase } from './supabaseClient'

export const authService = {
  // Registrierung (neuer Benutzer)
  async signup(email, password, username) {
    try {
      // 1. Benutzer in Supabase Auth erstellen
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (authError) throw authError

      // 2. Profil in Datenbank erstellen
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email,
            username,
            role: 'user',
          }
        ])

      if (profileError) throw profileError

      return { success: true, user: authData.user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Login (Benutzer anmelden)
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      // Benutzer-Profil abrufen
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      return { success: true, user: data.user, profile }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Logout (Benutzer abmelden)
  async logout() {
    const { error } = await supabase.auth.signOut()
    return { success: !error, error }
  },

  // Session abrufen (wenn Benutzer schon angemeldet)
  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session
  },

  // Profil abrufen
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  }
}