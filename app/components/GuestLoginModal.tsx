'use client';

import { useState } from 'react';

interface GuestLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, dateOfBirth: string) => void;
  isLoading?: boolean;
}

export default function GuestLoginModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: GuestLoginModalProps) {
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dateOfBirth.trim()) {
      setError('이름과 생년월일을 모두 입력해주세요.');
      return;
    }
    setError('');
    onSubmit(name.trim(), dateOfBirth.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-96 p-6">
        <h2 className="text-2xl font-bold text-center text-green mb-6">게스트 로그인</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="guest-name">
              이름
            </label>
            <input
              id="guest-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green/50 focus:border-green"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="guest-dob">
              생년월일 (YYYY-MM-DD)
            </label>
            <input
              id="guest-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green/50 focus:border-green"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green text-white font-semibold py-2 rounded-lg hover:bg-green/90 transition-colors mb-4"
            disabled={isLoading}
          >
            {isLoading ? '시작하는 중...' : '시작하기'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-grey/20 text-gray-700 hover:bg-grey/30 border border-gray-200 font-semibold py-2 rounded-lg transition-colors"
            disabled={isLoading}
          >
            취소
          </button>
        </form>
      </div>
    </div>
  );
} 