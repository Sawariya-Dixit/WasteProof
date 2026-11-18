import { useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';

const isDark = (theme) =>
  theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

function apply(map, dark) {
  if (!map.getLayer('osm')) return;
  map.setPaintProperty('osm', 'raster-brightness-max', dark ? 0.45 : 1);
  map.setPaintProperty('osm', 'raster-saturation', dark ? -0.35 : 0);
  map.setPaintProperty('osm', 'raster-contrast', dark ? 0.15 : 0);
}

// Map banane wale useEffect ke BAAD lagao: useMapTheme(mapRef)
export function useMapTheme(mapRef) {
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const run = () => apply(map, isDark(theme));
    if (map.isStyleLoaded()) run();
    else map.once('load', run);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', run);
    return () => mq.removeEventListener('change', run);
  }, [theme, mapRef]);
}