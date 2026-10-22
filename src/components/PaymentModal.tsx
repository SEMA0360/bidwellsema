import { useState } from 'react';
import { Check, Crown, Infinity as InfinityIcon, Landmark, TrendingUp, X, Zap } from 'lucide-react';

export type PricingTier = 'pay-per-bid' | 'growth' | 'enterprise';

const PLANS = [
  {
    tier: 'pay-per-bid',
    label: 'Pay-Per-Bid',
    price: '$49',
    period: 'one-time',
    description: 'Single RFP full export',
    icon: Zap,
    features: ['Full compliance matrix export (.csv)', 'Draft response export (.txt)', 'Gap analysis report (.csv)'],
  },
  {
    tier: 'growth',
    label: 'Growth Plan',
    price: '$360',
    period: '/ month',
    description: 'Up to 10 full proposals / month',
    icon: TrendingUp,
    features: ['Full document exports', 'Lead finder & outreach tools', 'Auto mail sender (100/day)'],
  },
  {
    tier: 'enterprise',
    label: 'Enterprise Unlimited',
    price: '$770',
    period: '/ month',
    description: 'Unlimited proposal exports and priority processing',
    icon: InfinityIcon,
    features: ['Unlimited proposal exports', 'Multi-portal monitoring', 'Priority AI processing'],
  },
] as const;

interface PaymentModalProps {
  onClose: () => void;
}

export default function PaymentModal({ onClose }: PaymentModalProps) {
  const [selectedTier, setSelectedTier] = useState<PricingTier>('growth');
  const selectedPlan = PLANS.find((plan) => plan.tier === selectedTier);
  const isMonthlyPlan = selectedTier !== 'pay-per-bid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="payment-title">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close payment dialog" />
      <section className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl">
        <header className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
          <div>
            <h2 id="payment-title" className="font-semibold">Choose your plan</h2>
            <p className="mt-1 text-xs text-ink-400">Online bank payment options</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PLANS.map((plan) => {
              const active = selectedTier === plan.tier;
              const Icon = plan.icon;
              return (
                <button
                  key={plan.tier}
                  type="button"
                  onClick={() => {
                    setSelectedTier(plan.tier);
                  }}
                  className={`rounded-xl border p-4 text-left transition-colors ${active ? 'border-accent/60 bg-accent/10' : 'border-ink-700 bg-ink-850/40 hover:border-ink-600'}`}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${active ? 'text-accent' : 'text-ink-300'}`} />
                    <span className={`text-sm font-semibold ${active ? 'text-accent' : 'text-ink-100'}`}>{plan.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-xs text-ink-400">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-400">{plan.description}</p>
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5 text-xs text-ink-300">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Bank payment methods">
            <div className="rounded-lg border border-ink-700 bg-ink-850/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-ink-200">
                <Landmark className="h-4 w-4 text-ink-400" />
                Net Banking
              </div>
              <p className="mt-1 text-xs text-ink-500">Not configured yet</p>
            </div>
            <div className="rounded-lg border border-ink-700 bg-ink-850/50 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-ink-200">
                <Landmark className="h-4 w-4 text-ink-400" />
                Direct Bank Debit
              </div>
              <p className="mt-1 text-xs text-ink-500">Not configured yet</p>
            </div>
          </div>

          <button
            className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-ink-700 py-3 font-semibold text-ink-400"
            disabled
            type="button"
          >
            <Landmark className="h-4 w-4" />
            Bank checkout unavailable
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-ink-400">
            Net Banking and Direct Bank Debit are not configured yet. No payment will be initiated.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-500">
            <Crown className="h-3.5 w-3.5" />
            {selectedPlan?.label} · {selectedPlan?.price}{isMonthlyPlan ? '/month' : ' one-time'}
          </div>
        </div>
      </section>
    </div>
  );
}
