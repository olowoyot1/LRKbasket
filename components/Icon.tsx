import { ICON_PATHS, ICON_NAMES } from '@/lib/icons';

export { ICON_NAMES };

export default function Icon({ name, className }: { name: string; className?: string }) {
  const path = ICON_PATHS[name] ?? ICON_PATHS.leaf;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}
