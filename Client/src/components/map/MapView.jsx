import { useEffect, useRef } from 'react';
import {
  GeolocateControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CLUSTER, KHATEGAON, OSM_STYLE, STATUS_COLORS } from '@/lib/mapConfig';
import { sitesToGeoJSON } from '@/lib/geo';

// Worker file public/ me hai (npm run dev/build se pehle apne aap copy hoti hai)
setWorkerUrl(`${import.meta.env.BASE_URL}maplibre-gl-worker.mjs`);

const SOURCE = 'sites';

// Cluster ke upar number. Inline style: maplibre ki CSS Tailwind classes ko override kar deti hai.
function makeClusterLabel(text) {
  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText =
    'width:40px;height:40px;display:flex;align-items:center;justify-content:center;' +
    'color:#fff;font:700 13px system-ui,sans-serif;pointer-events:none;';
  return el;
}

// Props:
//   sites        server se aayi sites (stable array)
//   selectedId   jis pin ka card khula hai (highlight ke liye)
//   onViewChange ({ bbox:[w,s,e,n], zoom }) map ruke tab
//   onSiteClick  (site) pin par click
//   onMapClick   () khali jagah par click (card band karne ke liye)
export default function MapView({ sites, selectedId, onViewChange, onSiteClick, onMapClick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const readyRef = useRef(false);

  // Latest values refs me rakho, taaki map ek hi baar bane aur purane closure na atkein
  const sitesRef = useRef(sites);
  const selectedRef = useRef(selectedId);
  const onViewRef = useRef(onViewChange);
  const onClickRef = useRef(onSiteClick);
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onViewRef.current = onViewChange;
    onClickRef.current = onSiteClick;
    onMapClickRef.current = onMapClick;
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

    // ---- Cluster ke number (HTML labels) ----
    const labels = new Map(); // cluster_id -> Marker
    const updateClusterLabels = () => {
      if (!map.getSource(SOURCE)) return;
      const feats = map.querySourceFeatures(SOURCE, { filter: ['has', 'point_count'] });
      const seen = new Set();
      for (const f of feats) {
        const id = f.properties.cluster_id;
        if (seen.has(id)) continue; // ek cluster kai tiles me dobara aa sakta hai
        seen.add(id);
        if (!labels.has(id)) {
          const marker = new Marker({ element: makeClusterLabel(f.properties.point_count_abbreviated) })
            .setLngLat(f.geometry.coordinates)
            .addTo(map);
          labels.set(id, marker);
        }
      }
      for (const [id, marker] of labels) {
        if (!seen.has(id)) {
          marker.remove();
          labels.delete(id);
        }
      }
    };

    map.on('load', () => {
      map.addSource(SOURCE, {
        type: 'geojson',
        data: sitesToGeoJSON(sitesRef.current),
        cluster: true,
        clusterMaxZoom: CLUSTER.maxZoom,
        clusterRadius: CLUSTER.radius,
      });

      // Cluster (gol, size count ke hisaab se)
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: SOURCE,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#334155',
          'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 20, 26],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Akela pin (status ke rang me)
      map.addLayer({
        id: 'sites-circles',
        type: 'circle',
        source: SOURCE,
        filter: ['!', ['has', 'point_count']],
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

      // Chuna hua pin: bahar ek neela ring
      map.addLayer({
        id: 'sites-selected',
        type: 'circle',
        source: SOURCE,
        filter: ['==', ['get', 'id'], selectedRef.current ?? ''],
        paint: {
          'circle-radius': 15,
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#2563eb',
        },
      });

      // Cluster par click: us cluster ke khulne wale zoom tak jao
      map.on('click', 'clusters', async (e) => {
        const f = e.features?.[0];
        if (!f) return;
        try {
          const zoom = await map.getSource(SOURCE).getClusterExpansionZoom(f.properties.cluster_id);
          map.easeTo({ center: f.geometry.coordinates, zoom: zoom + 0.5 });
        } catch {
          /* cluster badal chuka, koi baat nahi */
        }
      });

      // Pin par click: card kholo
      map.on('click', 'sites-circles', (e) => {
        const f = e.features?.[0];
        if (f) onClickRef.current?.({ ...f.properties, coordinates: f.geometry.coordinates });
      });

      // Khali jagah par click: card band
      map.on('click', (e) => {
        const hit = map.queryRenderedFeatures(e.point, { layers: ['clusters', 'sites-circles'] });
        if (!hit.length) onMapClickRef.current?.();
      });

      for (const layer of ['clusters', 'sites-circles']) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
      }

      readyRef.current = true;
      emitView(); // pehli baar ke liye box bhejo
    });

    // Data load hone, ya map hilne par cluster ke number update karo
    map.on('sourcedata', (e) => {
      if (e.sourceId === SOURCE && e.isSourceLoaded) updateClusterLabels();
    });
    map.on('move', updateClusterLabels);
    map.on('moveend', emitView);

    // React StrictMode (dev) me effect do baar chalta hai, isliye cleanup zaroori hai
    return () => {
      readyRef.current = false;
      labels.forEach((m) => m.remove());
      labels.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2) Sites badlein to pins update karo
  useEffect(() => {
    sitesRef.current = sites;
    if (readyRef.current) {
      mapRef.current?.getSource(SOURCE)?.setData(sitesToGeoJSON(sites));
    }
  }, [sites]);

  // 3) Chuna hua pin badle to ring update karo
  useEffect(() => {
    selectedRef.current = selectedId;
    if (readyRef.current) {
      mapRef.current?.setFilter('sites-selected', ['==', ['get', 'id'], selectedId ?? '']);
    }
  }, [selectedId]);

  // Bahar wala div position deta hai. Andar wale par maplibre apni class lagata hai (position:relative),
  // isliye size inline style se, Tailwind class se nahi.
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}