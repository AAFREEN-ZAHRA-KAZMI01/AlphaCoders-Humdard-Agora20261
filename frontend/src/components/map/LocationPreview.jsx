import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export default function LocationPreview({ lat, lng, title }) {
  if (!lat || !lng) return null

  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: '200px', width: '100%' }}
        dragging={false}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={markerIcon}>
          {title && <Popup>{title}</Popup>}
        </Marker>
      </MapContainer>
      <a
        href={osmUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1 py-2 text-xs text-primary-600 hover:bg-primary-50 transition-colors border-t border-gray-100"
      >
        <span>📍</span> Open in OpenStreetMap
      </a>
    </div>
  )
}
