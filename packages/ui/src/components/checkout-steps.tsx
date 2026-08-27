import { cn } from "../lib/cn";

export function CheckoutSteps({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <ol className="flex items-center gap-4">
      {steps.map((step, index) => {
        const isCurrent = index === currentStep;
        const isComplete = index < currentStep;
        return (
          <li
            key={step}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 text-sm",
              isCurrent && "font-semibold text-foreground",
              !isCurrent && !isComplete && "text-muted",
              isComplete && "text-brand"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs",
                isCurrent && "border-brand text-brand",
                isComplete && "border-brand bg-brand text-brand-foreground"
              )}
            >
              {index + 1}
            </span>
            {step}
          </li>
        );
      })}
    </ol>
  );
}
