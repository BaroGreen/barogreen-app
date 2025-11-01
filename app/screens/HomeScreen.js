// app/screens/HomeScreen.js
import React, { useEffect, useRef, useState, useMemo, useCallback, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import {
  Platform,
  View,
  StyleSheet,
  Image,
  Text,
  Alert,
  Pressable,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
  Linking,
} from 'react-native';
import * as Device from 'expo-device';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE } from '../core/config';
import { useFocusEffect } from '@react-navigation/native';

/* ===== 브랜드 컬러 (Green Theme) ===== */
const GREEN = '#2DB36F';
const GREEN_DARK = '#1E8A52';
const GREEN_LIGHT = '#E6F4EA';
const GREEN_BORDER = '#B7E1C0';

// ===== 상태 라벨 & 색상 =====
const REPORT_STATUS = {
  PENDING: '접수 완료',
  PROCESSING: '처리 진행 중',
  COMPLETED: '처리 완료',
};
const MARKER_COLOR = {
  PENDING: '#F4D35E',
  PROCESSING: '#27AE60',
  COMPLETED: '#1B5E20',
};

// ===== 개발용 플래그(모의 데이터 생성 on/off) =====
const DEV_MOCK = false;
const MOCK_COUNT = 120;
const MOCK_MIN_DIST_M = 120;
// ✅ 반경 10km
const SEARCH_RADIUS_KM = 10;

const MOCK_PHOTOS = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1484406566174-9da000fda645?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515456799515-3a1d6e8d8c94?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503594922194-9f2a9a0f0b5b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
];

// ===== 대한민국 영역(대략적 경계) & 도시 시드 =====
const KOREA_BOUNDS = { minLat: 33.0, maxLat: 38.65, minLng: 124.6, maxLng: 131.1 };
const KOREA_SEEDS = [
  { name: '서울', lat: 37.5665, lng: 126.9780 },
  { name: '인천', lat: 37.4563, lng: 126.7052 },
  { name: '수원', lat: 37.2636, lng: 127.0286 },
  { name: '성남', lat: 37.4200, lng: 127.1269 },
  { name: '용인', lat: 37.2411, lng: 127.1775 },
  { name: '안산', lat: 37.3219, lng: 126.8309 },
  { name: '화성', lat: 37.1995, lng: 126.8312 },
  { name: '평택', lat: 36.9947, lng: 127.0886 },
  { name: '의정부', lat: 37.7381, lng: 127.0337 },
  { name: '파주', lat: 37.7599, lng: 126.7771 },
  { name: '김포', lat: 37.6153, lng: 126.7150 },
  { name: '춘천', lat: 37.8813, lng: 127.7298 },
  { name: '원주', lat: 37.3422, lng: 127.9202 },
  { name: '강릉', lat: 37.7519, lng: 128.8761 },
  { name: '속초', lat: 38.2070, lng: 128.5910 },
  { name: '동해', lat: 37.5247, lng: 129.1140 },
  { name: '삼척', lat: 37.4499, lng: 129.1650 },
  { name: '청주', lat: 36.6424, lng: 127.4890 },
  { name: '천안', lat: 36.8151, lng: 127.1139 },
  { name: '아산', lat: 36.7898, lng: 127.0019 },
  { name: '세종', lat: 36.4800, lng: 127.2890 },
  { name: '대전', lat: 36.3504, lng: 127.3845 },
  { name: '전주', lat: 35.8242, lng: 127.1479 },
  { name: '군산', lat: 35.9677, lng: 126.7366 },
  { name: '익산', lat: 35.9483, lng: 126.9574 },
  { name: '광주', lat: 35.1595, lng: 126.8526 },
  { name: '목포', lat: 34.8118, lng: 126.3922 },
  { name: '여수', lat: 34.7604, lng: 127.6622 },
  { name: '순천', lat: 34.9507, lng: 127.4872 },
  { name: '광양', lat: 34.9400, lng: 127.6950 },
  { name: '진주', lat: 35.1796, lng: 128.1076 },
  { name: '통영', lat: 34.8556, lng: 128.4334 },
  { name: '거제', lat: 34.8806, lng: 128.6217 },
  { name: '창원', lat: 35.2270, lng: 128.6811 },
  { name: '김해', lat: 35.2286, lng: 128.8895 },
  { name: '부산', lat: 35.1796, lng: 129.0756 },
  { name: '양산', lat: 35.3350, lng: 129.0370 },
  { name: '울산', lat: 35.5384, lng: 129.3114 },
  { name: '대구', lat: 35.8714, lng: 128.6014 },
  { name: '구미', lat: 36.1195, lng: 128.3446 },
  { name: '김천', lat: 36.1398, lng: 128.1136 },
  { name: '포항', lat: 36.0190, lng: 129.3435 },
  { name: '경주', lat: 35.8562, lng: 129.2247 },
  { name: '안동', lat: 36.5684, lng: 128.7294 },
  { name: '제주', lat: 33.4996, lng: 126.5312 },
  { name: '서귀포', lat: 33.2541, lng: 126.5600 },
];

// ===== 유틸 =====
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const KOREA_INITIAL_REGION = { latitude: 36.5, longitude: 127.8, latitudeDelta: 8.5, longitudeDelta: 7.5 };

const withTimeout = (p, ms = 15000) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

/* ===== 간단 이벤트 버스 (업체 화면과 상태 동기화) ===== */
function getBus() {
  if (!globalThis.__CIVIC_EVENT_BUS) {
    const handlers = {};
    globalThis.__CIVIC_EVENT_BUS = {
      on(evt, fn) { (handlers[evt] ||= new Set()).add(fn); return () => handlers[evt].delete(fn); },
      emit(evt, payload) { (handlers[evt] || []).forEach(fn => { try { fn(payload); } catch {} }); },
    };
  }
  return globalThis.__CIVIC_EVENT_BUS;
}

const toRad = (v) => (v * Math.PI) / 180;
/** 하버사인 거리(km) */
function distanceKm(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function extractLatLngFromExif(exif = {}) {
  if (typeof exif?.GPSLatitude === 'number' && typeof exif?.GPSLongitude === 'number') {
    return { latitude: exif.GPSLatitude, longitude: exif.GPSLongitude };
  }
  return null;
}
const formatAddress = (a) => [a.region, a.city, a.district, a.street, a.name].filter(Boolean).join(' ');
function offsetMeters(center, dxMeters, dyMeters) {
  const latMeters = 111320;
  const lonMeters = 111320 * Math.cos((center.lat * Math.PI) / 180);
  const dLat = dyMeters / latMeters;
  const dLng = dxMeters / lonMeters;
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

export default function HomeScreen({ navigation }) {
  const { setUser } = useContext(UserContext);

  const onLogout = () => {
    setUser(null);
    navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
  };

  const mapRef = useRef(null);
  const watchRef = useRef(null);

  const [region, setRegion] = useState(null);
  const [pos, setPos] = useState(null);

  const [flags, setFlags] = useState([]); // {reportId, lat, lng, status, photoUri, address, note, reportedAt}
  const [reportOpen, setReportOpen] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [photo, setPhoto] = useState(null);
  const [photoCoord, setPhotoCoord] = useState(null);
  const [photoAddress, setPhotoAddress] = useState('');

  const [toast, setToast] = useState('');

  // 리스트/필터
  const [selectedCenter, setSelectedCenter] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  /* ✅ 상세 모달 상태 */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailReport, setDetailReport] = useState(null);
   const openDetail = (report) => {
   setDetailReport(normalizeReport(report));
   setDetailOpen(true);
 };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetailReport(null);
  };

  useFocusEffect(
    useCallback(() => {
      if (region) fetchFlags(region);
    }, [region])
  );

  // ✅ 업체 화면에서 완료 처리되면 HomeScreen 리스트/상세 데이터 즉시 반영
useEffect(() => {
  const off = getBus().on('report-updated', ({ reportId, status, completedPhoto }) => {
    setFlags(prev => prev.map(r =>
      r.reportId === reportId ? { ...r, status: status || r.status, completedPhoto: completedPhoto || r.completedPhoto } : r
    ));
    // 상세 모달이 열려 있었다면 그 안의 데이터도 갱신
    setDetailReport(d => d && d.reportId === reportId
      ? { ...d, status: status || d.status, completedPhoto: completedPhoto || d.completedPhoto }
      : d
    );
  });
  return () => { try { off && off(); } catch {} };
}, []);


  /* ✅ 최근 촬영/선택한 사진 풀 + 마커 뷰 트래킹 */
  const [shotPool, setShotPool] = useState([]); // 가장 최신이 인덱스 0
  const [trackMarkerViews, setTrackMarkerViews] = useState(true);
  useEffect(() => {
    setTrackMarkerViews(true);
    const t = setTimeout(() => setTrackMarkerViews(false), 800);
    return () => clearTimeout(t);
  }, [flags]);

  // ===== 서버에서 민원 불러오기 =====
  const fetchFlags = async (rgn) => {
    if (!rgn || DEV_MOCK) return;

    const isNationView = rgn.latitudeDelta >= 5 || rgn.longitudeDelta >= 5;
    const neLat = isNationView ? KOREA_BOUNDS.maxLat : rgn.latitude + rgn.latitudeDelta / 2;
    const swLat = isNationView ? KOREA_BOUNDS.minLat : rgn.latitude - rgn.latitudeDelta / 2;
    const neLng = isNationView ? KOREA_BOUNDS.maxLng : rgn.longitude + rgn.longitudeDelta / 2;
    const swLng = isNationView ? KOREA_BOUNDS.minLng : rgn.longitude - rgn.longitudeDelta / 2;

    const url = `${API_BASE}/api/trash/reports?neLat=${neLat}&neLng=${neLng}&swLat=${swLat}&swLng=${swLng}`;
    try {
      const res = await withTimeout(fetch(url, { headers: { Accept: 'application/json' } }), 10000);
      const data = await res.json();
      // const normalized = (data.reports || []).map((r) => ({
      //   ...r,
      //   status: String(r.status || '').toLowerCase(),
      // }));

      const normalized = (data.reports || []).map(normalizeReport);
      setFlags((prev) => {
        const mocks = prev.filter((f) => String(f.reportId).startsWith('mock-seed-'));
        return [...normalized, ...mocks];
      });
    } catch (e) {
      console.log('[reports] fetch fail/timeout', e);
    }
  };

  // ===== 임시 마커 10개 시드 =====
  const seedTenMocksOnceRef = useRef(false);
  const seedTenMocks = useCallback(() => {
    const statuses = ['pending', 'processing', 'completed'];
    const samples = [];
    let tries = 0;
    while (samples.length < 10 && tries < 500) {
      tries++;
      const seed = KOREA_SEEDS[Math.floor(Math.random() * KOREA_SEEDS.length)];
      const radius = 200 + Math.random() * 1500;
      const theta = Math.random() * Math.PI * 2;
      const { lat, lng } = offsetMeters(
        { lat: seed.lat, lng: seed.lng },
        Math.cos(theta) * radius,
        Math.sin(theta) * radius
      );
      if (
        lat < KOREA_BOUNDS.minLat || lat > KOREA_BOUNDS.maxLat ||
        lng < KOREA_BOUNDS.minLng || lng > KOREA_BOUNDS.maxLng
      ) continue;

      const dup = samples.some(
        (s) => distanceKm({ latitude: lat, longitude: lng }, { latitude: s.lat, longitude: s.lng }) * 1000 < 120
      );
      if (dup) continue;

      samples.push({
        reportId: `mock-seed-${seed.name}-${samples.length}`,
        lat,
        lng,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        photoUri: MOCK_PHOTOS[0],
        address: `${seed.name} 인근 (임시)`,
        note: Math.random() < 0.35 ? '대형 폐기물 있음' : '',
        reportedAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString(),
      });
    }
    setFlags((prev) => {
      const nonSeed = prev.filter((f) => !String(f.reportId).startsWith('mock-seed-'));
      return [...nonSeed, ...samples];
    });
  }, []);

  useEffect(() => {
    if (seedTenMocksOnceRef.current) return;
    seedTenMocksOnceRef.current = true;
    seedTenMocks();
  }, [seedTenMocks]);

  // ===== DEV_MOCK용 시드 =====
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const randomPick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function seedMockFlagsByRegion(rgn, count = MOCK_COUNT) {
    if (!rgn) return;
    const statuses = ['pending', 'processing', 'completed'];

    const latMin = Math.max(KOREA_BOUNDS.minLat, rgn.latitude - rgn.latitudeDelta / 2);
    const latMax = Math.min(KOREA_BOUNDS.maxLat, rgn.latitude + rgn.latitudeDelta / 2);
    const lngMin = Math.max(KOREA_BOUNDS.minLng, rgn.longitude - rgn.longitudeDelta / 2);
    const lngMax = Math.min(KOREA_BOUNDS.maxLng, rgn.longitude + rgn.longitudeDelta / 2);

    let localSeeds = KOREA_SEEDS.filter(
      (s) => s.lat >= latMin && s.lat <= latMax && s.lng >= lngMin && s.lng <= lngMax
    );
    if (localSeeds.length === 0) localSeeds = KOREA_SEEDS;

    const samples = [];
    const maxTry = count * 40;
    let tries = 0;

    while (samples.length < count && tries < maxTry) {
      tries++;
      const seed = randomPick(localSeeds);
      const radius = randomBetween(100, 1200);
      const theta = randomBetween(0, Math.PI * 2);
      const dx = Math.cos(theta) * radius;
      const dy = Math.sin(theta) * radius;
      const cand = offsetMeters({ lat: seed.lat, lng: seed.lng }, dx, dy);

      if (
        cand.lat < KOREA_BOUNDS.minLat ||
        cand.lat > KOREA_BOUNDS.maxLat ||
        cand.lng < KOREA_BOUNDS.minLng ||
        cand.lng > KOREA_BOUNDS.maxLng
      ) continue;

      const ok = samples.every(
        (s) => distanceKm({ latitude: cand.lat, longitude: cand.lng }, { latitude: s.lat, longitude: s.lng }) * 1000 >= MOCK_MIN_DIST_M
      );
      if (!ok) continue;

      samples.push({
        reportId: `mock-${Date.now()}-${samples.length}`,
        lat: cand.lat,
        lng: cand.lng,
        status: randomPick(statuses),
        photoUri: randomPick(MOCK_PHOTOS),
        address: `${seed.name} 인근 (테스트)`,
        note: Math.random() < 0.4 ? '대형 폐기물 있음' : '',
        reportedAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)).toISOString(),
      });
    }

    setFlags((prev) => {
      const remainReal = prev.filter((f) => !String(f.reportId).startsWith('mock-'));
      return [...remainReal, ...samples];
    });
  }

  // ===== 초기 권한 & 위치 & region =====
  useEffect(() => {
    (async () => {
      setRegion(KOREA_INITIAL_REGION);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (DEV_MOCK) seedMockFlagsByRegion(KOREA_INITIAL_REGION, MOCK_COUNT);
        return;
      }

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        if (DEV_MOCK) seedMockFlagsByRegion(KOREA_INITIAL_REGION, MOCK_COUNT);
        return;
      }

      let first = await Location.getLastKnownPositionAsync().catch(() => null);
      if (!first) {
        first = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 8000,
        }).catch(() => null);
      }
      if (first?.coords) setPos(first.coords);

      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (loc) => setPos(loc.coords)
      );
    })();

    return () => {
      if (watchRef.current?.remove) watchRef.current.remove();
    };
  }, []);

  // region 변경 처리
  useEffect(() => {
    if (!region) return;
    if (DEV_MOCK) {
      if (flags.length === 0) seedMockFlagsByRegion(region, MOCK_COUNT);
    } else {
      fetchFlags(region);
    }
  }, [region]); // eslint-disable-line

  // 지도 영역 변경
  const onRegionChangeComplete = (r) => {
    setRegion(r);
    if (!DEV_MOCK) fetchFlags(r);
  };

  // 주소 역지오
  const resolveAddress = async (coord) => {
    if (!coord) {
      setPhotoAddress('');
      return;
    }
    try {
      const g = await Location.reverseGeocodeAsync(coord);
      if (g?.[0]) setPhotoAddress(formatAddress(g[0]));
    } catch {
      setPhotoAddress('');
    }
  };

  // 사진 촬영/선택
  const pickImage = async () => {
    try {
      if (Platform.OS === 'ios' && !Device.isDevice) {
        Alert.alert('안내', '시뮬레이터는 카메라가 없어 앨범에서 선택합니다.');
        const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!libPerm.granted) {
          Alert.alert('권한 필요', '앨범 접근 권한을 허용해주세요.');
          return;
        }
        const lib = await ImagePicker.launchImageLibraryAsync({
          quality: 0.9,
          exif: true,
          mediaTypes: ImagePicker.MediaType.image,
        });
        if (!lib || lib.canceled) return;
        const asset = lib.assets?.[0];
        if (!asset) return;

        setPhoto(asset);
        setShotPool((prev) => [asset.uri, ...prev].slice(0, 50));
        const exifCoord = extractLatLngFromExif(asset?.exif);
        const fallback = pos ? { latitude: pos.latitude, longitude: pos.longitude } : null;
        const target = exifCoord || fallback;
        setPhotoCoord(target);
        resolveAddress(target);
        if (target) mapRef.current?.animateCamera({ center: target, zoom: 16 }, { duration: 600 });
        return;
      }

      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (!cam.granted) {
        Alert.alert('권한 필요', '카메라 권한을 허용해주세요.');
        return;
      }
      const loc = await Location.requestForegroundPermissionsAsync();
      if (!loc.granted) {
        Alert.alert('권한 필요', '위치 권한을 허용해주세요.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.9,
        exif: true,
      });
      if (!result || result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) {
        Alert.alert('실패', '사진을 불러오지 못했습니다.');
        return;
      }

      setPhoto(asset);
      setShotPool((prev) => [asset.uri, ...prev].slice(0, 50));

      const exifCoord = extractLatLngFromExif(asset?.exif);
      let gpsCoord = null;
      try {
        const cur = await Promise.race([
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            maximumAge: 5000,
            timeout: 3000,
          }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('gps-timeout')), 3000)),
        ]).catch(() => null);
        if (cur?.coords) gpsCoord = { latitude: cur.coords.latitude, longitude: cur.coords.longitude };
      } catch {}

      const target =
        exifCoord || gpsCoord || (pos ? { latitude: pos.latitude, longitude: pos.longitude } : null);
      setPhotoCoord(target);
      resolveAddress(target);
      if (!target) Alert.alert('안내', '사진 위치를 확인할 수 없습니다.');
      else mapRef.current?.animateCamera({ center: target, zoom: 16 }, { duration: 600 });
    } catch (err) {
      console.log('[pickImage] error:', err);
      Alert.alert('오류', '카메라/앨범을 여는 중 문제가 발생했습니다.');
    }
  };

  // 업로드(실서버용)
  async function uploadPhotoIfNeeded(localUri) {
    if (!localUri || /^https?:\/\//.test(localUri)) return localUri;
    const form = new FormData();
    form.append('file', { uri: localUri, name: 'photo.jpg', type: 'image/jpeg' });
    const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`upload failed: ${res.status}`);
    const json = await res.json();
    return json.url;
  }

  // 신고 전송
  const submitReport = async () => {
    if (submitting) return;

    if (!photo) {
      Alert.alert('안내', '불법 투기 현장 사진을 먼저 선택해주세요.');
      return;
    }
    const target = photoCoord || pos;
    if (!target) {
      Alert.alert('안내', '사진 위치/현재 위치를 확인할 수 없습니다.');
      return;
    }

    let address = photoAddress;
    if (!address) {
      try {
        const g = await Location.reverseGeocodeAsync(target);
        if (g?.[0]) address = formatAddress(g[0]);
      } catch {}
    }

    const localUri = photo.uri;

    // UI 즉시 반영(임시 항목)
    const tempReportId = `temp-${Date.now()}`;
    const newReport = {
      reportId: tempReportId,
      lat: target.latitude,
      lng: target.longitude,
      status: 'pending',
      photoUri: localUri,
      address: address || '주소 정보 없음',
      note,
      reportedAt: new Date().toISOString(),
    };
    setFlags((prev) => [...prev, newReport]);

    setReportOpen(false);
    setNote('');
    setPhoto(null);
    setPhotoCoord(null);
    setPhotoAddress('');

    setToast('신고가 성공적으로 접수되었습니다');
    setTimeout(() => setToast(''), 2000);

    if (DEV_MOCK) return;

    setSubmitting(true);
    (async () => {
      try {
        let photoUrl = '';
        try {
          photoUrl = await withTimeout(uploadPhotoIfNeeded(localUri), 15000);
        } catch (e) {
          console.log('[upload] fail or timeout', e);
          photoUrl = '';
        }
        const res = await withTimeout(
          fetch(`${API_BASE}/api/trash/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8', Accept: 'application/json' },
            body: JSON.stringify({
              lat: target.latitude,
              lng: target.longitude,
              note,
              photoUri: photoUrl,
              address,
            }),
          }),
          10000
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (region) fetchFlags(region);
      } catch (e) {
        console.log('[report] network error or timeout', e);
        Alert.alert('오류', '신고 처리 중 문제가 발생했습니다.');
      } finally {
        setSubmitting(false);
      }
    })();
  };

  /* ✅ 서버 응답/내부 데이터를 표준 형태로 정규화 */
function normalizeReport(r) {
  if (!r) return null;
  const lat = Number(r.lat ?? r.latitude);
  const lng = Number(r.lng ?? r.longitude);
  const status = String(r.status || '').toLowerCase();

  // 다양한 키를 하나로 통일
  const photoUri =
    r.photoUri || r.photo_url || r.photo || r.imageUrl || r.image_url || r.image || '';
  const completedPhoto =
    r.completedPhoto || r.completed_photo || r.completedImage || r.completedImageUrl || r.completed_image_url || '';

  return {
    ...r,
    reportId: r.reportId ?? r.id ?? r.report_id ?? r._id,
    lat, lng, status,
    photoUri,
    completedPhoto,
    address: r.address || r.addr || '',
    note: r.note || '',
    reportedAt: r.reportedAt || r.createdAt || r.created_at || r.time || new Date().toISOString(),
  };
}


  // 지도 탭: 주변 리스트
  const handleMapPress = async (e) => {
    const { coordinate } = e.nativeEvent;
    setSelectedCenter({ lat: coordinate.latitude, lng: coordinate.longitude, address: '' });
    openSheetToHalf();

    try {
      const g = await Location.reverseGeocodeAsync({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });
      if (g?.[0]) {
        const addr = formatAddress(g[0]);
        setSelectedCenter((prev) => ({ ...prev, address: addr }));
      }
    } catch {}
  };

  // 마커 클릭 시 패널 오픈
  const handleMarkerPress = (report) => {
    setSelectedCenter({ lat: report.lat, lng: report.lng, address: report.address || '' });
    openSheetToHalf();
  };

  // ✅ 선택 지점 주변(반경 10km) 분류
  const categorizedReports = useMemo(() => {
    if (!selectedCenter) {
      return { all: [], pending: [], processing: [], completed: [], counts: { pending: 0, processing: 0, completed: 0 } };
    }
    const center = { latitude: selectedCenter.lat, longitude: selectedCenter.lng };
    const nearby = flags.filter((f) => distanceKm(center, { latitude: f.lat, longitude: f.lng }) <= SEARCH_RADIUS_KM);

    const pending = nearby.filter((r) => r.status === 'pending');
    const processing = nearby.filter((r) => r.status === 'processing');
    const completed = nearby.filter((r) => r.status === 'completed');

    return {
      all: nearby,
      pending,
      processing,
      completed,
      counts: { pending: pending.length, processing: processing.length, completed: completed.length },
    };
  }, [flags, selectedCenter]);

  // 지도 표시 마커(필터)
  const visibleMarkers = useMemo(() => {
    if (filterStatus === 'ALL') return flags;
    return flags.filter((f) => f.status === filterStatus.toLowerCase());
  }, [flags, filterStatus]);

  const canSubmit = !!photo && (!!photoCoord || !!pos);

  // ✅ 썸네일 결정
  const getDisplayPhoto = useCallback(
    (report) => report?.photoUri || shotPool[0] || MOCK_PHOTOS[0],
    [shotPool]
  );

  // 이동 컨트롤
  const moveToMyLocation = async () => {
    try {
      let target = pos;
      if (!target) {
        const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeout: 8000 });
        target = cur.coords;
        setPos(cur.coords);
      }
      mapRef.current?.animateCamera(
        { center: { latitude: target.latitude, longitude: target.longitude }, zoom: 16 },
        { duration: 600 }
      );
    } catch {
      Alert.alert('오류', '현재 위치로 이동할 수 없습니다.');
    }
  };
  const moveToAll = () => {
    mapRef.current?.animateToRegion(KOREA_INITIAL_REGION, 600);
  };

  // 바텀시트
  const SHEET_MIN = Math.round(SCREEN_H * 0.28);
  const SHEET_MAX = Math.round(SCREEN_H * 0.72);
  const sheetHeight = useRef(new Animated.Value(0)).current;
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheetToHalf = () => {
    setSheetOpen(true);
    Animated.timing(sheetHeight, { toValue: SHEET_MIN, duration: 220, useNativeDriver: false }).start();
  };
  const openSheetToMax = () => {
    setSheetOpen(true);
    Animated.timing(sheetHeight, { toValue: SHEET_MAX, duration: 220, useNativeDriver: false }).start();
  };
  const closeSheet = () => {
    Animated.timing(sheetHeight, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setSheetOpen(false));
  };

  const pan = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderMove: (_, g) => {
        const next = Math.min(SHEET_MAX, Math.max(0, sheetHeight._value - g.dy));
        sheetHeight.setValue(next);
        pan.setValue(g.dy);
      },
      onPanResponderRelease: () => {
        const current = sheetHeight._value;
        const snap = Math.abs(current - SHEET_MIN) < Math.abs(current - SHEET_MAX) ? SHEET_MIN : SHEET_MAX;
        if (current < SHEET_MIN * 0.5) {
          closeSheet();
        } else {
          Animated.spring(sheetHeight, { toValue: snap, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  // ===== 렌더링 =====
  return (
    <View style={{ flex: 1 }}>
      {region && (
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          rotateEnabled={false}
          customMapStyle={googleMapStyle}
        >
          {/* 민원 마커 */}
          {visibleMarkers.map((f) => (
            <Marker
              key={f.reportId}
              coordinate={{ latitude: f.lat, longitude: f.lng }}
              anchor={{ x: 0.5, y: 1 }}
              centerOffset={{ x: 0, y: -20 }}
              tracksViewChanges={trackMarkerViews}
              onPress={() => handleMarkerPress(f)}
              onCalloutPress={() => handleMarkerPress(f)}
            >
              <View
                style={[
                  styles.reportMarker,
                  { backgroundColor: MARKER_COLOR[f.status.toUpperCase()] || '#888' },
                ]}
              />
              <Callout tooltip>
                <View style={styles.calloutCard}>
                  <Image source={{ uri: getDisplayPhoto(f) }} style={styles.calloutImg} />
                  <View style={{ padding: 8 }}>
                    <Text style={styles.calloutTitle}>
                      {REPORT_STATUS[f.status.toUpperCase()] || '상태'}
                    </Text>
                    <Text style={styles.calloutAddr}>
                      {(f.address || '근처').toString().slice(0, 28)}
                    </Text>
                    <Text style={styles.calloutHint}>탭하여 주변 민원 보기</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}

      {/* 상단 상태 필터 버튼 */}
      <View style={styles.filterRow}>
        {[
          { key: 'ALL', label: '전체', color: GREEN },
          { key: 'completed', label: REPORT_STATUS.COMPLETED, color: MARKER_COLOR.COMPLETED },
          { key: 'processing', label: REPORT_STATUS.PROCESSING, color: MARKER_COLOR.PROCESSING },
          { key: 'pending', label: REPORT_STATUS.PENDING, color: MARKER_COLOR.PENDING },
        ].map((b) => {
          const active = filterStatus.toLowerCase() === b.key.toLowerCase();
          return (
            <TouchableOpacity
              key={b.key}
              onPress={() => setFilterStatus(b.key.toUpperCase() === 'ALL' ? 'ALL' : b.key)}
              style={[styles.filterBtn, active && { backgroundColor: b.color, borderColor: b.color }]}
            >
              <Text style={[styles.filterText, active && { color: '#fff', fontWeight: '800' }]}>{b.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 신고 FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => {
          setSubmitting(false);
          setReportOpen(true);
          closeSheet();
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>신고</Text>
      </Pressable>

      {/* 위치 버튼 */}
      <View style={styles.locateRow}>
        <TouchableOpacity style={styles.locateBtn} onPress={moveToMyLocation}>
          <Text style={styles.locateText}>내 위치</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.locateBtn, { marginLeft: 8 }]} onPress={moveToAll}>
          <Text style={styles.locateText}>전체 지도</Text>
        </TouchableOpacity>
        {DEV_MOCK && (
          <TouchableOpacity
            style={[styles.locateBtn, { marginLeft: 8 }]}
            onPress={() => seedMockFlagsByRegion(region || KOREA_INITIAL_REGION, MOCK_COUNT)}
          >
            <Text style={styles.locateText}>임시데이터 새로고침</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 하단 패널: 커뮤니티 / (관련 법규 & 안내 | 로그아웃) */}
      <View style={styles.bottomPanel}>
        <Pressable style={[styles.bigBtn, styles.primary]} onPress={() => navigation.navigate('CommunityScreen')}>
          <Text style={styles.bigBtnText}>커뮤니티</Text>
        </Pressable>

        <View style={styles.bottomRow}>
          <Pressable
            style={[styles.halfBtn, styles.ghost]}
            onPress={() => navigation.navigate('FirstAidGuideScreen')}
          >
            <Text style={[styles.bigBtnText, { color: GREEN_DARK }]}>관련 법규 & 안내</Text>
          </Pressable>

          <Pressable style={[styles.halfBtn, styles.primary]} onPress={onLogout}>
            <Text style={styles.bigBtnText}>로그아웃</Text>
          </Pressable>
        </View>
      </View>

      {/* 신고 모달 */}
      <Modal
        visible={reportOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSubmitting(false);
          setReportOpen(false);
          setPhoto(null);
          setPhotoCoord(null);
          setPhotoAddress('');
          setNote('');
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>불법 투기 신고</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>현장 사진 촬영/업로드</Text>
            </TouchableOpacity>

            {photo && (
              <View style={styles.previewRow}>
                <Image source={{ uri: photo.uri }} style={styles.previewImg} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>처리 전 사진</Text>
                  {photoCoord ? (
                    <Text style={{ fontSize: 12, color: '#666' }}>
                      {`위치: ${photoAddress || `${photoCoord.latitude.toFixed(5)}, ${photoCoord.longitude.toFixed(5)}`}`}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 12, color: '#999' }}>위치: 정보 없음</Text>
                  )}
                </View>
              </View>
            )}

            <TextInput
              placeholder="특이사항 (선택, 예: 대형 폐기물)"
              value={note}
              onChangeText={setNote}
              style={styles.input}
              placeholderTextColor="#999"
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#ddd' }]}
                onPress={() => {
                  setSubmitting(false);
                  setReportOpen(false);
                  setPhoto(null);
                  setPhotoCoord(null);
                  setPhotoAddress('');
                  setNote('');
                }}
              >
                <Text>취소</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: canSubmit && !submitting ? GREEN : '#bbb', opacity: canSubmit && !submitting ? 1 : 0.6 },
                ]}
                onPress={submitReport}
                disabled={!canSubmit || submitting}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {submitting ? '신고 접수 중...' : '신고 접수하기'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ 상세 보기 모달 (신고 전 사진 + 수거 완료 사진 스크롤로 표시) */}
<Modal visible={detailOpen} transparent animationType="fade" onRequestClose={closeDetail}>
  <View style={styles.detailBackdrop}>
    <View style={styles.detailCard}>
      <Text style={styles.detailTitle}>신고 상세</Text>

      {/* 사진 영역: 스크롤로 두 장 표시 */}
      <ScrollView style={{ maxHeight: SCREEN_W > 420 ? 480 : 420 }}>
        {/* 1) 신고 전(처음 신고) 사진 */}
        {!!detailReport?.photoUri && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ paddingHorizontal: 12, paddingBottom: 6, fontSize: 12, color: '#6b7c70' }}>
              접수 완료 된 사진
            </Text>
            <Image source={{ uri: detailReport.photoUri }} style={styles.detailImage} />
          </View>
        )}

        {/* 2) 수거 완료 사진 (있을 때만) */}
        {!!detailReport?.completedPhoto && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ paddingHorizontal: 12, paddingBottom: 6, fontSize: 12, color: '#1E8A52', fontWeight: '800' }}>
              처리 완료 된 사진
            </Text>
            <Image source={{ uri: detailReport.completedPhoto }} style={styles.detailImage} />
          </View>
        )}
      </ScrollView>

      {/* 텍스트 정보 */}
      <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
        <Text style={styles.detailLabel}>주소</Text>
        <Text style={styles.detailValue}>{detailReport?.address || '정보 없음'}</Text>

        <Text style={[styles.detailLabel, { marginTop: 10 }]}>상태</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>
            {REPORT_STATUS[(detailReport?.status || '').toUpperCase()] || '상태'}
          </Text>
        </View>

        <Text style={[styles.detailLabel, { marginTop: 10 }]}>특이사항</Text>
        <Text style={styles.detailValue}>{detailReport?.note || '없음'}</Text>

        <Text style={[styles.detailLabel, { marginTop: 10 }]}>신고일시</Text>
        <Text style={styles.detailValue}>
          {detailReport?.reportedAt ? new Date(detailReport.reportedAt).toLocaleString() : '-'}
        </Text>
      </View>

      {/* 버튼들 */}
      <View style={styles.detailBtnRow}>
        {!!detailReport?.photoUri && (
          <TouchableOpacity
            style={[styles.detailBtn, { backgroundColor: '#6F63FF' }]}
            onPress={() => Linking.openURL(detailReport.photoUri)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>원본 열기</Text>
          </TouchableOpacity>
        )}
        {!!detailReport?.completedPhoto && (
          <TouchableOpacity
            style={[styles.detailBtn, { backgroundColor: '#2DB36F' }]}
            onPress={() => Linking.openURL(detailReport.completedPhoto)}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>완료 사진 열기</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.detailBtn, { backgroundColor: '#E9ECEF' }]} onPress={closeDetail}>
          <Text style={{ color: '#333', fontWeight: 'bold' }}>닫기</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>


      {/* 주변 민원 바텀시트 */}
      {sheetOpen && (
        <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
          <View style={styles.sheetHandle} {...panResponder.panHandlers}>
            <View style={styles.sheetHandleBar} />
          </View>

          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>주변 민원 현황(반경 10km)</Text>
            <Text style={styles.panelAddress}>{selectedCenter?.address || '주소 정보 없음'}</Text>

            <View style={styles.badgeRow}>
              {[
                { key: 'ALL', text: '전체', count: categorizedReports.all.length, color: GREEN },
                { key: 'completed', text: REPORT_STATUS.COMPLETED, count: categorizedReports.counts.completed, color: MARKER_COLOR.COMPLETED },
                { key: 'processing', text: REPORT_STATUS.PROCESSING, count: categorizedReports.counts.processing, color: MARKER_COLOR.PROCESSING },
                { key: 'pending', text: REPORT_STATUS.PENDING, count: categorizedReports.counts.pending, color: MARKER_COLOR.PENDING },
              ].map((b) => {
                const active = filterStatus.toLowerCase() === b.key.toLowerCase();
                return (
                  <TouchableOpacity
                    key={b.key}
                    onPress={() => setFilterStatus(b.key)}
                    style={[styles.badge, { borderColor: b.color, backgroundColor: active ? b.color : '#fff' }]}
                  >
                    <View style={[styles.dot, { backgroundColor: active ? '#fff' : b.color }]} />
                    <Text style={[styles.badgeText, active && { color: '#fff', fontWeight: '800' }]}>
                      {b.text} {b.count}건
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.listContainer}>
            {(filterStatus === 'ALL' ? categorizedReports.all : categorizedReports[filterStatus])?.map((r) => (
              <View key={r.reportId} style={styles.reportItem}>
                <Text style={styles.reportItemText}>📍 {(r.address || '근처').toString().slice(0, 40)}</Text>
                <Text style={styles.reportItemStatus}>{REPORT_STATUS[r.status.toUpperCase()]}</Text>

                <TouchableOpacity activeOpacity={0.8} onPress={() => openDetail(r)}>
                  <Image source={{ uri: getDisplayPhoto(r) }} style={styles.reportPhoto} />
                </TouchableOpacity>

                <Text style={styles.reportItemNote}>특이사항: {r.note || '없음'}</Text>
                <Text style={styles.reportTime}>신고일시: {new Date(r.reportedAt).toLocaleString()}</Text>
              </View>
            ))}
            {((filterStatus === 'ALL' ? categorizedReports.all : categorizedReports[filterStatus])?.length || 0) === 0 && (
              <Text style={styles.noReportText}>민원 내역이 없습니다.</Text>
            )}
          </ScrollView>

          <View style={styles.sheetBottomRow}>
            <TouchableOpacity style={styles.closePanelBtn} onPress={closeSheet}>
              <Text style={styles.closePanelText}>닫기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.expandBtn} onPress={openSheetToMax}>
              <Text style={styles.expandText}>위로 더 보기</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* 토스트 */}
      {!!toast && (
        <View style={styles.toast}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

/* ===== 지도 스타일 (그린 톤) ===== */
const googleMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#F3F8F4' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5F6A60' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F3F8F4' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#DFF2E1' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#7C8B7F' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#D0F0E8' }] },
];

/* ===== 스타일 ===== */
const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 200,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.20,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  locateRow: { position: 'absolute', left: 16, bottom: 200, flexDirection: 'row' },
  locateBtn: {
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  locateText: { color: GREEN_DARK, fontWeight: '700' },

  bottomPanel: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  bigBtn: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primary: { backgroundColor: GREEN },
  ghost: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: GREEN },
  bigBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  // ✅ 두 번째 줄: 반반 배치
  bottomRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  halfBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'flex-end' },
  modalCard: { width: '100%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: GREEN_DARK, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: GREEN_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: '#111',
    marginTop: 10,
  },
  modalBtn: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtn: {
    height: 44,
    borderRadius: 10,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  previewImg: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#eee' },

  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: GREEN_DARK,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  reportMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },

  /* ✅ 콜아웃 카드 스타일 */
  calloutCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 6,
  },
  calloutImg: { width: 220, height: 110, backgroundColor: '#ddd' },
  calloutTitle: { fontWeight: '800', color: '#333' },
  calloutAddr: { fontSize: 12, color: '#666', marginTop: 2 },
  calloutHint: { fontSize: 11, color: '#9aa1a7', marginTop: 6 },

  filterRow: {
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: GREEN_BORDER,
    alignItems: 'center',
  },
  filterText: { color: GREEN_DARK, fontWeight: '700', fontSize: 12 },

  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: -5 },
    overflow: 'hidden',
  },
  sheetHandle: { paddingVertical: 10, alignItems: 'center' },
  sheetHandleBar: { width: 46, height: 5, borderRadius: 3, backgroundColor: GREEN_BORDER },
  sheetBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  expandBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: GREEN_LIGHT, borderRadius: 10 },
  expandText: { fontWeight: '700', color: GREEN_DARK },

  panelHeader: { paddingHorizontal: 16, marginBottom: 6 },
  panelTitle: { fontSize: 18, fontWeight: 'bold', color: GREEN_DARK },
  panelAddress: { fontSize: 13, color: '#5F6A60' },

  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  badgeText: { fontSize: 12, fontWeight: '700', color: GREEN_DARK },

  listContainer: { paddingBottom: 80, paddingHorizontal: 16 },
  reportItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: GREEN_BORDER },
  reportItemText: { fontSize: 14, fontWeight: '600', color: '#1f1f1f' },
  reportItemStatus: { fontSize: 12, color: GREEN_DARK, marginTop: 4, fontWeight: 'bold' },
  reportPhoto: { width: '100%', height: 120, borderRadius: 8, marginVertical: 6, backgroundColor: '#ddd' },
  reportItemNote: { fontSize: 12, color: '#555', marginTop: 4 },
  reportTime: { fontSize: 11, color: '#6b7c70', marginTop: 2 },
  noReportText: { color: '#7f8f84', fontSize: 13, textAlign: 'center', paddingVertical: 10 },

  closePanelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: GREEN_LIGHT,
    borderRadius: 10,
    alignItems: 'center',
  },
  closePanelText: { fontWeight: 'bold', color: GREEN_DARK },

  /* ✅ 상세 모달 스타일 */
  detailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  detailCard: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#222',
    textAlign: 'center',
    paddingVertical: 12,
  },
  detailImage: {
    width: '100%',
    height: SCREEN_W > 420 ? 360 : 300,
    backgroundColor: '#eee',
  },
  detailLabel: { fontSize: 13, color: '#8A8F98' },
  detailValue: { fontSize: 16, color: '#222', marginTop: 2 },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: GREEN_LIGHT,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillText: { color: GREEN_DARK, fontWeight: '800' },
  detailBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 12,
  },
  detailBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


