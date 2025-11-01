// app/screens/FirstAidGuideScreen.js
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/* BARO GREEN palette */
const GREEN_MAIN = '#2DB36F';
const GREEN_DARK = '#1E8A52';
const GREEN_LIGHT = '#E8F6EE';
const GREEN_BORDER = '#CBEAD8';

export default function FirstAidGuideScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 (간단 버전 – 네이티브 헤더 안 쓰는 프로젝트 구조 맞춤) */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.title}>관련 법규 & 안내</Text>
        <Ionicons name="shield-checkmark-outline" size={22} color={GREEN_DARK} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>생활폐기물 불법투기 신고</Text>
          <Text style={styles.paragraph}>
            생활폐기물은 무단 투기 시 과태료가 부과될 수 있습니다. 발견 시 사진과 위치를
            기록하여 관할 지자체 또는 본 앱의 신고 기능을 이용해 접수하세요.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>대형폐기물 처리</Text>
          <Text style={styles.paragraph}>
            가구/가전 등 대형폐기물은 관할 지자체의 스티커 발급 또는 온라인 신고·수수료
            결제 후 배출해야 합니다. 지자체 별로 세부 절차가 다를 수 있습니다.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>재활용 분리배출 기본</Text>
          <Text style={styles.bullet}>• 플라스틱·캔·유리는 내용물을 비우고 배출</Text>
          <Text style={styles.bullet}>• 종이는 테이프/스테이플 제거 후 규격 묶음</Text>
          <Text style={styles.bullet}>• 음식물 쓰레기는 물기 제거 후 전용 용기</Text>
        </View>

        <View style={[styles.card, { marginBottom: 24 }]}>
          <Text style={styles.cardTitle}>유의사항</Text>
          <Text style={styles.paragraph}>
            실제 적용 법규·금액은 지역에 따라 상이할 수 있습니다. 정확한 절차는 관할
            지자체 홈페이지 또는 콜센터에서 확인하세요.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_LIGHT },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: GREEN_BORDER,
    backgroundColor: '#fff',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: GREEN_DARK },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: GREEN_DARK, marginBottom: 8 },
  paragraph: { fontSize: 14, color: '#1f1f1f', lineHeight: 20 },
  bullet: { fontSize: 14, color: '#1f1f1f', lineHeight: 20, marginTop: 4 },
});
