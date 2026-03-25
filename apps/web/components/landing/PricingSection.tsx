import React from 'react';

const tiers = [
  {
    name: 'Sprout',
    price: '$99',
    period: '/mo',
    features: ['Up to 10 Hectares', 'Basic IoT Sensor tracking', 'Email Support', 'Standard Reports'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Pro Farm',
    price: '$299',
    period: '/mo',
    features: ['Up to 50 Hectares', 'Advanced Cold Chain Alerts', 'Priority Support', 'Custom Integrations', 'Vendor Portal Access'],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Enterprise Network',
    price: 'Custom',
    period: '',
    features: ['Unlimited Hectares', 'Multi-tenant Gold Admin', '24/7 Phone Support', 'Dedicated Success Manager', 'On-premise deployment option'],
    cta: 'Contact Sales',
    popular: false,
  }
];

export default function PricingSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Transparent Pricing for Every Scale</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Start small and seamlessly upgrade as your operations grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, i) => (
            <div 
              key={i} 
              className={`relative flex flex-col p-8 rounded-3xl transition-transform hover:-translate-y-2 ${
                tier.popular 
                ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-2xl shadow-emerald-500/10 ring-2 ring-emerald-500' 
                : 'glass hover:bg-white dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-6 transform -translate-y-1/2">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}
              
              <h3 className={`text-2xl font-semibold mb-4 ${tier.popular ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {tier.name}
              </h3>
              
              <div className="mb-8">
                <span className="text-5xl font-extrabold">{tier.price}</span>
                <span className={tier.popular ? 'text-slate-300' : 'text-slate-500'}>{tier.period}</span>
              </div>
              
              <ul className="mb-8 flex-1 space-y-4">
                {tier.features.map((feat, j) => (
                  <li key={j} className="flex items-center gap-3">
                    <svg className={`shrink-0 w-5 h-5 ${tier.popular ? 'text-emerald-400' : 'text-emerald-500'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={tier.popular ? 'text-slate-100' : 'text-slate-700 dark:text-slate-300'}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
              
              <button 
                className={`w-full py-4 rounded-full font-semibold transition-colors ${
                  tier.popular 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
