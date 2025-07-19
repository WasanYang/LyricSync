
// src/app/lyrics/layout.tsx
export default function LyricsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout is specifically for the lyrics and setlist pages to achieve a full-screen experience.
  // It doesn't render the Header or BottomNavBar.
  return <>{children}</>;
}
