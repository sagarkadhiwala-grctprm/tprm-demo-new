import { tierBadgeColor, tierLabel } from '@/lib/utils'

export default function TierBadge({ tier }: { tier: number }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${tierBadgeColor(tier)}`}
    >
      {tierLabel(tier)}
    </span>
  )
}
