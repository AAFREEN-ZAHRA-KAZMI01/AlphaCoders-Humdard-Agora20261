const STYLES = {
  citizen:   'bg-blue-100   text-blue-700',
  ngo:       'bg-purple-100 text-purple-700',
  volunteer: 'bg-orange-100 text-orange-700',
}
const LABELS = { citizen: 'Citizen', ngo: 'NGO', volunteer: 'Volunteer' }

export default function UserTypeBadge({ type }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STYLES[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {LABELS[type] ?? type}
    </span>
  )
}
