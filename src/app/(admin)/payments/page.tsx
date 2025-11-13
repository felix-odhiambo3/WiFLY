import { getPayments, getPlans } from './actions';
import PaymentsPageClient from './PaymentsPageClient';

export const metadata = {
  title: 'Payment History - WiFly',
};

export default async function PaymentsPage() {
  const payments = await getPayments();
  const plans = await getPlans();
  return <PaymentsPageClient initialPayments={payments} plans={plans} />;
}
