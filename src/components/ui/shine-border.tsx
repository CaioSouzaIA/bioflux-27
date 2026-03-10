import * as React from "react";

import { cn } from "@/lib/utils";

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  borderWidth?: number;
  duration?: number;
  shineColor?: string | string[];
}

export function ShineBorder({
  className,
  borderWidth = 2,
  duration = 6,
  shineColor = "white",
  style,
  ...props
}: ShineBorderProps) {
  const colors = Array.isArray(shineColor) ? shineColor : [shineColor];
  const gradientStops = colors.join(", ");

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] animate-spin",
        className
      )}
      style={{
        padding: borderWidth,
        animationDuration: `${duration}s`,
        backgroundImage: `conic-gradient(from 0deg, transparent 0deg, ${gradientStops}, transparent 360deg)`,
        WebkitMask:
          "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
        ...style,
      }}
      {...props}
    />
  );
}
