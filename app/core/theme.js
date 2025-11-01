import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    // 기존 primary 대신 자연 친화적인 초록색으로 변경
    primary: '#4CAF50',       // 🌳 메인 초록색 (로그인 버튼 등)
    accent: '#8BC34A',        // 🌱 보조 초록색 (회원가입 버튼 테두리 등)
    secondary: '#607D8B',     // 🌿 보조 텍스트, 아이콘 등에 사용될 색상 (회색 계열)
    error: '#f13a59',         // 🛑 에러 메시지
    background: '#F0F4C3',    // 🍃 전체 배경색 (아주 연한 초록/베이지 톤)
    surface: '#FFFFFF',       // 카드, 컨테이너 등의 배경
    text: '#212121',          // 기본 텍스트 색상
    placeholder: '#BDBDBD',   // 플레이스홀더 텍스트
  },
};