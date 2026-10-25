import type { Meal, Order } from '../types'

export const demoMeals: Meal[] = [
  { id: 'm1', name: 'Jollof rice & chicken', description: 'Smoky party jollof with a piece of chicken', price: 2500, category: 'Meals', available: true, emoji: '🍛' },
  { id: 'm2', name: 'Beans & plantain', description: 'Beans porridge served with fried plantain', price: 1800, category: 'Meals', available: true, emoji: '🍲' },
  { id: 'm3', name: 'Fried rice & turkey', description: 'Vegetable fried rice with turkey', price: 3000, category: 'Meals', available: true, emoji: '🍚' },
  { id: 'm4', name: 'Chicken sandwich', description: 'Toasted sandwich with chicken filling', price: 1500, category: 'Snacks', available: true, emoji: '🥪' },
  { id: 'm5', name: 'Meat pie', description: 'Freshly baked meat pie', price: 700, category: 'Snacks', available: true, emoji: '🥟' },
  { id: 'm6', name: 'Water', description: 'Chilled bottled water', price: 300, category: 'Drinks', available: true, emoji: '💧' }
]

export const demoOrders: Order[] = [
  {
    id: 'order-1',
    code: 'CB-482915',
    studentName: 'Daniel T.',
    items: [{ name: 'Jollof rice & chicken', quantity: 1, price: 2500 }],
    total: 2500,
    status: 'paid',
    createdAt: new Date().toISOString()
  },
  {
    id: 'order-2',
    code: 'CB-731064',
    studentName: 'Amara O.',
    items: [{ name: 'Beans & plantain', quantity: 1, price: 1800 }, { name: 'Water', quantity: 1, price: 300 }],
    total: 2100,
    status: 'ready',
    createdAt: new Date(Date.now() - 18 * 60000).toISOString()
  }
]
