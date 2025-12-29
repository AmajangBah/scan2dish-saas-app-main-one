import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import React from "react";

interface DashboardCardProps {
  heading: string;
  figure?: number;
  isAddCard?: boolean;
  icon?: React.ReactNode;
  accent?: string; // e.g. "orange", "green", "blue"
}

const DashboardCard = ({
  heading,
  figure,
  isAddCard,
  icon,
  accent,
}: DashboardCardProps) => {
  const accentColor = accent || "orange";
  const accentClass =
    accentClassMap[accentColor as keyof typeof accentClassMap] ??
    accentClassMap.orange;

  return (
    <Card className="rounded-xl bg-card shadow-sm border hover:shadow-md transition-all cursor-pointer w-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {heading}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground [&>svg]:h-5 [&>svg]:w-5">
            {icon}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isAddCard ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="grid h-10 w-10 place-items-center rounded-lg border bg-muted/30">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-foreground">
                Add new
              </div>
              <div className="text-xs">Create in seconds</div>
            </div>
          </div>
        ) : (
          <p className={`text-3xl font-semibold tracking-tight ${accentClass}`}>
            {figure?.toLocaleString() ?? "—"}
          </p>
        )}
      </CardContent>
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
