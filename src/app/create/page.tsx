import LyricCreator from "@/components/LyricCreator";

export default function CreatePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold tracking-tight">Create & Sync Lyrics</h1>
        <p className="text-muted-foreground mt-2">Add new songs, enhance layout with AI, and sync your lyrics with precision.</p>
      </div>
      <LyricCreator />
    </div>
  );
}
