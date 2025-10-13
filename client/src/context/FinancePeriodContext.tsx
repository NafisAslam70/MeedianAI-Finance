import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AcademicYear } from "@/lib/types";

export const FINANCE_MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
] as string[];

type AcademicYearCode = string;
type FinanceMonth = string;

type FinancePeriodContextValue = {
  year: AcademicYearCode;
  years: readonly AcademicYear[];
  month: FinanceMonth;
  setYear: (year: AcademicYearCode) => void;
  setMonth: (month: FinanceMonth) => void;
  refreshYears: () => Promise<void>;
};

const YEAR_STORAGE_KEY = "finance.activeYear";
const MONTH_STORAGE_KEY = "finance.activeMonth";

const FinancePeriodContext = createContext<FinancePeriodContextValue | undefined>(undefined);

function getDefaultMonth(): FinanceMonth {
  const currentMonth = new Date().toLocaleString("default", { month: "long" });
  return FINANCE_MONTHS.find(month => month === currentMonth) ?? FINANCE_MONTHS[0];
}

export function FinancePeriodProvider({ children }: { children: React.ReactNode }) {
  const [year, setYearState] = useState<AcademicYearCode>("");
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [month, setMonthState] = useState<FinanceMonth>(getDefaultMonth);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedMonth = window.localStorage.getItem(MONTH_STORAGE_KEY) as FinanceMonth | null;

    if (storedMonth && FINANCE_MONTHS.includes(storedMonth)) {
      setMonthState(storedMonth);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (year) {
      window.localStorage.setItem(YEAR_STORAGE_KEY, year);
    }
  }, [year]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MONTH_STORAGE_KEY, month);
  }, [month]);

  const refreshYears = useCallback(async () => {
    try {
      const response = await fetch("/api/academic-years", { credentials: "include" });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const fetchedYears: AcademicYear[] = await response.json();
      const sortedYears = [...fetchedYears].sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1;
        if (!a.isCurrent && b.isCurrent) return 1;
        return b.code.localeCompare(a.code);
      });
      setYears(sortedYears);

      const storedYear = typeof window !== "undefined" ? window.localStorage.getItem(YEAR_STORAGE_KEY) : null;
      setYearState(prev => {
        if (prev && sortedYears.some(yearItem => yearItem.code === prev)) {
          return prev;
        }
        if (storedYear && sortedYears.some(yearItem => yearItem.code === storedYear)) {
          return storedYear;
        }
        const current = sortedYears.find(yearItem => yearItem.isCurrent)?.code ?? sortedYears[0]?.code ?? "";
        return current;
      });
    } catch (error) {
      console.error("[finance] Failed to load academic years", error);
    }
  }, []);

  useEffect(() => {
    void refreshYears();
  }, [refreshYears]);

  const setYear = useCallback((nextYear: AcademicYearCode) => {
    if (!nextYear) return;
    setYearState(prev => (prev === nextYear ? prev : nextYear));
  }, []);

  const setMonth = useCallback((nextMonth: FinanceMonth) => {
    if (!FINANCE_MONTHS.includes(nextMonth)) return;
    setMonthState(prev => (prev === nextMonth ? prev : nextMonth));
  }, []);

  const value = useMemo(
    () => ({ year, years, month, setYear, setMonth, refreshYears }),
    [year, years, month, setYear, setMonth, refreshYears],
  );

  return <FinancePeriodContext.Provider value={value}>{children}</FinancePeriodContext.Provider>;
}

export function useFinancePeriod(): FinancePeriodContextValue {
  const context = useContext(FinancePeriodContext);
  if (!context) {
    throw new Error("useFinancePeriod must be used within a FinancePeriodProvider");
  }
  return context;
}
