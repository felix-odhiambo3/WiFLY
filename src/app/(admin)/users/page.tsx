import { getPlans } from '../plans/actions';
import { getUserSessions } from './actions';
import UsersPageClient from './UsersPageClient';

export const metadata = {
  title: 'User Management - WiFly',
};


export default async function UsersPage() {
  const users = await getUserSessions();
  const plans = await getPlans();

  return <UsersPageClient initialUsers={users} plans={plans} />;
}
