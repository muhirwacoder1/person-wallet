import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for our database tables
export type Transaction = {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  payment_method?: string;
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

export type Category = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  created_at: string;
};

export type UserBalance = {
  id: string;
  current_balance: number;
  last_updated: string;
};

// Database helper functions
export const db = {
  balance: {
    async get() {
      const { data, error } = await supabase
        .from('user_balance')
        .select('*')
        .single();
      if (error) throw error;
      return data as UserBalance;
    },
  },
  transactions: {
    async getAll(page = 1, limit = 20) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('date', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return {
        transactions: data as Transaction[],
        total: count || 0,
        currentPage: page,
        totalPages: count ? Math.ceil(count / limit) : 0
      };
    },
    async getByType(type: 'income' | 'expense', page = 1, limit = 20) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('type', type)
        .order('date', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      return {
        transactions: data as Transaction[],
        total: count || 0,
        currentPage: page,
        totalPages: count ? Math.ceil(count / limit) : 0
      };
    },
    async add(transaction: Omit<Transaction, 'id' | 'created_at'>) {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      if (error) throw error;
      return data as Transaction;
    },
    async getRecentTransactions(limit = 5) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Transaction[];
    },
    async getMonthlyTotals() {
      const { data, error } = await supabase
        .rpc('get_monthly_totals');
      if (error) throw error;
      return data;
    }
  },
  budgets: {
    async getAll() {
      const { data, error } = await supabase
        .from('budgets')
        .select('*');
      if (error) throw error;
      return data as Budget[];
    },
    async add(budget: Omit<Budget, 'id' | 'created_at'>) {
      const { data, error } = await supabase
        .from('budgets')
        .insert(budget)
        .select()
        .single();
      if (error) throw error;
      return data as Budget;
    },
    async delete(category: string) {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('category', category);
      if (error) throw error;
    },
    async getBudgetTracking() {
      const { data, error } = await supabase
        .from('budget_tracking')
        .select('*');
      if (error) throw error;
      return data;
    }
  },
  categories: {
    async getAll() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Category[];
    },
    async getByType(type: 'income' | 'expense') {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('type', type)
        .order('name');
      if (error) throw error;
      return data as Category[];
    }
  }
}; 