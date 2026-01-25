import { useState } from "react";
import { useApp, Fridge } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThermometerSnowflake, History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function HACCP() {
  const { fridges, logs } = useApp();
  const { t } = useTranslation();
  
  // Group logs by fridge
  const getLatestLog = (fridgeId: string) => {
    return logs.find(l => l.fridgeId === fridgeId);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-heading font-bold">{t("haccp")}</h1>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <History className="h-3.5 w-3.5" /> {t("history")}
        </Button>
      </div>

      <div className="grid gap-4">
        {fridges.map(fridge => {
          const latest = getLatestLog(fridge.id);
          const isWarning = latest && (latest.status === "WARNING" || latest.status === "CRITICAL");

          return (
            <Card key={fridge.id} className={`overflow-hidden border-l-4 ${isWarning ? 'border-l-destructive' : 'border-l-green-500'}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-heading font-bold text-lg">{fridge.name}</h3>
                    <p className="text-xs text-muted-foreground">{t("range")}: {fridge.tempMin}°C to {fridge.tempMax}°C</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${isWarning ? 'bg-destructive/10 text-destructive' : 'bg-green-100 text-green-700'}`}>
                    {latest ? (
                      <>
                        <span className="text-lg">{latest.temperature}°C</span>
                      </>
                    ) : (
                      t("noData")
                    )}
                  </div>
                </div>

                <LogDialog fridge={fridge} />
                
                {latest && (
                   <div className="mt-3 pt-3 border-t text-[10px] text-muted-foreground flex justify-between">
                     <span>{t("lastCheck")}: {new Date(latest.timestamp).toLocaleString()}</span>
                     <span>{t("by")}: {latest.user}</span>
                   </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function LogDialog({ fridge }: { fridge: Fridge }) {
  const [temp, setTemp] = useState("");
  const { addLog } = useApp();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    const val = parseFloat(temp);
    if (isNaN(val)) return;

    const status = (val >= fridge.tempMin && val <= fridge.tempMax) ? "OK" : "WARNING";

    addLog({
      id: Math.random().toString(),
      fridgeId: fridge.id,
      temperature: val,
      timestamp: new Date().toISOString(),
      user: "Chef User", // Mock user
      status
    });

    toast({
      title: status === "OK" ? t("temperatureRecorded") : t("warningRecorded"),
      description: `Recorded ${val}°C for ${fridge.name}`,
      variant: status === "OK" ? "default" : "destructive",
    });

    setOpen(false);
    setTemp("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="secondary">
          <ThermometerSnowflake className="mr-2 h-4 w-4" /> {t("logTemperature")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t("logCheck")}: {fridge.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center p-6 bg-secondary/20 rounded-xl border border-dashed">
            <span className="text-4xl font-mono font-bold">{temp || "--"}</span>
            <span className="text-muted-foreground ml-1">°C</span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
             {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, '-'].map(n => (
               <Button key={n} variant="outline" className="h-12 text-lg" onClick={() => setTemp(prev => prev + n)}>
                 {n}
               </Button>
             ))}
             <Button variant="destructive" className="col-span-3" onClick={() => setTemp("")}>{t("clear")}</Button>
          </div>
          
          <Button className="w-full h-12 text-lg" onClick={handleSubmit} disabled={!temp}>
            {t("saveRecord")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
