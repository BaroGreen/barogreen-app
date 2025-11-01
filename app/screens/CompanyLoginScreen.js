// app/screens/CompanyLoginScreen.js
import React, { useState } from 'react';
import { View, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import { Text } from 'react-native-paper';

export default function CompanyLoginScreen({ navigation }) {
  const [id, setId] = useState('barogreen');
  const [pw, setPw] = useState('1234');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);

    const ok = id.trim() === 'barogreen' && pw.trim() === '1234';
    if (!ok) {
      setBusy(false);
      Alert.alert('로그인 실패', '아이디 또는 비밀번호가 올바르지 않습니다.');
      return;
    }

    navigation.replace('CompanyMapScreen', { company: { name: '바로그린', id: 'C001' } });
  };

  return (
    <Background>
      <Header>업체 로그인</Header>
      <TextInput label="아이디" value={id} onChangeText={setId} autoCapitalize="none" />
      <TextInput label="비밀번호" value={pw} onChangeText={setPw} secureTextEntry />
      <Button mode="contained" onPress={submit} disabled={busy}>{busy ? '처리 중...' : '로그인'}</Button>

      <View style={styles.row}>
        <Text>일반 사용자 로그인으로 돌아가기</Text>
        <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
          <Text style={styles.link}>이동</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginTop: 12, alignItems: 'center', gap: 6 },
  link: { fontWeight: 'bold', color: '#2DB36F' },
});
