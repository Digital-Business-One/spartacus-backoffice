interface AccountAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: "account-avatar account-avatar--sm",
  md: "account-avatar",
  lg: "account-avatar account-avatar--lg",
};

/**
 * Account avatar — displays the profile photo when available,
 * falling back to initials. Photo always takes priority.
 */
export function AccountAvatar({ name, photoUrl, size = "md" }: AccountAvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const className = SIZE_MAP[size];

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${className} account-avatar--photo`}
      />
    );
  }

  return <div className={className}>{initials}</div>;
}
