const RULES = [
  { label: 'At least 8 characters',  test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',    test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',    test: (p) => /[a-z]/.test(p) },
  { label: 'One number',              test: (p) => /\d/.test(p) },
  { label: 'One special character',   test: (p) => /[!@#$%^&*()_\-+=]/.test(p) },
]

const STRENGTH_LABEL = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-blue-500', 'bg-primary-500']
const TEXT_COLOR     = ['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-blue-600', 'text-primary-600']

export default function PasswordStrengthMeter({ password }) {
  const score = RULES.filter((r) => r.test(password)).length

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? STRENGTH_COLOR[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      {password && (
        <p className={`text-xs font-semibold ${TEXT_COLOR[score]}`}>{STRENGTH_LABEL[score]}</p>
      )}
      <ul className="space-y-1">
        {RULES.map((rule, i) => (
          <li key={i} className={`flex items-center gap-1.5 text-xs transition-colors ${rule.test(password) ? 'text-primary-600' : 'text-gray-400'}`}>
            <span className="font-bold">{rule.test(password) ? '✓' : '○'}</span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
