import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
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

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })
  return null
}

export default function MapPicker({ onLocationSelect, height = '300px' }) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (pos) => {
    setSelected(pos)
    onLocationSelect?.(pos)
  }

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 text-xs text-gray-600 px-3 py-1 rounded-full shadow pointer-events-none">
        Click on map to select location
      </div>
      <MapContainer
        center={[24.8607, 67.0011]}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
        cursor="crosshair"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={handleSelect} />
        {selected && (
          <Marker position={[selected.lat, selected.lng]} icon={markerIcon}>
            <Popup>Selected: {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
