/**
 * Outline icons for each IAM role — Feather-style, monochrome.
 * Uses currentColor so CSS controls the tone (muted/gold) per context.
 */

interface RoleIconProps {
  code: string;
  size?: number;
}

const SVG_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function paths(code: string): React.ReactNode {
  switch (code) {
    case "student":
      // graduation cap
      return (
        <>
          <path d="M22 10L12 4 2 10l10 6 10-6z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </>
      );
    case "guardian":
      // users (2 people)
      return (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      );
    case "teacher":
      // book-open
      return (
        <>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </>
      );
    case "instructor":
      // activity (pulse)
      return <path d="M22 12h-4l-3 9L9 3l-3 9H2" />;
    case "assistant":
      // briefcase
      return (
        <>
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </>
      );
    case "supporter":
      // heart
      return (
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      );
    case "sponsor":
      // dollar-sign
      return (
        <>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </>
      );
    case "owner":
      // shield with check
      return (
        <>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </>
      );
    case "master":
      // eye
      return (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      );
    case "social":
      // message-square
      return (
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      );
    default:
      // user (fallback)
      return (
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      );
  }
}

export function RoleIcon({ code, size = 18 }: RoleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...SVG_PROPS}
      aria-hidden="true"
    >
      {paths(code)}
    </svg>
  );
}
