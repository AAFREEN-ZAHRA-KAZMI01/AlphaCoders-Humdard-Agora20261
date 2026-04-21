import { useRef, useState, useEffect } from 'react'

export default function OTPInput({ length = 6, onComplete, countdown }) {
  const [values, setValues] = useState(Array(length).fill(''))
  const refs = useRef([])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...values]
    next[i] = val
    setValues(next)
    if (val && i < length - 1) refs.current[i + 1]?.focus()
    if (next.every((v) => v !== '')) onComplete?.(next.join(''))
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!text) return
    const next = text.split('').concat(Array(length).fill('')).slice(0, length)
    setValues(next)
    refs.current[Math.min(text.length, length - 1)]?.focus()
    if (text.length === length) onComplete?.(text)
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div>
      <div className="flex gap-3 justify-center">
        {values.map((v, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={v}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-colors"
          />
        ))}
      </div>
      {countdown !== undefined && (
        <p className={`text-center mt-3 text-sm font-medium ${countdown > 0 ? 'text-gray-500' : 'text-red-500'}`}>
          {countdown > 0 ? `Expires in ${fmt(countdown)}` : 'Code expired — request a new one'}
        </p>
      )}
    </div>
  )
}
