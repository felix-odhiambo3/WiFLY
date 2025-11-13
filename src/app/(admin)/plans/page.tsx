import { getPlans } from './actions';
import PlansPageClient from './PlansPageClient';

export const metadata = {
  title: 'Plan Management - WiFly',
};

export default async function PlansPage() {
  const plans = await getPlans();
  return <PlansPageClient initialPlans={plans} />;
}
