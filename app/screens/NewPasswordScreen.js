// app/screens/NewPasswordScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import Background from '../components/Background';
import Header from '../components/Header';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import BackButton from '../components/BackButton';
import { passwordValidator } from '../helpers/passwordValidator';
import { API_BASE } from '../core/config';

export default function NewPasswordScreen({ navigation, route }) {
  const { email } = route.params;
  const [password, setPassword] = useState({ value: '', error: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const passwordError = passwordValidator(password.value);
    if (passwordError) {
      setPassword({ ...password, error: passwordError });
      return;
    }
    if (password.value !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setSubmitting(true);
      const url = `${API_BASE}/api/user/reset-password`;
      console.log('RESET URL =', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password.value }),
      });

      if (response.ok) {
        // ✅ 확인 버튼을 눌렀을 때 스택을 [StartScreen, LoginScreen]으로 재구성
        Alert.alert('성공', '비밀번호가 재설정되었습니다.', [
          {
            text: '확인',
            onPress: () =>
              navigation.reset({
                index: 1,
                routes: [{ name: 'StartScreen' }, { name: 'LoginScreen' }],
              }),
          },
        ]);
      } else {
        const msg = await response.text().catch(() => '');
        Alert.alert('실패', `비밀번호 재설정 실패 (HTTP ${response.status})\n${msg}`);
      }
    } catch (err) {
      console.error('비밀번호 변경 오류', err);
      Alert.alert('서버 오류', '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Background>
      <BackButton goBack={navigation.goBack} />
      <Header>Wave 새로운 비밀번호 설정</Header>

      <TextInput
        label="새 비밀번호"
        returnKeyType="next"
        value={password.value}
        onChangeText={(t) => setPassword({ value: t, error: '' })}
        secureTextEntry
        error={!!password.error}
        errorText={password.error}
      />

      <TextInput
        label="비밀번호 확인"
        returnKeyType="done"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={{ marginTop: 8 }}
      />

      <Button
        mode="contained"
        onPress={onSubmit}
        disabled={submitting}
        style={{ marginTop: 16 }}
      >
        {submitting ? '처리 중...' : '비밀번호 재설정'}
      </Button>
    </Background>
  );
}

const styles = StyleSheet.create({});
