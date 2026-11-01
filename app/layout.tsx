import './globals.css';

export const metadata = {
  title: 'SA Learner K53 - Next.js + Prisma',
  description: 'South Africa Learner Licence K53 Test with Postgres & Prisma',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
