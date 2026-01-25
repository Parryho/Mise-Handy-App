import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe } from "lucide-react";

export default function SettingsPage() {
  const { t, lang, setLang } = useTranslation();

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-heading font-bold">{t("settings")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t("language")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={lang} onValueChange={(v) => setLang(v as any)} className="space-y-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="de" id="de" />
              <Label htmlFor="de" className="font-medium">Deutsch</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="en" id="en" />
              <Label htmlFor="en" className="font-medium">English</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
