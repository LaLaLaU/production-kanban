import { AlertOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons'
import {
    Button,
    Col,
    Divider,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Slider,
    Space,
    Switch,
    Typography,
    message
} from 'antd'
import React, { useEffect, useState } from 'react'
// import dayjs from 'dayjs' // 暂时不使用dayjs
import type { Task } from '../types'

const { Option } = Select
const { Text } = Typography

interface TaskEditModalProps {
  visible: boolean
  task: Task | null
  onCancel: () => void
  onSave: (updatedTask: Task) => void
}

// 17名师傅列表（包含待分配选项）
const MASTERS = [
  '待分配', '潘敏', '黄尚斌', '钱伟', '蒋怀东', '江峰', '谢守刚', '周博', '秦龙', '王章良',
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
      console.log('TaskEditModal - 任务数据:', task)
      console.log('TaskEditModal - 送达时间:', task.deliveryTime)
      
      // 转换时间格式以适配datetime-local输入框
      const formatForDatetimeLocal = (timeStr: string | undefined): string => {
        if (!timeStr) return ''
        try {
          // 尝试解析各种时间格式
          const date = new Date(timeStr)
          if (isNaN(date.getTime())) return ''
          
          // 转换为datetime-local需要的格式: YYYY-MM-DDTHH:mm
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          
          return `${year}-${month}-${day}T${hours}:${minutes}`
        } catch (error) {
          console.warn('时间格式转换失败:', timeStr, error)
          return ''
        }
      }
      
      form.setFieldsValue({
        productName: task.productName,
        productCode: task.productCode,
        masterName: task.masterName,
        workHours: task.workHours,
        batchNumber: task.batchNumber,
        clientName: task.clientName,
        commitTime: formatForDatetimeLocal(task.commitTime),
        isUrgent: task.priority >= 8, // 转换为布尔值
        status: task.status,
        coefficient: task.coefficient || 1,
        // 扩展字段
        processOrderId: task.processOrderId,
        factoryCode: task.factoryCode,
        orderDate: task.orderDate,
        deliveryTime: formatForDatetimeLocal(task.deliveryTime),
        quantity: task.quantity,
        assignedPerson: task.assignedPerson,
        assignedTeam: task.assignedTeam
      })
    }
  }, [visible, task, form])

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      if (!task) return

      // 转换datetime-local格式回标准时间格式
      const formatFromDatetimeLocal = (datetimeLocalStr: string | undefined): string => {
        if (!datetimeLocalStr) return ''
        try {
          // datetime-local格式: YYYY-MM-DDTHH:mm
          // 转换为标准格式: YYYY-MM-DD HH:mm:ss
          const date = new Date(datetimeLocalStr)
          if (isNaN(date.getTime())) return ''
          
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          const seconds = '00' // 默认秒数为00
          
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        } catch (error) {
          console.warn('时间格式转换失败:', datetimeLocalStr, error)
          return ''
        }
      }

      const updatedTask: Task = {
        ...task,
        productName: values.productName,
        productCode: values.productCode,
        masterName: values.masterName || '待分配',
        workHours: values.workHours,
        batchNumber: values.batchNumber,
        clientName: values.clientName,
        commitTime: formatFromDatetimeLocal(values.commitTime) || task.commitTime,
        priority: values.isUrgent ? 8 : 5, // 紧急为8，非紧急为5
        status: task.status, // 保持原始状态，因为表单中已经没有状态字段
        coefficient: values.coefficient || 1,
        // 扩展字段
        processOrderId: values.processOrderId,
        factoryCode: values.factoryCode,
        orderDate: values.orderDate,
        deliveryTime: formatFromDatetimeLocal(values.deliveryTime) || task.deliveryTime,
        quantity: values.quantity,
        assignedPerson: values.assignedPerson,
        assignedTeam: values.assignedTeam
      }

      console.log('保存任务数据:', updatedTask)
      console.log('转换后的送达时间:', updatedTask.deliveryTime)

      onSave(updatedTask)
      message.success('任务更新成功')
      onCancel()
    } catch {
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
    { label: '进行中', value: 'in-progress' },
    { label: '已完成', value: 'completed' }
  ]

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
      width={900}
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
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="productName"
              label="零件名称"
              rules={[{ required: true, message: '请输入零件名称' }]}
            >
              <Input placeholder="请输入零件名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="productCode"
              label="零件图号"
            >
              <Input placeholder="请输入零件图号（可选）" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="masterName"
              label={
                <Space>
                  <UserOutlined />
                  师傅姓名
                </Space>
              }
              rules={[{ required: true, message: '请选择师傅姓名' }]}
            >
              <Select
                placeholder="请选择负责师傅"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
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
          </Col>
          <Col span={12}>
            <Form.Item
              name="workHours"
              label={
                <Space>
                  <ClockCircleOutlined />
                  工时
                </Space>
              }
              rules={[
                { required: true, message: '请输入工时' },
                { type: 'number', min: 1, message: '工时必须大于0' }
              ]}
            >
              <InputNumber
                placeholder="请输入工时（分钟）"
                style={{ width: '100%' }}
                min={1}
                max={1000}
                addonAfter="分钟"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={
            <Space>
              <ClockCircleOutlined />
              工时系数
            </Space>
          }
          extra="调整实际工时难度，1.0表示标准工时，2.0表示双倍难度"
        >
          <Form.Item noStyle dependencies={['coefficient', 'workHours', 'quantity', 'isUrgent']}>
            {({ getFieldValue }) => {
              const currentCoefficient = getFieldValue('coefficient') || 1
              const currentWorkHours = getFieldValue('workHours') || 0
              const currentQuantity = getFieldValue('quantity') || 1
              const currentIsUrgent = getFieldValue('isUrgent') || false
              const adjustedWorkHours = currentWorkHours * currentCoefficient * currentQuantity
              const taskBarWidth = Math.max(60, Math.min(400, adjustedWorkHours * 1.5))
              const taskBarColor = currentIsUrgent ? '#ff4d4f' : '#52c41a'

              return (
                <div>
                  <Space style={{ width: '100%' }} direction="vertical" size={8}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>系数: <strong>{currentCoefficient.toFixed(1)}</strong></Text>
                      <Text type="secondary">
                        总工时: <strong>{adjustedWorkHours.toFixed(0)}分钟</strong>
                      </Text>
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
                      {currentWorkHours} × {currentQuantity} × {currentCoefficient.toFixed(1)} = {adjustedWorkHours.toFixed(0)}分钟
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

        <Form.Item
          name="isUrgent"
          label="紧急任务"
          valuePropName="checked"
        >
          <Switch
            checkedChildren="紧急"
            unCheckedChildren="普通"
          />
        </Form.Item>

        <Divider />

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="batchNumber"
              label="批次号"
              rules={[{ required: true, message: '请输入批次号' }]}
            >
              <Input placeholder="请输入批次号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="clientName"
              label="客户名称"
              rules={[{ required: true, message: '请输入客户名称' }]}
            >
              <Input placeholder="请输入客户名称" />
            </Form.Item>
          </Col>
        </Row>


        <Divider orientation="left">委托信息</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="processOrderId"
              label="委托加工单ID"
            >
              <Input placeholder="请输入委托加工单ID" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="factoryCode"
              label="工厂编号"
            >
              <Input placeholder="请输入工厂编号" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="commitTime"
              label="委托时间"
            >
              <Input
                style={{ width: '100%' }}
                placeholder="YYYY-MM-DD HH:mm:ss 格式"
                type="datetime-local"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="deliveryTime"
              label="送达时间"
            >
              <Input
                style={{ width: '100%' }}
                placeholder="YYYY-MM-DD HH:mm:ss 格式，如：2024-01-15 14:00:00"
                type="datetime-local"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="quantity"
              label="数量"
            >
              <InputNumber
                min={1}
                placeholder="请输入数量"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="assignedPerson"
              label="委托人"
            >
              <Input placeholder="请输入委托人" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="assignedTeam"
              label="委托班组"
            >
              <Input placeholder="请输入委托班组" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default TaskEditModal
