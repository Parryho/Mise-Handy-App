import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChefHat, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Register() {
  const [, setLocation] = useLocation();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [position, setPosition] = useState("");
  const [positions, setPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/auth/positions")
      .then(res => res.json())
      .then(data => setPositions(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    if (password !== confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen haben");
      setLoading(false);
      return;
    }
    
    const result = await register({ name, email, password, position });
    setLoading(false);
    
    if (result.success) {
      setSuccess(result.message || "Registrierung erfolgreich! Bitte warten Sie auf die Freischaltung.");
    } else {
      setError(result.error || "Registrierung fehlgeschlagen");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <ChefHat className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-heading">Registrierung</CardTitle>
          <CardDescription>Erstellen Sie Ihr ChefMate-Konto</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
              </Alert>
              <Button onClick={() => setLocation("/login")} className="w-full" data-testid="button-to-login">
                Zur Anmeldung
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Max Mustermann"
                  required 
                  data-testid="input-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input 
                  id="email"
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="ihre@email.at"
                  required 
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Küchenposition</Label>
                <Select value={position} onValueChange={setPosition} required>
                  <SelectTrigger data-testid="select-position">
                    <SelectValue placeholder="Position wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input 
                  id="password"
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mind. 6 Zeichen"
                  required 
                  data-testid="input-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input 
                  id="confirmPassword"
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  data-testid="input-confirm-password"
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={loading || !position} data-testid="button-register">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Registrieren
              </Button>
            </form>
          )}
          
          {!success && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Bereits registriert?{" "}
              <button 
                onClick={() => setLocation("/login")} 
                className="text-primary hover:underline"
                data-testid="link-login"
              >
                Anmelden
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
