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

  return (
    <Card className="rounded-xl bg-white shadow-sm border hover:shadow-lg transition-all cursor-pointer w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{heading}</CardTitle>
        {icon && <div className="text-gray-500">{icon}</div>}
      </CardHeader>

      <CardContent>
        {isAddCard ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Plus className="w-8 h-8" />
            <span className="text-base">Add New</span>
          </div>
        ) : (
          <p className={`text-3xl font-bold text-${accentColor}-600`}>
            {figure?.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;
