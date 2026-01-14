import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import React from "react";

interface DashboardCardProps {
  heading: string;
  figure?: number;
  figureText?: string;
  isAddCard?: boolean;
  icon?: React.ReactNode;
  accent?: string;
}

const DashboardCard = ({
  heading,
  figure,
  figureText,
  isAddCard,
  icon,
  accent,
}: DashboardCardProps) => {
  const accentColor = accent || "orange";
  const accentClass =
    accentClassMap[accentColor as keyof typeof accentClassMap] ??
    accentClassMap.orange;

  const iconBgClass =
    {
      orange: "bg-orange-100/50 text-orange-600",
      green: "bg-emerald-100/50 text-emerald-600",
      blue: "bg-blue-100/50 text-blue-600",
      red: "bg-red-100/50 text-red-600",
      purple: "bg-purple-100/50 text-purple-600",
    }[accentColor] || "bg-orange-100/50 text-orange-600";

  const gradientClass =
    {
      orange: "from-orange-500",
      green: "from-emerald-500",
      blue: "from-blue-500",
      red: "from-red-500",
      purple: "from-purple-500",
    }[accentColor] || "from-orange-500";

  const accentLineClass =
    {
      orange: "from-orange-500 to-orange-300",
      green: "from-emerald-500 to-emerald-300",
      blue: "from-blue-500 to-blue-300",
      red: "from-red-500 to-red-300",
      purple: "from-purple-500 to-purple-300",
    }[accentColor] || "from-orange-500 to-orange-300";

  return (
    <Card className="relative overflow-hidden rounded-xl bg-gradient-to-br from-card to-card/50 shadow-md border border-border/50 hover:shadow-lg hover:border-border transition-all duration-300 cursor-pointer w-full h-auto p-6 flex flex-col justify-between group">
      {/* Accent gradient background */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br ${gradientClass} to-transparent pointer-events-none`}
      ></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex flex-row items-start justify-between gap-4 mb-6">
          <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-widest leading-tight flex-1">
            {heading}
          </CardTitle>
          {icon && (
            <div
              className={`p-2 rounded-lg ${iconBgClass} [&>svg]:h-5 [&>svg]:w-5 flex-shrink-0`}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex items-end">
          {isAddCard ? (
            <div className="flex items-center gap-4 w-full group/add">
              <div className="grid h-12 w-12 place-items-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 group-hover/add:border-muted-foreground/50 group-hover/add:bg-muted/40 transition-all">
                <Plus className="h-5 w-5 text-muted-foreground/60" />
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-foreground">Add new</div>
                <div className="text-xs text-muted-foreground/80">
                  Create in seconds
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <p
                className={`text-4xl font-black tracking-tighter ${accentClass} drop-shadow-sm`}
              >
                {figureText ?? figure?.toLocaleString() ?? "—"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${accentLineClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      ></div>
    </Card>
  );
};

export default DashboardCard;

const accentClassMap = {
  orange: "text-orange-600",
  green: "text-emerald-600",
  blue: "text-blue-600",
  red: "text-red-600",
  purple: "text-purple-600",
} as const;
