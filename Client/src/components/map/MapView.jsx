import { useEffect, useRef } from 'react';
import { GeolocateControl, Map as MapLibreMap, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { KHATEGAON, OSM_STYLE, STATUS_COLORS } from '@/lib/mapConfig';
import { sitesToGeoJSON } from '@/lib/geo';

// Worker file public/ me hai (npm run dev/build se pehle apne aap copy hoti hai)
setWorkerUrl(`${import.meta.env.BASE_URL}maplibre-gl-worker.mjs`);
// Props:
//   sites        server se aayi sites (stable array)
//   onViewChange ({ bbox:[w,s,e,n], zoom }) map ruke tab
//   onSiteClick  (properties) pin par click (Day 5 me pin card yahin se khulega)
export default function MapView({ sites, onViewChange, onSiteClick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);

  // Latest values refs me rakho, taaki map ek hi baar bane aur purane closure na atkein
  const sitesRef = useRef(sites);
  const onViewRef = useRef(onViewChange);
  const onClickRef = useRef(onSiteClick);
  useEffect(() => {
    onViewRef.current = onViewChange;
    onClickRef.current = onSiteClick;
  });

  // 1) Map sirf ek baar banao
  useEffect(() => {
    const map = new MapLibreMap({
      container: containerRef.current,
      style: OSM_STYLE,
      center: KHATEGAON.center,
      zoom: KHATEGAON.zoom,
      minZoom: 9, // bahut zoom-out par server box reject karta hai
      maxZoom: 19,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right',
    );

    const emitView = () => {
      const b = map.getBounds();
      onViewRef.current?.({
        bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
        zoom: map.getZoom(),
      });
    };

    map.on('load', () => {
      map.addSource('sites', { type: 'geojson', data: sitesToGeoJSON(sitesRef.current) });
      map.addLayer({
        id: 'sites-circles',
        type: 'circle',
        source: 'sites',
        paint: {
          'circle-radius': 9,
          'circle-color': [
            'match',
            ['get', 'status'],
            'verified',
            STATUS_COLORS.verified,
            'cleaned',
            STATUS_COLORS.cleaned,
            STATUS_COLORS.unverified,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.on('click', 'sites-circles', (e) => {
        const f = e.features?.[0];
        if (f) onClickRef.current?.(f.properties);
      });
      map.on('mouseenter', 'sites-circles', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'sites-circles', () => (map.getCanvas().style.cursor = ''));

      readyRef.current = true;
      emitView(); // pehli baar ke liye box bhejo
    });

    map.on('moveend', emitView);

    // React StrictMode (dev) me effect do baar chalta hai, isliye cleanup zaroori hai
    return () => {
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2) Sites badlein to pins update karo
  useEffect(() => {
    sitesRef.current = sites;
    if (readyRef.current) {
      mapRef.current?.getSource('sites')?.setData(sitesToGeoJSON(sites));
    }
  }, [sites]);

  return (
  <div className="absolute inset-0">
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  </div>
);
}