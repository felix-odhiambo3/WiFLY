import { getVouchers } from './actions';
import VouchersPageClient from './VoucherPageClient';

export const metadata = {
  title: 'Voucher Management - WiFly',
};

export default async function VouchersPage() {
  const vouchers = await getVouchers();

  return <VouchersPageClient initialVouchers={vouchers} />;
}
