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
import { motion, Variants } from 'framer-motion';
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
      items: [
        {
          name: '메인 대시보드',
          href: '/main-dashboard',
          icon: ChartBarIcon,
        },
        {
          name: '모델 비교 분석',
          href: '/model-comparison',
          icon: MagnifyingGlassIcon,
        },
      ],
    },
    {
      id: 'governance',
      title: '프레임워크',
      description: 'AI 시스템의 윤리적, 법적 준수를 관리합니다.',
      items: [
        {
          name: '거버넌스 프레임워크',
          href: '/governance-framework',
          icon: ShieldCheckIcon,
        },
        {
          name: '위험 감사',
          href: '/risk-audit',
          icon: ShieldExclamationIcon,
        },
        {
          name: '과정 기록',
          href: '/process-log',
          icon: ClipboardDocumentListIcon,
        },
      ],
    },
  ];

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.42, 0, 0.58, 1],
      },
    },
  };

  return (
    <div>
      <header className="bg-white/80 backdrop-blur-sm border-b border-tan/50 sticky top-0 z-50">
        {/* Header content remains the same */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <h1 className="text-xl font-bold text-green">AI Gov</h1>
              </div>
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
                      handleGuestLogin();
                    }}
                    className="text-sm font-medium text-green hover:text-green/70 transition-colors"
                  >
                    게스트 로그인
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

      <div className="h-[calc(100vh-69px)] overflow-y-scroll snap-y snap-mandatory">
        {/* Hero Section */}
        <section className="h-full w-full snap-start flex flex-col justify-center items-center text-center px-4 bg-green">
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <h1 className="text-6xl font-extrabold text-white mb-6 leading-tight">
              AI 신뢰성/윤리<br />평가 플랫폼
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              인공지능 시스템의 윤리적, 기술적 안전성을 종합적으로 평가하고<br/>관리하는 통합 플랫폼입니다.
            </p>
          </motion.div>
        </section>

        {/* 빠른 시작 메뉴 */}
        <section className="h-full w-full snap-start flex flex-col justify-start items-center pt-16 relative bg-grey">
           <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="w-full h-full flex flex-col justify-start items-center"
          >
            <h2 className="text-5xl font-extrabold text-green whitespace-nowrap">
              빠른 시작
            </h2>
            <div className="flex flex-row justify-center items-start w-full mx-auto mt-24 gap-52 px-8">
              <div className="group relative">
                <button
                  onClick={() => router.push('/governance-framework')}
                  className="flex flex-col items-start gap-4 text-green group"
                >
                  <div className="p-9 bg-green group-hover:bg-slate-grey transition-colors rounded-lg">
                    <ShieldCheckIcon className="h-28 w-28 text-white" />
                  </div>
                  <span className="text-4xl font-bold group-hover:text-slate-grey transition-colors">모델 평가</span>
                </button>
                <div className="absolute -bottom-52 left-1/2 -translate-x-1/2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <div className="bg-green border-0 shadow-lg p-4">
                    <p className="text-xl text-gray-200">AI 모델을 종합적으로 평가합니다.</p>
                  </div>
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={() => router.push('/main-dashboard')}
                  className="flex flex-col items-start gap-4 text-green group"
                >
                  <div className="p-9 bg-green group-hover:bg-slate-grey transition-colors rounded-lg">
                    <ChartBarIcon className="h-28 w-28 text-white" />
                  </div>
                  <span className="text-4xl font-bold group-hover:text-slate-grey transition-colors">대시보드</span>
                </button>
                <div className="absolute -bottom-52 left-1/2 -translate-x-1/2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <div className="bg-green border-0 shadow-lg p-4">
                    <p className="text-xl text-gray-200">AI 모델을 종합적으로 모니터링합니다.</p>
                  </div>
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={() => router.push('/model-comparison')}
                  className="flex flex-col items-start gap-4 text-green group"
                >
                  <div className="p-9 bg-green group-hover:bg-slate-grey transition-colors rounded-lg">
                    <MagnifyingGlassIcon className="h-28 w-28 text-white" />
                  </div>
                  <span className="text-4xl font-bold group-hover:text-slate-grey transition-colors">모델 비교</span>
                </button>
                <div className="absolute -bottom-52 left-1/2 -translate-x-1/2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <div className="bg-green border-0 shadow-lg p-4">
                    <p className="text-xl text-gray-200">다양한 모델의 성능과 특성을 비교 분석합니다.</p>
                  </div>
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={() => router.push('/evaluation-data')}
                  className="flex flex-col items-start gap-4 text-green group"
                >
                  <div className="p-9 bg-green group-hover:bg-slate-grey transition-colors rounded-lg">
                    <SquaresPlusIcon className="h-28 w-28 text-white" />
                  </div>
                  <span className="text-4xl font-bold group-hover:text-slate-grey transition-colors">커스텀 추가</span>
                </button>
                <div className="absolute -bottom-52 left-1/2 -translate-x-1/2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <div className="bg-green border-0 shadow-lg p-4">
                    <p className="text-xl text-gray-200">사용자 정의 평가 모델 및 지표를 추가하고 관리합니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 주요 기능 둘러보기 */}
        <section className="h-full w-full snap-start flex flex-col justify-center items-center text-center py-20 bg-green">
           <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <h2 className="text-4xl font-bold text-white mb-16">
              주요 기능 둘러보기
            </h2>
            <div className="flex flex-wrap justify-center items-start gap-x-8 gap-y-12">
              {categories
                .flatMap((category) => category.items)
                .map((item, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(item.href);
                    }}
                    className="flex flex-col items-center justify-center gap-4 text-white group w-40"
                  >
                    <div className="p-4 bg-white/10 group-hover:bg-grey transition-colors rounded-full">
                      <item.icon className="h-10 w-10" />
                    </div>
                    <h3 className="text-lg font-semibold text-center text-white group-hover:text-grey transition-colors">
                      {item.name}
                    </h3>
                  </button>
                ))}
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
} 