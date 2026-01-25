import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight, PlusCircle, Pencil, Trash2, UserPlus, Calendar, Palmtree, Pill, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface Staff {
  id: number;
  name: string;
  role: string;
  color: string;
  email: string | null;
  phone: string | null;
}

interface ScheduleEntry {
  id: number;
  staffId: number;
  date: string;
  type: string;
  shift: string | null;
  notes: string | null;
}

const SHIFTS = [
  { key: "early", de: "Früh", icon: "🌅" },
  { key: "late", de: "Spät", icon: "🌆" },
  { key: "night", de: "Nacht", icon: "🌙" },
];

const ENTRY_TYPES = [
  { key: "shift", de: "Schicht", color: "bg-primary" },
  { key: "vacation", de: "Urlaub", color: "bg-green-500" },
  { key: "sick", de: "Krank", color: "bg-orange-500" },
  { key: "off", de: "Frei", color: "bg-gray-400" },
];

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - (day === 0 ? 6 : day - 1));
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function Schedule() {
  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-heading font-bold">Dienstplan</h1>
      
      <Tabs defaultValue="schedule" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule">Wochenplan</TabsTrigger>
          <TabsTrigger value="staff">Mitarbeiter</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule" className="mt-4">
          <ScheduleView />
        </TabsContent>
        
        <TabsContent value="staff" className="mt-4">
          <StaffView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScheduleView() {
  const [baseDate, setBaseDate] = useState(new Date());
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const weekDates = getWeekDates(baseDate);
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, entriesRes] = await Promise.all([
        fetch('/api/staff'),
        fetch(`/api/schedule?start=${startDate}&end=${endDate}`)
      ]);
      const staffData = await staffRes.json();
      const entriesData = await entriesRes.json();
      setStaffList(staffData);
      setEntries(entriesData);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const getEntry = (staffId: number, date: string) => {
    return entries.find(e => e.staffId === staffId && e.date === date);
  };

  const prevWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - 7);
    setBaseDate(d);
  };

  const nextWeek = () => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 7);
    setBaseDate(d);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-sm">
          KW {getWeekNumber(weekDates[0])} • {weekDates[0].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} - {weekDates[6].toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <Button variant="outline" size="icon" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Mitarbeiter vorhanden. Bitte zuerst Mitarbeiter anlegen.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 w-24">Mitarbeiter</th>
                {weekDates.map((date, idx) => {
                  const isToday = formatDate(new Date()) === formatDate(date);
                  return (
                    <th key={idx} className={`p-1 text-center min-w-[60px] ${isToday ? 'bg-primary/10' : ''}`}>
                      <div className="text-muted-foreground">{WEEKDAYS[idx]}</div>
                      <div className="font-bold">{date.getDate()}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {staffList.map(staff => (
                <tr key={staff.id} className="border-b">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: staff.color }} />
                      <span className="font-medium truncate max-w-[80px]">{staff.name}</span>
                    </div>
                  </td>
                  {weekDates.map((date, idx) => {
                    const dateStr = formatDate(date);
                    const entry = getEntry(staff.id, dateStr);
                    const isToday = formatDate(new Date()) === dateStr;
                    
                    return (
                      <ScheduleCell 
                        key={dateStr}
                        staffId={staff.id}
                        date={dateStr}
                        entry={entry}
                        staffColor={staff.color}
                        isToday={isToday}
                        onSave={fetchData}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2 flex-wrap text-[10px]">
        {ENTRY_TYPES.map(type => (
          <Badge key={type.key} variant="outline" className="gap-1">
            <div className={`w-2 h-2 rounded-full ${type.color}`} />
            {type.de}
          </Badge>
        ))}
        <div className="border-l mx-2" />
        {SHIFTS.map(shift => (
          <Badge key={shift.key} variant="outline">
            {shift.icon} {shift.de}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ScheduleCell({ staffId, date, entry, staffColor, isToday, onSave }: {
  staffId: number;
  date: string;
  entry: ScheduleEntry | undefined;
  staffColor: string;
  isToday: boolean;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(entry?.type || "shift");
  const [shift, setShift] = useState(entry?.shift || "early");
  const [notes, setNotes] = useState(entry?.notes || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setType(entry?.type || "shift");
    setShift(entry?.shift || "early");
    setNotes(entry?.notes || "");
  }, [entry]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (entry) {
        await fetch(`/api/schedule/${entry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, shift: type === 'shift' ? shift : null, notes: notes || null })
        });
      } else {
        await fetch('/api/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffId, date, type, shift: type === 'shift' ? shift : null, notes: notes || null })
        });
      }
      toast({ title: "Gespeichert" });
      setOpen(false);
      onSave();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    setSaving(true);
    try {
      await fetch(`/api/schedule/${entry.id}`, { method: 'DELETE' });
      toast({ title: "Gelöscht" });
      setOpen(false);
      onSave();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getDisplayContent = () => {
    if (!entry) return <span className="text-muted-foreground">-</span>;
    
    const typeInfo = ENTRY_TYPES.find(t => t.key === entry.type);
    if (entry.type === 'shift') {
      const shiftInfo = SHIFTS.find(s => s.key === entry.shift);
      return <span>{shiftInfo?.icon || '📅'}</span>;
    }
    if (entry.type === 'vacation') return <Palmtree className="h-3 w-3 text-green-500" />;
    if (entry.type === 'sick') return <Pill className="h-3 w-3 text-orange-500" />;
    return <X className="h-3 w-3 text-gray-400" />;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <td className={`p-1 text-center cursor-pointer hover:bg-secondary/50 transition-colors ${isToday ? 'bg-primary/5' : ''}`}>
          <div 
            className="h-8 rounded flex items-center justify-center text-lg"
            style={entry ? { backgroundColor: entry.type === 'shift' ? staffColor + '20' : undefined } : {}}
          >
            {getDisplayContent()}
          </div>
        </td>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{new Date(date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Typ</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTRY_TYPES.map(t => (
                  <SelectItem key={t.key} value={t.key}>{t.de}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {type === 'shift' && (
            <div className="space-y-2">
              <Label>Schicht</Label>
              <Select value={shift} onValueChange={setShift}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHIFTS.map(s => (
                    <SelectItem key={s.key} value={s.key}>{s.icon} {s.de}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notizen</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Speichern
            </Button>
            {entry && (
              <Button variant="destructive" size="icon" onClick={handleDelete} disabled={saving}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StaffView() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      setStaffList(data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Mitarbeiter wirklich löschen? Alle zugehörigen Dienstplan-Einträge werden ebenfalls gelöscht.")) return;
    try {
      await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      toast({ title: "Gelöscht" });
      fetchStaff();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddStaffDialog onSave={fetchStaff} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Mitarbeiter vorhanden
        </div>
      ) : (
        <div className="space-y-2">
          {staffList.map(member => (
            <Card key={member.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: member.color }}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.role}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <EditStaffDialog member={member} onSave={fetchStaff} />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(member.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddStaffDialog({ onSave }: { onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Koch");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, color })
      });
      toast({ title: "Mitarbeiter hinzugefügt" });
      setOpen(false);
      setName("");
      onSave();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <UserPlus className="h-4 w-4" /> Neuer Mitarbeiter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mitarbeiter hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Max Mustermann" required />
          </div>
          <div className="space-y-2">
            <Label>Rolle</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Koch">Koch</SelectItem>
                <SelectItem value="Sous-Chef">Sous-Chef</SelectItem>
                <SelectItem value="Küchenchef">Küchenchef</SelectItem>
                <SelectItem value="Beikoch">Beikoch</SelectItem>
                <SelectItem value="Auszubildender">Auszubildender</SelectItem>
                <SelectItem value="Küchenhilfe">Küchenhilfe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Farbe</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Speichern
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditStaffDialog({ member, onSave }: { member: Staff; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role);
  const [color, setColor] = useState(member.color);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/staff/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, color })
      });
      toast({ title: "Gespeichert" });
      setOpen(false);
      onSave();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Rolle</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Koch">Koch</SelectItem>
                <SelectItem value="Sous-Chef">Sous-Chef</SelectItem>
                <SelectItem value="Küchenchef">Küchenchef</SelectItem>
                <SelectItem value="Beikoch">Beikoch</SelectItem>
                <SelectItem value="Auszubildender">Auszubildender</SelectItem>
                <SelectItem value="Küchenhilfe">Küchenhilfe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Farbe</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Speichern
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
