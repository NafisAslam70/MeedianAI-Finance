import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface PendingAction {
  type: string;
  title: string;
  description: string;
  count: number;
  icon: string;
  color: string;
  action?: string;
}

interface PendingActionsProps {
  actions: PendingAction[];
}

export default function PendingActions({ actions }: PendingActionsProps) {
  const defaultActions: PendingAction[] = [
    {
      type: "overdue",
      title: "Overdue Payments",
      description: "Students with pending monthly fees",
      count: 0,
      icon: "fas fa-exclamation-triangle",
      color: "destructive",
      action: "/payments?filter=overdue"
    },
    {
      type: "verification",
      title: "Payments to Verify",
      description: "Require admin verification",
      count: 0,
      icon: "fas fa-clock",
      color: "accent",
      action: "/payments?filter=pending"
    },
    {
      type: "import",
      title: "Excel Import Ready",
      description: "New data ready for import",
      count: 0,
      icon: "fas fa-file-excel",
      color: "primary",
      action: "/excel-import"
    }
  ];

  const actionsToShow = actions && actions.length > 0 ? actions : defaultActions;

  return (
    <Card className="finance-card" data-testid="card-pending-actions">
      <CardHeader>
        <CardTitle>Pending Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actionsToShow.map((action, index) => (
            <div
              key={action.type}
              className={`flex items-start space-x-3 p-3 bg-${action.color}/5 border border-${action.color}/20 rounded-lg`}
              data-testid={`card-action-${action.type}`}
            >
              <div className={`w-8 h-8 bg-${action.color}/10 rounded-full flex items-center justify-center mt-0.5`}>
                <i className={`${action.icon} text-${action.color} text-sm`}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground" data-testid={`text-action-title-${index}`}>
                  {action.count > 0 ? `${action.count} ` : ""}{action.title}
                </p>
                <p className="text-xs text-muted-foreground" data-testid={`text-action-description-${index}`}>
                  {action.description}
                </p>
                {action.action && (
                  <Link href={action.action}>
                    <Button 
                      variant="link" 
                      className={`text-${action.color} hover:text-${action.color}/80 text-xs font-medium mt-1 p-0 h-auto`}
                      data-testid={`button-action-${action.type}`}
                    >
                      {action.type === 'overdue' && 'Send Reminders'}
                      {action.type === 'verification' && 'Review Now'}
                      {action.type === 'import' && 'Import Data'}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t border-border">
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-quick-actions-main"
          >
            <i className="fas fa-plus mr-2"></i>
            Quick Actions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
