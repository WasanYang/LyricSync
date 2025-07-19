import LyricCreator from "@/components/LyricCreator";
import Header from "@/components/Header";
import BottomNavBar from "@/components/BottomNavBar";

export default function CreatePage() {
  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-headline font-bold tracking-tight">Create & Sync Lyrics</h1>
            <p className="text-muted-foreground mt-2">Add new songs, enhance layout with AI, and sync your lyrics with precision.</p>
          </div>
          <LyricCreator />
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}
