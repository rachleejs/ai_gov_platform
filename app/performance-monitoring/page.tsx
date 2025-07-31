'use client'

import {
  ArrowLeftIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  InformationCircleIcon,
  ListBulletIcon,
  ServerIcon,
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const models = [
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
]

const timeRanges = [
  { id: '1h', name: '1시간' },
  { id: '6h', name: '6시간' },
  { id: '24h', name: '24시간' },
  { id: '7d', name: '7일' },
]

const generateChartData = (label: string, borderColor: string, backgroundColor: string) => {
  return {
    labels: ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
    datasets: [
      {
        label: label,
        data: Array.from({ length: 7 }, () => Math.random() * 100),
        fill: true,
        borderColor: borderColor,
        backgroundColor: backgroundColor,
        tension: 0.4,
        pointBackgroundColor: '#fff',
        pointBorderColor: borderColor,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: borderColor,
      },
    ],
  }
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      grid: {
        color: 'rgba(200, 200, 200, 0.2)',
      },
      ticks: {
        callback: function (value: string | number) {
          if (typeof value === 'number') {
            return value + '%'
          }
          return value
        },
      },
    },
  },
}

const performanceMetrics = [
  {
    name: '정확도 (Accuracy)',
    value: '98.7%',
    change: '+0.2%',
    changeType: 'positive',
    icon: ChartBarIcon,
    chartData: generateChartData('정확도', 'rgb(75, 192, 192)', 'rgba(75, 192, 192, 0.2)'),
  },
  {
    name: '응답 시간 (Latency)',
    value: '150ms',
    change: '-10ms',
    changeType: 'positive',
    icon: ClockIcon,
    chartData: generateChartData('응답 시간', 'rgb(255, 99, 132)', 'rgba(255, 99, 132, 0.2)'),
  },
  {
    name: '처리량 (Throughput)',
    value: '120 req/s',
    change: '+5 req/s',
    changeType: 'positive',
    icon: ServerIcon,
    chartData: generateChartData('처리량', 'rgb(54, 162, 235)', 'rgba(54, 162, 235, 0.2)'),
  },
  {
    name: '자원 사용량 (CPU)',
    value: '45%',
    change: '+2%',
    changeType: 'negative',
    icon: CpuChipIcon,
    chartData: generateChartData('CPU 사용량', 'rgb(255, 206, 86)', 'rgba(255, 206, 86, 0.2)'),
  },
]

const recentLogs = [
  { id: 1, type: 'INFO', message: '모델 "GPT-4 Turbo" 배포 완료', timestamp: '2024-07-21 10:00:00' },
  { id: 2, type: 'WARN', message: '응답 시간 임계값 초과 (250ms)', timestamp: '2024-07-21 10:15:23' },
  { id: 3, type: 'ERROR', message: 'API 요청 실패 (코드: 503)', timestamp: '2024-07-21 10:18:10' },
  { id: 4, type: 'INFO', message: '시스템 자동 재시작', timestamp: '2024-07-21 10:20:05' },
  { id: 5, type: 'INFO', message: '정상 상태 복구', timestamp: '2024-07-21 10:22:41' },
]

const PerformanceMonitoringPage = () => {
  const router = useRouter()
  const [selectedModel, setSelectedModel] = useState(models[0].id)
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRanges[2].id)

  const getLogTypeClass = (type: string) => {
    switch (type) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800'
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800'
      case 'ERROR':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="bg-grey">
      <div className="pt-4 px-4 sm:px-6 lg:px-8 max-w-screen-xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-grey border border-tan/50 rounded-lg hover:bg-tan"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            메인으로
          </button>
          <h1 className="text-xl font-bold text-green ml-4">성능 모니터링</h1>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-green">모델 선택:</span>
              <div className="flex space-x-1 bg-grey/20 p-1 rounded-lg">
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      selectedModel === model.id
                        ? 'bg-green text-white shadow'
                        : 'hover:bg-grey/30 text-green'
                    }`}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-green">시간 범위:</span>
              <div className="flex space-x-1 bg-grey/20 p-1 rounded-lg">
                {timeRanges.map(range => (
                  <button
                    key={range.id}
                    onClick={() => setSelectedTimeRange(range.id)}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      selectedTimeRange === range.id
                        ? 'bg-green text-white shadow'
                        : 'hover:bg-grey/30 text-green'
                    }`}
                  >
                    {range.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-green">{metric.name}</h3>
                <metric.icon className="h-6 w-6 text-grey" />
              </div>
              <p className="text-3xl font-bold text-green">{metric.value}</p>
              <p
                className={`text-sm mt-1 font-semibold ${
                  metric.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {metric.change}
              </p>
              <div className="mt-4 h-32">
                <Line data={metric.chartData} options={chartOptions as any}/>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ListBulletIcon className="h-6 w-6 mr-2 text-green" />
            최근 활동 로그
          </h2>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="space-y-3">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-grey/10">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`font-mono text-xs px-2 py-1 rounded-full ${getLogTypeClass(
                        log.type,
                      )}`}
                    >
                      {log.type}
                    </span>
                    <p className="text-grey-700">{log.message}</p>
                  </div>
                  <span className="text-grey-500 font-mono text-xs">{log.timestamp}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <button className="text-green hover:underline text-sm font-medium">
                전체 로그 보기
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-green/10 text-green rounded-lg flex items-start">
          <InformationCircleIcon className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">성능 최적화 제안</h3>
            <p className="text-sm">
              응답 시간이 평균보다 높은 <strong>{models.find(m => m.id === selectedModel)?.name}</strong> 모델에 대해 캐싱 전략을 검토하거나, 리소스 할당량을 늘리는 것을 고려해보세요.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PerformanceMonitoringPage 