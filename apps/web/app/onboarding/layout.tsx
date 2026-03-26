import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Setup Your Farm | Flori-Core Enterprise OS',
  description: 'Complete your farm profile to get started with Flori-Core.',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
