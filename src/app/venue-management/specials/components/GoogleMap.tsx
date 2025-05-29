import { useEffect, useRef, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  radius: number;
  address: string;
}

interface MapComponentProps {
  center: { lat: number; lng: number };
  radius: number;
  style: React.CSSProperties;
}

const MapComponent: React.FC<MapComponentProps> = ({ center, radius, style }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [marker, setMarker] = useState<google.maps.Marker>();
  const [circle, setCircle] = useState<google.maps.Circle>();

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });
      setMap(newMap);
    }
  }, [ref, map, center]);

  useEffect(() => {
    if (map) {
      // Update or create marker
      if (marker) {
        marker.setPosition(center);
      } else {
        const newMarker = new window.google.maps.Marker({
          position: center,
          map,
          title: 'Venue Location',
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EF4444"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24),
            anchor: new window.google.maps.Point(12, 24)
          }
        });
        setMarker(newMarker);
      }

      // Update or create circle
      if (circle) {
        circle.setCenter(center);
        circle.setRadius(radius);
      } else {
        const newCircle = new window.google.maps.Circle({
          strokeColor: '#3B82F6',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#3B82F6',
          fillOpacity: 0.15,
          map,
          center,
          radius
        });
        setCircle(newCircle);
      }

      // Adjust map bounds to fit the circle
      const bounds = new window.google.maps.LatLngBounds();
      const radiusInDegrees = radius / 111320; // Approximate conversion from meters to degrees
      bounds.extend(new window.google.maps.LatLng(center.lat + radiusInDegrees, center.lng + radiusInDegrees));
      bounds.extend(new window.google.maps.LatLng(center.lat - radiusInDegrees, center.lng - radiusInDegrees));
      map.fitBounds(bounds);
    }
  }, [map, center, radius, marker, circle]);

  return <div ref={ref} style={style} />;
};

const render = (status: Status): React.ReactElement => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-gray-600">Map failed to load</p>
            <p className="text-xs text-gray-500 mt-1">Please check your Google Maps API key</p>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600">Initializing map...</p>
          </div>
        </div>
      );
  }
};

const GoogleMap: React.FC<GoogleMapProps> = ({ center, radius, address }) => {
  // For development, we'll use a placeholder API key
  // In production, this should be set via environment variables
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

  return (
    <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
      <Wrapper apiKey={apiKey} render={render}>
        <MapComponent
          center={center}
          radius={radius}
          style={{ width: '100%', height: '100%' }}
        />
      </Wrapper>
      
      {/* Address overlay */}
      <div className="absolute bottom-2 left-2 bg-white px-2 py-1 rounded text-xs shadow-sm">
        📍 {address}
      </div>
      
      {/* Radius indicator */}
      <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs shadow-sm">
        {radius}m radius
      </div>
    </div>
  );
};

export default GoogleMap; 