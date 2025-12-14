"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        embossed:
          "bg-[#5220E3] text-white rounded-[14px] relative overflow-hidden font-semibold",
        "embossed-secondary":
          "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-[14px] relative overflow-hidden font-semibold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-10 px-4 py-2",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isEmbossed =
      variant === "embossed" || variant === "embossed-secondary";
    const [isPressed, setIsPressed] = React.useState(false);
    const [isBouncing, setIsBouncing] = React.useState(false);

    const handleMouseDown = () => {
      if (isEmbossed) {
        setIsPressed(true);
        setIsBouncing(false);
      }
    };

    const handleMouseUp = () => {
      if (isEmbossed) {
        setIsPressed(false);
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 200);
      }
    };

    const handleMouseLeave = () => {
      if (isEmbossed) {
        setIsPressed(false);
        setIsBouncing(false);
      }
    };

    const handleTouchStart = () => {
      if (isEmbossed) {
        setIsPressed(true);
        setIsBouncing(false);
      }
    };

    const handleTouchEnd = () => {
      if (isEmbossed) {
        setIsPressed(false);
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 200);
      }
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={
          isEmbossed
            ? {
                transform: isPressed
                  ? "scale(0.98) translateY(1px)"
                  : isBouncing
                  ? "scale(1.02) translateY(-1px)"
                  : "scale(1) translateY(0)",
                boxShadow:
                  variant === "embossed"
                    ? isPressed
                      ? `
                        inset -1px 0px 0.5px rgba(22, 0, 83, 0.3),
                        inset 1px 0px 1px rgba(255, 255, 255, 0.15),
                        inset 0 -2px 1px rgba(21, 0, 83, 0.5),
                        inset 0 1px 1px rgba(255, 255, 255, 0.25)
                      `
                      : `
                        inset -2px -1px 0.5px rgba(22, 0, 83, 0.2),
                        inset 2px 1px 1px rgba(255, 255, 255, 0.2),
                        inset 0 -4px 1px rgba(21, 0, 83, 0.4),
                        inset 0 3px 1px rgba(255, 255, 255, 0.36)
                      `
                    : isPressed
                    ? `
                      inset -1px 0px 0.5px rgba(0, 0, 0, 0.2),
                      inset 1px 0px 1px rgba(255, 255, 255, 0.4),
                      inset 0 -2px 1px rgba(0, 0, 0, 0.3),
                      inset 0 1px 1px rgba(255, 255, 255, 0.5)
                    `
                    : `
                      inset -2px -1px 0.5px rgba(0, 0, 0, 0.15),
                      inset 2px 1px 1px rgba(255, 255, 255, 0.5),
                      inset 0 -4px 1px rgba(0, 0, 0, 0.25),
                      inset 0 3px 1px rgba(255, 255, 255, 0.6)
                    `,
                transition: isBouncing
                  ? "transform 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 0.2s ease"
                  : "transform 0.075s ease, box-shadow 0.075s ease",
              }
            : undefined
        }
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
