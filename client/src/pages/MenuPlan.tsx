import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronLeft, ChevronRight, PlusCircle, Trash2, ShoppingCart, Download, ChefHat } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface MenuPlan {
  id: number;
  date: string;
  meal: string;
  recipeId: number | null;
  portions: number;
  notes: string | null;
}

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

const MEALS = [
  { key: "breakfast", de: "Frühstück" },
  { key: "lunch", de: "Mittagessen" },
  { key: "dinner", de: "Abendessen" },
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

export default function MenuPlan() {
  const { recipes } = useApp();
  const [baseDate, setBaseDate] = useState(new Date());
  const [plans, setPlans] = useState<MenuPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const { toast } = useToast();
  
  const weekDates = getWeekDates(baseDate);
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menu-plans?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      setPlans(data);
    } catch (error) {
      console.error('Failed to fetch menu plans:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [startDate, endDate]);

  const getPlan = (date: string, meal: string) => {
    return plans.find(p => p.date === date && p.meal === meal);
  };

  const getRecipeName = (id: number | null) => {
    if (!id) return null;
    return recipes.find(r => r.id === id)?.name || null;
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
    <div className="p-4 space-y-4 pb-24">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-heading font-bold">Menüplan</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowShoppingList(true)}>
            <ShoppingCart className="h-4 w-4" /> Liste
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => window.open(`/api/menu-plans/export?start=${startDate}&end=${endDate}`, '_blank')}>
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-sm">
          {weekDates[0].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })} - {weekDates[6].toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
        <Button variant="outline" size="icon" onClick={nextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {MEALS.map(meal => (
            <Card key={meal.key}>
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm font-medium">{meal.de}</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="grid grid-cols-7 gap-1">
                  {weekDates.map((date, idx) => {
                    const dateStr = formatDate(date);
                    const plan = getPlan(dateStr, meal.key);
                    const recipeName = plan ? getRecipeName(plan.recipeId) : null;
                    const isToday = formatDate(new Date()) === dateStr;
                    
                    return (
                      <MenuCell 
                        key={dateStr}
                        date={dateStr}
                        dayName={WEEKDAYS[idx]}
                        dayNum={date.getDate()}
                        meal={meal.key}
                        plan={plan}
                        recipeName={recipeName}
                        recipes={recipes}
                        isToday={isToday}
                        onSave={fetchPlans}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ShoppingListDialog 
        open={showShoppingList} 
        onOpenChange={setShowShoppingList}
        plans={plans}
        recipes={recipes}
      />
    </div>
  );
}

function MenuCell({ date, dayName, dayNum, meal, plan, recipeName, recipes, isToday, onSave }: {
  date: string;
  dayName: string;
  dayNum: number;
  meal: string;
  plan: MenuPlan | undefined;
  recipeName: string | null;
  recipes: any[];
  isToday: boolean;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [recipeId, setRecipeId] = useState(plan?.recipeId ? String(plan.recipeId) : "");
  const [portions, setPortions] = useState(String(plan?.portions || 10));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setRecipeId(plan?.recipeId ? String(plan.recipeId) : "");
    setPortions(String(plan?.portions || 10));
  }, [plan]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (plan) {
        await fetch(`/api/menu-plans/${plan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            recipeId: recipeId ? parseInt(recipeId) : null, 
            portions: parseInt(portions) || 1 
          })
        });
      } else {
        await fetch('/api/menu-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            date, 
            meal, 
            recipeId: recipeId ? parseInt(recipeId) : null,
            portions: parseInt(portions) || 1
          })
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
    if (!plan) return;
    setSaving(true);
    try {
      await fetch(`/api/menu-plans/${plan.id}`, { method: 'DELETE' });
      toast({ title: "Gelöscht" });
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
        <button className={`p-1 rounded border text-left ${isToday ? 'border-primary bg-primary/10' : 'border-border'} hover:bg-secondary/50 transition-colors min-h-[60px]`}>
          <div className="text-[10px] text-muted-foreground text-center">{dayName} {dayNum}</div>
          {recipeName ? (
            <div className="text-[9px] font-medium leading-tight mt-1 line-clamp-2">{recipeName}</div>
          ) : (
            <div className="text-[10px] text-muted-foreground text-center mt-2">-</div>
          )}
          {plan && plan.portions > 1 && (
            <Badge variant="secondary" className="text-[8px] h-4 px-1 mt-1">{plan.portions}P</Badge>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{dayName}, {dayNum}. - {meal === 'breakfast' ? 'Frühstück' : meal === 'lunch' ? 'Mittagessen' : 'Abendessen'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Rezept</Label>
            <Select value={recipeId} onValueChange={setRecipeId}>
              <SelectTrigger>
                <SelectValue placeholder="Rezept wählen..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="">Kein Rezept</SelectItem>
                {recipes.map(r => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Portionen</Label>
            <Input type="number" value={portions} onChange={(e) => setPortions(e.target.value)} min="1" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Speichern
            </Button>
            {plan && (
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

function ShoppingListDialog({ open, onOpenChange, plans, recipes }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: MenuPlan[];
  recipes: any[];
}) {
  const [ingredients, setIngredients] = useState<Map<string, { amount: number; unit: string }>>(new Map());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateList = async () => {
    setLoading(true);
    const ingredientMap = new Map<string, { amount: number; unit: string }>();
    
    try {
      for (const plan of plans) {
        if (!plan.recipeId) continue;
        
        const recipe = recipes.find(r => r.id === plan.recipeId);
        if (!recipe) continue;
        
        const res = await fetch(`/api/recipes/${plan.recipeId}/ingredients`);
        const ings = await res.json();
        
        const scaleFactor = plan.portions / recipe.portions;
        
        for (const ing of ings) {
          const key = `${ing.name.toLowerCase()}_${ing.unit}`;
          const scaledAmount = ing.amount * scaleFactor;
          
          if (ingredientMap.has(key)) {
            const existing = ingredientMap.get(key)!;
            existing.amount += scaledAmount;
          } else {
            ingredientMap.set(key, { amount: scaledAmount, unit: ing.unit });
          }
        }
      }
      
      setIngredients(ingredientMap);
    } catch (error) {
      console.error('Failed to generate shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && plans.length > 0) {
      generateList();
    }
  }, [open, plans]);

  const ingredientList = Array.from(ingredients.entries()).map(([key, val]) => {
    const name = key.split('_')[0];
    return { name: name.charAt(0).toUpperCase() + name.slice(1), ...val };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Einkaufsliste</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : ingredientList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Zutaten im Menüplan
            </div>
          ) : (
            <ul className="space-y-2">
              {ingredientList.map((ing, idx) => (
                <li key={idx} className="flex justify-between items-center py-1 border-b">
                  <span>{ing.name}</span>
                  <span className="font-mono text-sm">
                    {Number.isInteger(ing.amount) ? ing.amount : ing.amount.toFixed(1)} {ing.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
