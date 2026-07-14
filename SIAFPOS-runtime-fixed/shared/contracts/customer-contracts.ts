export type CustomerSummary = {
  uuid: string;
  name: string;
  phone: string | null;
  email: string | null;
  addressSummary: string | null;
  isActive: boolean;
};

export type CustomerSearchInput = {
  query: string;
  limit: number;
};
