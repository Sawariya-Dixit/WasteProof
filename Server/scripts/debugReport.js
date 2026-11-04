// Use: npm run debug:report            (aakhri 5 reports ek table me)
//      npm run debug:report <reportId> (ek report ka poora hisaab: steps, judges, site)
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Report } from '../models/Report.js';
import { Site } from '../models/Site.js';

await connectDB();
const id = process.argv[2];

if (!id) {
  const rows = await Report.find().sort({ createdAt: -1 }).limit(5).lean();
  console.table(
    rows.map((r) => ({
      id: String(r._id),
      status: r.status,
      type: r.type,
      reason: r.pipeline?.rejectReason ?? '',
      totalS: r.pipeline?.totalMs ? Math.round(r.pipeline.totalMs / 100) / 10 : '',
      attempts: r.attempts,
      siteId: r.siteId ? String(r.siteId) : '',
      createdAt: r.createdAt.toISOString(),
    })),
  );
} else {
  const r = await Report.findById(id).lean();
  if (!r) {
    console.log('Report nahi mili');
  } else {
    console.log(`\nReport ${id}: status=${r.status} type=${r.type} attempts=${r.attempts}`);
    if (r.pipeline?.rejectReason) console.log('rejectReason:', r.pipeline.rejectReason);
    if (r.pipeline?.lastError) console.log('lastError:', r.pipeline.lastError);
    if (r.pipeline?.totalMs) console.log(`totalMs: ${r.pipeline.totalMs} (snap se passed tak)`);

    const steps = r.pipeline?.steps ?? {};
    console.log('\nSteps:');
    console.table(
      Object.entries(steps).map(([name, s]) => ({ name, done: s.done, ms: s.ms ?? '' })),
    );

    const v = r.pipeline?.verify;
    if (v) {
      console.log('Verify:', {
        decision: v.decision,
        probability: v.probability,
        labels: v.labels?.verdict ?? 'n/a',
        llm: v.llm ? `${v.llm.verdict} (${v.llm.reason})` : v.llmError ? `ERROR ${v.llmError}` : 'off',
      });
    }
    const labels = steps.moderate?.result?.labels;
    if (labels?.length) {
      console.log('Rekognition labels:', labels.slice(0, 10).map((l) => `${l.name} ${l.conf}`).join(', '));
    }
    console.log('blurredUrl:', r.blurredUrl ?? '-');

    if (r.siteId) {
      const s = await Site.findById(r.siteId).lean();
      console.log('\nSite:', {
        id: String(s._id),
        status: s.status,
        backers: s.backerCount,
        no: s.noCount,
        reports: s.reportCount,
        photos: s.photoUrls?.length,
        areaIds: Object.keys(s.areaIds ?? {}).join(',') || '-',
        localBody: s.localBodyId ? 'yes' : 'no',
        locatedAt: s.locatedAt ?? '-',
        nearby: s.nearby
          ? `schools ${s.nearby.schools?.length ?? 0}, hospitals ${s.nearby.hospitals?.length ?? 0}`
          : '-',
      });
    }
  }
}
await mongoose.connection.close();