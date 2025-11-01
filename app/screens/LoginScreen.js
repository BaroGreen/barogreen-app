import React, { useState, useContext } from 'react';
import { TouchableOpacity, StyleSheet, View, Alert } from 'react-native'; // Image import 제거
import { Text } from 'react-native-paper';
import Background from '../components/Background';
import Header from '../components/Header';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';
import { emailValidator } from '../helpers/emailValidator';
import { passwordValidator } from '../helpers/passwordValidator';
import { UserContext } from '../context/UserContext';
import { API_BASE } from '../core/config';

export default function LoginScreen({ navigation }) {
  const { setUser } = useContext(UserContext);
  const [email, setEmail] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });
  const [submitting, setSubmitting] = useState(false);

  const onLoginPressed = async () => {
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);
    if (emailError || passwordError) {
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    try {
      setSubmitting(true);
      const url = `${API_BASE}/api/user/login`;
      console.log('LOGIN URL =', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.value,
          password: password.value,
        }),
      });

      if (response.ok) {
        const userData = await response.json().catch(() => null);
        if (!userData) {
          Alert.alert('오류', '서버 응답이 올바르지 않습니다.');
          return;
        }
        setUser(userData);
        Alert.alert('로그인 성공', `${userData.name}님 환영합니다!`);
        navigation.reset({
          index: 0,
          routes: [{ name: 'HomeScreen', params: { username: userData.name } }],
        });
      } else {
        const errorMsg = await response.text().catch(() => '');
        Alert.alert(
          '로그인 실패',
          errorMsg || '이메일 또는 비밀번호가 올바르지 않습니다.'
        );
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      Alert.alert('오류', '서버에 연결할 수 없습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ 안전한 뒤로가기: 스택이 없으면 StartScreen으로 이동
  const safeGoBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('StartScreen');
  };

  return (
    <Background>
      <BackButton goBack={safeGoBack} style={{ marginTop: 20 }}/>
      {/* 해파리 로고 <Image source={require('../../assets/icon.png')} style={styles.logo} /> 제거 */}
      <Header>BARO GREEN</Header>

      <TextInput
        label="이메일"
        value={email.value}
        onChangeText={(t) => setEmail({ value: t, error: '' })}
        error={!!email.error}
        errorText={email.error}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        label="비밀번호"
        value={password.value}
        onChangeText={(t) => setPassword({ value: t, error: '' })}
        error={!!password.error}
        errorText={password.error}
        secureTextEntry
      />

      <View style={styles.forgotPassword}>
        <TouchableOpacity onPress={() => navigation.navigate('ResetPasswordScreen')}>
          <Text style={styles.forgot}>비밀번호를 잊으셨나요?</Text>
        </TouchableOpacity>
      </View>

      <Button mode="contained" onPress={onLoginPressed} disabled={submitting}>
        {submitting ? '처리 중...' : '로그인'}
      </Button>

      <View style={styles.row}>
        <Text>아직 계정이 없으신가요?</Text>
        <TouchableOpacity onPress={() => navigation.replace('RegisterScreen')}>
          <Text style={styles.link}>회원가입하기!</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 16, width:'100%', alignItems:'center' }}>
  <TouchableOpacity onPress={() => navigation.navigate('CompanyLoginScreen')}>
    <Text style={{ fontWeight:'bold', color: theme.colors.primary }}>업체 로그인</Text>
  </TouchableOpacity>
</View>
    </Background>
  );
}

const styles = StyleSheet.create({
  // styles.logo 정의 제거
  forgotPassword: { width: '100%', alignItems: 'flex-end', marginBottom: 10 },
  row: { flexDirection: 'row', marginTop: 4 },
  forgot: { fontSize: 13, color: theme.colors.secondary },
  link: { fontWeight: 'bold', color: theme.colors.primary, marginLeft: 4 },
});
