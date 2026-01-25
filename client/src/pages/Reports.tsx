import { useApp } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { logs, fridges } = useApp();
  const { t } = useTranslation();
  const { toast } = useToast();

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("HACCP Temperature Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 30);
    
    let y = 40;
    
    fridges.forEach(fridge => {
      doc.setFont("helvetica", "bold");
      doc.text(`Unit: ${fridge.name}`, 14, y);
      y += 6;
      
      const fridgeLogs = logs.filter(l => l.fridgeId === fridge.id).slice(0, 10);
      
      fridgeLogs.forEach(log => {
        doc.setFont("helvetica", "normal");
        const line = `${format(new Date(log.timestamp), "yyyy-MM-dd HH:mm")} | ${log.temperature}°C | ${log.user} | ${log.status}`;
        doc.text(line, 20, y);
        y += 5;
      });
      
      y += 10;
    });

    doc.save("haccp-report.pdf");
    toast({ title: t("exportComplete"), description: "HACCP Report downloaded." });
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-heading font-bold">{t("reports")}</h1>
      
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly HACCP Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Export all temperature records for the past 7 days for audit compliance.</p>
            <div className="flex gap-2">
              <Button onClick={handleExportPDF} className="flex-1">
                <FileText className="mr-2 h-4 w-4" /> {t("exportPDF")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Allergen Matrix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Download current menu allergen overview.</p>
             <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => toast({ title: t("comingSoon"), description: "This report is not yet implemented in mock." })}>
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
