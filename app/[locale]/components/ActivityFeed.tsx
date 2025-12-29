"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Bell } from "lucide-react";
import { ActivityItem } from "@/types/activity";

interface Props {
  activities: ActivityItem[];
}

export default function ActivityFeed({ activities }: Props) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border w-full">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {activities.map((activity) => {
          const firstItem = activity.items?.[0];
          const fallback = firstItem ? firstItem.name[0].toUpperCase() : "•";

          return (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-orange-100 text-orange-700">
                    {fallback}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-medium">
                    Table {activity.table} ordered {activity.items.length} item
                    {activity.items.length > 1 ? "s" : ""}
                  </p>

                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {activity.time}
                  </span>
                </div>
              </div>

              <Bell className="text-orange-600" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
