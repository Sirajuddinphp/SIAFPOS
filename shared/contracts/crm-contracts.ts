export type LoyaltyAccount = {
  customerUuid: string;
  customerName: string;
  phone: string | null;
  pointsBalance: number;
  walletMinor: number;
  tier: "standard" | "silver" | "gold" | "platinum";
};

export type LoyaltyTransaction = {
  uuid: string;
  customerUuid: string;
  transactionType: "points" | "wallet";
  direction: "credit" | "debit";
  amount: number;
  reason: string;
  createdAt: string;
};

export type Coupon = {
  uuid: string;
  code: string;
  name: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minOrderMinor: number;
  maxDiscountMinor: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
};

export type Membership = {
  uuid: string;
  customerUuid: string;
  customerName: string;
  planName: string;
  startsAt: string;
  endsAt: string;
  status: "active" | "expired" | "cancelled";
};

export type CrmDashboard = {
  accounts: LoyaltyAccount[];
  recentTransactions: LoyaltyTransaction[];
  coupons: Coupon[];
  memberships: Membership[];
};

export type AdjustLoyaltyInput = {
  customerUuid: string;
  transactionType: "points" | "wallet";
  direction: "credit" | "debit";
  amount: number;
  reason: string;
};

export type SaveCouponInput = {
  couponUuid?: string;
  code: string;
  name: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  minOrderMinor?: number;
  maxDiscountMinor?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  isActive?: boolean;
};

export type SaveMembershipInput = {
  membershipUuid?: string;
  customerUuid: string;
  planName: string;
  startsAt: string;
  endsAt: string;
  status?: "active" | "expired" | "cancelled";
};
