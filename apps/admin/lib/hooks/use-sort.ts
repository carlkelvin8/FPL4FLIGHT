"use client";

import { useState, useMemo } from "react";

export type SortDir = "asc" | "desc";

export interface SortState {
  key: string;
  dir: SortDir;
}

export function useSort<T>(data: T[], defaultKey: string, defaultDir: SortDir = "asc") {
  const [sort, setSort] = useState<SortState>({ key: defaultKey, dir: defaultDir });

  const toggle = (key: string) => {
    setSort((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const sorted = useMemo(() => {
    return [...data].sort((a: any, b: any) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [data, sort]);

  return { sorted, sort, toggle };
}
