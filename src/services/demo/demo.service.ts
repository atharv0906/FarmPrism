import { requireSupabaseClient } from '../../lib/supabase/client';
import { isDevelopmentMockOtpEnabled } from '../auth/otp.strategy';
import { parseDemoAccount, parseFarmerHome, parseFarmerMyFarm, parseNotifications } from './demo.parsers';

function client() {
  if (!isDevelopmentMockOtpEnabled()) throw new Error('Demo data is only available in mock OTP development mode.');
  return requireSupabaseClient();
}

export const demoService = {
  async account(phone: string) {
    const { data, error } = await client().rpc('get_demo_account_by_phone', { p_phone: phone });
    if (error) throw new Error(`Unable to load the demo account: ${error.message}`);
    const account = parseDemoAccount(data);
    if (account && account.phone !== phone) throw new Error('The returned demo account does not match this phone.');
    return account;
  },
  async farmerHome(phone: string) {
    const { data, error } = await client().rpc('get_demo_farmer_home_summary', { p_phone: phone });
    if (error) throw new Error(`Unable to load Farmer Home: ${error.message}`);
    return parseFarmerHome(data);
  },
  async farmerMyFarm(phone: string) {
    const { data, error } = await client().rpc('get_demo_farmer_my_farm_summary', { p_phone: phone });
    if (error) throw new Error(`Unable to load My Farm: ${error.message}`);
    return parseFarmerMyFarm(data);
  },
  async notifications(phone: string) {
    const { data, error } = await client().rpc('get_demo_notifications', { p_phone: phone });
    if (error) throw new Error(`Unable to load notifications: ${error.message}`);
    return parseNotifications(data);
  },
  async markNotificationRead(phone: string, id: string) {
    const { data, error } = await client().rpc('mark_demo_notification_read', { p_phone: phone, p_notification_id: id });
    if (error || data !== true) throw new Error('Unable to mark this notification as read. Please retry.');
  },
};
