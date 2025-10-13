import { useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FeeStructureEditor from "@/components/fee-management/FeeStructureEditor";
import { useFinancePeriod } from "@/context/FinancePeriodContext";

// Normalize academic year to long form YYYY-YYYY
function toFullYear(y: string): string {
  const mShort = y.match(/^(\d{4})-(\d{2})$/);
  if (mShort) {
    const start = mShort[1];
    const endTwo = mShort[2];
    const century = start.slice(0, 2);
    return `${start}-${century}${endTwo}`;
  }
  const mLong = y.match(/^(\d{4})-(\d{4})$/);
  if (mLong) return y;
  return y.trim();
}

function fromFullYear(y: string): string {
  const normalized = y.trim();
  const match = normalized.match(/^(\d{4})-(\d{4})$/);
  if (match) {
    const start = match[1];
    const endTwo = match[2].slice(-2);
    return `${start}-${endTwo}`;
  }
  return normalized;
}

export default function FeeManagement() {
  const { year: contextYear, years, month, setYear: setContextYear, refreshYears } = useFinancePeriod();

  useEffect(() => {
    if (!contextYear) return;
    void refreshYears();
  }, [contextYear, refreshYears]);

  const selectedYearFull = useMemo(() => (
    contextYear ? toFullYear(contextYear) : ""
  ), [contextYear]);

  const handleEditorYearsChange = useCallback((years: string[]) => {
    if (!Array.isArray(years) || years.length === 0) return;
    void refreshYears();
  }, [refreshYears]);

  const handleEditorYearSelect = useCallback((year: string, years: string[]) => {
    const normalizedYear = toFullYear(year);
    setContextYear(fromFullYear(normalizedYear));
  }, [setContextYear]);

  const displayYearName = useMemo(
    () => years.find((item) => item.code === contextYear)?.name ?? selectedYearFull,
    [years, contextYear, selectedYearFull],
  );

  if (!selectedYearFull) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Fee Management</h2>
            <p className="text-muted-foreground">Configure and push fee structures synced with the MeedianAI Flow database.</p>
          </div>
        </div>
        <Card className="finance-card">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Select or create an academic year to begin managing fee structures.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Fee Management</h2>
          <p className="text-muted-foreground">Configure and push fee structures synced with the MeedianAI Flow database.</p>
        </div>
        <span className="text-sm text-muted-foreground">Academic Year <span className="font-medium text-foreground">{displayYearName}</span> · Month <span className="font-medium text-foreground">{month}</span></span>
      </div>

      <Card className="finance-card">
        <CardHeader>
          <CardTitle>Fee Structure Editor (Frontend-only)</CardTitle>
        </CardHeader>
        <CardContent>
          <FeeStructureEditor
            selectedYear={selectedYearFull}
            onSelectedYearChange={handleEditorYearSelect}
            onYearsChange={handleEditorYearsChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
