import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Text as PaperText } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome';
import Button from '../components/Button';
import { theme } from '../core/theme';

/**
 * Logo/Background가 상단 여백을 만들어
 * 타이틀이 위로 붙는 문제를 피하려고,
 * 중앙 정렬용 래퍼를 직접 구성.
 */
export default function StartScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>BARO GREEN</Text>
        <Text style={styles.subtitle}>바로 그린에 오신 것을 환영합니다</Text>

        <Text style={styles.caption}>
          내 주변 쓰레기 더미를 간편하게 신고하고, 처리 과정을 실시간으로 확인해 보세요.
        </Text>
      </View>

      {/* 하단 버튼 */}r
      <View style={styles.btnWrap}>
        <Button mode="contained" onPress={() => navigation.navigate('LoginScreen')} style={styles.btn}>
          로그인
        </Button>
        <Button mode="outlined" onPress={() => navigation.navigate('RegisterScreen')} style={styles.btn}>
          회원가입
        </Button>

        <TouchableOpacity style={styles.socialButton} onPress={() => {}}>
          <View style={styles.socialContent}>
            <Icon name="search" size={20} style={styles.naverIcon} />
            <PaperText style={styles.socialLabel}>네이버로 시작하기</PaperText>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ===== 스타일 ===== */
const GREEN = '#2DB36F';
const BG = '#F2F8DA';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: {
    flex: 1,
    justifyContent: 'center',    // ✅ 세로 중앙
    alignItems: 'center',        // ✅ 가로 중앙
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 44,
    fontWeight: '800',
    color: GREEN,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
    color: GREEN,
    textAlign: 'center',
  },
  caption: {
    marginTop: 16,
    maxWidth: 560,
    fontSize: 16,
    lineHeight: 23,
    color: '#5B7285',
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  btnWrap: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  btn: { height: 56, borderRadius: 28 },

  socialButton: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.placeholder,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  socialLabel: { marginLeft: 8, fontSize: 16, fontWeight: '700', color: theme.colors.secondary },
  naverIcon: { color: '#03C75A' },
});
