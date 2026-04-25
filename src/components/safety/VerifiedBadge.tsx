import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function VerifiedBadge({ className, size = "sm" }: { className?: string; size?: "sm" | "md" }) {
  const px = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex items-center text-primary", className)} aria-label="Verified tutor">
          <BadgeCheck className={cn(px, "fill-primary text-primary-foreground")} />
        </span>
      </TooltipTrigger>
      <TooltipContent>Verified tutor — identity confirmed</TooltipContent>
    </Tooltip>
  );
}