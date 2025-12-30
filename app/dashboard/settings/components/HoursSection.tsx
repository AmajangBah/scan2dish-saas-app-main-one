import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OpeningHours() {
  return (
    <div className="space-y-6 animate-fadeIn p-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Opening Hours</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Opening hours are not configurable yet.
        </p>
      </div>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            This feature will be enabled once opening hours are stored in the database.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
