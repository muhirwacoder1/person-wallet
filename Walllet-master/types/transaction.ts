export type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  payment_method: string;
  location?: string;
  created_at: string;
};

export type Budget = {
  id: string;
  category: string;
  budget_limit: number;
  period: 'monthly' | 'weekly' | 'yearly';
  created_at: string;
};

export type CategoryLimit = {
  category: string;
  limit: number;
  spent: number;
};

