import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const STATUS_COLORS = {
  reported:    '#6b7280',
  verified:    '#f59e0b',
  funded:      '#22c55e',
  in_progress: '#3b82f6',
  resolved:    '#14b8a6',
}

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${color};border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  })
}

const STATUS_LABELS = {
  reported: 'Reported', verified: 'Verified',
  funded: 'Funded', in_progress: 'In Progress', resolved: 'Resolved',
}

export default function FeedMap({ cases = [], onCaseClick, height = '500px' }) {
  return (
    <MapContainer
      center={[30.3753, 69.3451]}
      zoom={6}
      style={{ height, width: '100%', borderRadius: '16px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {cases
        .filter(c => c.latitude && c.longitude)
        .map(c => {
          const color = STATUS_COLORS[c.status] ?? '#6b7280'
          return (
            <Marker key={c.id} position={[c.latitude, c.longitude]} icon={makeIcon(color)}>
              <Popup>
                <div className="text-sm min-w-[160px]">
                  <p className="font-semibold text-gray-900 mb-1">{c.title}</p>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-white text-xs mb-2"
                    style={{ background: color }}
                  >
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                  {c.category && <p className="text-gray-500 text-xs mb-2">{c.category}</p>}
                  <button
                    onClick={() => onCaseClick?.(c.id)}
                    className="w-full py-1 bg-primary-500 hover:bg-primary-600 text-white text-xs rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
    </MapContainer>
  )
}
