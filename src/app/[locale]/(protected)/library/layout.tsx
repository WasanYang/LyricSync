import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Library | Lyricsync',
  description: 'A collection of your saved songs',
};

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
