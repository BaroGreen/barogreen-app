import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import PagerView from 'react-native-pager-view';
import Icon from 'react-native-vector-icons/FontAwesome'; // Icon import
// 이 경로가 이제 사용자님의 'app/data' 폴더 위치와 일치합니다.
import { getOnboardingData } from '../data/onboardingData'; 
import Button from '../components/Button';
import TypewriterText from '../components/TypewriterText';
import { theme } from '../core/theme';

const { width } = Dimensions.get('window');

// PagerView의 한 페이지를 표시하는 컴포넌트 (내용 유지)
const OnboardingPage = ({ data }) => {
    const TitleComponent = data.isTypewriter ? TypewriterText : Text;
    
    return (
        <View style={styles.pageContainer}>
            
            {/* 1. 타이틀 영역 */}
            <View style={styles.titleArea}>
                {data.isTypewriter ? (
                    <TitleComponent 
                        textContent={data.welcomeText} 
                        speed={80} 
                        style={[styles.typewriterTitle, {color: data.color}]}
                    />
                ) : (
                    <Text style={[styles.title, { color: data.color }]}>{data.title}</Text>
                )}
            </View>
            
            {/* 2. 이미지 대신 공간을 확보하는 영역 */}
            <View style={styles.titleAreaFiller} />

            {/* 3. 설명 텍스트 영역 */}
            <Text style={styles.description}>{data.description}</Text>
        </View>
    );
};

// PagerView 아래의 점(Indicator)을 표시하는 컴포넌트 (내용 유지)
const DotIndicator = ({ activeIndex, pageCount }) => (
    <View style={styles.dotContainer}>
        {Array.from({ length: pageCount }).map((_, index) => (
            <View
                key={index}
                style={[
                    styles.dot,
                    { backgroundColor: index === activeIndex ? theme.colors.primary : theme.colors.placeholder },
                    { width: index === activeIndex ? 18 : 8 }
                ]}
            />
        ))}
    </View>
);


export default function OnboardingScreen({ navigation }) {
    const [activePage, setActivePage] = useState(0);
    const onboardingData = getOnboardingData();

    const handlePageScroll = (e) => {
        setActivePage(e.nativeEvent.position);
    };

    const handleLogin = () => {
        navigation.replace('LoginScreen'); 
    };
    
    const handleRegister = () => {
        navigation.replace('RegisterScreen'); 
    }
    
    // 🚨 네이버 버튼 클릭 핸들러 (더미 함수)
    const onSocialLogin = (platform) => {
        console.log(`[${platform} 로그인] 버튼 클릭됨 (연동 미구현)`);
        // 실제 연동 로직은 여기에 들어갑니다.
    };
    
    return (
        <View style={styles.container}>
            
            {/* 상단 로고 (고정) */}
            <View style={styles.logoArea}>
                <Text style={styles.logoText}>BARO GREEN</Text>
            </View>

            {/* Pager View: 스와이프 가능한 영역 */}
            <PagerView
                style={styles.pagerView}
                initialPage={0}
                onPageSelected={handlePageScroll}
            >
                {onboardingData.map((data) => (
                    <View key={data.id}>
                        <OnboardingPage data={data} />
                    </View>
                ))}
            </PagerView>

            {/* Dot Indicator 표시 */}
            <DotIndicator activeIndex={activePage} pageCount={onboardingData.length} />

            {/* 고정 버튼 영역 */}
            <View style={styles.fixedButtonArea}>
                <Button mode="contained" onPress={handleLogin} style={styles.button}>
                    로그인
                </Button>
                <Button mode="outlined" onPress={handleRegister} style={styles.button}>
                    회원가입
                </Button>

                {/* 🚨 네이버 버튼 영역만 추가 */}
                <View style={styles.socialButtonsContainer}>
                    {/* 네이버 로그인 버튼 */}
                    <TouchableOpacity style={styles.socialButton} onPress={() => onSocialLogin('Naver')}>
                        <View style={styles.socialButtonContent}>
                            {/* 네이버 아이콘은 'search'로 대체 */}
                            <Icon name="search" size={20} style={styles.naver} />
                            <Text style={styles.socialButtonLabel}>네이버로 시작하기</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    logoArea: {
        paddingTop: 120, 
        paddingBottom: 20,
        alignItems: 'center',
    },
    logoText: {
        fontSize: 48, 
        fontWeight: 'bold',
        color: theme.colors.primary, 
    },
    pagerView: {
        flex: 1, 
    },
    pageContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 40,
        justifyContent: 'center',
    },
    titleArea: {
        paddingBottom: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28,
    },
    titleAreaFiller: {
         height: 0,
 marginBottom: 0,
    },
    typewriterTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        lineHeight: 28,  
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        lineHeight: 28,  
        flexWrap: 'nowrap',           // ✅ 줄바꿈 비활성화
   numberOfLines: 1,             // ✅ 한 줄로 고정
   adjustsFontSizeToFit: true,   // ✅ 화면 작으면 자동 폰트 축소
   minimumFontScale: 0.9,        // ✅ 너무 작게 줄어드는 걸 방지
   includeFontPadding: false,    // ✅ 여백 제거 (특히 안드로이드)
   textAlignVertical: 'center', 
    },
    description: {
        fontSize: 16,
        color: theme.colors.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    dotContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    fixedButtonArea: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    button: {
        marginVertical: 6,
    },
    // 🚨 네이버 버튼 스타일 추가
    socialButtonsContainer: {
        width: '100%',
        marginTop: 30, // 기존 버튼과의 간격
    },
    socialButton: {
        backgroundColor: 'white', 
        borderColor: theme.colors.placeholder,
        borderWidth: 1,
        marginVertical: 6,
        height: 50,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    socialButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    socialButtonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
        color: theme.colors.secondary,
    },
    naver: { color: '#03C75A' }, // 네이버 아이콘 색상
});
