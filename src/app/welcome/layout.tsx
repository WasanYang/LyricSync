
// src/app/welcome/layout.tsx
export default function WelcomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout is specifically for the welcome page to achieve a full-screen experience
  // without the standard Header or BottomNavBar.
  return <>{children}</>;
}
