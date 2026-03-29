// This is a Server Component that reads the token from cookies
// and passes it to the client WizardContainer.
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import WizardContainer from '../../components/onboarding/WizardContainer';

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  return <WizardContainer token={token} />;
}
