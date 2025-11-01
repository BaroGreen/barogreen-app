import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../core/theme';

// TextContent: 표시할 전체 텍스트
// speed: 한 글자가 나타나는 시간 간격 (밀리초)
export default function TypewriterText({ textContent, speed = 100, style }) {
  // 현재까지 표시된 텍스트를 저장하는 상태
  const [displayText, setDisplayText] = useState('');
  // 텍스트의 현재 인덱스
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // 텍스트가 모두 표시되면 useEffect를 종료합니다.
    if (currentIndex >= textContent.length) {
      return; 
    }

    // 설정된 speed(밀리초) 간격으로 다음 글자를 표시합니다.
    const timeout = setTimeout(() => {
      // 현재 표시된 텍스트에 다음 글자를 추가
      setDisplayText(prevText => prevText + textContent[currentIndex]);
      // 인덱스를 1 증가시켜 다음 글자를 준비
      setCurrentIndex(prevIndex => prevIndex + 1);
    }, speed);

    // 컴포넌트가 언마운트되거나 다음 useEffect가 실행될 때 타이머를 정리
    return () => clearTimeout(timeout);
    
  }, [currentIndex, speed, textContent]); // currentIndex가 변경될 때마다 다시 실행

  return (
    // 외부에서 받은 스타일과 기본 스타일을 적용
    <Text style={[styles.text, style]}>{displayText}</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 20, // 텍스트 크기
    fontWeight: 'bold',
    color: theme.colors.text, // 테마의 기본 텍스트 색상
    textAlign: 'center',
    paddingVertical: 12,
  },
});