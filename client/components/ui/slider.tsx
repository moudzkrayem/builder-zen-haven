import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary rounded-full" />
    </SliderPrimitive.Track>
    {/* Render one thumb per value (Radix requires one Thumb per value for range sliders) */}
    {(() => {
      // Detect controlled or uncontrolled values in a robust way
      const maybeValue = (props as any).value ?? (props as any).defaultValue;
      let values: number[] = [];
      if (Array.isArray(maybeValue)) {
        values = maybeValue as number[];
      } else if (typeof maybeValue === "number") {
        values = [maybeValue as number];
      }

      // If we couldn't detect any values, fall back to rendering a single thumb
      if (!values || values.length === 0) {
        return (
          <SliderPrimitive.Thumb
            data-index={0}
            className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 z-10"
          />
        );
      }

      // Render one thumb per detected value in order (important for Radix)
      return values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={`thumb-${i}`}
          data-index={i}
          className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 z-10"
        />
      ));
    })()}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
