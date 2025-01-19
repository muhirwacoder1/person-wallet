'use client'

import React from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/utils/formatters'
import { CategoryLimit } from '@/types/transaction'

interface NotificationDropdownProps {
  totalIncome: number
  totalExpenses: number
  budgets: CategoryLimit[]
}

export function NotificationDropdown({ totalIncome, totalExpenses, budgets }: NotificationDropdownProps) {
  const spendingPercentage = (totalExpenses / totalIncome) * 100

  const getNotifications = () => {
    const notifications: Array<{
      id: string
      icon: string
      message: string
      severity: 'critical' | 'high' | 'medium' | 'low'
    }> = []

    // Overall spending notifications
    if (spendingPercentage >= 100) {
      notifications.push({
        id: 'exceed-100',
        icon: '🚨',
        message: `Warning: Your expenses (${formatCurrency(totalExpenses)}) have exceeded your income (${formatCurrency(totalIncome)})`,
        severity: 'critical'
      })
    } else if (spendingPercentage >= 80) {
      notifications.push({
        id: 'exceed-80',
        icon: '⚠️',
        message: `Alert: Your expenses are at ${spendingPercentage.toFixed(1)}% of your income`,
        severity: 'high'
      })
    } else if (spendingPercentage >= 70) {
      notifications.push({
        id: 'exceed-70',
        icon: '⚠️',
        message: `Notice: Your expenses have reached ${spendingPercentage.toFixed(1)}% of your income`,
        severity: 'medium'
      })
    }

    // Budget-specific notifications
    budgets.forEach(budget => {
      const percentage = (budget.spent / budget.limit) * 100
      if (percentage >= 100) {
        notifications.push({
          id: `budget-exceed-${budget.category}`,
          icon: '💸',
          message: `Budget Alert: Your ${budget.category} spending (${formatCurrency(budget.spent)}) has exceeded the budget limit (${formatCurrency(budget.limit)})`,
          severity: 'critical'
        })
      } else if (percentage >= 80) {
        notifications.push({
          id: `budget-warning-${budget.category}`,
          icon: '📊',
          message: `Budget Warning: Your ${budget.category} spending is at ${percentage.toFixed(1)}% of the budget`,
          severity: 'high'
        })
      }
    })

    return notifications
  }

  const notifications = getNotifications()
  const hasNotifications = notifications.length > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={`relative hover:bg-primary/10 transition-colors ${
            hasNotifications ? 'animate-pulse' : ''
          }`}
        >
          <Bell className={`h-5 w-5 ${hasNotifications ? 'text-primary' : ''}`} />
          {hasNotifications && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-medium text-white ring-2 ring-background animate-bounce">
              {notifications.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[400px] p-2 backdrop-blur-sm"
      >
        {notifications.length > 0 ? (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 rounded-lg p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                  notification.severity === 'critical' 
                    ? 'bg-red-50/50 dark:bg-red-950/50 hover:bg-red-100/50 dark:hover:bg-red-900/50' 
                    : notification.severity === 'high'
                    ? 'bg-orange-50/50 dark:bg-orange-950/50 hover:bg-orange-100/50 dark:hover:bg-orange-900/50'
                    : notification.severity === 'medium'
                    ? 'bg-yellow-50/50 dark:bg-yellow-950/50 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/50'
                    : ''
                }`}
              >
                <span className="text-2xl mt-0.5">{notification.icon}</span>
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-tight">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`inline-block h-2 w-2 rounded-full ${
                      notification.severity === 'critical' 
                        ? 'bg-red-500' 
                        : notification.severity === 'high'
                        ? 'bg-orange-500'
                        : 'bg-yellow-500'
                    }`} />
                    {notification.severity === 'critical' 
                      ? 'Critical Alert'
                      : notification.severity === 'high'
                      ? 'High Priority'
                      : 'Medium Priority'
                    }
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <span className="text-4xl mb-3 block">✨</span>
            <p className="text-sm text-muted-foreground">
              You're all caught up!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No new notifications
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

