import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** Build the GitHub avatar URL for a handle (works for any public account). */
export function githubAvatarUrl(handle?: string | null, size = 160): string | null {
  if (!handle) return null;
  const clean = handle.trim().replace(/^@/, "");
  if (!clean) return null;
  return `https://github.com/${encodeURIComponent(clean)}.png?size=${size}`;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface StudentAvatarProps {
  name: string;
  githubUsername?: string | null;
  profilePhoto?: string | null;
  /** Rendered avatar box size in px (defaults to 40 / h-10 w-10 from Avatar). */
  size?: number;
  className?: string;
  /** Extra classes for the fallback (initials) circle. */
  fallbackClassName?: string;
}

/**
 * Shared avatar for a student. Prefers the GitHub profile photo, then the
 * stored LeetCode photo, then initials. Each source that fails to load
 * (e.g. a GitHub handle with no account) transparently falls through to the
 * next, so a wrong handle never leaves a broken image.
 */
export default function StudentAvatar({
  name,
  githubUsername,
  profilePhoto,
  size,
  className,
  fallbackClassName,
}: StudentAvatarProps) {
  const sources = useMemo(() => {
    const list: string[] = [];
    const gh = githubAvatarUrl(githubUsername, size ? size * 2 : 160);
    if (gh) list.push(gh);
    if (profilePhoto) list.push(profilePhoto);
    return list;
  }, [githubUsername, profilePhoto, size]);

  const [failedCount, setFailedCount] = useState(0);
  const src = sources[failedCount];

  return (
    <Avatar
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {src && (
        <AvatarImage
          key={src}
          src={src}
          alt={name}
          className="object-cover"
          onError={() => setFailedCount((c) => c + 1)}
        />
      )}
      <AvatarFallback
        className={cn("bg-primary/10 font-bold text-primary", fallbackClassName)}
      >
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
