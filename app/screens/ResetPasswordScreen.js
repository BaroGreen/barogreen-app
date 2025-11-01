// app/screens/ResetPasswordScreen.js
import React, { useState } from 'react';
import { Alert } from 'react-native';
import Background from '../components/Background';
import BackButton from '../components/BackButton';
import Logo from '../components/Logo';
import Header from '../components/Header';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import { emailValidator } from '../helpers/emailValidator';
import { API_BASE } from '../core/config';

export default function ResetPasswordScreen({ navigation }) {
  const [email, setEmail] = useState({ value: '', error: '' });
  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendResetPasswordEmail = async () => {
    const trimmed = email.value.trim();
    const emailError = emailValidator(trimmed);
    if (emailError) {
      setEmail({ value: trimmed, error: emailError });
      return;
    }

    try {
      setLoading(true);
      const url = `${API_BASE}/api/email/send-code?email=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, { method: 'POST' });

      // ✅ DB에 없는 이메일이면 백엔드가 404를 줌 → 여기서 막기
      if (res.status === 404) {
        Alert.alert('계정 없음', '등록된 계정이 아닙니다.');
        return;
      }

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        Alert.alert('오류', msg || `코드 전송 실패 (HTTP ${res.status})`);
        return;
      }

      // 200 OK → 다음 단계로 진행
      Alert.alert('이메일 전송 완료', '입력하신 이메일로 인증코드를 보냈습니다.');
      setShowCodeInput(true);
    } catch (e) {
      Alert.alert('네트워크 오류', '서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCodeAndContinue = async () => {
    const trimmedEmail = email.value.trim();
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      Alert.alert('오류', '인증코드를 입력하세요.');
      return;
    }

    try {
      setLoading(true);
      const url = `${API_BASE}/api/email/verify-code?email=${encodeURIComponent(
        trimmedEmail
      )}&code=${encodeURIComponent(trimmedCode)}`;

      const res = await fetch(url, { method: 'POST' });
      // Spring이 true/false를 JSON(Boolean)으로 주는 경우/문자열로 주는 경우 모두 처리
      let okBody = null;
      try {
        okBody = await res.json();
      } catch {
        const txt = await res.text().catch(() => '');
        okBody = txt === 'true';
      }

      if (res.ok && okBody === true) {
        Alert.alert('성공', '인증이 완료되었습니다.');
        navigation.navigate('NewPasswordScreen', { email: trimmedEmail });
      } else {
        Alert.alert('실패', '인증코드가 일치하지 않습니다.');
      }
    } catch (e) {
      Alert.alert('네트워크 오류', '서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 뒤로가기: 스택이 없을 때도 안전
  const safeGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('StartScreen');
  };

  return (
    <Background>
      <BackButton goBack={safeGoBack} />
      <Logo />
      <Header>비밀번호 재설정</Header>

      <TextInput
        label="이메일"
        returnKeyType="done"
        value={email.value}
        onChangeText={(t) => setEmail({ value: t, error: '' })}
        error={!!email.error}
        errorText={email.error}
        autoCapitalize="none"
        keyboardType="email-address"
        description="비밀번호 재설정 인증코드가 이메일로 전송됩니다."
      />

      {showCodeInput && (
        <TextInput
          label="인증 코드"
          returnKeyType="done"
          value={code}
          onChangeText={setCode}
          style={{ marginTop: 16 }}
        />
      )}

      <Button
        mode="contained"
        onPress={showCodeInput ? verifyCodeAndContinue : sendResetPasswordEmail}
        disabled={loading}
        style={{ marginTop: 16 }}
      >
        {showCodeInput ? (loading ? '확인 중...' : '확인') : (loading ? '전송 중...' : '계속하기')}
      </Button>
    </Background>
  );
}
