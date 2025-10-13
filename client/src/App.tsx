import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Classes from "@/pages/classes";
import FeeManagement from "@/pages/fee-management";
import Transport from "@/pages/transport";
import Payments from "@/pages/payments";
import Dues from "@/pages/dues";
import ExcelImport from "@/pages/excel-import";
import Reports from "@/pages/reports";
import NotFound from "@/pages/not-found";
import { FinancePeriodProvider } from "@/context/FinancePeriodContext";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Layout><Dashboard /></Layout>} />
      <Route path="/students" component={() => <Layout><Students /></Layout>} />
      <Route path="/classes" component={() => <Layout><Classes /></Layout>} />
      <Route path="/fee-management" component={() => <Layout><FeeManagement /></Layout>} />
      <Route path="/transport" component={() => <Layout><Transport /></Layout>} />
      <Route path="/payments" component={() => <Layout><Payments /></Layout>} />
      <Route path="/dues" component={() => <Layout><Dues /></Layout>} />
      <Route path="/excel-import" component={() => <Layout><ExcelImport /></Layout>} />
      <Route path="/reports" component={() => <Layout><Reports /></Layout>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FinancePeriodProvider>
          <Toaster />
          <Router />
        </FinancePeriodProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
