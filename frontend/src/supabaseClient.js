import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase Client Settings:
 * - detectSessionInUrl: handles the PKCE / hash strings automatically
 * - flowType: 'pkce' is the most secure modern standard
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        storage: window.localStorage,
        storageKey: 'routigo-auth',
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    }
})
