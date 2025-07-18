import { FontSizeOutlined } from '@ant-design/icons'
import { Button, Dropdown, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import React, { useEffect, useState } from 'react'

const { Text } = Typography

// 字体大小选项
const FONT_SIZE_OPTIONS = [
  { key: 'small', label: '小号字体', scale: 0.85 },
  { key: 'normal', label: '标准字体', scale: 1.0 },
  { key: 'large', label: '大号字体', scale: 1.15 },
  { key: 'xlarge', label: '超大字体', scale: 1.3 },
  { key: 'xxlarge', label: '巨大字体', scale: 1.5 }
]

const STORAGE_KEY = 'kanban-font-size'

interface FontSizeSettingsProps {
  className?: string
}

const FontSizeSettings: React.FC<FontSizeSettingsProps> = ({ className }) => {
  const [currentSize, setCurrentSize] = useState('normal')

  // 从localStorage加载字体大小设置
  useEffect(() => {
    const savedSize = localStorage.getItem(STORAGE_KEY)
    if (savedSize && FONT_SIZE_OPTIONS.find(opt => opt.key === savedSize)) {
      setCurrentSize(savedSize)
      applyFontSize(savedSize)
    }
  }, [])

  // 应用字体大小到根元素
  const applyFontSize = (sizeKey: string) => {
    const option = FONT_SIZE_OPTIONS.find(opt => opt.key === sizeKey)
    if (option) {
      const root = document.documentElement
      root.style.setProperty('--font-scale', option.scale.toString())
      
      // 应用到body的基础字体大小
      document.body.style.fontSize = `${14 * option.scale}px`
      
      // 为大屏幕优化：调整整体缩放
      if (option.scale >= 1.3) {
        root.style.setProperty('--content-scale', (option.scale * 0.9).toString())
      } else {
        root.style.setProperty('--content-scale', '1')
      }
    }
  }

  // 处理字体大小变更
  const handleFontSizeChange = (sizeKey: string) => {
    setCurrentSize(sizeKey)
    applyFontSize(sizeKey)
    localStorage.setItem(STORAGE_KEY, sizeKey)
    
    const option = FONT_SIZE_OPTIONS.find(opt => opt.key === sizeKey)
    if (option) {
      // 显示提示信息
      const event = new CustomEvent('fontSizeChanged', {
        detail: { size: sizeKey, label: option.label, scale: option.scale }
      })
      window.dispatchEvent(event)
    }
  }

  // 构建下拉菜单项
  const menuItems: MenuProps['items'] = FONT_SIZE_OPTIONS.map(option => ({
    key: option.key,
    label: (
      <Space>
        <span style={{ 
          fontSize: `${14 * option.scale}px`,
          fontWeight: currentSize === option.key ? 'bold' : 'normal',
          color: currentSize === option.key ? '#1890ff' : 'inherit'
        }}>
          {option.label}
        </span>
        {currentSize === option.key && (
          <Text type="success" style={{ fontSize: '12px' }}>✓</Text>
        )}
      </Space>
    ),
    onClick: () => handleFontSizeChange(option.key)
  }))

  const currentOption = FONT_SIZE_OPTIONS.find(opt => opt.key === currentSize)

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      trigger={['click']}
      className={className}
    >
      <Button 
        icon={<FontSizeOutlined />}
        title="调整字体大小"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span style={{ fontSize: '12px' }}>
          {currentOption?.label || '标准字体'}
        </span>
      </Button>
    </Dropdown>
  )
}

export default FontSizeSettings