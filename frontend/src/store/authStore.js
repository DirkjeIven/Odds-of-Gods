import { create } from 'zustand'
import { authService } from '../services/authService'

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false, // ← DAS IST NEU!
  error: null,

  signup: async (email, password, username) => {
    set({ isLoading: true, error: null })
    const result = await authService.signup(email, password, username)
    if (result.success) {
      set({ user: result.user, isLoading: false })
      return true
    } else {
      set({ error: result.error, isLoading: false })
      return false
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    const result = await authService.login(email, password)
    if (result.success) {
      set({
        user: result.user,
        profile: result.profile,
        isLoading: false,
        error: null
      })
      return true
    } else {
      set({ error: result.error, isLoading: false })
      return false
    }
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, profile: null })
  },

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setInitialized: (isInitialized) => set({ isInitialized }), // ← NEU!
}))