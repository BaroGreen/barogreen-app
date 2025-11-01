require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const {
  insertReport,
  selectReportsInBounds,
  aggregateFlags,
  selectAllReports,
} = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// 업로드 디렉토리 준비 + 정적 제공
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// 멀터 설정
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

// 헬스체크
app.get('/health', (_, res) => res.json({ ok: true }));

// 파일 업로드
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no-file' });
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${base}/uploads/${req.file.filename}`;
  return res.json({ url });
});

// 신고 저장
app.post('/api/hazard/report', (req, res) => {
  const { type, lat, lng, note, photoUri, address } = req.body || {};
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat/lng required' });
  }
  console.log('[report]', { lat, lng, hasPhoto: !!photoUri });
  insertReport.run({
    type: type || 'jellyfish',
    lat,
    lng,
    note: note || '',
    photo_url: photoUri || '',
    address: address || '',
  });
  return res.json({ ok: true });
});

// 범위 집계
app.get('/api/hazard/flags', (req, res) => {
  const neLat = parseFloat(req.query.neLat);
  const neLng = parseFloat(req.query.neLng);
  const swLat = parseFloat(req.query.swLat);
  const swLng = parseFloat(req.query.swLng);
  if ([neLat, neLng, swLat, swLng].some((v) => Number.isNaN(v))) {
    return res.status(400).json({ error: 'bounds required' });
  }
  // 경계 보정(혹시 반대로 들어오면 교정)
  const hiLat = Math.max(neLat, swLat);
  const loLat = Math.min(neLat, swLat);
  const hiLng = Math.max(neLng, swLng);
  const loLng = Math.min(neLng, swLng);

  const rows = selectReportsInBounds.all({
    neLat: hiLat,
    neLng: hiLng,
    swLat: loLat,
    swLng: loLng,
  });

  const flags = aggregateFlags(rows);
  return res.json({ flags });
});

// 진단용: 전체 리스트
app.get('/api/hazard/all', (req, res) => {
  const rows = selectAllReports.all();
  return res.json(rows);
});

// 타일 API(임시): 빈 배열 내려 에러 차단
app.get('/api/hazard/tiles', (req, res) => {
  return res.json({ zones: [] });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`server listening on http://0.0.0.0:${PORT}`);
});
