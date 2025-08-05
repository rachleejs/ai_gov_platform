'use client';

import {
  ClipboardDocumentListIcon,
  ShieldExclamationIcon,
  SquaresPlusIcon,
  ClipboardIcon,
  TrophyIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  const handleNavigation = (path: string, event: React.MouseEvent) => {
    // 클릭된 아이콘의 중심 위치 계산
    const rect = event.currentTarget.getBoundingClientRect();
    const iconCenter = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    
    setClickPosition(iconCenter);
    setIsTransitioning(true);
    
    setTimeout(() => {
      router.push(path);
    }, 800); // 애니메이션 지속 시간
  };



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
    <div className="relative">
      {/* 전환 애니메이션 오버레이 */}
      <motion.div
        className="fixed bg-lime z-50 pointer-events-none"
        initial={{ scale: 0 }}
        animate={{ scale: isTransitioning ? 100 : 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ 
          left: clickPosition.x,
          top: clickPosition.y,
          width: '20px',
          height: '20px',
          borderRadius: isTransitioning ? '0%' : '50%',
          transformOrigin: 'center center',
          transform: 'translate(-50%, -50%)'
        }}
      />
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

        {/* 메뉴 */}
        <section className="h-full w-full snap-start flex flex-col justify-start items-center pt-16 relative bg-grey">
           <motion.div
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="w-full h-full flex flex-col justify-start items-center"
          >
            <h2 className="text-7xl font-extrabold text-green whitespace-nowrap ">
              메뉴
            </h2>
            <div className="flex flex-row justify-center items-start w-full mx-auto mt-[calc(50vh-300px)] gap-8 md:gap-16 lg:gap-24 xl:gap-32 px-4 md:px-8">
              <div className="group relative">
                <button
                  onClick={(e) => handleNavigation('/main-dashboard', e)}
                  className="flex flex-col items-center gap-4 text-green group"
                >
                  <div className="p-5 md:p-6 lg:p-9 xl:p-12 bg-green group-hover:bg-lime transition-colors rounded-full hover:cursor-pointer hover:scale-110 hover:shadow-lg hover:bg-lime">
                    <ClipboardIcon className="h-18 w-18 md:h-24 md:w-24 lg:h-30 lg:w-30 xl:h-36 xl:w-36 text-white" />
                  </div>
                  <span className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold group-hover:text-lime transition-colors">메인 대시보드</span>
                </button>
                <div className="absolute -bottom-40 md:-bottom-48 lg:-bottom-56 xl:-bottom-64 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 w-72 md:w-80 lg:w-96">
                  <p className="text-sm md:text-base lg:text-lg xl:text-xl text-orange font-medium text-center leading-relaxed">종합적인 AI 모델 평가 현황을 실시간으로<br/>모니터링하고 윤리성, 신뢰성, 성능 등<br/>핵심 지표들을 시각적으로 분석하여<br/>데이터 기반의 인사이트를 제공합니다.</p>
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={(e) => handleNavigation('/leaderboard', e)}
                  className="flex flex-col items-center gap-4 text-green group"
                >
                  <div className="p-5 md:p-6 lg:p-9 xl:p-12 bg-green group-hover:bg-lime transition-colors rounded-full hover:cursor-pointer hover:scale-110 hover:shadow-lg hover:bg-lime">
                    <TrophyIcon className="h-18 w-18 md:h-24 md:w-24 lg:h-30 lg:w-30 xl:h-36 xl:w-36 text-white" />
                  </div>
                  <span className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold group-hover:text-lime transition-colors">리더보드</span>
                </button>
                <div className="absolute -bottom-40 md:-bottom-48 lg:-bottom-56 xl:-bottom-64 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 w-72 md:w-80 lg:w-96">
                  <p className="text-sm md:text-base lg:text-lg xl:text-xl text-orange font-medium text-center leading-relaxed">다양한 AI 모델들의 성능을 공정하고 투명하게<br/>비교하여 윤리성, 신뢰성, 심리학적 지표 등을<br/>종합적으로 평가하고 랭킹 시스템을 통해<br/>모델 선택의 기준을 제시합니다.</p>
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={(e) => handleNavigation('/model-comparison', e)}
                  className="flex flex-col items-center gap-4 text-green group"
                >
                  <div className="p-5 md:p-6 lg:p-9 xl:p-12 bg-green group-hover:bg-lime transition-colors rounded-full hover:cursor-pointer hover:scale-110 hover:shadow-lg hover:bg-lime">
                    <MagnifyingGlassIcon className="h-18 w-18 md:h-24 md:w-24 lg:h-30 lg:w-30 xl:h-36 xl:w-36 text-white" />
                  </div>
                  <span className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold group-hover:text-lime transition-colors">모델 비교</span>
                </button>
                <div className="absolute -bottom-40 md:-bottom-48 lg:-bottom-56 xl:-bottom-64 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 w-72 md:w-80 lg:w-96">
                  <p className="text-sm md:text-base lg:text-lg xl:text-xl text-orange font-medium text-center leading-relaxed">선택된 모델들을 동일한 조건에서 비교 평가하여<br/>각 모델의 강점과 약점을 상세히 분석하고<br/>사용 목적에 맞는 최적의 모델을<br/>찾을 수 있도록 도와드립니다.</p>
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={(e) => handleNavigation('/governance-framework', e)}
                  className="flex flex-col items-center gap-4 text-green group"
                >
                  <div className="p-5 md:p-6 lg:p-9 xl:p-12 bg-green group-hover:bg-lime transition-colors rounded-full hover:cursor-pointer hover:scale-110 hover:shadow-lg hover:bg-lime">
                    <ShieldExclamationIcon className="h-18 w-18 md:h-24 md:w-24 lg:h-30 lg:w-30 xl:h-36 xl:w-36 text-white" />
                  </div>
                  <span className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold group-hover:text-lime transition-colors">프레임워크</span>
                </button>
                <div className="absolute -bottom-40 md:-bottom-48 lg:-bottom-56 xl:-bottom-64 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 w-72 md:w-80 lg:w-96">
                  <p className="text-sm md:text-base lg:text-lg xl:text-xl text-orange font-medium text-center leading-relaxed">종합적인 AI 거버넌스 프레임워크를 통해<br/>윤리성, 안전성, 투명성 등 핵심 영역을<br/>체계적으로 평가하고 AI 시스템의 책임감 있는<br/>개발과 운영을 지원합니다.</p>
                </div>
              </div>
              <div className="group relative">
                <button
                  onClick={(e) => handleNavigation('/add-custom', e)}
                  className="flex flex-col items-center gap-4 text-green group"
                >
                  <div className="p-5 md:p-6 lg:p-9 xl:p-12 bg-green group-hover:bg-lime transition-colors rounded-full hover:cursor-pointer hover:scale-110 hover:shadow-lg hover:bg-lime">
                    <SquaresPlusIcon className="h-18 w-18 md:h-24 md:w-24 lg:h-30 lg:w-30 xl:h-36 xl:w-36 text-white" />
                  </div>
                  <span className="text-base md:text-lg lg:text-xl xl:text-2xl font-bold group-hover:text-lime transition-colors">커스텀 추가</span>
                </button>
                <div className="absolute -bottom-40 md:-bottom-48 lg:-bottom-56 xl:-bottom-64 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 w-72 md:w-80 lg:w-96">
                  <p className="text-sm md:text-base lg:text-lg xl:text-xl text-orange font-medium text-center leading-relaxed">사용자의 특별한 요구사항에 맞춰<br/>새로운 AI 모델과 커스텀 평가 지표를 쉽게<br/>추가하고 관리할 수 있으며 개별 조직의<br/>특성에 맞는 맞춤형 평가 환경을 구축합니다.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
} 