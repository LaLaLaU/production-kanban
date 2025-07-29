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

  // 备用方案：使用多种方法保持屏幕活跃
  const startFallbackKeepAwake = () => {
    // 方案1：定时器触发用户活动模拟
    const id = setInterval(() => {
      // 模拟鼠标移动
      if (document.hasFocus()) {
        const event = new MouseEvent('mousemove', {
          bubbles: true,
          cancelable: true,
          clientX: Math.random() * window.innerWidth,
          clientY: Math.random() * window.innerHeight
        })
        document.dispatchEvent(event)
      }
      
      // 创建一个不可见的元素并立即移除，模拟用户活动
      const dummy = document.createElement('div')
      dummy.style.position = 'absolute'
      dummy.style.left = '-9999px'
      dummy.style.opacity = '0'
      document.body.appendChild(dummy)
      
      // 触发一些DOM操作
      dummy.offsetHeight // 强制重排
      
      setTimeout(() => {
        if (dummy.parentNode) {
          dummy.parentNode.removeChild(dummy)
        }
      }, 1)
      
      // 方案2：使用Page Visibility API
      if (document.hidden === false) {
        // 尝试请求用户交互（不会真的显示）
        try {
          const tempInput = document.createElement('input')
          tempInput.style.position = 'absolute'
          tempInput.style.left = '-9999px'
          document.body.appendChild(tempInput)
          tempInput.focus()
          tempInput.blur()
          document.body.removeChild(tempInput)
        } catch (e) {
          // 忽略错误
        }
      }
    }, 20000) // 20秒间隔，更频繁的活动
    
    setIntervalId(id)
    
    // 方案3：使用NoSleep.js的思路 - 播放无声视频
    try {
      const noSleepVideo = document.createElement('video')
      noSleepVideo.setAttribute('playsinline', 'playsinline')
      noSleepVideo.setAttribute('muted', 'muted')
      noSleepVideo.setAttribute('title', 'No Sleep')
      noSleepVideo.setAttribute('style', 'position: fixed; top: -100%; left: 0; width: 1px; height: 1px;')
      
      // 使用base64编码的最小视频
      const base64Video = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAu1tZGF0AAACrQYF//+r3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTEgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MToweDExMSBtZT1oZXggc3VibWU9MiBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0wIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MCA4eDhkY3Q9MCBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0wIHRocmVhZHM9NiBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTMgYl9weXJhbWlkPTIgYl9hZGFwdD0xIGJfYmlhcz0wIGRpcmVjdD0xIHdlaWdodGI9MSBvcGVuX2dvcD0wIHdlaWdodHA9MSBrZXlpbnQ9MzAwIGtleWludF9taW49MjUgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD0xMCByYz1jcmYgbWJ0cmVlPTEgY3JmPTIwLjAgcWNvbXA9MC42MCBxcG1pbj0wIHFwbWF4PTY5IHFwc3RlcD00IHZidl9tYXhyYXRlPTIwMDAwIHZidl9idWZzaXplPTI1MDAwIGNyZl9tYXg9MC4wIG5hbF9ocmQ9bm9uZSBmaWxsZXI9MCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAABWWIhAAQ/8ltlOsNf+zalOMoQsEiho0wAQVAUM9bPxhgwlteXpld'
      noSleepVideo.src = base64Video
      noSleepVideo.loop = true
      
      document.body.appendChild(noSleepVideo)
      
      // 尝试播放视频
      const playPromise = noSleepVideo.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // 忽略自动播放错误
          console.log('无声视频自动播放失败，将在用户交互后重试')
        })
      }
      
      // 存储视频元素引用以便后续清理
      (window as any).__noSleepVideo = noSleepVideo
    } catch (e) {
      console.log('无声视频方案失败:', e)
    }
  }

  // 停止备用方案
  const stopFallbackKeepAwake = () => {
    if (intervalId) {
      clearInterval(intervalId)
      setIntervalId(null)
    }
    
    // 清理无声视频
    const noSleepVideo = (window as any).__noSleepVideo
    if (noSleepVideo) {
      noSleepVideo.pause()
      noSleepVideo.src = ''
      if (noSleepVideo.parentNode) {
        noSleepVideo.parentNode.removeChild(noSleepVideo)
      }
      delete (window as any).__noSleepVideo
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