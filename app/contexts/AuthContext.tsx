'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;
  role?: 'admin' | 'expert' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  guestLogin: () => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Supabase 인증 상태 확인
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
      }
      setIsLoading(false);
    };

    getInitialSession();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading user profile for:', supabaseUser.id);
      
      // 사용자 프로필 정보 조회
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      console.log('Profile query result:', { profile, error });

      if (error) {
        console.error('Profile load error:', error);
        console.log('Creating new profile for user:', supabaseUser.id);
        
        // 프로필이 없으면 기본 프로필 생성 (UPSERT 사용)
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .upsert([
            {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.user_metadata?.name || '사용자',
              role: 'user',
              is_guest: false
            }
          ])
          .select()
          .single();

        console.log('Profile creation result:', { newProfile, createError });

        if (createError) {
          console.error('Profile creation error:', createError);
          alert(`프로필 생성 오류: ${createError.message}`);
          return;
        }

        setUser({
          id: newProfile.id,
          name: newProfile.name,
          email: newProfile.email,
          role: newProfile.role,
          isGuest: false
        });
      } else {
        console.log('Profile loaded successfully:', profile);
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          isGuest: profile.is_guest
        });
      }
    } catch (error) {
      console.error('User profile loading error:', error);
      alert(`사용자 프로필 로딩 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Starting login process:', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Login response:', { data, error });

      if (error) {
        console.error('Login error:', error);
        alert(`로그인 오류: ${error.message}`);
        return false;
      }

      if (data.user) {
        console.log('User logged in successfully:', data.user);
        await loadUserProfile(data.user);
        return true;
      }
      
      console.log('No user returned from login');
      return false;
    } catch (error) {
      console.error('Login error:', error);
      alert(`로그인 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Starting signup process:', { name, email });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      console.log('Signup response:', { data, error });

      if (error) {
        console.error('Signup error:', error);
        alert(`회원가입 오류: ${error.message}`);
        return false;
      }

      if (data.user) {
        console.log('User created successfully:', data.user);
        
        // 사용자 프로필 생성 (UPSERT 사용)
        const { error: profileError } = await supabase
          .from('users')
          .upsert([
            {
              id: data.user.id,
              email,
              name,
              role: 'user',
              is_guest: false
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          alert(`프로필 생성 오류: ${profileError.message}`);
          // 프로필 생성 실패해도 회원가입은 성공한 것으로 처리
        }

        await loadUserProfile(data.user);
        return true;
      }
      
      console.log('No user returned from signup');
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      alert(`회원가입 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const guestLogin = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // 게스트 사용자를 위한 임시 이메일 생성 (더 안전한 도메인 사용)
      const guestEmail = `guest_${Date.now()}@example.com`;
      const guestPassword = 'guest_password_' + Date.now();
      
      console.log('Starting guest login process:', { guestEmail });
      
      const { data, error } = await supabase.auth.signUp({
        email: guestEmail,
        password: guestPassword,
        options: {
          data: {
            name: '게스트'
          }
        }
      });

      console.log('Guest login response:', { data, error });

      if (error) {
        console.error('Guest login error:', error);
        alert(`게스트 로그인 오류: ${error.message}`);
        return false;
      }

      if (data.user) {
        console.log('Guest user created successfully:', data.user);
        
        // 게스트 사용자 프로필 생성 (UPSERT 사용)
        const { error: profileError } = await supabase
          .from('users')
          .upsert([
            {
              id: data.user.id,
              email: guestEmail,
              name: '게스트',
              role: 'user',
              is_guest: true
            }
          ]);

        if (profileError) {
          console.error('Guest profile creation error:', profileError);
          alert(`게스트 프로필 생성 오류: ${profileError.message}`);
          // 프로필 생성 실패해도 게스트 로그인은 성공한 것으로 처리
        }

        await loadUserProfile(data.user);
        return true;
      }
      
      console.log('No user returned from guest login');
      return false;
    } catch (error) {
      console.error('Guest login error:', error);
      alert(`게스트 로그인 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    login,
    signup,
    guestLogin,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 