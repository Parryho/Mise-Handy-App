import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Users, Baby, ChevronLeft, ChevronRight, PlusCircle, Pencil, Trash2, Download, FileSpreadsheet, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface GuestCount {
  id: number;
  date: string;
  meal: string;
  adults: number;
  children: number;
  notes: string | null;
}

interface CateringEvent {
  id: number;
  clientName: string;
  eventName: string;
  date: string;
  time: string;
  personCount: number;
  dishes: string[];
  notes: string | null;
}

const MEALS = [
  { key: "breakfast", de: "Frühstück", en: "Breakfast" },
  { key: "lunch", de: "Mittagessen", en: "Lunch" },
  { key: "dinner", de: "Abendessen", en: "Dinner" },
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

function getMonthDates(baseDate: Date): Date[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const dates: Date[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export default function Guests() {
  return (
    <div className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-heading font-bold">Gäste & Catering</h1>
      
      <Tabs defaultValue="guests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guests">Gästezahlen</TabsTrigger>
          <TabsTrigger value="catering">Catering</TabsTrigger>
        </TabsList>
        
        <TabsContent value="guests" className="mt-4">
          <GuestCountsView />
        </TabsContent>
        
        <TabsContent value="catering" className="mt-4">
          <CateringView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GuestCountsView() {
  const [baseDate, setBaseDate] = useState(new Date());
  const [counts, setCounts] = useState<GuestCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const { toast } = useToast();

  const getDates = () => {
    if (viewMode === "day") return [baseDate];
    if (viewMode === "month") return getMonthDates(baseDate);
    return getWeekDates(baseDate);
  };

  const dates = getDates();
  const startDate = formatDate(dates[0]);
  const endDate = formatDate(dates[dates.length - 1]);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guests?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      setCounts(data);
    } catch (error) {
      console.error('Failed to fetch guests:', error);
      toast({ title: "Fehler beim Laden", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [startDate, endDate]);

  const getCount = (date: string, meal: string) => {
    return counts.find(c => c.date === date && c.meal === meal);
  };

  const navigate = (direction: number) => {
    const d = new Date(baseDate);
    if (viewMode === "day") d.setDate(d.getDate() + direction);
    else if (viewMode === "week") d.setDate(d.getDate() + direction * 7);
    else d.setMonth(d.getMonth() + direction);
    setBaseDate(d);
  };

  const getDateLabel = () => {
    if (viewMode === "day") {
      return baseDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
    if (viewMode === "month") {
      return baseDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    }
    return `${dates[0].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} - ${dates[dates.length - 1].toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };

  const getTotalForPeriod = () => {
    let adults = 0, children = 0;
    for (const count of counts) {
      adults += count.adults;
      children += count.children;
    }
    return { adults, children, total: adults + children };
  };

  const periodTotals = getTotalForPeriod();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as any)} size="sm" data-testid="guests-view-toggle">
          <ToggleGroupItem value="day" data-testid="toggle-view-day">Tag</ToggleGroupItem>
          <ToggleGroupItem value="week" data-testid="toggle-view-week">Woche</ToggleGroupItem>
          <ToggleGroupItem value="month" data-testid="toggle-view-month">Monat</ToggleGroupItem>
        </ToggleGroup>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1" data-testid="button-export">
              <Download className="h-4 w-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => window.open(`/api/guest-counts/export?start=${startDate}&end=${endDate}&format=pdf`, '_blank')}>
              <Download className="h-4 w-4 mr-2" /> PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`/api/guest-counts/export?start=${startDate}&end=${endDate}&format=xlsx`, '_blank')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} data-testid="button-nav-prev">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-sm text-center" data-testid="text-date-label">{getDateLabel()}</span>
        <Button variant="outline" size="icon" onClick={() => navigate(1)} data-testid="button-nav-next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : viewMode === "month" ? (
        <MonthView dates={dates} counts={counts} getCount={getCount} onSave={fetchCounts} />
      ) : (
        <div className="space-y-4">
          {MEALS.map(meal => (
            <Card key={meal.key}>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm font-medium">{meal.de}</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className={`grid gap-1 text-center text-xs ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
                  {dates.map((date, idx) => {
                    const dateStr = formatDate(date);
                    const count = getCount(dateStr, meal.key);
                    const isToday = formatDate(new Date()) === dateStr;
                    const dayIdx = date.getDay() === 0 ? 6 : date.getDay() - 1;
                    
                    return (
                      <GuestCell 
                        key={dateStr}
                        date={dateStr}
                        dayName={WEEKDAYS[dayIdx]}
                        dayNum={date.getDate()}
                        meal={meal.key}
                        count={count}
                        isToday={isToday}
                        onSave={fetchCounts}
                        showDayName={viewMode === "week"}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-secondary/30">
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground mb-2">Gesamtsumme ({viewMode === "day" ? "Tag" : viewMode === "week" ? "Woche" : "Monat"})</div>
          <div className="flex justify-around text-center">
            <div>
              <div className="text-2xl font-bold">{periodTotals.total}</div>
              <div className="text-xs text-muted-foreground">Gesamt</div>
            </div>
            <div>
              <div className="text-lg font-medium">{periodTotals.adults}</div>
              <div className="text-xs text-muted-foreground">Erwachsene</div>
            </div>
            <div>
              <div className="text-lg font-medium">{periodTotals.children}</div>
              <div className="text-xs text-muted-foreground">Kinder</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MonthView({ dates, counts, getCount, onSave }: {
  dates: Date[];
  counts: GuestCount[];
  getCount: (date: string, meal: string) => GuestCount | undefined;
  onSave: () => void;
}) {
  const firstDayOffset = dates[0].getDay() === 0 ? 6 : dates[0].getDay() - 1;
  
  const getDayTotal = (dateStr: string) => {
    let total = 0;
    MEALS.forEach(meal => {
      const count = getCount(dateStr, meal.key);
      total += (count?.adults || 0) + (count?.children || 0);
    });
    return total;
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array(firstDayOffset).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="h-16" />
        ))}
        {dates.map(date => {
          const dateStr = formatDate(date);
          const isToday = formatDate(new Date()) === dateStr;
          const total = getDayTotal(dateStr);
          
          return (
            <MonthDayCell 
              key={dateStr}
              date={dateStr}
              dayNum={date.getDate()}
              isToday={isToday}
              total={total}
              getCount={getCount}
              onSave={onSave}
            />
          );
        })}
      </div>
    </div>
  );
}

function MonthDayCell({ date, dayNum, isToday, total, getCount, onSave }: {
  date: string;
  dayNum: number;
  isToday: boolean;
  total: number;
  getCount: (date: string, meal: string) => GuestCount | undefined;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`h-16 p-1 rounded border text-center ${isToday ? 'border-primary bg-primary/10' : 'border-border'} hover:bg-secondary/50 transition-colors`}>
          <div className="text-xs text-muted-foreground">{dayNum}</div>
          <div className="text-lg font-bold">{total || '-'}</div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{new Date(date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {MEALS.map(meal => {
            const count = getCount(date, meal.key);
            return (
              <MealInputRow 
                key={meal.key}
                date={date}
                meal={meal.key}
                mealName={meal.de}
                count={count}
                onSave={() => { setOpen(false); onSave(); }}
              />
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MealInputRow({ date, meal, mealName, count, onSave }: {
  date: string;
  meal: string;
  mealName: string;
  count: GuestCount | undefined;
  onSave: () => void;
}) {
  const [adults, setAdults] = useState(String(count?.adults || 0));
  const [children, setChildren] = useState(String(count?.children || 0));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, meal, adults: parseInt(adults) || 0, children: parseInt(children) || 0 })
      });
      toast({ title: "Gespeichert" });
      onSave();
    } catch (error: any) {
      toast({ title: "Fehler", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">{mealName}</div>
      <div className="flex gap-2 items-center">
        <Input type="number" value={adults} onChange={(e) => setAdults(e.target.value)} min="0" className="w-16 h-8 text-center" placeholder="Erw" />
        <span className="text-xs text-muted-foreground">+</span>
        <Input type="number" value={children} onChange={(e) => setChildren(e.target.value)} min="0" className="w-16 h-8 text-center" placeholder="Kind" />
        <Button size="sm" onClick={handleSave} disabled={saving} className="h-8">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
        </Button>
      </div>
    </div>
  );
}

function GuestCell({ date, dayName, dayNum, meal, count, isToday, onSave, showDayName }: {
  date: string;
  dayName: string;
  dayNum: number;
  meal: string;
  count: GuestCount | undefined;
  isToday: boolean;
  onSave: () => void;
  showDayName: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [adults, setAdults] = useState(String(count?.adults || 0));
  const [children, setChildren] = useState(String(count?.children || 0));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setAdults(String(count?.adults || 0));
    setChildren(String(count?.children || 0));
  }, [count]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          meal,
          adults: parseInt(adults) || 0,
          children: parseInt(children) || 0
        })
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

  const total = (count?.adults || 0) + (count?.children || 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`p-1 rounded border ${isToday ? 'border-primary bg-primary/10' : 'border-border'} hover:bg-secondary/50 transition-colors`}>
          {showDayName && <div className="text-[10px] text-muted-foreground">{dayName}</div>}
          <div className="font-bold text-lg">{total || '-'}</div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{dayName}, {dayNum}. - {meal === 'breakfast' ? 'Frühstück' : meal === 'lunch' ? 'Mittagessen' : 'Abendessen'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Users className="h-3 w-3" /> Erwachsene</Label>
              <Input type="number" value={adults} onChange={(e) => setAdults(e.target.value)} min="0" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Baby className="h-3 w-3" /> Kinder</Label>
              <Input type="number" value={children} onChange={(e) => setChildren(e.target.value)} min="0" />
            </div>
          </div>
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CateringView() {
  const [events, setEvents] = useState<CateringEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/catering');
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch catering:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Catering-Event wirklich löschen?")) return;
    try {
      await fetch(`/api/catering/${id}`, { method: 'DELETE' });
      toast({ title: "Gelöscht" });
      fetchEvents();
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddCateringDialog onSave={fetchEvents} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Keine Catering-Events vorhanden
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <Card key={event.id}>
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{event.eventName}</div>
                    <div className="text-sm text-muted-foreground">{event.clientName}</div>
                    <div className="text-xs mt-1">
                      {new Date(event.date).toLocaleDateString('de-DE')} um {event.time} Uhr
                    </div>
                    <div className="text-xs text-muted-foreground">{event.personCount} Personen</div>
                    {event.dishes.length > 0 && (
                      <div className="text-xs mt-1 text-primary">{event.dishes.join(', ')}</div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <EditCateringDialog event={event} onSave={fetchEvents} />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AddCateringDialog({ onSave }: { onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [eventName, setEventName] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [time, setTime] = useState("12:00");
  const [personCount, setPersonCount] = useState("10");
  const [dishes, setDishes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/catering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          eventName,
          date,
          time,
          personCount: parseInt(personCount) || 0,
          dishes: dishes.split(',').map(d => d.trim()).filter(Boolean)
        })
      });
      toast({ title: "Event erstellt" });
      setOpen(false);
      setClientName("");
      setEventName("");
      setDishes("");
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
          <PlusCircle className="h-4 w-4" /> Neues Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Catering-Event hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Kunde</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="z.B. Arbeiterkammer" required />
          </div>
          <div className="space-y-2">
            <Label>Event-Name</Label>
            <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="z.B. Firmenjubiläum" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Uhrzeit</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Personenzahl</Label>
            <Input type="number" value={personCount} onChange={(e) => setPersonCount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Speisen (kommagetrennt)</Label>
            <Input value={dishes} onChange={(e) => setDishes(e.target.value)} placeholder="Vorspeise, Hauptgang, Dessert" />
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

function EditCateringDialog({ event, onSave }: { event: CateringEvent; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState(event.clientName);
  const [eventName, setEventName] = useState(event.eventName);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time);
  const [personCount, setPersonCount] = useState(String(event.personCount));
  const [dishes, setDishes] = useState(event.dishes.join(', '));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`/api/catering/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          eventName,
          date,
          time,
          personCount: parseInt(personCount) || 0,
          dishes: dishes.split(',').map(d => d.trim()).filter(Boolean)
        })
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
        <Button size="icon" variant="ghost" className="h-7 w-7">
          <Pencil className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Event bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label>Kunde</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Event-Name</Label>
            <Input value={eventName} onChange={(e) => setEventName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Uhrzeit</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Personenzahl</Label>
            <Input type="number" value={personCount} onChange={(e) => setPersonCount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Speisen (kommagetrennt)</Label>
            <Input value={dishes} onChange={(e) => setDishes(e.target.value)} />
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
