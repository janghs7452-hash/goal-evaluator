import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export function ScoreBadge({ score }: { score: number }) {
  let variant: "success" | "warning" | "destructive" | "default" = "default";
  
  if (score >= 4.0) variant = "success";
  else if (score >= 3.0) variant = "warning";
  else if (score > 0) variant = "destructive";

  return (
    <Badge variant={variant} className="flex items-center gap-1 px-3 py-1 text-sm font-bold shadow-sm">
      <Star className="w-3.5 h-3.5 fill-current" />
      {score.toFixed(1)}
    </Badge>
  );
}
