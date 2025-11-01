// app/core/config.js
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * 개발 중(Expo Go) 자동 추론:
 * - Expo Dev Server의 hostUri에서 PC IP를 뽑아 씁니다.
 * - hostUri가 없거나 엇갈리면 수동 HOTSPOT_IP로 fallback.
 */
function resolveHost() {
  // 1) Expo가 알려주는 host (예: "192.168.137.1:8081")
  const hostUri = Constants?.expoConfig?.hostUri ?? "";
  const fromExpo = hostUri.split(":")[0];

  // 2) 수동 지정 (핫스팟일 때 대부분 192.168.137.1)
  const HOTSPOT_IP = "192.168.137.1"; // ← PC가 핫스팟 호스트일 때 폰에서 접근하는 주소

  // 3) 에뮬레이터 특수 케이스(참고): 실제 기기에서는 절대 사용하지 않음
  const ANDROID_EMULATOR = "10.0.2.2";

  // 우선순위: Expo host IP → 수동 핫스팟 IP → (안드 에뮬레이터일 때만) 10.0.2.2
  if (fromExpo && /^[0-9.]+$/.test(fromExpo)) return fromExpo;
  if (HOTSPOT_IP) return HOTSPOT_IP;
  if (Platform.OS === "android") return ANDROID_EMULATOR;
  return "localhost";
}

export const PORT = 8080; // Spring Boot 포트
export const HOST = resolveHost();
export const API_BASE = `http://${HOST}:${PORT}`;

// 자주 쓰는 엔드포인트
export const API = {
  login: `${API_BASE}/api/user/login`,
  register: `${API_BASE}/api/user/register`,
  sendCode: `${API_BASE}/api/email/send-code`,
  verifyCode: `${API_BASE}/api/email/verify-code`,
  // 필요 시 계속 추가
};
