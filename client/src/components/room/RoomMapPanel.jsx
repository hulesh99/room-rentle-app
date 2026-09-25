import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { formatINR } from '@/utils/format';

const CITY_COORDS = {
  mumbai: [19.076, 72.8777],
  navi_mumbai: [19.033, 73.0297],
  thane: [19.2183, 72.9781],
  delhi: [28.7041, 77.1025],
  new_delhi: [28.6139, 77.209],
  gurugram: [28.4595, 77.0266],
  gurgaon: [28.4595, 77.0266],
  noida: [28.5355, 77.391],
  ghaziabad: [28.6692, 77.4538],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  hyderabad: [17.385, 78.4867],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  pune: [18.5204, 73.8567],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  surat: [21.1702, 72.8311],
  indore: [22.7196, 75.8577],
  bhopal: [23.2599, 77.4126],
  nagpur: [21.1458, 79.0882],
  patna: [25.5941, 85.1376],
  kochi: [9.9312, 76.2673],
  coimbatore: [11.0168, 76.9558],
  visakhapatnam: [17.6868, 83.2185],
  chandigarh: [30.7333, 76.7794],
  dehradun: [30.3165, 78.0322],
  guwahati: [26.1445, 91.7362],
  panaji: [15.4909, 73.8278],
  goa: [15.4909, 73.8278],
};

const normalize = (city = '') => city.trim().toLowerCase().replace(/\s+/g, '_');

const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0].coords, 12);
      return;
    }
    if (points.length > 1) {
      map.fitBounds(
        points.map((p) => p.coords),
        { padding: [40, 40], maxZoom: 11 }
      );
    }
  }, [map, points]);
  return null;
};

const RoomMapPanel = ({ rooms = [] }) => {
  const cityCounts = useMemo(() => {
    const counts = new Map();
    rooms.forEach((room) => {
      const key = normalize(room.city);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [rooms]);

  const points = useMemo(
    () =>
      rooms
        .filter((room) => room.isAvailable !== false)
        .map((room) => {
          const coords = CITY_COORDS[normalize(room.city)];
          return coords ? { room, coords, count: cityCounts.get(normalize(room.city)) || 1 } : null;
        })
        .filter(Boolean),
    [rooms, cityCounts]
  );

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b px-5 py-3">
        <h2 className="font-display text-sm font-semibold">
          Map view{' '}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {points.length} of {rooms.length} listings shown (city centre)
          </span>
        </h2>
      </div>
      <div className="h-[420px] w-full">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />
          {points.map(({ room, coords, count }) => (
            <CircleMarker
              key={room._id}
              center={coords}
              radius={8 + Math.min(12, (count - 1) * 3)}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: 'hsl(146 78% 30%)',
                fillOpacity: 0.92,
              }}
            >
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>{room.title}</p>
                  <p style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>
                    {room.city}, {room.state}
                    {count > 1 ? ` \u00B7 ${count} rooms in this city` : ''}
                  </p>
                  <p style={{ fontWeight: 600, color: 'hsl(146 78% 28%)' }}>
                    {formatINR(room.price)}
                    <span style={{ color: '#777', fontWeight: 400 }}> /month</span>
                  </p>
                  <Link
                    to={`/rooms/${room._id}`}
                    style={{
                      display: 'inline-block',
                      marginTop: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#fff',
                      background: 'hsl(146 78% 30%)',
                      padding: '5px 10px',
                      borderRadius: 999,
                    }}
                  >
                    View details
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default RoomMapPanel;
