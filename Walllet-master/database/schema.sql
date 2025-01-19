-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE budget_period AS ENUM ('monthly', 'weekly', 'yearly');

-- Create user_balance table
CREATE TABLE user_balance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, type)
);

-- Create budgets table
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    budget_limit DECIMAL(12,2) NOT NULL CHECK (budget_limit > 0),
    period budget_period NOT NULL DEFAULT 'monthly',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, period)
);

-- Create transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    type transaction_type NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);

-- Insert default categories
INSERT INTO categories (name, type, icon) VALUES
    -- Income categories
    ('Salary', 'income', '💰'),
    ('Freelance', 'income', '💼'),
    ('Investments', 'income', '📈'),
    ('Gifts', 'income', '🎁'),
    ('Other Income', 'income', '💵'),
    
    -- Expense categories
    ('Food & Dining', 'expense', '🍽️'),
    ('Transportation', 'expense', '🚗'),
    ('Shopping', 'expense', '🛍️'),
    ('Entertainment', 'expense', '🎬'),
    ('Bills & Utilities', 'expense', '📱'),
    ('Housing', 'expense', '🏠'),
    ('Healthcare', 'expense', '🏥'),
    ('Education', 'expense', '📚'),
    ('Travel', 'expense', '✈️'),
    ('Other Expenses', 'expense', '📝');

-- Initialize user balance with 0
INSERT INTO user_balance (current_balance) VALUES (0);

-- Create a view for budget tracking
CREATE VIEW budget_tracking AS
SELECT 
    b.category,
    b.budget_limit,
    b.period,
    COALESCE(SUM(t.amount), 0) as spent,
    b.budget_limit - COALESCE(SUM(t.amount), 0) as remaining,
    CASE 
        WHEN b.budget_limit = 0 THEN 0
        ELSE (COALESCE(SUM(t.amount), 0) / b.budget_limit * 100)
    END as percentage_used
FROM budgets b
LEFT JOIN transactions t ON 
    b.category = t.category 
    AND t.type = 'expense'
    AND (
        CASE 
            WHEN b.period = 'monthly' THEN 
                t.date >= DATE_TRUNC('month', CURRENT_DATE)
            WHEN b.period = 'weekly' THEN 
                t.date >= DATE_TRUNC('week', CURRENT_DATE)
            WHEN b.period = 'yearly' THEN 
                t.date >= DATE_TRUNC('year', CURRENT_DATE)
        END
    )
GROUP BY b.category, b.budget_limit, b.period;

-- Create function to update balance after transaction
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'income' THEN
        UPDATE user_balance 
        SET current_balance = current_balance + NEW.amount,
            last_updated = NOW();
    ELSE
        UPDATE user_balance 
        SET current_balance = current_balance - NEW.amount,
            last_updated = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update balance
CREATE TRIGGER after_transaction_insert
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_balance(); 