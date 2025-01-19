import { Transaction, Budget } from '@/types/transaction'

const STORAGE_KEYS = {
  TRANSACTIONS: 'wallet_transactions',
  BUDGETS: 'wallet_budgets',
  BALANCE: 'wallet_balance'
} as const;

// Helper to safely parse JSON from localStorage
const safelyParseJSON = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export const storage = {
  balance: {
    get(): number {
      return safelyParseJSON<number>(STORAGE_KEYS.BALANCE, 0)
    },
    set(amount: number) {
      localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(amount))
    },
    update(amount: number, type: 'income' | 'expense') {
      const currentBalance = this.get()
      const newBalance = type === 'income' 
        ? currentBalance + amount 
        : currentBalance - amount
      this.set(newBalance)
      return newBalance
    }
  },
  transactions: {
    getAll(): Transaction[] {
      return safelyParseJSON<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, [])
    },
    add(transaction: Omit<Transaction, 'id'>) {
      const transactions = this.getAll()
      const newTransaction = {
        ...transaction,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      }
      transactions.unshift(newTransaction) // Add to start of array
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions))
      
      // Update balance
      storage.balance.update(transaction.amount, transaction.type)
      
      return newTransaction
    },
    getByType(type: 'income' | 'expense'): Transaction[] {
      return this.getAll().filter(t => t.type === type)
    },
    getRecentTransactions(limit = 5): Transaction[] {
      return this.getAll().slice(0, limit)
    },
    getMonthlyTotals() {
      const transactions = this.getAll()
      const monthlyTotals = new Map<string, { income: number; expense: number }>()

      transactions.forEach(transaction => {
        const month = new Date(transaction.date).toISOString().slice(0, 7) // YYYY-MM
        const current = monthlyTotals.get(month) || { income: 0, expense: 0 }
        
        if (transaction.type === 'income') {
          current.income += transaction.amount
        } else {
          current.expense += transaction.amount
        }
        
        monthlyTotals.set(month, current)
      })

      return Array.from(monthlyTotals.entries()).map(([month, totals]) => ({
        month: new Date(month + '-01'), // Convert to date object
        total_income: totals.income,
        total_expenses: totals.expense,
        net_amount: totals.income - totals.expense
      }))
    }
  },
  budgets: {
    getAll(): Budget[] {
      return safelyParseJSON<Budget[]>(STORAGE_KEYS.BUDGETS, [])
    },
    add(budget: Omit<Budget, 'id'>) {
      const budgets = this.getAll()
      // Check if budget for this category already exists
      const existingIndex = budgets.findIndex(b => b.category === budget.category)
      
      const newBudget = {
        ...budget,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        // Update existing budget
        budgets[existingIndex] = newBudget
      } else {
        // Add new budget
        budgets.push(newBudget)
      }

      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets))
      return newBudget
    },
    delete(category: string) {
      const budgets = this.getAll().filter(b => b.category !== category)
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets))
    },
    getBudgetTracking() {
      const budgets = this.getAll()
      const transactions = storage.transactions.getAll()
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

      return budgets.map(budget => {
        const spent = transactions
          .filter(t => 
            t.type === 'expense' && 
            t.category === budget.category &&
            t.date.slice(0, 7) === currentMonth
          )
          .reduce((sum, t) => sum + t.amount, 0)

        return {
          category: budget.category,
          spent,
          remaining: budget.budget_limit - spent,
          percentage: (spent / budget.budget_limit) * 100
        }
      })
    }
  }
}; 