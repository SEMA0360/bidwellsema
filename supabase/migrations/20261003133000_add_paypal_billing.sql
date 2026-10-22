CREATE TABLE IF NOT EXISTS public.billing_entitlements (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL CHECK (tier IN ('pay-per-bid', 'growth', 'enterprise')),
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'suspended', 'expired')),
  paypal_subscription_id text UNIQUE,
  analysis_id uuid REFERENCES public.rfp_analyses(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own billing entitlement"
  ON public.billing_entitlements
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.paypal_billing_catalog (
  tier text PRIMARY KEY CHECK (tier IN ('growth', 'enterprise')),
  product_id text NOT NULL,
  plan_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paypal_billing_catalog ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.paypal_billing_settings (
  setting text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE public.paypal_billing_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.paypal_webhook_events (
  event_id text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paypal_webhook_events ENABLE ROW LEVEL SECURITY;
