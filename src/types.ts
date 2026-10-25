export type Role = 'student' | 'cafeteria' | 'admin'
export type OrderStatus = 'paid' | 'preparing' | 'ready' | 'collected'

export type Meal = {
  id: string
  name: string
  description: string
  price: number
  category: string
  available: boolean
  emoji: string
}

export type Order = {
  id: string
  code: string
  receiptNumber?: string
  paymentReference?: string
  studentId?: string
  studentName: string
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: OrderStatus
  createdAt: string
}
