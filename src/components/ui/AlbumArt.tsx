// src/components/ui/AlbumArt.tsx
import Image from 'next/image';

interface AlbumArtProps {
  title: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function AlbumArt({
  title,
  width = 200,
  height = 200,
  className,
}: AlbumArtProps) {
  // Always encode and trim for safety
  const safeTitle = encodeURIComponent(title.trim());
  return (
    <Image
      src={`https://placehold.co/${width}x${height}.png?text=${safeTitle}`}
      alt={`${title} album art`}
      width={width}
      height={height}
      className={className}
      data-ai-hint='album cover'
    />
  );
}
