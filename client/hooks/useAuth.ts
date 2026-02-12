import { useState, useEffect } from "react";
// Supabase import removed for local bypass
// import { supabase } from "@/integrations/supabase/client";
// import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  full_name: string;
  section_name: string | null;
}

export function useAuth() {
  // Mock user for local development bypass
  const mockUser = {
    id: "mock-user-id",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: { full_name: "Admin User" },
    aud: "authenticated",
    created_at: new Date().toISOString()
  };

  const mockProfile = {
    full_name: "Admin User",
    section_name: "Test Section"
  };

  return {
    user: mockUser,
    profile: mockProfile,
    loading: false,
    signIn: async () => ({ error: null }),
    signUp: async () => ({ error: null }),
    signOut: async () => {},
  };
}
