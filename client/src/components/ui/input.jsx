import * as React from "react";
import { cn } from "@/lib/utils";
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (<input type={type} className={cn("flex h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props}/>);
});
Input.displayName = "Input";
const Textarea = React.forwardRef(({ className, ...props }, ref) => {
    return (<textarea className={cn("flex min-h-[80px] w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50", className)} ref={ref} {...props}/>);
});
Textarea.displayName = "Textarea";
const Label = React.forwardRef(({ className, ...props }, ref) => {
    return (<label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[var(--foreground)]", className)} ref={ref} {...props}/>);
});
Label.displayName = "Label";
export { Input, Textarea, Label };
