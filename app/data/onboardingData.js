import { theme } from '../core/theme';

// theme 의존성 문제를 해결하기 위해 데이터를 함수로 반환합니다.
export const getOnboardingData = () => [
  {
    id: 1,
    title: "환영합니다!",
    isTypewriter: true, // 타이핑 효과를 위한 플래그
    welcomeText: "바로 그린에 오신 것을 환영합니다.", // 타이핑 텍스트
    description: "내 주변 쓰레기 더미를 간편하게 신고하고, 처리 과정을 실시간으로 확인하세요.",
    color: theme.colors.primary, 
  },
  {
    id: 2,
    title: "빠르고 정확한 처리",
    isTypewriter: false,
    description: "관리자를 거쳐 전문 청소 업체에 즉시 배정되어 신속하게 처리됩니다.",
    color: theme.colors.secondary,
  },
  {
    id: 3,
    title: "함께 만드는 깨끗한 환경",
    isTypewriter: false,
    description: "로그인하여 '바로 그린'의 쾌적한 환경 조성에 동참하세요.",
    color: theme.colors.primary,
  },
];
