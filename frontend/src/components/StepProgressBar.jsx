export default function StepProgressBar({ steps, current }) {
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              i < current  ? 'bg-primary-500 text-white' :
              i === current ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                              'bg-gray-200 text-gray-500'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-1 whitespace-nowrap ${i === current ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < current ? 'bg-primary-500' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
