-- Migration: Add currency support to restaurants table
-- Date: 2025-12-23
-- Description: Adds currency field to allow restaurants to set their preferred currency

-- Add currency column to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'GMD';

-- Add comment
COMMENT ON COLUMN public.restaurants.currency IS 'Restaurant currency code (USD, EUR, GBP, GMD, etc.)';

-- Optional: Add check constraint for valid currencies
ALTER TABLE public.restaurants
ADD CONSTRAINT restaurants_currency_check 
CHECK (currency IN ('USD', 'EUR', 'GBP', 'GMD', 'XOF', 'NGN', 'GHS', 'ZAR', 'KES'));
