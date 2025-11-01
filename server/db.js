const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'app.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  note TEXT,
  photo_url TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const insertReport = db.prepare(`
  INSERT INTO reports (type, lat, lng, note, photo_url, address)
  VALUES (@type, @lat, @lng, @note, @photo_url, @address)
`);

const selectReportsInBounds = db.prepare(`
  SELECT id, type, lat, lng, note, photo_url, address, created_at
  FROM reports
  WHERE lat BETWEEN @swLat AND @neLat
    AND lng BETWEEN @swLng AND @neLng
  ORDER BY created_at DESC
`);

const selectAllReports = db.prepare(`
  SELECT id, type, lat, lng, note, photo_url, address, created_at
  FROM reports
  ORDER BY created_at DESC
`);

function keyFor(lat, lng) {
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function aggregateFlags(rows) {
  const map = new Map();
  for (const r of rows) {
    const k = keyFor(r.lat, r.lng);
    if (!map.has(k)) {
      map.set(k, {
        key: k,
        lat: Number(r.lat.toFixed(6)),
        lng: Number(r.lng.toFixed(6)),
        count: 0,
        photos: [],
        address: r.address || '',
        notes: [],
      });
    }
    const cell = map.get(k);
    cell.count += 1;
    if (r.photo_url) {
      cell.photos.push(r.photo_url);
      if (cell.photos.length > 5) cell.photos = cell.photos.slice(-5);
    }
    if (r.address && !cell.address) cell.address = r.address;
    if (r.note && r.note.trim()) cell.notes.push(r.note.trim());
  }
  return Array.from(map.values());
}

module.exports = {
  insertReport,
  selectReportsInBounds,
  selectAllReports,
  aggregateFlags,
};
