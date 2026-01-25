import { useState } from "react";
import { useApp, Recipe, Ingredient, Category } from "@/lib/store";
import { ALLERGENS, AllergenCode, useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Minus, Plus, Clock, Users, ExternalLink, PlusCircle, Link2, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Recipes() {
  const { recipes, loading } = useApp();
  const { t, tCat, lang } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAllergen, setSelectedAllergen] = useState<AllergenCode | null>(null);

  const categories = Array.from(new Set(recipes.map(r => r.category)));

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) && 
    (!selectedCategory || r.category === selectedCategory) &&
    (!selectedAllergen || r.allergens.includes(selectedAllergen))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pb-2 space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-heading font-bold">{t("recipes")}</h1>
          <AddRecipeDialog />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("searchRecipes")}
            className="pl-9 bg-secondary/50 border-0" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        {/* Filters */}
        <div className="flex flex-col gap-2">
           <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Badge 
              variant={selectedCategory === null ? "default" : "outline"}
              className="whitespace-nowrap cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              {t("all")}
            </Badge>
            {categories.map(cat => (
              <Badge 
                key={cat} 
                variant={selectedCategory === cat ? "default" : "outline"}
                className="whitespace-nowrap cursor-pointer"
                onClick={() => setSelectedCategory(cat)}
              >
                {tCat(cat)}
              </Badge>
            ))}
          </div>
          
          {/* Allergen Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[10px] font-bold text-muted-foreground uppercase whitespace-nowrap">{t("filterByAllergen")}:</span>
            <Badge 
                variant={selectedAllergen === null ? "secondary" : "outline"}
                className="whitespace-nowrap cursor-pointer text-[10px] h-5"
                onClick={() => setSelectedAllergen(null)}
            >
              All
            </Badge>
            {Object.values(ALLERGENS).map(alg => (
               <Badge 
                key={alg.code} 
                variant={selectedAllergen === alg.code ? "destructive" : "outline"}
                className="whitespace-nowrap cursor-pointer text-[10px] h-5 px-1 font-mono"
                onClick={() => setSelectedAllergen(selectedAllergen === alg.code ? null : alg.code)}
              >
                {alg.code}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 pb-20">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t("noData")}</p>
          </div>
        ) : (
          filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        )}
      </div>
    </div>
  );
}

function AddRecipeDialog() {
  const { t, tCat } = useTranslation();
  const { addRecipe, importRecipe } = useApp();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Mains");
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addRecipe({
        name,
        category,
        portions: 1,
        prepTime: 0,
        image: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800",
        sourceUrl: null,
        steps: [],
        allergens: [],
        ingredientsList: []
      });
      toast({ title: t("save"), description: "Recipe created successfully" });
      setOpen(false);
      setName("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl) return;
    
    setImporting(true);
    try {
      const recipe = await importRecipe(importUrl);
      toast({ 
        title: "Import erfolgreich!", 
        description: `"${recipe.name}" wurde importiert.` 
      });
      setOpen(false);
      setImportUrl("");
    } catch (error: any) {
      toast({ 
        title: "Import fehlgeschlagen", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" className="rounded-full h-10 w-10 border-primary text-primary hover:bg-primary/10">
          <PlusCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addRecipe")}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="gap-2">
              <Link2 className="h-4 w-4" /> Import
            </TabsTrigger>
            <TabsTrigger value="manual">Manuell</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="mt-4">
            <form onSubmit={handleImport} className="space-y-4">
              <div className="space-y-2">
                <Label>Rezept-URL (z.B. Chefkoch)</Label>
                <Input 
                  type="url" 
                  value={importUrl} 
                  onChange={(e) => setImportUrl(e.target.value)} 
                  placeholder="https://www.chefkoch.de/rezepte/..."
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Füge einen Link zu einem Rezept ein. Die Zutaten und Schritte werden automatisch importiert.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={importing || !importUrl}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
                {importing ? "Importiere..." : "Rezept importieren"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="manual" className="mt-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("recipeName")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Starters">{tCat("Starters")}</SelectItem>
                    <SelectItem value="Mains">{tCat("Mains")}</SelectItem>
                    <SelectItem value="Desserts">{tCat("Desserts")}</SelectItem>
                    <SelectItem value="Sides">{tCat("Sides")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">{t("save")}</Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { t, lang } = useTranslation();
  const { deleteRecipe } = useApp();
  const { toast } = useToast();
  const [portions, setPortions] = useState(recipe.portions);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      toast({ title: "Rezept gelöscht", description: `"${recipe.name}" wurde entfernt.` });
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const loadIngredients = async () => {
    if (ingredients.length > 0) return;
    setLoadingIngredients(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}/ingredients`);
      const data = await res.json();
      setIngredients(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    } finally {
      setLoadingIngredients(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) loadIngredients(); }}>
      <DialogTrigger asChild>
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] border-border/50">
          <div className="relative h-32 w-full">
            <img 
              src={recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800"} 
              alt={recipe.name} 
              className="absolute inset-0 w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end text-white">
              <div>
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 mb-1 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                  {recipe.category}
                </Badge>
                <h3 className="font-heading font-bold text-lg leading-tight shadow-black drop-shadow-md">{recipe.name}</h3>
              </div>
            </div>
          </div>
          <CardContent className="p-3 flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {recipe.prepTime}m</span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {recipe.portions}p</span>
            </div>
            <div className="flex gap-1">
              {recipe.allergens.length > 0 ? recipe.allergens.map(code => (
                <span key={code} className="w-5 h-5 rounded-full bg-destructive/10 text-destructive text-[10px] flex items-center justify-center font-bold border border-destructive/20 font-mono" title={ALLERGENS[code as AllergenCode]?.[lang]}>
                  {code}
                </span>
              )) : <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded">{t("noAllergens")}</span>}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-md h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="relative h-48 shrink-0">
          <img 
            src={recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800"} 
            alt={recipe.name} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <Badge className="mb-2 bg-primary text-primary-foreground border-none">{recipe.category}</Badge>
            <h2 className="text-3xl font-heading font-bold text-foreground drop-shadow-sm">{recipe.name}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex gap-2">
            {recipe.sourceUrl && (
              <Button variant="outline" className="flex-1 gap-2" asChild>
                <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> {t("visitWebsite")}
                </a>
              </Button>
            )}
            <Button 
              variant="destructive" 
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              data-testid={`delete-recipe-${recipe.id}`}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>

          {/* Portion Scaler */}
          <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg border border-border">
            <span className="font-medium text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> {t("portions")}
            </span>
            <div className="flex items-center gap-3 bg-background rounded-md border border-border p-1">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setPortions(Math.max(1, portions - 1))}><Minus className="h-3 w-3" /></Button>
              <span className="font-mono font-bold w-6 text-center">{portions}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setPortions(portions + 1)}><Plus className="h-3 w-3" /></Button>
            </div>
          </div>
          
           {/* Allergen Summary */}
           <div>
            <h3 className="text-sm font-heading font-semibold mb-2 text-muted-foreground uppercase tracking-wide">{t("allergens")}</h3>
            <div className="flex flex-wrap gap-2">
               {recipe.allergens.length > 0 ? recipe.allergens.map(code => (
                 <Badge key={code} variant="destructive" className="flex items-center gap-1 font-mono">
                   <span className="font-bold bg-white/20 px-1 rounded mr-1">{code}</span>
                   {ALLERGENS[code as AllergenCode]?.[lang]}
                 </Badge>
               )) : <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">{t("noAllergens")}</Badge>}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-lg font-heading font-semibold mb-3 border-b pb-1">{t("ingredients")}</h3>
            {loadingIngredients ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ul className="space-y-2 text-sm">
                {ingredients.map((ing, idx) => {
                  const scaledAmount = (ing.amount / recipe.portions) * portions;
                  return (
                    <li key={idx} className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">{ing.name}</span>
                      <div className="flex items-center gap-2">
                         {ing.allergens?.map(code => (
                            <span key={code} className="text-[10px] text-destructive font-bold px-1 border border-destructive/30 rounded font-mono" title={ALLERGENS[code as AllergenCode]?.[lang]}>
                              {code}
                            </span>
                         ))}
                         <span className="font-mono font-medium text-foreground">
                           {Number.isInteger(scaledAmount) ? scaledAmount : scaledAmount.toFixed(1)} {ing.unit}
                         </span>
                      </div>
                    </li>
                  );
                })}
                {ingredients.length === 0 && !loadingIngredients && (
                  <li className="text-muted-foreground text-center py-2">{t("noData")}</li>
                )}
              </ul>
            )}
          </div>

          {/* Steps */}
          <div>
            <h3 className="text-lg font-heading font-semibold mb-3 border-b pb-1">{t("preparation")}</h3>
            <ol className="space-y-4">
              {recipe.steps.map((step, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step}</p>
                </li>
              ))}
              {recipe.steps.length === 0 && (
                <li className="text-muted-foreground text-center py-2">{t("noData")}</li>
              )}
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
