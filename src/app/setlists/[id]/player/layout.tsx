
export default function SetlistPlayerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout is specifically for the setlist player to achieve a full-screen experience.
  // It doesn't render the Header or BottomNavBar.
  return <>{children}</>;
}
