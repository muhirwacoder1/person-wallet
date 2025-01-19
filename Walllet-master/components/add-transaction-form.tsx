'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { incomeCategories, expenseCategories } from '@/utils/categories'
import { Transaction } from '@/types/transaction'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface AddTransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => void;
  defaultType?: 'income' | 'expense';
}

export const AddTransactionForm = ({ onAddTransaction, defaultType = 'expense' }: AddTransactionFormProps) => {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState<Date>(new Date())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const transaction = {
      type: defaultType,
      amount: Number(amount),
      category,
      description,
      date: date.toISOString(),
      payment_method: paymentMethod,
      location: location || undefined
    };

    onAddTransaction(transaction);

    // Reset form
    setAmount('')
    setCategory('')
    setDescription('')
    setPaymentMethod('cash')
    setLocation('')
    setDate(new Date())
  }

  const categories = defaultType === 'income' ? incomeCategories : expenseCategories

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            placeholder="Enter amount"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <Select
            value={category}
            onValueChange={setCategory}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem 
                  key={cat.value} 
                  value={cat.value}
                  className="flex items-center gap-2"
                >
                  <span className="text-xl">{cat.icon}</span>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Payment Method</label>
          <Select
            value={paymentMethod}
            onValueChange={setPaymentMethod}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
              <SelectItem value="mobile">Mobile Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            placeholder="Enter description"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Location (Optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            placeholder="Enter location"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90"
        disabled={!amount || !category || !description}
      >
        Add {defaultType === 'income' ? 'Income' : 'Expense'}
      </Button>
    </form>
  )
}

