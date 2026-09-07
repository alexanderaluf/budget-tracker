export type UserProfile = {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  role: string;
  imageUri?: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
};

export type ProfileValues = Pick<
  UserProfile,
  | "name"
  | "email"
  | "role"
  | "imageUri"
  | "currencyCode"
  | "currencyName"
  | "currencySymbol"
>;
