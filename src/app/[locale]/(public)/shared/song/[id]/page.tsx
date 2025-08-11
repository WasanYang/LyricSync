import { SongDetail } from '@/components/SongDetail';

type Props = {
  params: { id: string; locale?: string };
};
export default async function SongDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <SongDetail songId={id} showPlayerLink={true} isSharePage />
    </>
  );
}
