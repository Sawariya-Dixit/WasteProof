import { Site } from '../models/Site.js';
import { Area } from '../models/Area.js';
import { Vote } from '../models/Vote.js';
import { Representative } from '../models/Representative.js';
import { LocalBody } from '../models/LocalBody.js';
import { AppError } from '../utils/AppError.js';
import { PUBLIC_SITE_STATUSES } from '../config/defaults.js';
import { resolveAreas } from './geoService.js';

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

const SEAT_LEVELS = ['ward', 'assembly', 'loksabha', 'district'];

// Site ke ward / MLA seat / MP seat / district aur unke representatives.
// Worker ka locate step (Day 12) areaIds bhar dega. Tab tak (ya seed ki hui sites ke liye) point-in-polygon se
// abhi nikaal lete hain, taaki site page par seats pehle din se dikhein.
async function buildSeats(site) {
  const stored = SEAT_LEVELS.map((l) => site.areaIds?.[l]).filter(Boolean);
  let areas;
  if (stored.length) {
    areas = await Area.find({ _id: { $in: stored } })
      .select('level name state code')
      .lean();
  } else {
    const [lng, lat] = site.location.coordinates;
    const found = await resolveAreas(lat, lng);
    areas = Object.entries(found)
      .filter(([, a]) => a)
      .map(([level, a]) => ({ _id: a.id, level, name: a.name, state: a.state, code: a.code }));
  }

  const reps = areas.length
    ? await Representative.find({ areaId: { $in: areas.map((a) => a._id) } })
        .select('office name areaId contactNote')
        .lean()
    : [];

  const seats = { ward: null, assembly: null, loksabha: null, district: null };
  for (const a of areas) {
    if (!SEAT_LEVELS.includes(a.level)) continue;
    seats[a.level] = {
      id: a._id,
      name: a.name,
      representatives: reps
        .filter((r) => String(r.areaId) === String(a._id))
        .map((r) => ({ office: r.office, name: r.name, contactNote: r.contactNote ?? null })),
    };
  }
  return seats;
}

// GET /sites/:id (public). Hidden site 404 hai. backers (user ids) aur embedding bahar nahi jaate.
export async function getSiteDetail(id , userId = null) {
  const site = await Site.findOne({ _id: id, status: { $in: PUBLIC_SITE_STATUSES } }).lean();
  if (!site) throw new AppError('Site nahi mili', 404, 'NOT_FOUND');

  const [seats, localBody, myVote] = await Promise.all([
    buildSeats(site),
    site.localBodyId
      ? LocalBody.findById(site.localBodyId).select('name type headTitle').lean()
      : null,
    userId ? Vote.findOne({ siteId: id, userId }).select('value').lean() : null,
  ]);

  return {
    id: site._id,
    type: site.type,
    status: site.status,
    location: { lat: site.location.coordinates[1], lng: site.location.coordinates[0] },
    backerCount: site.backerCount ?? 0,
    noCount: site.noCount ?? 0,
    reportCount: site.reportCount ?? 0,
    photoUrls: site.photoUrls ?? [],
    createdAt: site.createdAt,
    cleanedAt: site.cleanedAt ?? null,
    seats,
    localBody: localBody
      ? { id: localBody._id, name: localBody.name, type: localBody.type, headTitle: localBody.headTitle }
      : null,
    nearby: site.nearby ?? null,
        myVote: myVote?.value ?? null, // 'yes' | 'no' | 'me_too' | null
        
  };
}
