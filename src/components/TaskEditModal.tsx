import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Space,
  message,
  Divider,
  Slider,
  Typography
} from 'antd'
import { UserOutlined, ClockCircleOutlined, CalendarOutlined, AlertOutlined } from '@ant-design/icons'
// import dayjs from 'dayjs' // 暂时不使用dayjs
import type { Task } from '../types'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

interface TaskEditModalProps {
  visible: boolean
  task: Task | null
  onCancel: () => void
  onSave: (updatedTask: Task) => void
}

// 17名师傅列表
const MASTERS = [
  '潘敏', '黄尚斌', '钱伟', '蒋怀东', '江峰', '谢守刚', '周博', '秦龙', '王章良',
  '叶佩珺', '李雪', '昂洪涛', '刘庆', '王家龙', '叶建辉', '魏祯', '杨同'
]

const TaskEditModal: React.FC<TaskEditModalProps> = ({
  visible,
  task,
  onCancel,
  onSave
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && task) {
      form.setFieldsValue({
        productName: task.productName,
        masterName: task.masterName,
        workHours: task.workHours,
        batchNumber: task.batchNumber,
        clientName: task.clientName,
        commitTime: task.commitTime,
        priority: task.priority,
        status: task.status,
        coefficient: task.coefficient || 1
      })
    }
  }, [visible, task, form])

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()
      
      if (!task) return

      const updatedTask: Task = {
        ...task,
        productName: values.productName,
        masterName: values.masterName || '待分配',
        workHours: values.workHours,
        batchNumber: values.batchNumber,
        clientName: values.clientName,
        commitTime: values.commitTime || task.commitTime,
        priority: values.priority,
        status: values.status,
        coefficient: values.coefficient || 1
      }

      onSave(updatedTask)
      message.success('任务更新成功')
      onCancel()
    } catch (error) {
      message.error('请完善必填信息')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  const getStatusOptions = () => [
    { label: '待处理', value: 'pending' },
    { label: '进行中', value: 'inProgress' },
    { label: '已完成', value: 'completed' }
  ]

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return '#ff4d4f'
    if (priority >= 5) return '#faad14'
    return '#52c41a'
  }

  return (
    <Modal
      title={
        <Space>
          <AlertOutlined />
          编辑任务
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          保存
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="productName"
          label="产品名称"
          rules={[{ required: true, message: '请输入产品名称' }]}
        >
          <Input placeholder="请输入产品名称" />
        </Form.Item>

        <Form.Item
          name="productCode"
          label="产品图号"
        >
          <Input placeholder="请输入产品图号（可选）" />
        </Form.Item>

        <Form.Item
          name="masterName"
          label={
            <Space>
              <UserOutlined />
              负责师傅
            </Space>
          }
          rules={[{ required: true, message: '请选择负责师傅' }]}
        >
          <Select
            placeholder="请选择负责师傅"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="待分配">
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>待分配</span>
            </Option>
            {MASTERS.map(master => (
              <Option key={master} value={master}>
                {master}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="workHours"
          label={
            <Space>
              <ClockCircleOutlined />
              预计工时（分钟）
            </Space>
          }
          rules={[
            { required: true, message: '请输入预计工时' },
            { type: 'number', min: 1, message: '工时必须大于0' }
          ]}
        >
          <InputNumber
            placeholder="请输入工时"
            style={{ width: '100%' }}
            min={1}
            max={1000}
            addonAfter="分钟"
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <ClockCircleOutlined />
              工时系数
            </Space>
          }
          extra="调整实际工时难度，1.0表示标准工时，2.0表示双倍难度"
        >
          <Form.Item noStyle dependencies={['coefficient', 'workHours', 'priority']}>
            {({ getFieldValue }) => {
              const currentCoefficient = getFieldValue('coefficient') || 1
              const currentWorkHours = getFieldValue('workHours') || 0
              const currentPriority = getFieldValue('priority') || 1
              const adjustedWorkHours = currentWorkHours * currentCoefficient
              const taskBarWidth = Math.max(60, Math.min(400, adjustedWorkHours * 1.5))
              const taskBarColor = currentPriority >= 8 ? '#ff4d4f' : currentPriority >= 5 ? '#faad14' : '#52c41a'
              
              return (
                <div>
                  <Space style={{ width: '100%' }} direction="vertical" size={8}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>系数: <strong>{currentCoefficient.toFixed(1)}</strong></Text>
                      <Text type="secondary">
                        实际工时: <strong>{adjustedWorkHours.toFixed(0)}分钟</strong>
                      </Text>
                    </div>
                    <Form.Item name="coefficient" noStyle>
                      <Slider
                        min={0.1}
                        max={2.0}
                        step={0.1}
                        value={currentCoefficient}
                        marks={{
                          0.1: '0.1',
                          0.5: '0.5',
                          1.0: '1.0',
                          1.5: '1.5',
                          2.0: '2.0'
                        }}
                        tooltip={{ formatter: (value) => `${value}x` }}
                      />
                    </Form.Item>
                    {/* 任务条预览 */}
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>任务条预览:</Text>
                      <div style={{ 
                        marginTop: 4, 
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px'
                      }}>
                        <div
                          style={{
                            width: `${taskBarWidth}px`,
                            height: '28px',
                            backgroundColor: taskBarColor,
                            borderRadius: '4px',
                            position: 'relative',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            display: 'inline-block'
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: '2px',
                              left: '4px',
                              color: 'white',
                              fontSize: taskBarWidth < 100 ? '8px' : '9px',
                              fontWeight: 'bold',
                              textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
                              lineHeight: '1.2'
                            }}
                          >
                            <div>{task?.productName || '产品名称'}</div>
                            <div style={{ 
                              fontSize: taskBarWidth < 100 ? '7px' : '8px', 
                              opacity: 0.9,
                              fontWeight: 'normal'
                            }}>
                              {adjustedWorkHours.toFixed(0)}分钟
                            </div>
                          </div>
                        </div>
                        <Text type="secondary" style={{ fontSize: '11px', marginLeft: 8 }}>
                          长度: {taskBarWidth}px
                        </Text>
                      </div>
                    </div>
                  </Space>
                </div>
              )
            }}
          </Form.Item>
        </Form.Item>

        <Space.Compact style={{ display: 'flex', width: '100%' }}>
          <Form.Item
            name="priority"
            label="优先级"
            style={{ flex: 1, marginRight: 16 }}
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="选择优先级">
              <Option value={1}>
                <Space>
                  <div style={{ width: 12, height: 12, backgroundColor: '#52c41a', borderRadius: 2 }} />
                  1 - 低优先级
                </Space>
              </Option>
              <Option value={3}>
                <Space>
                  <div style={{ width: 12, height: 12, backgroundColor: '#52c41a', borderRadius: 2 }} />
                  3 - 一般
                </Space>
              </Option>
              <Option value={5}>
                <Space>
                  <div style={{ width: 12, height: 12, backgroundColor: '#faad14', borderRadius: 2 }} />
                  5 - 重要
                </Space>
              </Option>
              <Option value={7}>
                <Space>
                  <div style={{ width: 12, height: 12, backgroundColor: '#faad14', borderRadius: 2 }} />
                  7 - 很重要
                </Space>
              </Option>
              <Option value={8}>
                <Space>
                  <div style={{ width: 12, height: 12, backgroundColor: '#ff4d4f', borderRadius: 2 }} />
                  8 - 紧急
                </Space>
              </Option>
              <Option value={10}>
                <Space>
                  <div style={{ width: 12, height: 12, backgroundColor: '#ff4d4f', borderRadius: 2 }} />
                  10 - 极紧急
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="任务状态"
            style={{ flex: 1 }}
            rules={[{ required: true, message: '请选择任务状态' }]}
          >
            <Select placeholder="选择状态">
              {getStatusOptions().map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Space.Compact>

        <Divider />

        <Form.Item
          name="batchNumber"
          label="架次号"
          rules={[{ required: true, message: '请输入架次号' }]}
        >
          <Input placeholder="请输入架次号" />
        </Form.Item>

        <Form.Item
          name="clientName"
          label="委托方"
          rules={[{ required: true, message: '请输入委托方' }]}
        >
          <Input placeholder="请输入委托方名称" />
        </Form.Item>

        <Form.Item
          name="commitTime"
          label={
            <Space>
              <CalendarOutlined />
              委托时间
            </Space>
          }
          rules={[{ required: true, message: '请选择委托时间' }]}
        >
          <Input
            style={{ width: '100%' }}
            placeholder="YYYY-MM-DD 格式，如：2024-01-15"
            type="date"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default TaskEditModal 