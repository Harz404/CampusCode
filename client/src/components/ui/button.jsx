import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const buttonVariants = cva("inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none", {
    variants: {
        variant: {
            default: "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm hover:opacity-90 active:scale-[0.98]",
            destructive: "bg-[var(--destructive)] text-[var(--destructive-foreground)] shadow-sm hover:opacity-90 active:scale-[0.98]",
            outline: "border border-[var(--border)] bg-transparent hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] active:scale-[0.98]",
            secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] shadow-sm hover:opacity-80 active:scale-[0.98]",
            ghost: "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] active:scale-[0.98]",
            link: "text-[var(--primary)] underline-offset-4 hover:underline",
            gradient: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md hover:opacity-90 active:scale-[0.98]",
        },
        size: {
            default: "h-9 px-4 py-2",
            sm: "h-8 rounded-md px-3 text-xs",
            lg: "h-11 rounded-lg px-8 text-base",
            icon: "h-9 w-9",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
    return (<button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}/>);
});
Button.displayName = "Button";
export { Button, buttonVariants };
