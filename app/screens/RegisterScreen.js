// app/screens/RegisterScreen.js
import React, { useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import Background from '../components/Background';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';
import { emailValidator } from '../helpers/emailValidator';
import { passwordValidator } from '../helpers/passwordValidator';
import { nameValidator } from '../helpers/nameValidator';
import { UserContext } from '../context/UserContext';
import { API_BASE } from '../core/config';

export default function RegisterScreen({ navigation }) {
  const { setUser } = useContext(UserContext);
  const [name, setName] = useState({ value: '', error: '' });
  const [email, setEmail] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });

  const [code, setCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /** 회원가입용 인증코드 전송 (신규 메일만 허용) */
  const sendVerificationCode = async () => {
    const trimmed = email.value.trim();
    const emailError = emailValidator(trimmed);
    if (emailError) {
      setEmail({ value: trimmed, error: emailError });
      return;
    }

    try {
      setSending(true);
      // ✅ 회원가입 전용 엔드포인트 사용
      const url = `${API_BASE}/api/email/send-signup-code?email=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url, { method: 'POST' });

      // 이미 존재하는 이메일 (409)
      if (res.status === 409) {
        const body = await res.text().catch(() => '');
        Alert.alert('이미 존재', body || '이미 가입된 이메일입니다.');
        return;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        Alert.alert('오류', body || `인증코드 전송 실패 (HTTP ${res.status})`);
        return;
      }

      Alert.alert('전송 성공', '인증코드를 이메일로 보냈습니다.');
      setShowCodeInput(true);
      setCodeVerified(false);
    } catch (e) {
      console.log('send-signup-code error:', e);
      Alert.alert('네트워크 오류', '서버에 연결할 수 없습니다.');
    } finally {
      setSending(false);
    }
  };

  /** 회원가입용 인증코드 검증 */
  const verifyCode = async () => {
    const trimmedEmail = email.value.trim();
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      Alert.alert('오류', '인증코드를 입력하세요.');
      return;
    }

    try {
      const url = `${API_BASE}/api/email/verify-code?email=${encodeURIComponent(
        trimmedEmail
      )}&code=${encodeURIComponent(trimmedCode)}&purpose=signup`;
      const res = await fetch(url, { method: 'POST' });

      // 응답이 JSON(true/false) 또는 'true'/'false' 문자열일 수 있으므로 모두 처리
      let ok;
      try {
        ok = await res.json();
      } catch {
        const txt = await res.text().catch(() => '');
        ok = txt === 'true';
      }

      if (res.ok && ok === true) {
        Alert.alert('성공', '이메일 인증이 완료되었습니다.');
        setCodeVerified(true);
      } else {
        Alert.alert('실패', '인증코드가 일치하지 않습니다.');
        setCodeVerified(false);
      }
    } catch (e) {
      console.log('verify-code error:', e);
      Alert.alert('오류', '서버와 통신 중 오류가 발생했습니다.');
    }
  };

  /** 회원가입 제출 */
  const onSignUpPressed = async () => {
    const nameError = nameValidator(name.value);
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);

    if (nameError || emailError || passwordError) {
      setName({ value: name.value, error: nameError });
      setEmail({ value: email.value, error: emailError });
      setPassword({ value: password.value, error: passwordError });
      return;
    }

    if (!codeVerified) {
      Alert.alert('알림', '이메일 인증을 먼저 완료해 주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API_BASE}/api/user/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          password: password.value,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        Alert.alert('실패', `회원가입 실패 (HTTP ${res.status})\n${txt}`);
        return;
      }

      setUser({ name: name.value.trim(), email: email.value.trim() });
      Alert.alert('회원가입 완료', '로그인 후 이용해 주세요.');
      navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
    } catch (e) {
      console.log('register error:', e);
      Alert.alert('오류', '서버에 연결할 수 없습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 뒤로가기: 스택이 없을 때도 안전
  const safeGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('StartScreen');
  };

  return (
    <Background>
      <BackButton goBack={safeGoBack} />
      <Logo />
      <Header>회원가입</Header>

      <TextInput
        label="이름"
        value={name.value}
        onChangeText={(t) => setName({ value: t, error: '' })}
        error={!!name.error}
        errorText={name.error}
      />

      <TextInput
        label="이메일"
        value={email.value}
        onChangeText={(t) => {
          setEmail({ value: t, error: '' });
          setCodeVerified(false);
        }}
        error={!!email.error}
        errorText={email.error}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Button mode="outlined" onPress={sendVerificationCode} disabled={sending}>
        {sending ? '전송 중...' : '인증코드 보내기'}
      </Button>

      {showCodeInput && (
        <>
          <TextInput
            label="인증 코드"
            value={code}
            onChangeText={setCode}
            style={{ marginTop: 8 }}
          />
          <Button mode="outlined" onPress={verifyCode}>
            인증 코드 확인
          </Button>
        </>
      )}

      <TextInput
        label="비밀번호"
        value={password.value}
        onChangeText={(t) => setPassword({ value: t, error: '' })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry
        style={{ marginTop: 8 }}
      />

      <Button
        mode="contained"
        onPress={onSignUpPressed}
        disabled={submitting}
        style={{ marginTop: 16 }}
      >
        {submitting ? '처리 중...' : '다음'}
      </Button>

      <View style={styles.row}>
        <Text>이미 계정이 있으신가요?</Text>
        <TouchableOpacity onPress={() => navigation.replace('LoginScreen')}>
          <Text style={styles.link}> 로그인</Text>
        </TouchableOpacity>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginTop: 4 },
  link: { fontWeight: 'bold', color: theme.colors.primary, marginLeft: 4 },
});
