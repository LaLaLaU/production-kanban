import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons'
import { Button, message, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'

interface KeepScreenAwakeProps {
  className?: string
}

const KeepScreenAwake: React.FC<KeepScreenAwakeProps> = ({ className }) => {
  const [isActive, setIsActive] = useState(false)
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null)
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)

  // 检查浏览器是否支持Wake Lock API
  const isWakeLockSupported = 'wakeLock' in navigator

  // 使用Wake Lock API保持屏幕常亮
  const requestWakeLock = async () => {
    try {
      if (isWakeLockSupported) {
        const lock = await navigator.wakeLock.request('screen')
        setWakeLock(lock)
        
        // 监听wake lock释放事件
        lock.addEventListener('release', () => {
          console.log('Wake Lock已释放')
          setWakeLock(null)
        })
        
        return true
      }
      return false
    } catch (error) {
      console.error('请求Wake Lock失败:', error)
      return false
    }
  }

  // 释放Wake Lock
  const releaseWakeLock = async () => {
    if (wakeLock) {
      try {
        await wakeLock.release()
        setWakeLock(null)
      } catch (error) {
        console.error('释放Wake Lock失败:', error)
      }
    }
  }

  // 备用方案：使用定时器模拟用户活动
  const startFallbackKeepAwake = () => {
    // 每30秒触发一次微小的DOM操作来保持活跃状态
    const id = setInterval(() => {
      // 创建一个不可见的元素并立即移除，模拟用户活动
      const dummy = document.createElement('div')
      dummy.style.position = 'absolute'
      dummy.style.left = '-9999px'
      dummy.style.opacity = '0'
      document.body.appendChild(dummy)
      setTimeout(() => {
        if (dummy.parentNode) {
          dummy.parentNode.removeChild(dummy)
        }
      }, 1)
    }, 30000) // 30秒间隔
    
    setIntervalId(id)
  }

  // 停止备用方案
  const stopFallbackKeepAwake = () => {
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
  }

  // 切换防熄屏状态
  const toggleKeepAwake = async () => {
    if (isActive) {
      // 关闭防熄屏
      await releaseWakeLock()
      stopFallbackKeepAwake()
      setIsActive(false)
      message.success('已关闭防熄屏功能')
    } else {
      // 开启防熄屏
      let success = false
      
      if (isWakeLockSupported) {
        success = await requestWakeLock()
        if (success) {
          message.success('已开启防熄屏功能 (使用Wake Lock API)')
        }
      }
      
      if (!success) {
        // 使用备用方案
        startFallbackKeepAwake()
        message.success('已开启防熄屏功能 (使用备用方案)')
      }
      
      setIsActive(true)
    }
  }

  // 页面可见性变化时重新请求Wake Lock
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (isActive && !document.hidden && isWakeLockSupported && !wakeLock) {
        await requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isActive, wakeLock, isWakeLockSupported])

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      releaseWakeLock()
      stopFallbackKeepAwake()
    }
  }, [])

  return (
    <Tooltip 
      title={isActive ? '点击关闭防熄屏功能' : '点击开启防熄屏功能，适用于大屏幕长时间展示'}
      placement="bottom"
    >
      <Button
        type={isActive ? 'primary' : 'default'}
        icon={isActive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
        onClick={toggleKeepAwake}
        className={className}
        style={{
          backgroundColor: isActive ? '#52c41a' : undefined,
          borderColor: isActive ? '#52c41a' : undefined
        }}
      >
        {isActive ? '防熄屏已开启' : '防熄屏'}
      </Button>
    </Tooltip>
  )
}

export default KeepScreenAwake