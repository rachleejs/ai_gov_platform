'use client';

import { 
  ChartBarIcon, 
  MagnifyingGlassIcon,
  ShieldCheckIcon, 
  UserCircleIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  ShieldExclamationIcon,
  ArrowRightIcon,
  SquaresPlusIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useAuth } from './contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, logout, guestLogin } = useAuth();

  const handleGuestLogin = async () => {
    await guestLogin();
  };

  const categories = [
    {
      id: 'monitoring',
      title: '성능 모니터링',
      description: 'AI 시스템의 성능을 지속적으로 모니터링하고 분석합니다.',
      categoryClasses: 'bg-white border-tan',
      headerClasses: 'text-navy bg-tan/50',
      items: [
        { 
          name: '메인 대시보드',
          href: '/main-dashboard',
          icon: ChartBarIcon,
          description: '전체 AI 시스템 현황을 한눈에 확인',
          detail: '실시간 성능 지표, 위험 알림, 사용자 피드백 등',
          recommended: '최우선 권장',
        },
        { 
          name: '모델 비교 분석',
          href: '/model-comparison',
          icon: MagnifyingGlassIcon,
          description: '여러 AI 모델의 성능을 비교분석',
          detail: '윤리성, 안전성, 성능 지표 종합 비교',
          recommended: '권장',
        }
        
      ]
    },
    {
      id: 'governance',
      title: '프레임워크',
      description: 'AI 시스템의 윤리적, 법적 준수를 관리합니다.',
      categoryClasses: 'bg-white border-tan',
      headerClasses: 'text-navy bg-tan/50',
      items: [
        { 
          name: '거버넌스 프레임워크',
          href: '/governance-framework',
          icon: ShieldCheckIcon,
          description: '포괄적인 AI 거버넌스 평가',
          detail: '윤리적 안전성, 법적 준수, 사회적 책임',
          recommended: '필수',
        },
        { 
          name: '위험 감사',
          href: '/risk-audit',
          icon: ShieldExclamationIcon,
          description: 'AI 시스템의 잠재적 위험 요소 감사',
          detail: '편향성, 보안 취약점, 규정 준수 여부',
          recommended: '권장',
        },
        { 
          name: '과정 기록',
          href: '/process-log',
          icon: ClipboardDocumentListIcon,
          description: 'AI 개발 및 운영 과정 추적',
          detail: '의사결정 과정, 변경 이력, 승인 절차',
          recommended: '권장',
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-tan/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <h1 className="text-xl font-bold text-navy">AI Gov</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-taupe">
                    <UserCircleIcon className="h-5 w-5" />
                    <span>{user.name}{user.isGuest ? ' (게스트)' : ''}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      logout();
                    }}
                    className="text-sm text-taupe hover:text-navy bg-cream hover:bg-tan px-3 py-1 rounded-lg transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleGuestLogin();
                    }}
                    className="text-sm text-taupe hover:text-navy bg-cream hover:bg-tan px-3 py-1 rounded-lg transition-colors"
                  >
                    👤 게스트
                  </button>
                  <span className="text-tan">|</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      router.push('/login');
                    }}
                    className="text-sm text-slate-blue hover:text-navy font-medium transition-colors"
                  >
                    로그인
                  </button>
                  <span className="text-tan">|</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      router.push('/signup');
                    }}
                    className="text-sm bg-slate-blue text-white px-3 py-1 rounded-lg hover:bg-navy transition-colors"
                  >
                    회원가입
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 히어로 섹션 */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-blue to-navy">
            AI 신뢰성/윤리 평가 플랫폼
          </h1>
          <p className="text-xl text-taupe max-w-3xl mx-auto leading-relaxed">
            인공지능 시스템의 윤리적, 기술적 안전성을 종합적으로 평가하고 관리하는 통합 플랫폼입니다.
          </p>
          
          {user?.isGuest && (
            <div className="mt-8 max-w-2xl mx-auto bg-cream border border-tan rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-taupe mr-2">ℹ️</span>
                <p className="text-sm text-taupe">
                  현재 게스트 모드로 이용 중입니다. 
                  <button
                    onClick={() => router.push('/signup')}
                    className="ml-1 text-slate-blue hover:text-navy font-medium underline"
                  >
                    회원가입
                  </button>
                  하시면 더 많은 기능을 이용할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 빠른 액세스 섹션 */}
        <div className="mb-16 bg-white rounded-2xl shadow-xl border border-tan/30 overflow-hidden">
          <div className="bg-navy px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">빠른 시작</h2>
                <p className="text-tan mt-2">가장 중요한 기능들에 바로 접근하세요</p>
              </div>
              {!user && (
                <button
                  onClick={handleGuestLogin}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <span>👤</span>
                  <span>게스트로 시작</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/governance-framework')}
                className="text-left p-4 rounded-lg border-2 border-tan/50 hover:border-slate-blue/50 hover:bg-cream transition-all duration-200 group"
              >
                <ShieldCheckIcon className="h-8 w-8 text-slate-blue mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-navy group-hover:text-slate-blue">모델 평가</h3>
                <p className="text-sm text-taupe mt-1">AI 윤리 및 규정 준수</p>
              </button>

              <button
                onClick={() => router.push('/main-dashboard')}
                className="text-left p-4 rounded-lg border-2 border-tan/50 hover:border-slate-blue/50 hover:bg-cream transition-all duration-200 group"
              >
                <ChartBarIcon className="h-8 w-8 text-slate-blue mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-navy group-hover:text-slate-blue">대시보드</h3>
                <p className="text-sm text-taupe mt-1">실시간 성능 모니터링</p>
              </button>

              <button
                onClick={() => router.push('/model-comparison')}
                className="text-left p-4 rounded-lg border-2 border-tan/50 hover:border-slate-blue/50 hover:bg-cream transition-all duration-200 group"
              >
                <MagnifyingGlassIcon className="h-8 w-8 text-slate-blue mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-navy group-hover:text-slate-blue">모델 비교</h3>
                <p className="text-sm text-taupe mt-1">AI 모델 성능 분석</p>
              </button>

              <button
                onClick={() => router.push('/evaluation-data')}
                className="text-left p-4 rounded-lg border-2 border-tan/50 hover:border-slate-blue/50 hover:bg-cream transition-all duration-200 group"
              >
                <SquaresPlusIcon className="h-8 w-8 text-slate-blue mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-navy group-hover:text-slate-blue">커스텀 추가</h3>
                <p className="text-sm text-taupe mt-1">모델/평가지표 설정</p>
              </button>
            </div>
          </div>
        </div>

        {/* 카테고리 섹션 */}
        <div className="space-y-12">
          {categories.map((category) => (
            <div key={category.id} className={`rounded-2xl p-8 shadow-lg border ${category.categoryClasses}`}>
              <div className="flex items-center mb-6">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${category.headerClasses}`}>
                  {category.title}
                </span>
              </div>
              <p className="text-taupe mb-8 text-lg">{category.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map((item, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(item.href);
                    }}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer border border-white/50 hover:scale-105 group text-left w-full"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-navy text-white">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-semibold text-slate-blue bg-slate-blue/10 px-2 py-1 rounded-full">
                        {item.recommended}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-navy mb-2 group-hover:text-slate-blue transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-taupe text-sm mb-3">
                      {item.description}
                    </p>
                    <p className="text-taupe/80 text-xs">
                      {item.detail}
                    </p>
                    <div className="mt-4 flex items-center text-slate-blue text-sm font-medium group-hover:text-navy">
                      바로가기
                      <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
} 