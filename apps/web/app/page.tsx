import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import PricingSection from "../components/landing/PricingSection";
import ContactForm from "../components/landing/ContactForm";
import Footer from "../components/landing/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation (Simple conceptual header) */}
      <header className="absolute top-0 w-full z-50">
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 py-8 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tighter text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-brand-dark rounded-sm rotate-45" />
            </div>
            Flori-Core
          </div>
          <div className="hidden lg:flex space-x-10 items-center text-sm font-semibold text-slate-300">
            <a href="#platform" className="text-white border-b-2 border-brand-green pb-1 transition-all">Platform</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
            <a href="#insights" className="hover:text-white transition-colors">Insights</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login" className="hidden sm:block text-sm font-semibold text-white hover:text-brand-green transition-colors">Login</a>
            <a href="/signup" className="px-6 py-2.5 rounded-full bg-brand-green text-brand-dark text-sm font-bold hover:bg-emerald-400 transition-all">
              Request Demo
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

      <Footer />
    </div>
  );
}
