
import SongCreator from "@/components/SongCreator";

export default function SongCreatorPage() {
  return (
    <div className="flex-grow flex flex-col h-screen bg-background">
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col">
        <SongCreator />
      </main>
    </div>
  );
}
