import { Site } from '../models/Site.js';

export async function findInBbox({ bbox, type, status, limit }) {
  const [minLng, minLat, maxLng, maxLat] = bbox;

  const filter = {
    location: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [minLng, minLat],
              [maxLng, minLat],
              [maxLng, maxLat],
              [minLng, maxLat],
              [minLng, minLat],
            ],
          ],
        },
      },
    },
    status: status || { $ne: 'hidden' },
  };
  if (type) filter.type = type;

  return Site.find(filter)
    .select('type status location backerCount noCount reportCount photoUrls createdAt')
    .limit(limit)
    .lean();
}