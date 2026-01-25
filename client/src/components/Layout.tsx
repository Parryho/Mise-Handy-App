import { Link, useLocation } from "wouter";
import { LayoutDashboard, ChefHat, ThermometerSnowflake, FileBarChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { icon: LayoutDashboard, label: t("home"), href: "/" },
    { icon: ChefHat, label: t("recipes"), href: "/recipes" },
    { icon: ThermometerSnowflake, label: t("haccp"), href: "/haccp" },
    { icon: FileBarChart, label: t("reports"), href: "/reports" },
    { icon: Settings, label: t("settings"), href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:max-w-md md:mx-auto md:border-x md:shadow-2xl overflow-hidden relative">
      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-24 safe-area-bottom custom-scrollbar">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed md:absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-border/50 h-16 pb-safe z-50 md:w-full">
        <div className="grid grid-cols-5 h-full">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors duration-200 h-full w-full",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                  <item.icon className={cn("h-5 w-5", isActive && "fill-current/20")} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-medium uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
