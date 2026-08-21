import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface LimitedInputProps extends React.ComponentProps<"input"> {
  maxLength?: number;
}

export const LimitedInput = React.forwardRef<HTMLInputElement, LimitedInputProps>(
  ({ className, maxLength = 40, defaultValue, value: propValue, onChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(propValue ?? defaultValue ?? "");

    // Sync with external value if controlled
    React.useEffect(() => {
        if (propValue !== undefined) {
            setInternalValue(propValue);
        }
    }, [propValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      if (onChange) {
        onChange(e);
      }
    };

    const currentValue = propValue !== undefined ? propValue : internalValue;
    const isExhausted = currentValue.toString().length >= maxLength;

    return (
      <div className="relative flex flex-col gap-1">
        <Input
          ref={ref}
          maxLength={maxLength}
          value={propValue}
          defaultValue={propValue === undefined ? defaultValue : undefined}
          onChange={handleChange}
          className={cn(
            className,
            isExhausted && "border-red-500 ring-1 ring-red-500 focus-visible:ring-red-500 focus-visible:border-red-500 aria-invalid:border-red-500"
          )}
          {...props}
        />
        {isExhausted && (
          <span className="text-[10px] font-bold text-red-500">
            Zeichenlimit erreicht ({maxLength})
          </span>
        )}
      </div>
    );
  }
);

LimitedInput.displayName = "LimitedInput"
