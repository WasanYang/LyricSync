
import Header from "@/components/Header"
import BottomNavBar from "@/components/BottomNavBar"

// src/app/lyrics/layout.tsx
export default function LyricsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
}
