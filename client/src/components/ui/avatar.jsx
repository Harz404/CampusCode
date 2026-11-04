import * as React from "react";
import { cn, getInitials } from "@/lib/utils";
const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl",
};
export function Avatar({ src, alt = "", name, fallback, size = "md", className, ...props }) {
    const [imageError, setImageError] = React.useState(false);
    const displayName = name || alt || "";
    const initials = fallback || (displayName ? getInitials(displayName) : "?");
    return (<div className={cn("relative flex shrink-0 overflow-hidden rounded-full border border-[var(--border)] bg-[var(--muted)]", sizeClasses[size], className)} {...props}>
      {src && !imageError ? (<img src={src} alt={displayName} onError={() => setImageError(true)} className="aspect-square h-full w-full object-cover"/>) : (<div className="flex h-full w-full items-center justify-center font-semibold text-[var(--muted-foreground)]">
          {initials}
        </div>)}
    </div>);
}
