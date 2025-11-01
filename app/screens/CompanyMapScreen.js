// app/screens/CompanyMapScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert, Dimensions, ScrollView, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Device from 'expo-device';
import { API_BASE } from '../core/config';

const GREEN = '#2DB36F';
const GREEN_DARK = '#1E8A52';
const GREEN_LIGHT = '#E6F4EA';
const GREEN_BORDER = '#B7E1C0';

const STATUS_TEXT = { pending: '접수 완료', processing: '처리 진행 중', completed: '처리 완료' };
const COLOR = { pending: '#F4D35E', processing: '#F4D35E', completed: '#1B5E20' }; // ✅ 처리중=노랑
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop';

const KOREA_INITIAL_REGION = { latitude: 36.5, longitude: 127.8, latitudeDelta: 8.5, longitudeDelta: 7.5 };
const { width: SCREEN_W } = Dimensions.get('window');



const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  '';

function imagePickerOptions(base = {}) {
  const MT = ImagePicker?.MediaType?.Images;
  if (MT) return { quality: 0.9, mediaTypes: [MT], ...base };
  return { quality: 0.9, mediaTypes: ImagePicker.MediaTypeOptions.Images, ...base };
}

/* ===== 간단 이벤트 버스 ===== */
function getBus() {
  if (!globalThis.__CIVIC_EVENT_BUS) {
    const handlers = {};
    globalThis.__CIVIC_EVENT_BUS = {
      on(evt, fn) { (handlers[evt] ||= new Set()).add(fn); return () => handlers[evt].delete(fn); },
      emit(evt, payload) { (handlers[evt] || []).forEach((fn) => { try { fn(payload); } catch {} }); },
    };
  }
  return globalThis.__CIVIC_EVENT_BUS;
}

function toRad(v) { return (v * Math.PI) / 180; }
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

function decodePolyline(encoded = '') {
  let index = 0, lat = 0, lng = 0, coordinates = [];
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;
    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coordinates;
}

/* 시간 포맷 */
function fmtKo(dt) {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleString('ko-KR'); } catch { return String(dt); }
}

/* ✅ 서버 응답을 표준 필드로 정규화 */
function normalizeReport(r) {
  if (!r) return null;
  const lat = Number(r.lat ?? r.latitude);
  const lng = Number(r.lng ?? r.longitude);
  const status = String(r.status || '').toLowerCase();

  const photoUri =
    r.photoUri || r.photo_url || r.photo || r.imageUrl || r.image_url || r.image || '';
  const completedPhoto =
    r.completedPhoto || r.completed_photo || r.completedImage || r.completedImageUrl || r.completed_image_url || '';

  // ⬇️ 서버가 내려줄 수도 있는 다양한 키 대응
  const completedAt =
    r.completedAt || r.completed_at || r.completedTime || r.completed_time || null;


  return {
    ...r,
    reportId: r.reportId ?? r.id ?? r.report_id ?? r._id,
    lat, lng, status,
    photoUri,
    completedPhoto,
    completedAt,     
    address: r.address || r.addr || '',
    note: r.note || '',
    reportedAt: r.reportedAt || r.createdAt || r.created_at || r.time || new Date().toISOString(),
  };
}

export default function CompanyMapScreen() {
  const mapRef = useRef(null);
  const watchRef = useRef(null);
  const movingRef = useRef(false);
  const mountedRef = useRef(true);
  const cacheRef = useRef(new Map());

  const [region, setRegion] = useState(KOREA_INITIAL_REGION);
  const [pos, setPos] = useState(null);
  const [flags, setFlags] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  const [navigating, setNavigating] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceM, setDistanceM] = useState(0);
  const [navBusy, setNavBusy] = useState(false);
  const navActiveRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      navActiveRef.current = false;
      if (watchRef.current?.remove) { try { watchRef.current.remove(); } catch {} }
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const cur = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null);
        if (cur?.coords && isFinite(cur.coords.latitude) && isFinite(cur.coords.longitude)) {
          setPos(cur.coords);
          try {
            mapRef.current?.animateCamera(
              { center: { latitude: cur.coords.latitude, longitude: cur.coords.longitude }, zoom: 12 },
              { duration: 600 }
            );
          } catch {}
        }
      } catch {}
    })();
  }, []);

  useEffect(() => { fetchFlags(region); }, [region]);

  async function fetchFlags(rgn) {
    if (!rgn) return;
    const isNation = rgn.latitudeDelta >= 5 || rgn.longitudeDelta >= 5;
    const neLat = isNation ? 38.65 : rgn.latitude + rgn.latitudeDelta / 2;
    const swLat = isNation ? 33.0  : rgn.latitude - rgn.latitudeDelta / 2;
    const neLng = isNation ? 131.1 : rgn.longitude + rgn.longitudeDelta / 2;
    const swLng = isNation ? 124.6 : rgn.longitude - rgn.longitudeDelta / 2;

    try {
      const url = `${API_BASE}/api/trash/reports?neLat=${neLat}&neLng=${neLng}&swLat=${swLat}&swLng=${swLng}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json().catch(() => ({}));

      // ✅ completedPhoto 포함하여 정규화
      const normalized = (data.reports || [])
        .map(normalizeReport)
        .filter(r => isFinite(r.lat) && isFinite(r.lng));

       const merged = normalized.map((it) => {
   const c = cacheRef.current.get(it.reportId);
   if (c?.status === 'completed') {
     return {
       ...it,
       status: 'completed',
       completedPhoto: it.completedPhoto || c.completedPhoto,
       completedAt: it.completedAt || c.completedAt,
     };
   }
   return it;
 });
 if (mountedRef.current) setFlags(merged); // ✅ 캐시 보강 후 반영
    } catch (e) {
      console.log('[company] fetch fail', e);
    }
  }

  const openDetail = (r) => { setCurrent(r); setDetailOpen(true); };
  const closeDetail = () => { setDetailOpen(false); setCurrent(null); };

  async function getRoutePath(origin, destination) {
    const ok = (p) => p && isFinite(p.latitude) && isFinite(p.longitude);
    if (!ok(origin) || !ok(destination)) return [];
    if (!GOOGLE_MAPS_API_KEY) return [origin, destination];
    try {
      const o = `${origin.latitude},${origin.longitude}`;
      const d = `${destination.latitude},${destination.longitude}`;
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${o}&destination=${d}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`directions HTTP ${res.status}`);
      const json = await res.json();
      const points = json?.routes?.[0]?.overview_polyline?.points || '';
      if (!points) return [origin, destination];
      const decoded = decodePolyline(points);
      const safe = decoded.filter(p => isFinite(p.latitude) && isFinite(p.longitude));
      if (safe.length < 2) return [origin, destination];
      return safe;
    } catch (e) {
      console.log('[directions] fail', e);
      return [origin, destination];
    }
  }

  const startNavigation = async (r) => {
    if (navBusy) return;
    setNavBusy(true);
    try {
      if (!r) { Alert.alert('오류', '목표가 없습니다.'); return; }
      if (!pos || !isFinite(pos.latitude) || !isFinite(pos.longitude)) {
        Alert.alert('안내', '현재 위치를 먼저 가져오는 중입니다.');
        return;
      }
      const lat = Number(r.lat), lng = Number(r.lng);
      if (!isFinite(lat) || !isFinite(lng)) { Alert.alert('오류', '목표 위치가 올바르지 않습니다.'); return; }

      const origin = { latitude: Number(pos.latitude), longitude: Number(pos.longitude) };
      const target = { latitude: lat, longitude: lng };

      const path = await getRoutePath(origin, target);
      if (path.length >= 2) {
        setRouteCoords(path);
        setDistanceM(Math.round(distanceKm(origin, target) * 1000));
        setDetailOpen(false);
        setNavigating(true);
      } else {
        Alert.alert('오류', '경로를 계산할 수 없습니다.');
        return;
      }

      if (watchRef.current?.remove) { try { watchRef.current.remove(); } catch {} }
      navActiveRef.current = true;

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1500, distanceInterval: 2 },
        async (loc) => {
          try {
            if (!navActiveRef.current || !mountedRef.current) return;
            const ok = loc?.coords && isFinite(loc.coords.latitude) && isFinite(loc.coords.longitude);
            if (!ok) return;

            const me = { latitude: Number(loc.coords.latitude), longitude: Number(loc.coords.longitude) };
            setPos(loc.coords);

            try {
              mapRef.current?.animateCamera({ center: me, zoom: 16 }, { duration: 350 });
            } catch {}

            if (GOOGLE_MAPS_API_KEY) {
              if (!movingRef.current) {
                movingRef.current = true;
                try {
                  const newPath = await getRoutePath(me, target);
                  setRouteCoords(newPath);
                } finally {
                  setTimeout(() => { movingRef.current = false; }, 8000);
                }
              }
            } else {
              setRouteCoords([me, target]);
            }

            const d = Math.round(distanceKm(me, target) * 1000);
            setDistanceM(d);

            if (d <= 30) {
              stopNavigation();
              setCurrent(r);
              setDetailOpen(true);
            }
          } catch (err) { console.log('[watch cb] error', err); }
        }
      );
      watchRef.current = sub;
    } catch (err) {
      console.log('[startNavigation] error', err);
      Alert.alert('오류', '길찾기를 시작할 수 없습니다.');
    } finally {
      setNavBusy(false);
    }
  };

  const stopNavigation = () => {
    navActiveRef.current = false;
    setNavigating(false);
    setRouteCoords([]);
    setDistanceM(0);
    if (watchRef.current?.remove) { try { watchRef.current.remove(); } catch {} }
  };

  const uploadPhotoIfNeeded = async (localUri) => {
    if (!localUri || /^https?:\/\//.test(localUri)) return localUri;
    const form = new FormData();
    form.append('file', { uri: localUri, name: 'complete.jpg', type: 'image/jpeg' });
    const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`upload failed: ${res.status}`);
    const json = await res.json().catch(() => ({}));
    return json.url || json.path || json.location || localUri;
  };

  const [completing, setCompleting] = useState(false);
  const markCompleted = async () => {
    if (!current || completing) return;
    try {
      setCompleting(true);

     
    // ⬇️ 촬영 시각(클라이언트 기준) 기록
    const completedAt = new Date().toISOString();

      let asset = null;
      if (Platform.OS === 'ios' && !Device.isDevice) {
        const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!libPerm.granted) { Alert.alert('권한 필요', '앨범 권한을 허용해주세요.'); return; }
        const res = await ImagePicker.launchImageLibraryAsync(imagePickerOptions());
        if (!res || res.canceled) return;
        asset = res.assets?.[0];
      } else {
        const cam = await ImagePicker.requestCameraPermissionsAsync();
        if (!cam.granted) { Alert.alert('권한 필요', '카메라 권한을 허용해주세요.'); return; }
        const res = await ImagePicker.launchCameraAsync(imagePickerOptions());
        if (!res || res.canceled) return;
        asset = res.assets?.[0];
      }
      if (!asset?.uri) return;

      const photoUrl = await uploadPhotoIfNeeded(asset.uri);

      // ✅ URL 통일: /api/trash/{id}/status
      const res = await fetch(`${API_BASE}/api/trash/${encodeURIComponent(current.reportId)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ status: 'completed', photoUri: photoUrl, completedAt }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      // 로컬 상태 업데이트
      setFlags((prev) => prev.map((it) =>
        it.reportId === current.reportId ? { ...it, status: 'completed', completedPhoto: photoUrl, completedAt} : it
      ));
      setCurrent((c) => (c ? { ...c, status: 'completed', completedPhoto: photoUrl, completedAt } : c));
      cacheRef.current.set(current.reportId, { status: 'completed', completedPhoto: photoUrl, completedAt });

      // 홈 화면 동기화
      try {
        getBus().emit('report-updated', { reportId: current.reportId, status: 'completed', completedPhoto: photoUrl, completedAt});
      } catch {}

      Alert.alert('완료', '민원이 처리 완료로 변경되었습니다.');
    } catch (e) {
      console.log('[complete] fail', e);
      Alert.alert('오류', `완료 처리에 실패했습니다.\n${String(e.message || e)}`);
    } finally {
      setCompleting(false);
    }
  };

  // const sortedFlags = useMemo(() => {
  //   if (!pos) return flags;
  //   return [...flags].sort((a, b) => {
  //     const da = distanceKm(
  //       { latitude: pos.latitude, longitude: pos.longitude },
  //       { latitude: a.lat, longitude: a.lng }
  //     );
  //     const db = distanceKm(
  //       { latitude: pos.latitude, longitude: pos.longitude },
  //       { latitude: b.lat, longitude: b.lng }
  //     );
  //     return da - db;
  //   });
  // }, [flags, pos]);


  const sortedFlags = useMemo(() => {
  if (!pos) return flags;
  const toMs = (v) => { 
    try { return v ? new Date(v).getTime() : 0; } catch { return 0; } };
  return [...flags].sort((a, b) => {
    // ① 거리 우선 (가까운 순)
    const da = distanceKm(
      { latitude: pos.latitude, longitude: pos.longitude },
      { latitude: a.lat, longitude: a.lng }
    );
    const db = distanceKm(
      { latitude: pos.latitude, longitude: pos.longitude },
      { latitude: b.lat, longitude: b.lng }
    );
    if (Math.abs(da - db) > 0.01) return da - db; // 0.01km 이상 차이면 거리순 우선

    // ② 거리 비슷하면 완료사진이 있는 게 위로
    const aHas = !!a.completedPhoto, bHas = !!b.completedPhoto;
    if (aHas !== bHas) return bHas - aHas;

    // ③ 둘 다 완료사진 있으면 completedAt 최신순
    const aKey = aHas ? (toMs(a.completedAt) || toMs(a.reportedAt)) : toMs(a.reportedAt);
    const bKey = bHas ? (toMs(b.completedAt) || toMs(b.reportedAt)) : toMs(b.reportedAt);
    return bKey - aKey; // 최신순 위로
  });
}, [flags, pos]);



  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        rotateEnabled={false}
      >
        {navigating && routeCoords.length >= 2 && (
          <Polyline
            coordinates={routeCoords.filter(p => isFinite(p.latitude) && isFinite(p.longitude))}
            strokeWidth={6}
            strokeColor={GREEN}
          />
        )}

        {flags.map((f) => (
          <Marker
            key={f.reportId}
            coordinate={{ latitude: f.lat, longitude: f.lng }}
            onPress={() => openDetail(f)}
          >
            <View style={[styles.dot, { backgroundColor: COLOR[f.status] || '#888' }]} />
            <Callout tooltip>
              <View style={styles.callout}>
                <Image source={{ uri: f.photoUri || FALLBACK_IMG }} style={styles.calloutImg} />
                <View style={{ padding: 8 }}>
                  <Text style={{ fontWeight: '800' }}>{STATUS_TEXT[f.status] || '상태'}</Text>
                  <Text style={{ fontSize: 12, color: '#666' }}>{(f.address || '').toString().slice(0, 28)}</Text>
                  {/* ✅ 콜아웃에 특이사항 요약 */}
                  <Text style={{ fontSize: 12, color: '#6b7c70', marginTop: 2 }}>
                    특이사항: {(f.note || '없음').toString().slice(0, 18)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9aa1a7', marginTop: 6 }}>탭하여 상세</Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {navigating && (
        <View style={styles.navBanner}>
          <Text style={styles.navText}>쓰레기까지 약 {Math.max(0, distanceM)} m</Text>
          <TouchableOpacity onPress={stopNavigation} style={styles.navStopBtn}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>길찾기 종료</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.listPanel}>
        <Text style={styles.listTitle}>신고 목록(가까운 순)</Text>
        <ScrollView style={{ maxHeight: 200 }}>
          {sortedFlags.map((r) => (
            <TouchableOpacity key={r.reportId} style={styles.item} onPress={() => openDetail(r)}>
              <Image source={{ uri: r.completedPhoto || r.photoUri || FALLBACK_IMG }} style={styles.itemImg} />

              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.itemTitle}>{(r.address || '위치').toString().slice(0, 22)}</Text>
                <Text style={[styles.badgeSmall, { borderColor: COLOR[r.status] }]}>{STATUS_TEXT[r.status] || '-'}</Text>
                {/* ✅ 리스트에도 특이사항 표시 */}
                <Text style={styles.itemNote}>특이사항: {r.note ? r.note : '없음'}</Text>
                {/* ✅ 수거 완료 사진이 있으면 작은 배지로 힌트 */}
                {!!r.completedPhoto && (
                  <Text style={{ marginTop: 2, fontSize: 11, color: GREEN_DARK, fontWeight: '700' }}>
                    완료 사진 등록됨
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Modal visible={!!detailOpen} transparent animationType="fade" onRequestClose={closeDetail}>
        <View style={styles.backdrop}> 
          <View style={styles.card}>
            <Text style={styles.title}>신고 상세(업체)</Text>

            {/* 사진들: 신고 전 + 완료 사진을 스크롤로 */}
            <ScrollView style={{ maxHeight: SCREEN_W > 420 ? 480 : 420 }}>
              {/* 1) 신고 전 사진 */}
              {!!current?.photoUri && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ paddingHorizontal: 12, paddingBottom: 6, fontSize: 12, color: '#6b7c70' }}>
                    사용자가 접수 한 사진
                  </Text>
                  <Image source={{ uri: current.photoUri || FALLBACK_IMG }} style={styles.mainImg} />
                </View>
              )}
              {/* 2) 수거 완료 사진 (있을 때만) */}
              {!!current?.completedPhoto && (
                <View style={{ marginBottom: 12 }}>
                  
                  <Text style={{ paddingHorizontal: 12, paddingBottom: 6, fontSize: 12, color: '#1E8A52', fontWeight: '800' }}>
                    처리 완료 된 사진
                  </Text>
                  {/*<Image source={{ uri: current.completedPhoto }} style={styles.mainImg} />*/}
                  <Image source={{ uri: current.completedPhoto || FALLBACK_IMG }} style={styles.mainImg} />


                  {/* ✅ 여기 추가: 신고 시각 표시 (HomeScreen과 동일 로직), 라벨만 '촬영일시' */}

                </View>
              )}
            </ScrollView>

            <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
              <Text style={styles.label}>주소</Text>
              <Text style={styles.value}>{current?.address || '정보 없음'}</Text>

              <Text style={[styles.label, { marginTop: 10 }]}>상태</Text>
              <View style={styles.pill}>
                <Text style={{ color: GREEN_DARK, fontWeight: '800' }}>
                  {STATUS_TEXT[current?.status] || '-'}
                </Text>
              </View>
   {/* ✅ HomeScreen과 동일: 신고 시각을 '촬영일시' 라벨로 노출 */}
   <Text style={[styles.label, { marginTop: 10 }]}>촬영일시</Text>
   <Text style={styles.value}>{fmtKo(current?.reportedAt)}</Text>

              
              {/* 특이사항 유지 */}
              <Text style={[styles.label, { marginTop: 10 }]}>특이사항</Text>
              <Text style={styles.value}>{current?.note ? current.note : '없음'}</Text>
            </View>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#0B72E7', marginRight: 10 }]}
                onPress={() => current && !navBusy && startNavigation(current)}
                disabled={navBusy}
              >
                <Text style={styles.btnText}>{navBusy ? '준비 중…' : '길찾기 시작'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: GREEN, marginRight: 10 }]}
                onPress={markCompleted}
                disabled={completing || current?.status === 'completed'}
              >
                <Text style={styles.btnText}>{completing ? '업로드 중...' : '수거 완료(촬영)'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#E9ECEF' }]} onPress={closeDetail}>
                <Text style={{ color: '#333', fontWeight: 'bold' }}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff' },
  callout: { width: 220, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 6 },
  calloutImg: { width: 220, height: 110, backgroundColor: '#ddd' },

  navBanner: {
    position: 'absolute', top: 50, left: 12, right: 12,
    backgroundColor: GREEN_DARK, padding: 12, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  navText: { color: '#fff', fontWeight: 'bold' },
  navStopBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#00000055', borderRadius: 8 },

  listPanel: {
    position: 'absolute', right: 12, bottom: 20, left: 12,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 10, elevation: 6,
  },
  listTitle: { fontWeight: '800', color: GREEN_DARK, marginBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: GREEN_BORDER },
  itemImg: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#ddd' },
  itemTitle: { fontWeight: '700', color: '#1f1f1f' },
  badgeSmall: { marginTop: 4, borderWidth: 1.2, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, fontSize: 12, color: '#333', alignSelf: 'flex-start' },
  itemNote: { marginTop: 2, fontSize: 12, color: '#55616a' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 640, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  title: { fontSize: 22, fontWeight: '900', color: '#222', textAlign: 'center', paddingVertical: 12 },
  mainImg: { width: '100%', height: SCREEN_W > 420 ? 360 : 300, backgroundColor: '#eee' },
  label: { fontSize: 13, color: '#8A8F98' },
  value: { fontSize: 16, color: '#222', marginTop: 2 },
  pill: { alignSelf: 'flex-start', backgroundColor: GREEN_LIGHT, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', padding: 12 },
  btn: { height: 44, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
});
