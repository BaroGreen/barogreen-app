// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';

import { PostProvider } from './app/components/PostContext';
import { UserProvider } from './app/context/UserContext';
import { theme } from './app/core/theme';

// 스크린들
import StartScreen from './app/screens/StartScreen';
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';
import ResetPasswordScreen from './app/screens/ResetPasswordScreen';
import HomeScreen from './app/screens/HomeScreen';
import OnboardingScreen from './app/screens/OnboardingScreen';

// 커뮤니티
import CommunityScreen from './app/screens/CommunityScreen';
import CommunityWriteScreen from './app/screens/CommunityWriteScreen';
import CommunitySelectScreen from './app/screens/CommunitySelectScreen';
import CommunityEditScreen from './app/screens/CommunityEditScreen';
import CommunityDetailScreen from './app/screens/CommunityDetailScreen';

// 새 비밀번호 설정 완료 단계
import NewPasswordScreen from './app/screens/NewPasswordScreen';

// ✅ 새로 추가: 관련 법규 & 안내
import FirstAidGuideScreen from './app/screens/FirstAidGuideScreen';
import CompanyLoginScreen from './app/screens/CompanyLoginScreen';
import CompanyMapScreen   from './app/screens/CompanyMapScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PostProvider>
      <UserProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="OnboardingScreen" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />

              <Stack.Screen name="StartScreen" component={StartScreen} />
              <Stack.Screen name="LoginScreen" component={LoginScreen} />
              <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
              <Stack.Screen name="HomeScreen" component={HomeScreen} />
              <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />

              {/* 커뮤니티 */}
              <Stack.Screen name="CommunityScreen" component={CommunityScreen} />
              <Stack.Screen name="CommunityWriteScreen" component={CommunityWriteScreen} />
              <Stack.Screen name="CommunitySelectScreen" component={CommunitySelectScreen} />
              <Stack.Screen name="CommunityEditScreen" component={CommunityEditScreen} />
              <Stack.Screen name="CommunityDetailScreen" component={CommunityDetailScreen} />

              {/* 새 비밀번호 설정 완료 단계 */}
              <Stack.Screen name="NewPasswordScreen" component={NewPasswordScreen} />

              {/* ✅ 추가된 스크린 등록 */}
              <Stack.Screen name="FirstAidGuideScreen" component={FirstAidGuideScreen} />
              <Stack.Screen name="CompanyLoginScreen" component={CompanyLoginScreen} options={{ headerShown:false }} />
      <Stack.Screen name="CompanyMapScreen" component={CompanyMapScreen} options={{ title:'업체 페이지', headerShown:true }} />
            </Stack.Navigator>
          </NavigationContainer>
        </PaperProvider>
      </UserProvider>
    </PostProvider>
  );
}
