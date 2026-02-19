import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WP Pilot",
  description: "Manage your WordPress business without wp-admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
