import { useState } from "react";
import { useApp, Recipe, Ingredient } from "@/lib/store";
import { ALLERGENS, AllergenCode, useTranslation } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Filter, Minus, Plus, ChefHat, Clock, Users } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function Recipes() {
  const { recipes } = useApp();
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

  return (
    <div className="p-4 space-y-4">
      <div className="sticky top-0 bg-background/95 backdrop-blur z-10 pb-2 space-y-2">
        <h1 className="text-2xl font-heading font-bold">{t("recipes")}</h1>
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
        {filteredRecipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { t, lang } = useTranslation();
  const [portions, setPortions] = useState(recipe.portions);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] border-border/50">
          <div className="relative h-32 w-full">
            <img src={recipe.image} alt={recipe.name} className="absolute inset-0 w-full h-full object-cover" />
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
                <span key={code} className="w-5 h-5 rounded-full bg-destructive/10 text-destructive text-[10px] flex items-center justify-center font-bold border border-destructive/20 font-mono" title={ALLERGENS[code][lang]}>
                  {code}
                </span>
              )) : <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded">{t("noAllergens")}</span>}
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-md h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="relative h-48 shrink-0">
          <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <Badge className="mb-2 bg-primary text-primary-foreground border-none">{recipe.category}</Badge>
            <h2 className="text-3xl font-heading font-bold text-foreground drop-shadow-sm">{recipe.name}</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                   {ALLERGENS[code][lang]}
                 </Badge>
               )) : <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">{t("noAllergens")}</Badge>}
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-lg font-heading font-semibold mb-3 border-b pb-1">{t("ingredients")}</h3>
            <ul className="space-y-2 text-sm">
              {recipe.ingredients.map((ing, idx) => {
                const scaledAmount = (ing.amount / recipe.portions) * portions;
                return (
                  <li key={idx} className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">{ing.name}</span>
                    <div className="flex items-center gap-2">
                       {ing.allergens?.map(code => (
                          <span key={code} className="text-[10px] text-destructive font-bold px-1 border border-destructive/30 rounded font-mono" title={ALLERGENS[code][lang]}>
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
            </ul>
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
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
