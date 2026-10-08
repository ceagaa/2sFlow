import { Badge } from '../../../components/ui/Badge'
import type { TaskStatus } from '../types'

interface StatusBadgeProps {
  status?: TaskStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null
  return <Badge variant={status.category === 'done' ? 'solid' : 'muted'}>{status.name}</Badge>
}
