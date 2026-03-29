import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import PricingSection from "../components/landing/PricingSection";
import ContactForm from "../components/landing/ContactForm";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation (Simple conceptual header) */}
      <header className="absolute top-0 w-full z-50">
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-emerald-500">Flori-</span>Core
          </div>
          <div className="hidden md:flex space-x-8 items-center text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-emerald-500 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-emerald-500 transition-colors">Pricing</a>
            <a href="/login" className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity">
              Login
            </a>
          </div>
        </nav>
      </header>

      <main className="grow">
        <HeroSection />
        <FeaturesSection />
        <div id="pricing">
          <PricingSection />
        </div>
        <ContactForm />
      </main>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <div>&copy; {new Date().getFullYear()} Flori-Core Enterprise OS. All rights reserved.</div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
