import { useEffect, useState } from 'react';

// Live GPS. Page khulte hi chalu hota hai, taaki photo khichne tak accuracy achhi ho jaye.
export function useGeolocation() {
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const [position, setPosition] = useState(null); // { lat, lng, accuracyM, at }
  const [error, setError] = useState(supported ? null : 'unsupported'); // denied | unavailable | timeout | unsupported

  useEffect(() => {
    if (!supported) return;
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setError(null);
        setPosition({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracyM: Math.round(p.coords.accuracy),
          at: p.timestamp,
        });
      },
      (e) => setError(e.code === 1 ? 'denied' : e.code === 2 ? 'unavailable' : 'timeout'),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [supported]);

  return { position, error };
}
