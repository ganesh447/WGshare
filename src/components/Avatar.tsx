import { AVATAR_COLORS } from '@/lib/data';

type Props = {
  name: string;
  color: number;
  size?: number;
};

export default function Avatar({ name, color, size = 44 }: Props) {
  const bg = AVATAR_COLORS[color % AVATAR_COLORS.length];
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-foreground flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize,
        background: bg,
        boxShadow: `0 3px 10px ${bg}44`,
      }}
    >
      {initials}
    </div>
  );
}
