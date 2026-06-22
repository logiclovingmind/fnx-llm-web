import Image from 'next/image';

// Logic Loving Mind — 3D brand mark (nested heart, deep-purple -> gold).
export default function Logo({
  size = 30,
  className = '',
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo-3d.png"
      alt="Logic Loving Mind"
      width={size}
      height={size}
      className={className}
      priority={priority}
    />
  );
}
