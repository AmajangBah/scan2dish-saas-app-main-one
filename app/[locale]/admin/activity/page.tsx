/**
 * Admin: Activity Logs
 * View all admin actions and activity
 */

import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  CheckCircle,
  XCircle,
  DollarSign,
  Eye,
  Settings,
  Activity,
} from "lucide-react";

export default async function AdminActivity() {
  await requireAdmin();
  const supabase = await createClient();

  // Get activity logs
  const { data: logs } = await supabase
    .from("admin_activity_logs")
    .select(
      `
      *,
      admin:admin_users!admin_id(id, full_name, email),
      restaurant:restaurants!restaurant_id(id, name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-gray-600 mt-1">
          Audit trail of all admin actions
        </p>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {logs?.map((log) => (
            <div
              key={log.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <ActivityIcon action={log.action_type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {formatActionType(log.action_type)}
                      </h3>
                      {log.restaurant && (
                        <p className="text-sm text-gray-600 mt-1">
                          Restaurant: {log.restaurant.name}
                        </p>
                      )}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500 flex-shrink-0">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-xs">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span className="font-medium">
                      {log.admin?.full_name || "Unknown Admin"}
                    </span>
                    <span>•</span>
                    <span>{log.admin?.email}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {(!logs || logs.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No activity logs yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityIcon({ action }: { action: string }) {
  const iconClass = "h-10 w-10 p-2 rounded-lg flex-shrink-0";

  if (action.includes("enabled")) {
    return (
      <div className={`${iconClass} bg-green-100 text-green-600`}>
        <CheckCircle className="h-full w-full" />
      </div>
    );
  }
  if (action.includes("disabled")) {
    return (
      <div className={`${iconClass} bg-red-100 text-red-600`}>
        <XCircle className="h-full w-full" />
      </div>
    );
  }
  if (action.includes("payment")) {
    return (
      <div className={`${iconClass} bg-green-100 text-green-600`}>
        <DollarSign className="h-full w-full" />
      </div>
    );
  }
  if (action.includes("viewed")) {
    return (
      <div className={`${iconClass} bg-blue-100 text-blue-600`}>
        <Eye className="h-full w-full" />
      </div>
    );
  }
  return (
    <div className={`${iconClass} bg-gray-100 text-gray-600`}>
      <Settings className="h-full w-full" />
    </div>
  );
}

function formatActionType(action: string): string {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
