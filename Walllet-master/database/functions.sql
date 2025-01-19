-- Function to get monthly totals for both income and expenses
CREATE OR REPLACE FUNCTION get_monthly_totals()
RETURNS TABLE (
    month DATE,
    total_income DECIMAL(12,2),
    total_expenses DECIMAL(12,2),
    net_amount DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_transactions AS (
        SELECT
            DATE_TRUNC('month', date)::DATE as month,
            type,
            SUM(amount) as total
        FROM transactions
        WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
        GROUP BY DATE_TRUNC('month', date), type
    )
    SELECT
        m.month,
        COALESCE(SUM(CASE WHEN m.type = 'income' THEN m.total ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN m.type = 'expense' THEN m.total ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(CASE WHEN m.type = 'income' THEN m.total ELSE -m.total END), 0) as net_amount
    FROM monthly_transactions m
    GROUP BY m.month
    ORDER BY m.month DESC;
END;
$$ LANGUAGE plpgsql; 