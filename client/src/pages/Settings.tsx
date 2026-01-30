import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, Shield, Settings2, Check, Globe, Trash2, UserCheck, UserX, LogOut, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface UserData {
  id: string;
  name: string;
  email: string;
  position: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
}

const ROLES = [
  { key: "admin", label: "Küchenchef (Admin)", color: "bg-red-500" },
  { key: "souschef", label: "Sous-Chef", color: "bg-orange-500" },
  { key: "koch", label: "Koch", color: "bg-blue-500" },
  { key: "fruehkoch", label: "Früh-Koch", color: "bg-cyan-500" },
  { key: "lehrling", label: "Lehrling", color: "bg-green-500" },
  { key: "abwasch", label: "Abwasch", color: "bg-gray-500" },
  { key: "guest", label: "Gast", color: "bg-slate-400" },
];

export default function SettingsPage() {
  const { t, lang, setLang } = useTranslation();
  const { user, isAdmin, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">{t("settings")}</h1>
        {user && (
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Abmelden
          </Button>
        )}
      </div>

      {user && (
        <Card className="bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{user.name.charAt(0)}</span>
              </div>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.position} • {user.email}</div>
              </div>
              <Badge className="ml-auto" variant={isAdmin ? "default" : "secondary"}>
                {ROLES.find(r => r.key === user.role)?.label || user.role}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-1'}`}>
          <TabsTrigger value="general"><Globe className="h-4 w-4 mr-1" /> Sprache</TabsTrigger>
          {isAdmin && <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" /> Benutzer</TabsTrigger>}
          {isAdmin && <TabsTrigger value="visibility"><Settings2 className="h-4 w-4 mr-1" /> Sichtbarkeit</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
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
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tr" id="tr" />
                  <Label htmlFor="tr" className="font-medium">Türkçe</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="uk" id="uk" />
                  <Label htmlFor="uk" className="font-medium">Українська</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="users" className="mt-4">
            <UserManagement />
          </TabsContent>
        )}
        
        {isAdmin && (
          <TabsContent value="visibility" className="mt-4">
            <VisibilitySettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Add user form state
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("koch");
  const [addLoading, setAddLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, email: newEmail, password: newPassword, role: newRole }),
      });
      if (res.ok) {
        toast({ title: "Benutzer erstellt" });
        setAddOpen(false);
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("koch");
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: "Fehler", description: data.error, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setAddLoading(false);
    }
  };

  const handleApprove = async (userId: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: approve }),
      });
      if (res.ok) {
        toast({ title: approve ? "Benutzer freigeschaltet" : "Freischaltung aufgehoben" });
        fetchUsers();
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        toast({ title: "Rolle geändert" });
        fetchUsers();
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Benutzer wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Benutzer gelöscht" });
        fetchUsers();
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  const pendingUsers = users.filter(u => !u.isApproved);
  const activeUsers = users.filter(u => u.isApproved);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add User Button + Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2">
            <UserPlus className="h-4 w-4" /> Benutzer anlegen
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Max Mustermann" required />
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="name@email.at" required />
            </div>
            <div className="space-y-2">
              <Label>Passwort</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mind. 6 Zeichen" required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Rolle</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.key} value={role.key}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={addLoading}>
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Benutzer erstellen
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {pendingUsers.length > 0 && (
        <Card className="border-orange-500/50">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserX className="h-4 w-4 text-orange-500" />
              Warten auf Freischaltung ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-2">
              {pendingUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email} • {user.position}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => handleApprove(user.id, true)} className="h-7 gap-1" data-testid={`approve-user-${user.id}`}>
                      <Check className="h-3 w-3" /> Freischalten
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)} className="h-7" data-testid={`delete-user-${user.id}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-green-500" />
            Aktive Benutzer ({activeUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {activeUsers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Keine aktiven Benutzer
            </div>
          ) : (
            <div className="space-y-2">
              {activeUsers.map(user => {
                const roleInfo = ROLES.find(r => r.key === user.role);
                const isCurrentUser = user.id === currentUser?.id;

                return (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${roleInfo?.color || 'bg-gray-400'}`} />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {user.name}
                          {isCurrentUser && <Badge variant="outline" className="text-[10px]">Sie</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{user.email} • {user.position}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(v) => handleRoleChange(user.id, v)}
                        disabled={isCurrentUser}
                      >
                        <SelectTrigger className="w-32 h-7 text-xs" data-testid={`role-select-${user.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(role => (
                            <SelectItem key={role.key} value={role.key}>{role.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!isCurrentUser && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(user.id)} data-testid={`delete-active-${user.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VisibilitySettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const MODULES = [
    { key: "show_recipes", label: "Rezepte", description: "Rezeptdatenbank anzeigen" },
    { key: "show_menu_plan", label: "Menüplan", description: "Wochenmenü anzeigen" },
    { key: "show_guests", label: "Gästezahlen", description: "Gästeverwaltung anzeigen" },
    { key: "show_schedule", label: "Dienstplan", description: "Personalplanung anzeigen" },
    { key: "show_haccp", label: "HACCP", description: "Temperaturprotokoll anzeigen" },
  ];

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = async (key: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: enabled ? "true" : "false" }),
      });
      if (res.ok) {
        setSettings(prev => ({ ...prev, [key]: enabled ? "true" : "false" }));
        toast({ title: "Einstellung gespeichert" });
      }
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-sm">Bereiche ein-/ausblenden</CardTitle>
        <CardDescription className="text-xs">Steuern Sie, welche Bereiche für alle Benutzer sichtbar sind</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {MODULES.map(mod => (
          <div key={mod.key} className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{mod.label}</div>
              <div className="text-xs text-muted-foreground">{mod.description}</div>
            </div>
            <Switch 
              checked={settings[mod.key] !== "false"}
              onCheckedChange={(checked) => handleToggle(mod.key, checked)}
              data-testid={`switch-${mod.key}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
