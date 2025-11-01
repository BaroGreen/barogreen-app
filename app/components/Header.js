import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../core/theme'; // 테마 파일을 import 합니다.

export default function Header(props) {
  return <Text style={styles.header} {...props} />;
}

const styles = StyleSheet.create({
  header: {
    fontSize: 26,
    color: theme.colors.primary, // 주 초록색을 사용하거나, 더 어두운 'text' 색상을 사용할 수 있습니다.
    fontWeight: 'bold',
    paddingVertical: 12,
  },
});