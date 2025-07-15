import React from 'react'

interface GanttWaterLevelProps {
  commitTime: string
  width: number
  height: number
  maxDays?: number
  isUrgent?: boolean
}

const GanttWaterLevel: React.FC<GanttWaterLevelProps> = ({
  commitTime,
  maxDays = 4,
  isUrgent = false
}) => {
  // 计算等待天数
  const calculateWaitingDays = () => {
    if (!commitTime) return 0

    try {
      const commitDate = new Date(commitTime)
      const now = new Date()

      // 检查日期是否有效
      if (isNaN(commitDate.getTime())) {
        console.warn('Invalid commit time:', commitTime)
        return 0
      }

      const diffTime = Math.abs(now.getTime() - commitDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      // 调试信息 - 仅在开发环境显示
      if (process.env.NODE_ENV === 'development') {
        console.log('GanttWaterLevel Debug:', {
          commitTime,
          commitDate: commitDate.toISOString(),
          now: now.toISOString(),
          diffTime,
          diffDays,
          maxDays
        })
      }

      return diffDays
    } catch (error) {
      console.error('Error calculating waiting days:', error)
      return 0
    }
  }

  // 根据等待天数计算填充高度百分比
  const getWaterLevel = () => {
    const waitingDays = calculateWaitingDays()
    const percentage = Math.min((waitingDays / maxDays) * 100, 100)
    return percentage
  }

  // 根据等待天数获取颜色
  const getWaterColor = () => {
    // 如果是紧急任务，强制使用黑色
    if (isUrgent) {
      return 'rgba(0, 0, 0, 0.8)'
    }

    const waitingDays = calculateWaitingDays()
    const ratio = waitingDays / maxDays

    if (ratio <= 0.25) {
      // 0-1天：绿色系
      return `rgba(82, 196, 26, 0.6)`
    } else if (ratio <= 0.5) {
      // 2天：黄色系
      return `rgba(250, 173, 20, 0.7)`
    } else if (ratio <= 0.75) {
      // 3天：橙色系
      return `rgba(255, 136, 0, 0.8)`
    } else {
      // 4天+：红色系
      return `rgba(255, 77, 79, 0.9)`
    }
  }

  const waitingDays = calculateWaitingDays()
  const waterLevel = getWaterLevel()
  const waterColor = getWaterColor()

  // 如果等待天数为0或无效，不显示水位
  if (waitingDays === 0) {
    return null
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        borderRadius: '3px',
        pointerEvents: 'none'
      }}
    >
      {/* 水位填充 - 从底部向上填充 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${waterLevel}%`,
          background: waterColor,
          transition: 'height 0.3s ease-out, background-color 0.3s ease-out'
        }}
      />

      {/* 调试信息 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            fontSize: '8px',
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '1px 3px',
            borderRadius: '2px',
            zIndex: 10
          }}
        >
          {waitingDays}d
        </div>
      )}
    </div>
  )
}

export default GanttWaterLevel
