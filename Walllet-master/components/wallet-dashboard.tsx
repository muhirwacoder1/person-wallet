'use client'

import React, { useState, useEffect } from 'react'
import { Transaction, CategoryLimit } from '@/types/transaction'
import { UserProfile } from '@/types/user'
import { TransactionCard } from './transaction-card'
import { SpendingChart } from './spending-chart'
import { SpendingPieChart } from './spending-pie-chart'
import { AddTransactionForm } from './add-transaction-form'
import { ThemeToggle } from './theme-toggle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bell, Wallet, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationDropdown } from './notification-dropdown'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from './date-range-picker'
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { expenseCategories } from '@/utils/categories'
import { Progress } from '@/components/ui/progress'
import { storage } from '@/lib/storage'

const sampleUserProfile: UserProfile = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  photoUrl: '/avatar.png',
}

const WalletDashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [userProfile] = useState<UserProfile>(sampleUserProfile)
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week')
  const [reportStartDate, setReportStartDate] = useState<Date>()
  const [reportEndDate, setReportEndDate] = useState<Date>()
  const [budgets, setBudgets] = useState<CategoryLimit[]>([])
  const [newBudget, setNewBudget] = useState({ category: '', limit: 0 })
  const { toast } = useToast()

  // Refresh data function
  const refreshData = () => {
    try {
      // Get current balance
      const currentBalance = storage.balance.get()
      setBalance(currentBalance)

      // Get transactions
      const allTransactions = storage.transactions.getAll()
      setTransactions(allTransactions)

      // Get budget tracking data
      const budgetData = storage.budgets.getAll()
      const trackingData = storage.budgets.getBudgetTracking()
      
      setBudgets(budgetData.map(b => ({
        category: b.category,
        limit: b.budget_limit,
        spent: trackingData.find(t => t.category === b.category)?.spent || 0
      })))
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast({
        title: "Error refreshing data",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  // Load initial data
  useEffect(() => {
    refreshData()
    setLoading(false)
  }, [])

  const handleAddTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    try {
      console.log('Adding transaction:', newTransaction)
      
      // Add the transaction
      const transaction = storage.transactions.add(newTransaction)
      console.log('Transaction added:', transaction)

      // Refresh all data
      refreshData()

      toast({
        title: `${newTransaction.type === 'income' ? 'Income' : 'Expense'} Added`,
        description: `${formatCurrency(newTransaction.amount)} has been ${newTransaction.type === 'income' ? 'added to' : 'deducted from'} your balance`,
      })
    } catch (error) {
      console.error('Error details:', error)
      toast({
        title: "Error adding transaction",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleAddBudget = () => {
    if (!newBudget.category || newBudget.limit <= 0) {
      toast({
        title: "Invalid Budget",
        description: "Please select a category and enter a valid limit",
        variant: "destructive",
      })
      return
    }

    try {
      storage.budgets.add({
        category: newBudget.category,
        budget_limit: newBudget.limit,
        period: 'monthly'
      })

      // Refresh budgets data
      refreshData()
      
      // Reset form
      setNewBudget({ category: '', limit: 0 })
      
      toast({
        title: "Budget Added",
        description: `New budget created for ${newBudget.category}`,
      })
    } catch (error) {
      console.error('Error adding budget:', error)
      toast({
        title: "Error adding budget",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBudget = (category: string) => {
    try {
      storage.budgets.delete(category)
      refreshData()
      
      toast({
        title: "Budget Deleted",
        description: `Budget for ${category} has been removed`,
      })
    } catch (error) {
      console.error('Error deleting budget:', error)
      toast({
        title: "Error deleting budget",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const filteredTransactions = transactions.filter(transaction => {
    if (!reportStartDate || !reportEndDate) return true
    
    const transactionDate = startOfDay(new Date(transaction.date))
    return isWithinInterval(transactionDate, {
      start: startOfDay(reportStartDate),
      end: endOfDay(reportEndDate)
    })
  })

  const reportIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const reportExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 dark:from-background dark:to-background/90">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8 bg-card rounded-xl p-6 shadow-sm border border-border/50">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <img src="/logo.svg" alt="Wallet Logo" className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">My Wallet</h1>
              <p className="text-muted-foreground">Track your spending and savings</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <NotificationDropdown 
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              budgets={budgets}
            />
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage src={userProfile.photoUrl} alt={userProfile.name} />
              <AvatarFallback className="bg-primary/10 text-primary">{userProfile.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-card hover:shadow-lg transition-all duration-200 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold tracking-tight">{formatCurrency(balance)}</span>
            </CardContent>
          </Card>
          <Card className="bg-card hover:shadow-lg transition-all duration-200 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="text-lg">💸</span>
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold tracking-tight text-green-500 dark:text-green-400">
                {formatCurrency(totalIncome)}
              </span>
            </CardContent>
          </Card>
          <Card className="bg-card hover:shadow-lg transition-all duration-200 border-border/50">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="text-lg">💳</span>
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold tracking-tight text-red-500 dark:text-red-400">
                {formatCurrency(totalExpenses)}
              </span>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="income" className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-5 w-[800px] p-1 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="income" className="data-[state=active]:bg-background data-[state=active]:text-primary">
                <span className="text-xl mr-2">💸</span>
                Income
              </TabsTrigger>
              <TabsTrigger value="expenses" className="data-[state=active]:bg-background data-[state=active]:text-primary">
                <span className="text-xl mr-2">💳</span>
                Expenses
              </TabsTrigger>
              <TabsTrigger value="analysis" className="data-[state=active]:bg-background data-[state=active]:text-primary">
                <span className="text-xl mr-2">📊</span>
                Analysis
              </TabsTrigger>
              <TabsTrigger value="budget" className="data-[state=active]:bg-background data-[state=active]:text-primary">
                <span className="text-xl mr-2">💰</span>
                Budget
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-background data-[state=active]:text-primary">
                <span className="text-xl mr-2">📋</span>
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="income">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddTransactionForm 
                    onAddTransaction={handleAddTransaction} 
                    defaultType="income"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Income History</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions
                    .filter((t) => t.type === 'income')
                    .map((transaction) => (
                      <TransactionCard key={transaction.id} transaction={transaction} />
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Expense</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddTransactionForm 
                    onAddTransaction={handleAddTransaction} 
                    defaultType="expense"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expense History</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions
                    .filter((t) => t.type === 'expense')
                    .map((transaction) => (
                      <TransactionCard key={transaction.id} transaction={transaction} />
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Spending Trends</CardTitle>
                  <Select
                    value={timeframe}
                    onValueChange={(value: 'week' | 'month' | 'year') => setTimeframe(value)}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent>
                  <SpendingChart 
                    transactions={transactions}
                    timeframe={timeframe}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <SpendingPieChart transactions={transactions} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="budget">
            <div className="grid gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    Budget Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="text-xl">✨</span>
                      Add/Update Budget
                    </h3>
                    <div className="flex gap-4">
                      <Select
                        value={newBudget.category}
                        onValueChange={(value) => setNewBudget(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="w-[250px] bg-background">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((category) => (
                            <SelectItem 
                              key={category.value} 
                              value={category.value}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xl">{category.icon}</span>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input
                        type="number"
                        value={newBudget.limit}
                        onChange={(e) => setNewBudget(prev => ({ ...prev, limit: parseFloat(e.target.value) || 0 }))}
                        className="flex h-10 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus:ring-2 focus:ring-ring"
                        placeholder="Enter budget limit"
                      />
                      <Button 
                        onClick={handleAddBudget}
                        className="min-w-[120px] bg-primary hover:bg-primary/90"
                      >
                        <span className="text-lg mr-2">➕</span>
                        Add Budget
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 text-lg">
                      <span className="text-xl">📊</span>
                      Current Budgets
                    </h3>
                    <div className="grid gap-4">
                      {budgets.map((budget) => {
                        const category = expenseCategories.find(c => c.value === budget.category)
                        const percentage = (budget.spent / budget.limit) * 100
                        const status = percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'normal'

                        return (
                          <div
                            key={budget.category}
                            className={`rounded-lg border p-6 transition-all duration-200 hover:shadow-md ${
                              status === 'exceeded'
                                ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/50'
                                : status === 'warning'
                                ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/50 dark:bg-yellow-950/50'
                                : 'border-border/50 bg-card'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div>
                                  <span className="font-medium text-lg">{category?.label}</span>
                                  <div className="text-sm text-muted-foreground">
                                    {percentage >= 100 ? 'Budget exceeded' : 
                                     percentage >= 80 ? 'Approaching limit' : 
                                     'Within budget'}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => handleDeleteBudget(budget.category)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm font-medium">
                                <span>Spent: {formatCurrency(budget.spent)}</span>
                                <span>Limit: {formatCurrency(budget.limit)}</span>
                              </div>
                              <div className="h-2.5 rounded-full bg-muted/50">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    status === 'exceeded'
                                      ? 'bg-red-500'
                                      : status === 'warning'
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                              <div className="text-sm text-right font-medium">
                                {percentage.toFixed(1)}% used
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {budgets.length === 0 && (
                        <div className="text-center py-12 bg-muted/30 rounded-lg">
                          <span className="text-4xl mb-4 block">💫</span>
                          <p className="text-muted-foreground">
                            No budgets set yet. Add a budget to start tracking your spending!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <DateRangePicker
                    startDate={reportStartDate}
                    endDate={reportEndDate}
                    onStartDateChange={setReportStartDate}
                    onEndDateChange={setReportEndDate}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="text-sm font-medium text-gray-500">Period Income</div>
                      <div className="text-2xl font-bold text-green-500">
                        {formatCurrency(reportIncome)}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm font-medium text-gray-500">Period Expenses</div>
                      <div className="text-2xl font-bold text-red-500">
                        {formatCurrency(reportExpenses)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Transactions in Period</h3>
                    {filteredTransactions.length === 0 ? (
                      <p className="text-sm text-gray-500">No transactions found in the selected period.</p>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TransactionCard key={transaction.id} transaction={transaction} />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default WalletDashboard 