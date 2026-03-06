export const rpName = "Pensionsmanager";
export const rpID = process.env.NODE_ENV === "development" ? "localhost" : process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname : "localhost";
export const origin = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`;
