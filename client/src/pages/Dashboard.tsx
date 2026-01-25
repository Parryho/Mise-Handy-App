import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChefHat, ThermometerSnowflake, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { recipes, logs, fridges } = useApp();

  const warnings = logs.filter(l => l.status === "WARNING" || l.status === "CRITICAL").length;
  const todaysLogs = logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length;
  const pendingChecks = fridges.length * 2 - todaysLogs; // Assuming 2 checks per day per fridge

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ChefMate</h1>
          <p className="text-sm text-muted-foreground">Kitchen Overview</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <span className="font-heading font-bold text-primary">CM</span>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/haccp">
          <div className="bg-gradient-to-br from-primary to-blue-600 rounded-xl p-4 text-white shadow-lg cursor-pointer active:scale-95 transition-transform">
            <div className="flex justify-between items-start mb-2">
              <ThermometerSnowflake className="h-6 w-6 opacity-80" />
              {warnings > 0 && <Badge variant="destructive" className="h-5 px-1.5">{warnings}</Badge>}
            </div>
            <div className="text-2xl font-heading font-bold">{pendingChecks > 0 ? pendingChecks : 0}</div>
            <div className="text-xs opacity-90">Pending Temp Checks</div>
          </div>
        </Link>
        
        <Link href="/recipes">
          <div className="bg-white dark:bg-card border border-border rounded-xl p-4 shadow-sm cursor-pointer active:scale-95 transition-transform">
            <div className="flex justify-between items-start mb-2">
              <ChefHat className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-heading font-bold text-foreground">{recipes.length}</div>
            <div className="text-xs text-muted-foreground">Active Recipes</div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-2">
           <Link href="/haccp">
            <div className="flex items-center p-3 bg-white dark:bg-card border border-border rounded-lg shadow-sm hover:bg-secondary/50 transition-colors">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center mr-3">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">Log Temperatures</div>
                <div className="text-xs text-muted-foreground">Morning Check</div>
              </div>
            </div>
           </Link>
        </div>
      </div>

      {/* Recent Activity / Status */}
      <div>
        <h2 className="text-lg font-heading font-semibold mb-3">Kitchen Status</h2>
        <div className="space-y-3">
          {logs.slice(0, 3).map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-white dark:bg-card border border-border rounded-lg text-sm">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${log.status === 'OK' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="font-medium">Fridge: {log.fridgeId}</div>
                  <div className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {log.user}</div>
                </div>
              </div>
              <div className="font-mono font-bold">
                {log.temperature}°C
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
