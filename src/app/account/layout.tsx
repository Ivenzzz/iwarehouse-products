import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Your account", template: "%s | iWarehouse" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
