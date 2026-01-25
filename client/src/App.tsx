import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/lib/store";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Recipes from "@/pages/Recipes";
import HACCP from "@/pages/HACCP";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Guests from "@/pages/Guests";
import Schedule from "@/pages/Schedule";
import MenuPlanPage from "@/pages/MenuPlan";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/recipes" component={Recipes} />
        <Route path="/haccp" component={HACCP} />
        <Route path="/guests" component={Guests} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/menu" component={MenuPlanPage} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <Router />
        <Toaster />
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
