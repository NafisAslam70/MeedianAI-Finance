import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type ClassKey = "NUR" | "LKG" | "UKG" | "I" | "II" | "III" | "IV" | "V" | "VI" | "VII" | "VIII";
type Mode = "hosteller" | "dayScholar";

type FeeRow = {
  admission: number;
  monthly: number;
  schoolFeesTotal?: number;
  uniform?: number;
  hstDress?: number;
  copy?: number;
  book?: number;
  total?: number;
};

type FeeState = Record<ClassKey, FeeRow>;
type StoredFeeState = Partial<Record<ClassKey, Partial<FeeRow>>>;
type StoredState = {
  hosteller?: StoredFeeState;
  dayScholar?: StoredFeeState;
};

type PersistedState = {
  hosteller: FeeState;
  dayScholar: FeeState;
};

const CLASS_KEYS: ClassKey[] = [
  "NUR",
  "LKG",
  "UKG",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
];

const CLASS_ALIAS_MAP: Record<ClassKey, string[]> = {
  NUR: ["NUR", "Nur", "Nursery"],
  LKG: ["LKG"],
  UKG: ["UKG"],
  I: ["I", "1", "Class I", "Class 1"],
  II: ["II", "2", "Class II", "Class 2"],
  III: ["III", "3", "Class III", "Class 3"],
  IV: ["IV", "4", "Class IV", "Class 4"],
  V: ["V", "5", "Class V", "Class 5"],
  VI: ["VI", "6", "Class VI", "Class 6"],
  VII: ["VII", "7", "Class VII", "Class 7"],
  VIII: ["VIII", "8", "Class VIII", "Class 8"],
};

const DEFAULT_YEAR = "2024-2025";

const PRESET: Record<string, StoredState> = {
  [DEFAULT_YEAR]: {
    hosteller: {
      NUR: { admission: 5500, monthly: 3900, schoolFeesTotal: 9400, uniform: 3500, hstDress: 1500, copy: 700, book: 1245, total: 16345 },
      LKG: { admission: 5500, monthly: 3900, schoolFeesTotal: 9400, uniform: 3500, hstDress: 1500, copy: 700, book: 1430, total: 16530 },
      UKG: { admission: 5500, monthly: 3900, schoolFeesTotal: 9400, uniform: 3500, hstDress: 1500, copy: 700, book: 1740, total: 16840 },
      I: { admission: 5500, monthly: 3900, schoolFeesTotal: 9400, uniform: 3500, hstDress: 1500, copy: 700, book: 3495, total: 18595 },
      II: { admission: 6000, monthly: 4200, schoolFeesTotal: 10200, uniform: 3800, hstDress: 1800, copy: 700, book: 3540, total: 20040 },
      III: { admission: 6000, monthly: 4200, schoolFeesTotal: 10200, uniform: 3800, hstDress: 1800, copy: 700, book: 3700, total: 20200 },
      IV: { admission: 6500, monthly: 4400, schoolFeesTotal: 10900, uniform: 4000, hstDress: 1800, copy: 700, book: 3825, total: 21225 },
      V: { admission: 6500, monthly: 4400, schoolFeesTotal: 10900, uniform: 4000, hstDress: 1800, copy: 700, book: 3905, total: 21305 },
      VI: { admission: 7500, monthly: 4800, schoolFeesTotal: 12300, uniform: 4100, hstDress: 2000, copy: 700, book: 3630, total: 22730 },
      VII: { admission: 7500, monthly: 4800, schoolFeesTotal: 12300, uniform: 4100, hstDress: 2000, copy: 700, book: 3735, total: 22835 },
      VIII: { admission: 8500, monthly: 5500, schoolFeesTotal: 14000, uniform: 4200, hstDress: 2000, copy: 700, book: 1500, total: 22400 },
    },
    dayScholar: {
      NUR: { admission: 4000, monthly: 600, schoolFeesTotal: 4600, uniform: 3500, hstDress: 0, copy: 700, book: 1245, total: 10045 },
      LKG: { admission: 4000, monthly: 600, schoolFeesTotal: 4600, uniform: 3500, hstDress: 0, copy: 700, book: 1430, total: 10230 },
      UKG: { admission: 4000, monthly: 600, schoolFeesTotal: 4600, uniform: 3500, hstDress: 0, copy: 700, book: 1740, total: 10540 },
      I: { admission: 4000, monthly: 600, schoolFeesTotal: 4600, uniform: 3500, hstDress: 0, copy: 700, book: 3495, total: 12295 },
      II: { admission: 4500, monthly: 800, schoolFeesTotal: 5300, uniform: 3800, hstDress: 0, copy: 700, book: 3540, total: 13340 },
      III: { admission: 4500, monthly: 800, schoolFeesTotal: 5300, uniform: 3800, hstDress: 0, copy: 700, book: 3700, total: 13500 },
      IV: { admission: 5000, monthly: 850, schoolFeesTotal: 5850, uniform: 4000, hstDress: 0, copy: 700, book: 3825, total: 14375 },
      V: { admission: 5000, monthly: 850, schoolFeesTotal: 5850, uniform: 4000, hstDress: 0, copy: 700, book: 3905, total: 14455 },
      VI: { admission: 5500, monthly: 1000, schoolFeesTotal: 6500, uniform: 4100, hstDress: 0, copy: 700, book: 3630, total: 14930 },
      VII: { admission: 5500, monthly: 1000, schoolFeesTotal: 6500, uniform: 4100, hstDress: 0, copy: 700, book: 3735, total: 15035 },
      VIII: { admission: 6000, monthly: 1100, schoolFeesTotal: 7100, uniform: 4200, hstDress: 0, copy: 700, book: 1500, total: 13500 },
    },
  },
};

function sanitizeNumber(value: unknown): number {
  if (value === "" || value === null || value === undefined) return 0;
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(num) ? num : 0;
}

function computeTotal(row: FeeRow): number {
  const school = row.schoolFeesTotal ?? row.admission + row.monthly;
  const extras = (row.uniform ?? 0) + (row.hstDress ?? 0) + (row.copy ?? 0) + (row.book ?? 0);
  return school + extras;
}

function normalizeRow(row?: Partial<FeeRow>): FeeRow {
  const admission = sanitizeNumber(row?.admission);
  const monthly = sanitizeNumber(row?.monthly);
  const schoolFeesTotal = row?.schoolFeesTotal !== undefined && row?.schoolFeesTotal !== null
    ? sanitizeNumber(row?.schoolFeesTotal)
    : undefined;
  const uniform = sanitizeNumber(row?.uniform);
  const hstDress = sanitizeNumber(row?.hstDress);
  const copy = sanitizeNumber(row?.copy);
  const book = sanitizeNumber(row?.book);

  const normalized: FeeRow = {
    admission,
    monthly,
    schoolFeesTotal,
    uniform,
    hstDress,
    copy,
    book,
  };
  normalized.total = computeTotal(normalized);
  return normalized;
}

function normalizeState(data?: StoredState): PersistedState {
  const hosteller = {} as FeeState;
  const dayScholar = {} as FeeState;

  CLASS_KEYS.forEach((klass) => {
    hosteller[klass] = normalizeRow(data?.hosteller?.[klass]);
    dayScholar[klass] = normalizeRow(data?.dayScholar?.[klass]);
  });

  return { hosteller, dayScholar };
}

function loadLS(year: string): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`fee-structures/${year}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLS(year: string, data: PersistedState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`fee-structures/${year}`, JSON.stringify(data));
}

function getStoredYears(): string[] {
  if (typeof window === "undefined") return [];
  const years: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith("fee-structures/")) {
      years.push(key.split("/")[1]);
    }
  }
  return years;
}

function gatherInitialYears(): string[] {
  const set = new Set<string>(Object.keys(PRESET));
  getStoredYears().forEach((year) => set.add(year));
  return Array.from(set).sort();
}

function normalizeClassName(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function cloneState(state: PersistedState): PersistedState {
  return normalizeState(JSON.parse(JSON.stringify(state)) as StoredState);
}

function resolveClassId(klass: ClassKey, lookup: Map<string, any>): number | null {
  for (const alias of CLASS_ALIAS_MAP[klass]) {
    const match = lookup.get(normalizeClassName(alias));
    if (match) return match.id;
  }
  return null;
}

type FeeStructureEditorProps = {
  selectedYear: string;
  onSelectedYearChange: (year: string, years: string[]) => void;
  onYearsChange?: (years: string[]) => void;
};

export default function FeeStructureEditor({ selectedYear, onSelectedYearChange, onYearsChange }: FeeStructureEditorProps) {
  const [mode, setMode] = useState<Mode>("hosteller");
  const [state, setState] = useState<PersistedState>(() => normalizeState(loadLS(selectedYear) ?? PRESET[selectedYear]));
  const [classLookup, setClassLookup] = useState<Map<string, any>>(new Map());
  const [idToKey, setIdToKey] = useState<Map<number, ClassKey>>(new Map());
  const [isPushing, setIsPushing] = useState(false);
  const [isModifyOpen, setIsModifyOpen] = useState(false);

  const syncYears = useCallback(() => {
    const yearsList = gatherInitialYears();
    onYearsChange?.(yearsList);
    return yearsList;
  }, [onYearsChange]);

  useEffect(() => {
    syncYears();
  }, [syncYears]);

  useEffect(() => {
    const data = normalizeState(loadLS(selectedYear) ?? PRESET[selectedYear]);
    setState(data);
  }, [selectedYear]);

  const getClassKeyFromName = (name: string): ClassKey | null => {
    const norm = normalizeClassName(name);
    for (const key of CLASS_KEYS) {
      for (const alias of CLASS_ALIAS_MAP[key]) {
        if (normalizeClassName(alias) === norm) return key;
      }
    }
    return null;
  };

  const fetchClasses = useCallback(async (): Promise<Map<string, any>> => {
    try {
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Failed to load classes");
      const data = await res.json();
      const map = new Map<string, any>();
      const idMap = new Map<number, ClassKey>();
      (data || []).forEach((cls: any) => {
        if (!cls?.name) return;
        map.set(normalizeClassName(cls.name), cls);
        const key = getClassKeyFromName(cls.name);
        if (key) idMap.set(cls.id, key);
      });
      setClassLookup(map);
      setIdToKey(idMap);
      return map;
    } catch (error) {
      console.error("Failed to load classes", error);
      return new Map<string, any>();
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const updateCell = (klass: ClassKey, field: keyof FeeRow, rawValue: string) => {
    setState((prev) => {
      const next: PersistedState = {
        hosteller: { ...prev.hosteller },
        dayScholar: { ...prev.dayScholar },
      };
      const target = { ...next[mode] } as FeeState;
      const currentRow = { ...target[klass] };

      if (field === "schoolFeesTotal" && rawValue === "") {
        delete currentRow.schoolFeesTotal;
      } else if (field !== "total") {
        const numericValue = sanitizeNumber(rawValue);
        (currentRow as any)[field] = numericValue;
      }

      const normalizedRow = normalizeRow(currentRow);
      target[klass] = normalizedRow;
      next[mode] = target;
      return next;
    });
  };

  const rows = state[mode];

  useEffect(() => {
    const loadFromServer = async () => {
      try {
        if (!idToKey.size) return; // wait until classes loaded
        const res = await fetch(`/api/fee-structures?academicYear=${encodeURIComponent(selectedYear)}`);
        if (!res.ok) return;
        const items = await res.json();
        if (!Array.isArray(items) || items.length === 0) return;

        const hosteller: any = {};
        const dayScholar: any = {};

        const coerce = (obj: any): FeeRow => {
          // accept both new and legacy shapes
          const h = obj?.components ? obj.components : obj;
          const row: Partial<FeeRow> = {
            admission: sanitizeNumber(h?.admission),
            monthly: sanitizeNumber(h?.monthly),
            schoolFeesTotal: h?.schoolFeesTotal !== undefined ? sanitizeNumber(h.schoolFeesTotal) : undefined,
            uniform: sanitizeNumber(h?.uniform),
            hstDress: sanitizeNumber(h?.hstDress ?? h?.extra),
            copy: sanitizeNumber(h?.copy),
            book: sanitizeNumber(h?.book),
          };
          return normalizeRow(row);
        };

        for (const item of items) {
          const key = idToKey.get(item.classId);
          if (!key) continue;
          try {
            const parsed = item.description ? JSON.parse(item.description) : null;
            if (parsed?.hosteller && parsed?.dayScholar) {
              hosteller[key] = coerce(parsed.hosteller);
              dayScholar[key] = coerce(parsed.dayScholar);
            }
          } catch (_) {
            // if description not parsable, skip and fallback
          }
        }

        const merged: PersistedState = normalizeState({ hosteller, dayScholar });
        setState(merged);
      } catch (e) {
        console.warn('Unable to load server fee structures for year', selectedYear);
      }
    };
    loadFromServer();
  }, [selectedYear, idToKey]);

  const handleSave = () => {
    const normalized = cloneState(state);
    setState(normalized);
    saveLS(selectedYear, normalized);
    const yearsList = syncYears();
    onSelectedYearChange(selectedYear, yearsList);
    const confirmDb = window.confirm(`Saved locally. Also save to database for ${selectedYear}?`);
    if (confirmDb) {
      // fire and handle result; modal not required for this quick path
      (async () => {
        const ok = await handlePushToDB();
        if (ok) {
          window.alert("Saved to database.");
        }
      })();
    }
  };

  const handleExport = () => {
    const payload = {
      year: selectedYear,
      hosteller: state.hosteller,
      dayScholar: state.dayScholar,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fee-structures-${selectedYear}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed.year || !parsed.hosteller || !parsed.dayScholar) {
          window.alert("Invalid JSON structure");
          return;
        }
        const normalized = normalizeState(parsed);
        saveLS(parsed.year, normalized);
        setState(normalized);
        const yearsList = syncYears();
        onSelectedYearChange(parsed.year, yearsList);
        window.alert("Imported fee structure");
      } catch (error) {
        console.error(error);
        window.alert("Failed to parse JSON");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleAddYear = () => {
    const input = window.prompt("Enter new academic year (e.g., 2025-2026)");
    if (!input) return;
    const newYear = input.trim();
    if (!newYear) return;

    const existing = gatherInitialYears();
    if (existing.includes(newYear)) {
      onSelectedYearChange(newYear, existing);
      window.alert(`${newYear} already exists. Switched to it.`);
      return;
    }

    const cloned = cloneState(state);
    saveLS(newYear, cloned);
    setState(cloned);
    const yearsList = syncYears();
    onSelectedYearChange(newYear, yearsList);
    window.alert(`Added academic year ${newYear}`);
  };

  const handlePushToDB = async (): Promise<boolean> => {
    try {
      setIsPushing(true);
      let lookup = classLookup;
      if (!lookup.size) {
        lookup = await fetchClasses();
        if (lookup.size) {
          setClassLookup(lookup);
        }
      }

      const missing: ClassKey[] = [];
      const items = CLASS_KEYS.map((klass) => {
        const classId = resolveClassId(klass, lookup);
        if (!classId) {
          missing.push(klass);
          return null;
        }
        const hostellerRow = normalizeRow(state.hosteller[klass]);
        const dayScholarRow = normalizeRow(state.dayScholar[klass]);
        const payload = {
          classId,
          academicYear: selectedYear,
          feeType: "tuition",
          hostellerAmount: computeTotal(hostellerRow).toFixed(2),
          dayScholarAmount: computeTotal(dayScholarRow).toFixed(2),
          description: JSON.stringify({
            hosteller: {
              ...hostellerRow,
              components: {
                admission: hostellerRow.admission,
                monthly: hostellerRow.monthly,
                schoolFeesTotal: hostellerRow.schoolFeesTotal ?? hostellerRow.admission + hostellerRow.monthly,
                uniform: hostellerRow.uniform ?? 0,
                hstDress: hostellerRow.hstDress ?? 0,
                copy: hostellerRow.copy ?? 0,
                book: hostellerRow.book ?? 0,
              },
            },
            dayScholar: {
              ...dayScholarRow,
              components: {
                admission: dayScholarRow.admission,
                monthly: dayScholarRow.monthly,
                schoolFeesTotal: dayScholarRow.schoolFeesTotal ?? dayScholarRow.admission + dayScholarRow.monthly,
                uniform: dayScholarRow.uniform ?? 0,
                hstDress: dayScholarRow.hstDress ?? 0,
                copy: dayScholarRow.copy ?? 0,
                book: dayScholarRow.book ?? 0,
              },
            },
          }),
        };
        return payload;
      }).filter(Boolean);

      if (missing.length > 0) {
        throw new Error(`Missing class mapping for: ${missing.join(", ")}`);
      }

      if (items.length === 0) {
        throw new Error("No fee structure data to push");
      }

      const response = await fetch("/api/fee-structures/bulk-upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || "Failed to push to database");
      }

      saveLS(selectedYear, cloneState(state));
      const yearsList = syncYears();
      onSelectedYearChange(selectedYear, yearsList);
      window.alert("Fee structures saved to database");
      return true;
    } catch (error) {
      window.alert(`Push failed: ${(error as Error).message}`);
      return false;
    } finally {
      setIsPushing(false);
    }
  };

  const totals = useMemo(() => {
    const hostellerTotal = CLASS_KEYS.reduce((sum, klass) => sum + computeTotal(state.hosteller[klass]), 0);
    const dayScholarTotal = CLASS_KEYS.reduce((sum, klass) => sum + computeTotal(state.dayScholar[klass]), 0);
    return { hostellerTotal, dayScholarTotal };
  }, [state]);

  type FieldKey = keyof Pick<FeeRow, 'uniform' | 'hstDress' | 'book' | 'copy'>;
  const COMPONENT_COLUMNS: Array<{ key: FieldKey; label: string }> = useMemo(() => ([
    { key: 'uniform', label: 'Uniform' },
    { key: 'hstDress', label: 'Book' },
    { key: 'book', label: 'Copy' },
    { key: 'copy', label: 'HST Dress' },
  ]), []);

  return (
    <>
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm text-muted-foreground">
          Editing <span className="font-semibold text-foreground">{selectedYear}</span>
        </div>
        <div className="inline-flex rounded border border-border overflow-hidden">
          <Button
            type="button"
            variant={mode === "hosteller" ? "default" : "ghost"}
            className="rounded-none"
            onClick={() => setMode("hosteller")}
          >
            Hosteller
          </Button>
          <Button
            type="button"
            variant={mode === "dayScholar" ? "default" : "ghost"}
            className="rounded-none"
            onClick={() => setMode("dayScholar")}
          >
            Day Scholar
          </Button>
        </div>
        <Button type="button" variant="outline" onClick={handleAddYear}>
          + Add Year
        </Button>
        <Button type="button" onClick={handleSave}>
          Save
        </Button>
        <Button type="button" variant="secondary" onClick={handleExport}>
          Export JSON
        </Button>
        <label className="relative">
          <Button type="button" variant="outline">
            Import JSON
          </Button>
          <input
            type="file"
            accept="application/json"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleImport}
          />
        </label>
        <Button type="button" variant="default" onClick={() => setIsModifyOpen(true)} disabled={isPushing}>
          Modify Fee Structure
        </Button>
      </div>

      <div className="rounded border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        Totals this year · Hosteller: <span className="font-semibold text-foreground">₹{totals.hostellerTotal.toLocaleString("en-IN")}</span> · Day Scholar: <span className="font-semibold text-foreground">₹{totals.dayScholarTotal.toLocaleString("en-IN")}</span>
      </div>

      <div className="overflow-auto border border-border rounded">
        <table className="min-w-[900px] w-full text-sm bg-card">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left font-semibold text-muted-foreground">Class</th>
              <th className="p-3 text-left font-semibold text-muted-foreground">Admission</th>
              <th className="p-3 text-left font-semibold text-muted-foreground">Monthly</th>
              <th className="p-3 text-left font-semibold text-muted-foreground">School Fees Total</th>
              {COMPONENT_COLUMNS.map(col => (
                <th key={col.key} className="p-3 text-left font-semibold text-muted-foreground">{col.label}</th>
              ))}
              <th className="p-3 text-right font-semibold text-muted-foreground">Grand Total</th>
              <th className="p-3 text-left font-semibold text-muted-foreground">Match</th>
            </tr>
          </thead>
          <tbody>
            {CLASS_KEYS.map((klass) => {
              const row = rows[klass];
              const computedSchool = row.schoolFeesTotal ?? row.admission + row.monthly;
              const computedTotal = computeTotal(row);
              const matches = typeof row.total === "number" ? row.total === computedTotal : true;
              return (
                <tr key={klass} className="border-t border-border">
                  <td className="p-3 font-medium">{klass}</td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={row.admission}
                      onChange={(event) => updateCell(klass, "admission", event.target.value)}
                      className="w-24 px-2 py-1 border border-border rounded"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={row.monthly}
                      onChange={(event) => updateCell(klass, "monthly", event.target.value)}
                      className="w-24 px-2 py-1 border border-border rounded"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={row.schoolFeesTotal ?? ""}
                      onChange={(event) => updateCell(klass, "schoolFeesTotal", event.target.value)}
                      className="w-28 px-2 py-1 border border-border rounded"
                    />
                  </td>
                  {COMPONENT_COLUMNS.map(col => (
                    <td key={col.key} className="p-3">
                      <input
                        type="number"
                        value={(row[col.key] as number | undefined) ?? 0}
                        onChange={(event) => updateCell(klass, col.key, event.target.value)}
                        className="w-24 px-2 py-1 border border-border rounded"
                      />
                    </td>
                  ))}
                  <td className="p-3 text-right font-semibold tabular-nums">
                    {computedTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-3">
                    {matches ? (
                      <span className="text-emerald-600">OK</span>
                    ) : (
                      <span className="text-rose-600">Check</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

      <Dialog open={isModifyOpen} onOpenChange={setIsModifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save changes for {selectedYear}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-auto mt-2 border border-border rounded">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Class</th>
                  <th className="p-2 text-right">Hosteller Total</th>
                  <th className="p-2 text-right">Day Scholar Total</th>
                </tr>
              </thead>
              <tbody>
                {CLASS_KEYS.map((klass) => (
                  <tr key={klass} className="border-t border-border">
                    <td className="p-2 font-medium">{klass}</td>
                    <td className="p-2 text-right">{computeTotal(state.hosteller[klass]).toLocaleString('en-IN')}</td>
                    <td className="p-2 text-right">{computeTotal(state.dayScholar[klass]).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsModifyOpen(false)}>Cancel</Button>
            <Button type="button" onClick={async () => { const ok = await handlePushToDB(); if (ok) setIsModifyOpen(false); }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  </>
  );
}
