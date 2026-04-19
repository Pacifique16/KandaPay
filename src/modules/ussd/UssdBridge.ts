import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
const { UssdModule } = NativeModules;

export interface SimCard {
  slotIndex: number;
  operatorName: string;
  iccId: string;
  subscriptionId: number;
}

export interface UssdResult {
  success: boolean;
  response?: string;
  error?: string;
}

export async function requestUssdPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const grants = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CALL_PHONE,
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
  ]);
  return (
    grants[PermissionsAndroid.PERMISSIONS.CALL_PHONE] === 'granted' &&
    grants[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === 'granted'
  );
}

export async function getSimCards(): Promise<SimCard[]> {
  try {
    return await UssdModule.getActiveSimCards();
  } catch (e: any) {
    console.error('getSimCards error:', e);
    return [];
  }
}

export async function dialUssd(ussdCode: string, simSlot = 0): Promise<UssdResult> {
  try {
    const hasPermission = await requestUssdPermissions();
    if (!hasPermission) return { success: false, error: 'Phone permissions denied' };
    const response: string = await UssdModule.sendUssdRequest(ussdCode, simSlot);
    return { success: true, response };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'USSD request failed' };
  }
}
