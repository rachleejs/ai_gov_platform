'use client';

import { 
  UserCircleIcon,
  TrophyIcon,
  MagnifyingGlassIcon,
  ShieldExclamationIcon,
  SquaresPlusIcon,
  ClipboardIcon
} from '@heroicons/react/24/outline';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleNonMemberClick = () => {
    router.push('/non-member-login');
  };

  const menuItems = [
    { name: '메인 대시보드', href: '/main-dashboard', icon: ClipboardIcon},
    { name: '리더보드', href: '/leaderboard', icon: TrophyIcon },
    { name: '모델 비교', href: '/model-comparison', icon: MagnifyingGlassIcon },
    { name: '프레임워크', href: '/governance-framework', icon: ShieldExclamationIcon },
    { name: '커스텀 추가', href: '/evaluation-data', icon: SquaresPlusIcon },
  ];

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-tan/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h1 className="text-xl font-bold text-green">AI Gov</h1>
            </Link>
            
            {/* 네비게이션 메뉴 - 메인 페이지가 아닐 때만 표시 */}
            {pathname !== '/' && (
              <nav className="hidden lg:flex items-center space-x-6">
                {menuItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={index}
                      href={item.href}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors group ${
                        isActive 
                          ? 'bg-green text-white' 
                          : 'text-green hover:bg-green/10'
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'group-hover:text-green'}`} />
                      <span className={`text-sm font-medium ${isActive ? 'text-white' : 'group-hover:text-green'}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-taupe">
                  <UserCircleIcon className="h-5 w-5" />
                  <span>
                    {user.name}
                    {user.isGuest ? ' (게스트)' : ''}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    logout();
                  }}
                  className="text-sm font-medium text-green hover:text-green/70 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleNonMemberClick();
                  }}
                  className="text-sm font-medium text-green hover:text-green/70 transition-colors"
                >
                  비회원 로그인
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/login');
                  }}
                  className="text-sm font-medium text-green hover:text-green/70 transition-colors"
                >
                  로그인
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/signup');
                  }}
                  className="text-sm font-medium bg-green text-white px-4 py-2 rounded-lg hover:bg-green/90 transition-colors"
                >
                  회원가입
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 