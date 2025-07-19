import SetlistCreator from "@/components/SetlistCreator";
import Header from "@/components/Header";
import BottomNavBar from "@/components/BottomNavBar";

export default function CreatePage() {
  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-headline font-bold tracking-tight">Create Setlist</h1>
            <p className="text-muted-foreground mt-2">Build and arrange your perfect setlist for any occasion.</p>
          </div>
          <SetlistCreator />
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}
