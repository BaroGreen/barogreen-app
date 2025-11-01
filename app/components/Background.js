import React from 'react';
import { StyleSheet, KeyboardAvoidingView, View } from 'react-native'; // ImageBackground 대신 View를 사용합니다.
import { theme } from '../core/theme'; 

export default function Background({ children }) {
  return (
    // ImageBackground 대신 일반 View 컴포넌트를 사용하여 배경색만 적용합니다.
    <View style={styles.background}> 
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    // theme.js에서 정의한 단색 배경색만 사용
    backgroundColor: theme.colors.background, 
  },
  container: {
    flex: 1,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
});