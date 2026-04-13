import { cn } from "@/lib/utils";

const PROFILE_LINES = [
  "Formats: PNG, WebP, or JPEG",
  "Max size: 2 MB",
  "Max dimensions: 2000 × 2000 px",
];

const BANNER_LINES = [
  "Formats: PNG, WebP, or JPEG",
  "Max size: 2 MB",
  "Max dimensions: 3000 × 2000 px",
  "Aspect ratio: 5 : 3 (e.g. 1000 × 600)",
];

type UploadRequirementHintProps = {
  variant: "profile" | "banner";
  className?: string;
};

export function UploadRequirementHint({
  variant,
  className,
}: UploadRequirementHintProps) {
  const lines = variant === "profile" ? PROFILE_LINES : BANNER_LINES;
  return (
    <div
      className={cn(
        "rounded-md border border-cs-border/80 bg-muted/40 px-3 py-2 text-xs text-cs-text leading-relaxed",
        className,
      )}
      role="note"
    >
      <p className="font-medium text-cs-heading mb-1">Requirements</p>
      <ul className="list-disc space-y-0.5 pl-4">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
