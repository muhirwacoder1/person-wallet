export const incomeCategories = [
  { value: 'salary', label: 'Salary', icon: '💰' },
  { value: 'freelance', label: 'Freelance', icon: '💼' },
  { value: 'investments', label: 'Investments', icon: '📈' },
  { value: 'gifts', label: 'Gifts', icon: '🎁' },
  { value: 'other_income', label: 'Other Income', icon: '💵' },
];

export const expenseCategories = [
  { value: 'food', label: 'Food & Dining', icon: '🍽️' },
  { value: 'transportation', label: 'Transportation', icon: '🚗' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'bills', label: 'Bills & Utilities', icon: '📱' },
  { value: 'housing', label: 'Housing', icon: '🏠' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'other_expenses', label: 'Other Expenses', icon: '📝' },
];

export const paymentMethods = [
  { value: 'cash', label: '💵 Cash', icon: '💵' },
  { value: 'card', label: '💳 Card', icon: '💳' },
  { value: 'bank', label: '🏦 Bank Transfer', icon: '🏦' },
  { value: 'mobile', label: '📱 Mobile Payment', icon: '📱' },
] as const

export type Category = typeof incomeCategories[number]['value'] | typeof expenseCategories[number]['value']
export type PaymentMethod = typeof paymentMethods[number]['value']

export function getCategoryIcon(category: Category, type: 'income' | 'expense'): string {
  const categories = type === 'income' ? incomeCategories : expenseCategories
  return categories.find(c => c.value === category)?.icon || '✨'
}

export function getPaymentMethodIcon(method: PaymentMethod): string {
  return paymentMethods.find(m => m.value === method)?.icon || '💳'
} 