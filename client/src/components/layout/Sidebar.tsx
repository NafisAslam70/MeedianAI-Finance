import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: "fas fa-chart-line" },
  { name: "Students", href: "/students", icon: "fas fa-users" },
  { name: "Classes", href: "/classes", icon: "fas fa-graduation-cap" },
  { name: "Fee Management", href: "/fee-management", icon: "fas fa-receipt" },
  { name: "Transport", href: "/transport", icon: "fas fa-bus" },
  { name: "Payments", href: "/payments", icon: "fas fa-credit-card" },
  { name: "Excel Import", href: "/excel-import", icon: "fas fa-file-excel" },
  { name: "Reports", href: "/reports", icon: "fas fa-chart-bar" },
];

export default function Sidebar() {
  const [location] = useLocation();

  const handleFlowAppNavigation = () => {
    // Navigate to MeedianAI-Flow app - this would be implemented based on deployment setup
    window.location.href = "/flow"; // or appropriate URL for Flow app
  };

  return (
    <div className="w-64 bg-card border-r border-border sidebar-transition">
      <div className="p-6">
        {/* App Logo and Branding */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-coins text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">MeedianAI</h1>
            <p className="text-sm text-muted-foreground">Finances</p>
          </div>
        </div>
        
        {/* Cross-App Navigation */}
        <div className="mb-6">
          <div className="flex bg-muted rounded-lg p-1">
            <button className="flex-1 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium">
              Finances
            </button>
            <button 
              onClick={handleFlowAppNavigation}
              className="flex-1 text-muted-foreground hover:text-foreground px-3 py-2 text-sm font-medium transition-colors"
              data-testid="button-navigate-flow"
            >
              Flow
            </button>
          </div>
        </div>
        
        {/* Main Navigation */}
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                data-testid={`link-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <i className={`${item.icon} w-5`}></i>
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* User Profile Section */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex items-center space-x-3 px-3 py-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium">AR</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Admin Rahman</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <button className="text-muted-foreground hover:text-foreground" data-testid="button-user-settings">
              <i className="fas fa-cog w-4"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
