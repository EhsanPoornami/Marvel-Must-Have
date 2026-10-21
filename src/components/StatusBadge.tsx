import { STATUS_STYLES } from '../lib/statusStyles'
import { STATUS_LABELS, type Status } from '../types'

export function StatusBadge({ status, className = '' }: { status: Status; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${STATUS_STYLES[status]} ${className}`}>
      {status === 'wishlist' && '★ '}
      {STATUS_LABELS[status]}
    </span>
  )
}
