import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../core/theme'; // 테마 파일을 import 합니다.

export default function Logo() {
  return (
    <View style={styles.container}>
      {/* 기존 Image 컴포넌트를 Text 컴포넌트로 대체합니다. */}
      <Text style={styles.logoText}>BARO GREEN</Text> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20, // 로고와 헤더 사이 간격
  },
  logoText: {
    fontSize: 48, // 로고 텍스트 크기
    fontWeight: 'bold', // 굵게
    color: theme.colors.primary, // 테마의 기본 초록색 사용
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)', // 그림자 효과
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});