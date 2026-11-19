import test from 'node:test';
import assert from 'node:assert/strict';
import { addSitePhotoSchema, createReportSchema } from '../validators/report.validators.js';

const base = {
  key: 'originals/u1/abc',
  sha256: 'a'.repeat(64),
  lat: 22.5933,
  lng: 76.9132,
  accuracyM: 12,
  capturedAt: new Date().toISOString(),
};

test('addSitePhoto: type ke bina chalta hai', () => {
  assert.equal(addSitePhotoSchema.safeParse(base).success, true);
});

test('addSitePhoto: client se type bhejna mana hai (type site se aata hai)', () => {
  assert.equal(addSitePhotoSchema.safeParse({ ...base, type: 'waste_dump' }).success, false);
});

test('addSitePhoto: India ke bahar ki location reject', () => {
  assert.equal(addSitePhotoSchema.safeParse({ ...base, lat: 51.5, lng: -0.12 }).success, false);
});

test('createReport: type ab bhi zaroori hai', () => {
  assert.equal(createReportSchema.safeParse(base).success, false);
});