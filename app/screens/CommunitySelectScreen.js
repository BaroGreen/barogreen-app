// app/screens/CommunitySelectScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePostContext } from '../components/PostContext';

/* ===== BARO GREEN Color Palette ===== */
const GREEN_MAIN = '#2DB36F';     // 메인 초록
const GREEN_MID = '#6ECB91';      // 중간 톤
const GREEN_LIGHT = '#E8F6EE';    // 배경용 연한 민트
const GREEN_BORDER = '#CBEAD8';   // 테두리 연초록
const GREEN_DARK = '#1E8A52';     // 진한 포인트

export default function CommunitySelectScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const mode = route.params?.mode || 'edit';
  const { posts, setPosts } = usePostContext();

  const handleSelect = (post) => {
    if (mode === 'edit') {
      navigation.navigate('CommunityEditScreen', { postId: post.id });
    } else {
      Alert.alert('삭제 확인', `"${post.title}" 글을 삭제할까요?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setPosts(posts.filter((p) => p.id !== post.id));
            Alert.alert('삭제 완료', '글이 삭제되었습니다.');
            navigation.goBack();
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={GREEN_DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {mode === 'edit' ? '수정할 글 선택' : '삭제할 글 선택'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 게시글 목록 */}
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.postBox}
            onPress={() => handleSelect(post)}
            activeOpacity={0.85}
          >
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postAuthor}>작성자: {post.author}</Text>
          </TouchableOpacity>
        ))}
        {posts.length === 0 && (
          <Text style={styles.emptyText}>게시글이 없습니다.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_LIGHT },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GREEN_DARK,
  },

  postBox: {
    padding: 16,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#222',
  },

  postAuthor: {
    fontSize: 13,
    color: GREEN_DARK,
  },

  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 24,
  },
});
