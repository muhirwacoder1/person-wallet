'use client'

import { Transaction } from '@/types/transaction'
import { formatCurrency } from '@/utils/formatters'
import { format } from 'date-fns'
import { getCategoryIcon } from '@/utils/categories'

interface TransactionCardProps {
  transaction: Transaction
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border mb-2 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${
          transaction.type === 'income' 
            ? 'bg-green-500/10 text-green-500' 
            : 'bg-red-500/10 text-red-500'
        }`}>
          {getCategoryIcon(transaction.category, transaction.type)}
        </div>
        <div>
          <h3 className="font-medium">{transaction.description}</h3>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              {transaction.payment_method.charAt(0).toUpperCase() + transaction.payment_method.slice(1)}
            </span>
            {transaction.location && (
              <>
                <span>•</span>
                <span>{transaction.location}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <span className={`font-bold ${
        transaction.type === 'income' 
          ? 'text-green-500' 
          : 'text-red-500'
      }`}>
        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
      </span>
    </div>
  )
}

