export type Session = {
  token: string;
  mac: string;
  plan: string;
  expiresAt: number; // Unix timestamp in seconds
};
