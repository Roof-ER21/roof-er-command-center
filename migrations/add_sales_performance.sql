-- Add sales_performance table
CREATE TABLE IF NOT EXISTS sales_performance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  sales_rep_id INTEGER REFERENCES sales_reps(id),
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  revenue REAL DEFAULT 0,
  target REAL DEFAULT 0,
  deals_won INTEGER DEFAULT 0,
  deals_pending INTEGER DEFAULT 0,
  deals_lost INTEGER DEFAULT 0,
  commission REAL DEFAULT 0,
  commission_rate REAL DEFAULT 0.1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_performance_user_id ON sales_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_performance_month_year ON sales_performance(month, year);
CREATE INDEX IF NOT EXISTS idx_sales_performance_sales_rep_id ON sales_performance(sales_rep_id);

-- Add comment
COMMENT ON TABLE sales_performance IS 'Sales performance tracking for individual deals and monthly stats';
