// app/components/BackButton.js
import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BackButton({ goBack, style, hitSlop }) {
  const insets = useSafeAreaInsets();
  const top = (insets?.top ?? 0) + 8;        // ✅ 안전영역 기준으로 8px 아래
  return (
    <TouchableOpacity
      onPress={goBack}
      activeOpacity={0.8}
      hitSlop={hitSlop ?? { top: 16, bottom: 16, left: 16, right: 16 }}  // ✅ 터치영역 확대
      style={[styles.container, { top }, style]}                           // ✅ 외부 style 병합
    >
      <Image style={styles.image} source={require('../../assets/items/back.png')} />
    </TouchableOpacity>
  );
}

const styles=StyleSheet.create({
    container: {
    position: 'absolute',
    left: 10,
    zIndex: 100,
    // ✅ 터치 타깃 확대 & 가시성 향상(선택)
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E0E5E0',
  },
  image: { width: 22, height: 22 },
});
