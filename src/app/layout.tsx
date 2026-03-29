import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Swiss Car Import Calculator | Fahrzeugimport Schweiz Rechner',
  description: 'Calculate the total cost of importing a car into Switzerland. Customs, taxes, CO₂, MFK — everything at a glance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
