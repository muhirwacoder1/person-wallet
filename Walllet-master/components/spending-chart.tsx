'use client'

import { Transaction } from '@/types/transaction'
import { formatCurrency } from '@/utils/formatters'
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, subYears } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'

interface SpendingChartProps {
  transactions: Transaction[]
  timeframe: 'week' | 'month' | 'year'
}

export function SpendingChart({ transactions, timeframe }: SpendingChartProps) {
  // Get date range based on timeframe
  const getDateRange = () => {
    const now = new Date()
    switch (timeframe) {
      case 'week':
        return Array.from({ length: 7 }, (_, i) => subDays(now, 6 - i))
      case 'month':
        const start = startOfMonth(now)
        const end = endOfMonth(now)
        const days = []
        for (let d = start; d <= end; d = new Date(d.setDate(d.getDate() + 1))) {
          days.push(new Date(d))
        }
        return days
      case 'year':
        return Array.from({ length: 12 }, (_, i) => subMonths(now, 11 - i))
    }
  }

  // Format data for the chart
  const chartData = getDateRange().map(date => {
    const dayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date)
      switch (timeframe) {
        case 'week':
          return format(transactionDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        case 'month':
          return format(transactionDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        case 'year':
          return format(transactionDate, 'yyyy-MM') === format(date, 'yyyy-MM')
      }
    })

    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      date: timeframe === 'year' 
        ? format(date, 'MMM')
        : format(date, 'd MMM'),
      income,
      expense,
      balance: income - expense
    }
  })

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-4 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-sm text-green-500">
            Income: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-red-500">
            Expense: {formatCurrency(Math.abs(payload[1].value))}
          </p>
          <p className="text-sm font-medium mt-1">
            Balance: {formatCurrency(payload[2].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            className="text-xs text-muted-foreground"
            tickMargin={10}
          />
          <YAxis 
            className="text-xs text-muted-foreground"
            tickFormatter={(value) => formatCurrency(value)}
            tickMargin={10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            className="text-sm"
          />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#22c55e"
            fill="url(#colorIncome)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Expense"
            stroke="#ef4444"
            fill="url(#colorExpense)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="balance"
            name="Balance"
            stroke="#3b82f6"
            fill="url(#colorBalance)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

