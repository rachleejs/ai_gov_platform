'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function NonMemberLoginPage() {
  const router = useRouter();
  const { nonMemberLogin, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dob.trim()) {
      setError('이름과 생년월일을 모두 입력해주세요.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const success = await nonMemberLogin(name.trim(), dob.trim());
      if (success) {
        router.push('/main-dashboard');
      } else {
        setError('비회원 로그인에 실패했습니다.');
      }
    } catch (err) {
      console.error('Non-member login error:', err);
      setError('비회원 로그인 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const loading = isSubmitting;

  return (
    <div className="flex items-center justify-center min-h-screen bg-grey/20">
      <div className="p-8 bg-white rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-green">비회원 로그인</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nonmember-name" className="block text-green text-sm font-bold mb-2">
              이름
            </label>
            <input
              id="nonmember-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green/50 focus:border-green text-green placeholder:text-green/50"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="nonmember-dob" className="block text-green text-sm font-bold mb-2">
              생년월일 (YYYY-MM-DD)
            </label>
            <input
              id="nonmember-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green/50 focus:border-green text-green placeholder:text-green/50"
              disabled={isSubmitting}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green text-white font-semibold py-2 rounded-lg hover:bg-green/90 transition-colors"
            disabled={isSubmitting}
          >
            {loading ? '시작하는 중...' : '시작하기'}
          </button>
        </form>
      </div>
    </div>
  );
} 