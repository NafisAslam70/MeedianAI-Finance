import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QuickActionModal from "@/components/modals/QuickActionModal";

export default function Header() {
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <header className="bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Financial Dashboard</h2>
              <p className="text-muted-foreground" data-testid="text-academic-year">Academic Year 2023-24</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search students, payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 bg-muted border border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="input-search"
                />
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
              </div>
              
              {/* Quick Actions */}
              <Button
                onClick={() => setIsQuickActionOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-new-payment"
              >
                <i className="fas fa-plus mr-2"></i>
                New Payment
              </Button>
              
              {/* Notifications */}
              <button className="relative p-2 text-muted-foreground hover:text-foreground" data-testid="button-notifications">
                <i className="fas fa-bell text-lg"></i>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
      />
    </>
  );
}
