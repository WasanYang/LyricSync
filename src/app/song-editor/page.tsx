
import SongCreator from "@/components/SongCreator";
import Header from "@/components/Header";
import BottomNavBar from "@/components/BottomNavBar";

export default function SongCreatorPage() {
  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8 flex flex-col">
        <SongCreator />
      </main>
      <BottomNavBar />
    </div>
  );
}
