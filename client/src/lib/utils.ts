import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ACADEMIC_YEAR_START_MONTH = 4; // April

const parseAcademicYear = (value?: string | null) => {
  if (!value) {
    const year = new Date().getFullYear();
    return { startYear: year, endYear: year + 1 };
  }

  const match = value.match(/(\d{4})\D*(\d{2,4})/);
  if (!match) {
    const year = new Date().getFullYear();
    return { startYear: year, endYear: year + 1 };
  }

  const startYear = parseInt(match[1], 10);
  const rawEnd = match[2];
  const endYear = rawEnd.length === 2
    ? parseInt(`${String(startYear + 1).slice(0, 2)}${rawEnd}`, 10)
    : parseInt(rawEnd, 10);

  return { startYear, endYear };
};

export const buildAcademicYearMonths = (academicYear?: string | null): string[] => {
  const { startYear, endYear } = parseAcademicYear(academicYear);
  const months: string[] = [];

  for (let month = ACADEMIC_YEAR_START_MONTH; month <= 12; month += 1) {
    months.push(`${startYear}-${String(month).padStart(2, "0")}`);
  }

  for (let month = 1; month < ACADEMIC_YEAR_START_MONTH; month += 1) {
    months.push(`${endYear}-${String(month).padStart(2, "0")}`);
  }

  return months;
};

export const getCurrentAcademicYear = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const startYear = (today.getMonth() + 1) >= ACADEMIC_YEAR_START_MONTH ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}-${String(endYear).slice(-2)}`;
};

export const getCurrentMonthKey = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
};

export const formatAcademicMonth = (month: string | null | undefined): string => {
  if (!month) {
    return "—";
  }
  const [year, mm] = month.split("-");
  const date = new Date(Number(year), Number(mm) - 1);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
};
