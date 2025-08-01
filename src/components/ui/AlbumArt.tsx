// src/components/ui/AlbumArt.tsx
import Image from 'next/image';

interface AlbumArtProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  title: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
}

export default function AlbumArt({
  title,
  width = 200,
  height = 200,
  className,
  priority,
  fetchPriority,
  ...props
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
      priority={priority}
      fetchPriority={fetchPriority}
      {...props}
    />
  );
}
