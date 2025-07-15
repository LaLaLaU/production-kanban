import React from 'react'

interface WaterLevelIndicatorProps {
  commitTime: string
  height: number
  maxDays?: number
}

const WaterLevelIndicator: React.FC<WaterLevelIndicatorProps> = ({
  commitTime,
  height,
  maxDays = 30
}) => {
  // 计算等待天数
  const calculateWaitingDays = () => {
    const commitDate = new Date(commitTime)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - commitDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // 根据等待天数计算填充高度百分比
  const getWaterLevel = () => {
    const waitingDays = calculateWaitingDays()
    const percentage = Math.min((waitingDays / maxDays) * 100, 100)
    return percentage
  }

  // 根据等待天数获取颜色
  const getWaterColor = () => {
    const waitingDays = calculateWaitingDays()
    const ratio = waitingDays / maxDays

    if (ratio <= 0.3) {
      // 0-9天：绿色系
      return `rgba(82, 196, 26, ${0.3 + ratio * 0.4})`
    } else if (ratio <= 0.6) {
      // 10-18天：黄色系
      return `rgba(250, 173, 20, ${0.4 + (ratio - 0.3) * 0.4})`
    } else if (ratio <= 0.9) {
      // 19-27天：橙色系
      return `rgba(255, 136, 0, ${0.5 + (ratio - 0.6) * 0.3})`
    } else {
      // 28-30天+：红色系
      return `rgba(255, 77, 79, ${0.6 + (ratio - 0.9) * 0.4})`
    }
  }

  // 获取波浪动画颜色（稍微透明一些）
  const getWaveColor = () => {
    const baseColor = getWaterColor()
    return baseColor.replace(/[\d.]+\)$/, '0.2)')
  }

  const waitingDays = calculateWaitingDays()
  const waterLevel = getWaterLevel()
  const waterColor = getWaterColor()
  const waveColor = getWaveColor()

  return (
    <div
      className="water-level-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        borderRadius: '6px',
        pointerEvents: 'none'
      }}
    >
      {/* 水位填充 */}
      <div
        className="water-fill"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${waterLevel}%`,
          background: waterColor,
          transition: 'height 0.5s ease-out, background-color 0.5s ease-out'
        }}
      />

      {/* 波浪效果 */}
      <div
        className="water-wave"
        style={{
          position: 'absolute',
          bottom: `${waterLevel}%`,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${waveColor} 0%, ${waterColor} 50%, ${waveColor} 100%)`,
          transform: 'translateY(2px)',
          opacity: waterLevel > 0 ? 1 : 0,
          transition: 'opacity 0.3s ease-out'
        }}
      />

      {/* 等待天数指示器 */}
      {waitingDays > 0 && (
        <div
          className="waiting-days-indicator"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: 'bold',
            zIndex: 1
          }}
        >
          {waitingDays}天
        </div>
      )}

      {/* 30天刻度线 */}
      <div className="scale-lines">
        {Array.from({ length: 6 }, (_, i) => {
          const position = (i + 1) * (100 / 6) // 每5天一条线
          const daysMark = Math.round((i + 1) * (maxDays / 6))

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: `${position}%`,
                left: 0,
                right: 0,
                height: '1px',
                background: 'rgba(255, 255, 255, 0.3)',
                opacity: waterLevel > position ? 0.6 : 0.3
              }}
            />
          )
        })}
      </div>

      <style jsx>{`
        .water-wave {
          animation: wave 2s ease-in-out infinite;
        }

        @keyframes wave {
          0%, 100% {
            transform: translateY(2px) scaleY(1);
          }
          50% {
            transform: translateY(0px) scaleY(1.2);
          }
        }

        .water-fill {
          position: relative;
        }

        .water-fill::before {
          content: '';
          position: absolute;
          top: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
          animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 0.3;
            transform: translateX(-100%);
          }
          50% {
            opacity: 0.8;
            transform: translateX(100%);
          }
        }

        .waiting-days-indicator {
          backdrop-filter: blur(4px);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .scale-lines div {
          transition: opacity 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default WaterLevelIndicator
