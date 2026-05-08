export interface MerchantLocationSignal {
  id?: string;
  merchant_code: string;
  latitude: number;
  longitude: number;
  hashed_user_id: string;
  timestamp: string;
  transaction_count?: number;
}

export interface VerifiedMerchant {
  id?: string;
  merchant_code: string;
  merchant_name: string;
  latitude: number;
  longitude: number;
  confidence_score: number;
  usage_count: number;
  verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MerchantAlias {
  id?: string;
  merchant_code: string;
  alias: string;
  votes: number;
}

export interface MerchantUsageStat {
  id?: string;
  merchant_code: string;
  daily_usage: number;
  weekly_usage: number;
  monthly_usage: number;
}

export interface NearbyMerchantResult extends VerifiedMerchant {
  distance_meters: number;
  all_codes?: string[]; // grouped codes for same merchant name
}
