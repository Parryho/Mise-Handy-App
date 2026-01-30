import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/lib/store";
import { AuthProvider, useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Recipes from "@/pages/Recipes";
import HACCP from "@/pages/HACCP";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Guests from "@/pages/Guests";
import Schedule from "@/pages/Schedule";
import MenuPlanPage from "@/pages/MenuPlan";
import Today from "@/pages/Today";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    setLocation("/login");
    return null;
  }
  
  return <Component />;
}

function Router() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/today" /> : <Login />}
      </Route>
      <Route path="/">
        {user ? (
          <Redirect to="/today" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/recipes">
        {user ? (
          <Layout>
            <Recipes />
          </Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/haccp">
        {user ? (
          <Layout>
            <HACCP />
          </Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/guests">
        {user ? (
          <Layout>
            <Guests />
          </Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/schedule">
        {user ? (
          <Layout>
            <Schedule />
          </Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/menu">
        {user ? (
          <Layout>
            <MenuPlanPage />
          </Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/today">
        {user ? (
          <Layout>
            <Today />
          </Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/reports">
        {user ? (
          <Layout>
            <Reports />
          </Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route path="/settings">
        {user ? (
          <Layout>
            <Settings />
          </Layout>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <Router />
          <Toaster />
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
