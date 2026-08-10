export type MissingValueState =
  | "unavailable"
  | "unsupported"
  | "collecting"
  | "failed"
  | "empty"

const missingLabels: Record<MissingValueState, string> = {
  unavailable: "Unavailable",
  unsupported: "Not supported",
  collecting: "Collecting",
  failed: "Failed to retrieve",
  empty: "No records",
}

const compactNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

const groupedNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
})

export function missingValue(state: MissingValueState = "unavailable") {
  return missingLabels[state]
}

export function formatNumber(
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {},
) {
  if (value === null || value === undefined || value === "") return missingValue()
  const parsed = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(parsed)) return missingValue("failed")
  return new Intl.NumberFormat("en-US", options).format(parsed)
}

export function formatCompactNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return missingValue()
  if (!Number.isFinite(value)) return missingValue("failed")
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatBytes(value: number | null | undefined, binary = true) {
  if (value === null || value === undefined) return missingValue()
  if (!Number.isFinite(value) || value < 0) return missingValue("failed")
  if (value === 0) return "0 B"
  const base = binary ? 1024 : 1000
  const units = binary
    ? ["B", "KiB", "MiB", "GiB", "TiB", "PiB"]
    : ["B", "KB", "MB", "GB", "TB", "PB"]
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(base)), units.length - 1)
  return `${compactNumber.format(value / base ** exponent)} ${units[exponent]}`
}

export function formatBitRate(value: number | null | undefined) {
  if (value === null || value === undefined) return missingValue()
  if (!Number.isFinite(value) || value < 0) return missingValue("failed")
  const units: Array<[string, number]> = [
    ["Tbps", 1e12],
    ["Gbps", 1e9],
    ["Mbps", 1e6],
    ["Kbps", 1e3],
    ["bps", 1],
  ]
  const [unit, scale] = units.find(([, candidate]) => value >= candidate) ?? units.at(-1)!
  return `${compactNumber.format(value / scale)} ${unit}`
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) return missingValue()
  if (!Number.isFinite(seconds) || seconds < 0) return missingValue("failed")
  if (seconds === 0) return "0 seconds"
  const total = Math.floor(seconds)
  const days = Math.floor(total / 86_400)
  const hours = Math.floor(total % 86_400 / 3_600)
  const minutes = Math.floor(total % 3_600 / 60)
  const remainingSeconds = total % 60
  const parts = [
    days ? `${days}d` : "",
    hours ? `${hours}h` : "",
    minutes ? `${minutes}m` : "",
    remainingSeconds && !days ? `${remainingSeconds}s` : "",
  ].filter(Boolean)
  return parts.slice(0, 3).join(" ")
}

export function formatPercent(
  value: number | null | undefined,
  input: "ratio" | "percent" = "percent",
  digits = 1,
) {
  if (value === null || value === undefined) return missingValue()
  if (!Number.isFinite(value)) return missingValue("failed")
  const percent = input === "ratio" ? value * 100 : value
  return `${groupedNumber.format(Number(percent.toFixed(digits)))}%`
}

export function formatLocalDateTime(
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
) {
  if (value === null || value === undefined || value === "") return missingValue()
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return missingValue("failed")
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(date)
}

export function formatLocalDate(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined || value === "") return missingValue()
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return missingValue("failed")
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date)
}

export function humanizeEnum(value: string | null | undefined) {
  if (!value) return missingValue()
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, character => character.toUpperCase())
}

export function formatBoolean(value: boolean | null | undefined) {
  if (value === null || value === undefined) return missingValue()
  return value ? "Enabled" : "Disabled"
}

