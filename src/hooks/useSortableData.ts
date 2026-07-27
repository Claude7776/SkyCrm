import { useMemo, useState } from "react"

export type SortDirection = "asc" | "desc"

export function useSortableData<T>(
  items: T[],
  getValue: (item: T, key: string) => string | number,
  initialKey: string,
  initialDirection: SortDirection = "asc"
) {
  const [sortKey, setSortKey] = useState(initialKey)
  const [direction, setDirection] = useState<SortDirection>(initialDirection)

  const toggleSort = (key: string) => {
    if (key === sortKey) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setDirection("asc")
    }
  }

  const sorted = useMemo(() => {
    const copy = [...items]
    copy.sort((a, b) => {
      const va = getValue(a, sortKey)
      const vb = getValue(b, sortKey)
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "fr")
      return direction === "asc" ? cmp : -cmp
    })
    return copy
  }, [items, sortKey, direction, getValue])

  return { sorted, sortKey, direction, toggleSort }
}
