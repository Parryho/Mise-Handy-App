import { Link, useLocation } from "wouter";
import { LayoutDashboard, ChefHat, ThermometerSnowflake, Users, CalendarDays, Settings, Menu, X, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const mainNavItems = [
    { icon: LayoutDashboard, label: t("home"), href: "/" },
    { icon: ChefHat, label: t("recipes"), href: "/recipes" },
    { icon: ThermometerSnowflake, label: t("haccp"), href: "/haccp" },
    { icon: Users, label: "Gäste", href: "/guests" },
    { icon: CalendarDays, label: "Dienst", href: "/schedule" },
  ];

  const moreItems = [
    { icon: UtensilsCrossed, label: "Menüplan", href: "/menu" },
    { icon: Settings, label: t("settings"), href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:max-w-md md:mx-auto md:border-x md:shadow-2xl overflow-hidden relative">
      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-24 safe-area-bottom custom-scrollbar">
        {children}
      </main>

      {/* Slide-up Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute bottom-16 left-0 right-0 bg-white dark:bg-slate-900 border-t rounded-t-2xl p-4 md:max-w-md md:mx-auto" onClick={e => e.stopPropagation()}>
            <div className="grid grid-cols-3 gap-4">
              {moreItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors">
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed md:absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-border/50 h-16 pb-safe z-50 md:w-full md:max-w-md md:mx-auto">
        <div className="grid grid-cols-6 h-full">
          {mainNavItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 h-full w-full",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                  <item.icon className={cn("h-5 w-5", isActive && "fill-current/20")} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[8px] font-medium uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 h-full w-full",
              menuOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="text-[8px] font-medium uppercase tracking-wider">Mehr</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
