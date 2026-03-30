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
    <section className="py-32 bg-brand-dark relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">Transparent <span className="text-brand-green">Pricing</span></h2>
          <p className="text-lg text-slate-400 font-light">
            Start small and seamlessly upgrade as your operations grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier, i) => (
            <div 
              key={i} 
              className={`relative flex flex-col p-10 rounded-4xl transition-all duration-700 hover:-translate-y-3 backdrop-blur-3xl ${
                tier.popular 
                ? 'bg-emerald-500/12 border-2 border-brand-green shadow-2xl shadow-emerald-500/10' 
                : 'bg-white/4 border-white/7 hover:bg-white/8 hover:border-white/15'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-10 transform -translate-y-1/2">
                  <span className="bg-brand-green text-brand-dark text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
                    Most Popular
                  </span>
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-4 text-white">
                {tier.name}
              </h3>
              
              <div className="mb-10">
                <span className="text-6xl font-black text-white">{tier.price}</span>
                <span className="text-slate-400 ml-2 font-light">{tier.period}</span>
              </div>
              
              <ul className="mb-10 flex-1 space-y-5">
                {tier.features.map((feat, j) => (
                  <li key={j} className="flex items-center gap-4">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-brand-green/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-slate-300 font-light text-sm">
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>
              
              <a 
                href="/signup"
                className={`w-full py-4 rounded-full font-bold transition-all text-center ${
                  tier.popular 
                  ? 'bg-brand-green hover:bg-emerald-400 text-brand-dark shadow-lg shadow-emerald-500/20' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
