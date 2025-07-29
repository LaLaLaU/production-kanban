import React, { useMemo } from 'react'
import { Card, Row, Col, Statistic, Progress, Typography, Space, Divider } from 'antd'
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons'
import type { Task } from '../types'

const { Title, Text } = Typography

interface MasterStats {
  total: number
  pending: number
  'in-progress': number
  completed: number
  totalHours: number
}

interface StatsPanelProps {
  tasks: Task[]
}

const StatsPanel: React.FC<StatsPanelProps> = ({ tasks }) => {
  const stats = useMemo(() => {
    const totalTasks = tasks.length
    const pendingTasks = tasks.filter(t => t.status === 'pending').length
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
    const completedTasks = tasks.filter(t => t.status === 'completed').length

    const totalWorkHours = tasks.reduce((sum, task) => sum + (task.workHours * (task.coefficient || 1) * (task.quantity || 1)), 0)
    const completedWorkHours = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, task) => sum + (task.workHours * (task.coefficient || 1) * (task.quantity || 1)), 0)
    
    const progressPercentage = totalWorkHours > 0 ? (completedWorkHours / totalWorkHours) * 100 : 0

    const today = new Date().toISOString().split('T')[0]
    const todayCompleted = tasks.filter(t => 
      t.status === 'completed' && 
      new Date(t.commitTime).toISOString().split('T')[0] === today
    ).length

    const masterStats = tasks.reduce((acc, task) => {
      if (task.masterName && task.masterName !== '待分配') {
        if (!acc[task.masterName]) {
          acc[task.masterName] = {
            total: 0,
            completed: 0,
            'in-progress': 0,
            pending: 0,
            totalHours: 0
          }
        }
        acc[task.masterName].total++
        acc[task.masterName][task.status]++
        acc[task.masterName].totalHours += task.workHours * (task.coefficient || 1) * (task.quantity || 1)
      }
      return acc
    }, {} as Record<string, MasterStats>)

    return {
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      totalWorkHours,
      completedWorkHours,
      progressPercentage,
      todayCompleted,
      masterStats
    }
  }, [tasks])

  return (
    <Card title="生产统计" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="总任务数"
            value={stats.totalTasks}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="已完成"
            value={stats.completedTasks}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="进行中"
            value={stats.inProgressTasks}
            valueStyle={{ color: '#1890ff' }}
            prefix={<SyncOutlined spin />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="待处理"
            value={stats.pendingTasks}
            valueStyle={{ color: '#faad14' }}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
      </Row>

      <Divider />

      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="总工时"
            value={stats.totalWorkHours.toFixed(0)}
            suffix="分钟"
            prefix={<ClockCircleOutlined />}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="已完成工时"
            value={stats.completedWorkHours.toFixed(0)}
            suffix="分钟"
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={8}>
          <div>
            <Text type="secondary">完成进度</Text>
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={stats.progressPercentage}
                status={stats.progressPercentage === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
            </div>
          </div>
        </Col>
      </Row>

      <Divider />

      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="今日完成"
            value={stats.todayCompleted}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={18}>
          <Title level={5}>师傅工作量分布</Title>
          {Object.entries(stats.masterStats).map(([master, data]: [string, MasterStats]) => (
            <div key={master} style={{ marginBottom: 8 }}>
              <Row align="middle">
                <Col span={6}>
                  <Space>
                    <UserOutlined />
                    <Text strong>{master}</Text>
                  </Space>
                </Col>
                <Col span={12}>
                  <Progress
                    percent={(data.completed / data.total) * 100}
                    size="small"
                    strokeColor="#52c41a"
                    format={() => `${data.completed}/${data.total}`}
                  />
                </Col>
                <Col span={6}>
                  <Text type="secondary">
                    {data.totalHours.toFixed(0)}分钟
                  </Text>
                </Col>
              </Row>
            </div>
          ))}
        </Col>
      </Row>
    </Card>
  )
}

export default StatsPanel