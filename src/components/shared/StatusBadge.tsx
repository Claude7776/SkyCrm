import { CheckCircle2, CircleDashed, AlertCircle, Clock3, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PaymentStatus, PrestationStatus } from "@/types"
import {
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
  PRESTATION_STATUS_BADGE,
  PRESTATION_STATUS_LABELS,
} from "@/utils/status"

export function PrestationStatusBadge({ status }: { status: PrestationStatus }) {
  const Icon =
    status === "todo" ? CircleDashed : status === "in_progress" ? Loader2 : CheckCircle2

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-medium", PRESTATION_STATUS_BADGE[status])}
    >
      <Icon className="size-3" />
      {PRESTATION_STATUS_LABELS[status]}
    </Badge>
  )
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const Icon = status === "unpaid" ? AlertCircle : status === "partial" ? Clock3 : CheckCircle2

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 font-medium", PAYMENT_STATUS_BADGE[status])}
    >
      <Icon className="size-3" />
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  )
}
