import { SongPlayerComponent } from '../../_component/SongPlayerComponent';

type Props = {
  params: { id: string; locale?: string };
};
export default async function LyricPlayerPage({ params }: Props) {
  const { id } = await params;
  return <SongPlayerComponent id={id} />;
}
