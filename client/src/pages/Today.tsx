import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CalendarIcon, Plus, Trash2, Loader2, CheckCircle2, Circle, ListTodo, UtensilsCrossed } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: number;
  title: string;
  note: string | null;
  priority: string;
  status: string;
  date: string;
}

interface MenuPlanItem {
  id: number;
  date: string;
  meal: string;
  course: string;
  recipeId: number | null;
  portions: number;
  notes: string | null;
  recipe?: {
    id: number;
    name: string;
    category: string;
  };
}

export default function Today() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [menuItems, setMenuItems] = useState<MenuPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // Menu labels
  const mealLabels: Record<string, string> = {
    breakfast: "Frühstück",
    lunch: "Mittagessen",
    dinner: "Abendessen",
  };
  const courseLabels: Record<string, string> = {
    soup: "Suppe",
    main_meat: "Hauptspeise Fleisch",
    main_veg: "Hauptspeise Veg",
    side1: "Beilage 1",
    side2: "Beilage 2",
    dessert: "Dessert",
    main: "Hauptspeise",
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?date=${dateStr}`);
      if (!res.ok) throw new Error("Fehler beim Laden der Tasks");
      const data = await res.json();
      setTasks(data);
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  const fetchMenuPlan = async () => {
    try {
      const res = await fetch(`/api/menu-plans?date=${dateStr}&withRecipes=1`);
      if (!res.ok) throw new Error("Fehler beim Laden des Menüplans");
      const data = await res.json();
      setMenuItems(data);
    } catch (error: any) {
      console.error("Menu fetch error:", error);
      setMenuItems([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTasks(), fetchMenuPlan()]).finally(() => {
      setLoading(false);
    });
  }, [dateStr]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Convert priority string to number
    const priorityMap: Record<string, number> = { low: 0, normal: 1, high: 2 };
    const priorityNum = priorityMap[newPriority] ?? 1;

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          note: newNote.trim() || null,
          priority: priorityNum,
          date: dateStr,
        }),
      });
      if (!res.ok) throw new Error("Fehler beim Erstellen");
      const created = await res.json();
      setTasks([...tasks, created]);
      setNewTitle("");
      setNewNote("");
      setNewPriority("normal");
      setAddDialogOpen(false);
      toast({ title: "Task erstellt" });
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "open" : "done";
    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Fehler beim Aktualisieren");
      const updated = await res.json();
      setTasks(tasks.map(t => t.id === task.id ? updated : t));
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fehler beim Löschen");
      setTasks(tasks.filter(t => t.id !== taskId));
      toast({ title: "Task gelöscht" });
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  };

  const openTasks = tasks.filter(t => t.status === "open");
  const doneTasks = tasks.filter(t => t.status === "done");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Heute</h1>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="outline" className="rounded-full h-10 w-10 border-primary text-primary hover:bg-primary/10">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuer Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-2">
                <Label>Titel *</Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Was ist zu tun?"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Notiz</Label>
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Optionale Details..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Priorität</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={submitting || !newTitle.trim()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Task erstellen
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(selectedDate, "EEEE, d. MMMM yyyy", { locale: de })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={de}
          />
        </PopoverContent>
      </Popover>

      {/* Today's Menu */}
      {menuItems.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              Menü des Tages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {["breakfast", "lunch", "dinner"].map((meal) => {
              const mealItems = menuItems.filter((m) => m.meal === meal && m.recipe);
              if (mealItems.length === 0) return null;
              return (
                <div key={meal} className="space-y-1">
                  <h4 className="text-sm font-semibold text-primary">{mealLabels[meal]}</h4>
                  <ul className="space-y-0.5 pl-2">
                    {mealItems.map((item) => (
                      <li key={item.id} className="text-sm flex gap-2">
                        <span className="text-muted-foreground">{courseLabels[item.course] || item.course}:</span>
                        <span className="font-medium">{item.recipe?.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">Keine Tasks für diesen Tag</p>
          <p className="text-sm mt-1">Erstellen Sie einen neuen Task</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Task anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Open Tasks */}
          {openTasks.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Offen ({openTasks.length})
              </h2>
              {openTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleStatus(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          )}

          {/* Done Tasks */}
          {doneTasks.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Erledigt ({doneTasks.length})
              </h2>
              {doneTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggleStatus(task)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isDone = task.status === "done";
  // Priority: 0=low, 1=normal, 2=high (also support legacy string values)
  const priorityColors: Record<string | number, string> = {
    0: "border-l-gray-400",
    1: "border-l-blue-500",
    2: "border-l-red-500",
    low: "border-l-gray-400",
    normal: "border-l-blue-500",
    high: "border-l-red-500",
  };

  return (
    <Card className={`border-l-4 ${priorityColors[task.priority] || priorityColors[1]}`}>
      <CardContent className="p-3 flex items-start gap-3">
        <button
          onClick={onToggle}
          className="mt-0.5 shrink-0 touch-manipulation"
          style={{ minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isDone ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground hover:text-primary" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </p>
          {task.note && (
            <p className="text-sm text-muted-foreground mt-1 truncate">{task.note}</p>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Task löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie "{task.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
