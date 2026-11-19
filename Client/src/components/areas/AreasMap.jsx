import { useEffect, useRef } from 'react';
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AREA_MIN_VERIFIED, KHATEGAON, OSM_STYLE } from '@/lib/mapConfig';
import { EMPTY_FC, SCORE_COLORS, geojsonBounds, scoreColor } from '@/lib/areaGeo';
import { useMapTheme } from '@/lib/mapTheme';
setWorkerUrl(`${import.meta.env.BASE_URL}maplibre-gl-worker.mjs`);

const SRC = 'areas';

// score < 0 (ya null) = withheld (grey). Rang scoreColor() se match karte hain.
const COLOR_EXPR = [
  'step',
  ['coalesce', ['get', 'overallScore'], -1],
  SCORE_COLORS.none,
  0,
  SCORE_COLORS.bad,
  40,
  SCORE_COLORS.mid,
  70,
  SCORE_COLORS.good,
];

function makeLabel(p, selected, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.setAttribute('aria-label', p.name);
  el.textContent = p.scoreVisible
    ? p.overallScore == null
      ? '–'
      : String(Math.round(p.overallScore))
    : `${p.verifiedCount}/${AREA_MIN_VERIFIED}`;
  el.style.cssText =
    'min-width:38px;height:38px;padding:0 6px;border-radius:9999px;border:2px solid #fff;' +
    'color:#fff;font:700 12px system-ui,sans-serif;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.4);' +
    `background:${scoreColor(p.scoreVisible ? p.overallScore : null)};`;
  if (selected) el.style.outline = '3px solid #2563eb';
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(p.id);
  });
  return el;
}

// Props: geojson (/areas/map ka jawab), selectedId, onSelect(id)
export default function AreasMap({ geojson = EMPTY_FC, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);
  const markersRef = useRef(new Map()); // id -> { marker, el, lng, lat }
  const dataRef = useRef(geojson);
  const selectedRef = useRef(selectedId);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  // data map par daalo: polygons, number wale markers, aur sab ko frame me lao
  const show = (map, fc) => {
    map.getSource(SRC)?.setData(fc);

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();
    for (const f of fc.features) {
      const p = f.properties;
      if (p.centroidLng == null) continue;
      const el = makeLabel(p, p.id === selectedRef.current, (id) => onSelectRef.current?.(id));
      const marker = new Marker({ element: el }).setLngLat([p.centroidLng, p.centroidLat]).addTo(map);
      markersRef.current.set(p.id, { marker, el, lng: p.centroidLng, lat: p.centroidLat });
    }

    const b = geojsonBounds(fc);
    if (b) map.fitBounds(b, { padding: 40, maxZoom: 11, duration: 600 });
  };

  // 1) Map ek hi baar banao
  useEffect(() => {
    const map = new MapLibreMap({
      container: containerRef.current,
      style: OSM_STYLE,
      center: KHATEGAON.center,
      zoom: 9,
      minZoom: 4,
      maxZoom: 16,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource(SRC, { type: 'geojson', data: dataRef.current });
      map.addLayer({
        id: 'areas-fill',
        type: 'fill',
        source: SRC,
        paint: { 'fill-color': COLOR_EXPR, 'fill-opacity': 0.3 },
      });
      map.addLayer({
        id: 'areas-line',
        type: 'line',
        source: SRC,
        paint: { 'line-color': COLOR_EXPR, 'line-width': 2 },
      });
      map.addLayer({
        id: 'areas-selected',
        type: 'line',
        source: SRC,
        filter: ['==', ['get', 'id'], selectedRef.current ?? ''],
        paint: { 'line-color': '#2563eb', 'line-width': 4 },
      });

      map.on('click', 'areas-fill', (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (id) onSelectRef.current?.(id);
      });
      map.on('mouseenter', 'areas-fill', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'areas-fill', () => (map.getCanvas().style.cursor = ''));

      readyRef.current = true;
      show(map, dataRef.current);
    });

    return () => {
      readyRef.current = false;
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Data badle (level change / refetch)
  useEffect(() => {
    dataRef.current = geojson;
    if (readyRef.current && mapRef.current) show(mapRef.current, geojson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson]);

  // 3) Chuna hua area: border highlight, marker ring, aur map wahan le jao
  useEffect(() => {
    selectedRef.current = selectedId;
    const map = mapRef.current;
    markersRef.current.forEach(({ el }, id) => {
      el.style.outline = id === selectedId ? '3px solid #2563eb' : 'none';
    });
    if (!map || !readyRef.current) return;
    map.setFilter('areas-selected', ['==', ['get', 'id'], selectedId ?? '']);
    const m = selectedId ? markersRef.current.get(selectedId) : null;
    if (m) map.easeTo({ center: [m.lng, m.lat], duration: 500 });
  }, [selectedId]);

  // Size inline style se (Tailwind class se nahi), warna maplibre ki CSS height 0 kar deti hai
  useMapTheme(mapRef);
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}