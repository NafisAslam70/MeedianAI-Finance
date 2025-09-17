import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickActionModal({ isOpen, onClose }: QuickActionModalProps) {
  const [, setLocation] = useLocation();

  const quickActions = [
    {
      title: "Record Payment",
      description: "Add new payment entry",
      icon: "fas fa-credit-card",
      color: "primary",
      action: () => {
        setLocation("/payments?action=new");
        onClose();
      }
    },
    {
      title: "Import Excel",
      description: "Bulk import from Excel",
      icon: "fas fa-file-excel",
      color: "secondary",
      action: () => {
        setLocation("/excel-import");
        onClose();
      }
    },
    {
      title: "Send Reminders",
      description: "Fee reminder messages",
      icon: "fas fa-bell",
      color: "accent",
      action: () => {
        // TODO: Implement reminder functionality
        onClose();
      }
    },
    {
      title: "Generate Report",
      description: "Financial summaries",
      icon: "fas fa-chart-bar",
      color: "purple",
      action: () => {
        setLocation("/reports");
        onClose();
      }
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle data-testid="text-modal-title">Quick Actions</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 p-6">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex flex-col items-center space-y-3 p-6 h-auto hover:bg-muted transition-colors"
              onClick={action.action}
              data-testid={`button-quick-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className={`w-12 h-12 bg-${action.color}/10 rounded-lg flex items-center justify-center`}>
                <i className={`${action.icon} text-${action.color} text-xl`}></i>
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">{action.title}</p>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
