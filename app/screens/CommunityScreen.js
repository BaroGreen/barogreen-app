// app/screens/CommunityScreen.js
import React, { useContext, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Platform, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePostContext } from '../components/PostContext';
import { UserContext } from '../context/UserContext';

const GREEN = '#2DB36F';
const GREEN_DARK = '#1E8A52';
const GREEN_SOFT = '#7CCFA2';
const GREEN_MUTE = '#A9DDBF';
const GREEN_BG = '#EAF7F0';
const GREEN_BORDER = '#CBEAD8';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s 전`;
  const m = Math.floor(diff / 60); if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}일 전`;
  const date = new Date(ts);
  const pad = (n) => `${n}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CommunityScreen() {
  const navigation = useNavigation();
  const { posts } = usePostContext();

  const { user } = useContext(UserContext) || {};
  const username =
    user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : null);

  const myPostCount = useMemo(
    () => posts.filter((p) => username && p.author === username).length,
    [posts, username]
  );

  const requireLogin = (actionLabel) => {
    if (!username) {
      Alert.alert('로그인 필요', `${actionLabel} 하려면 먼저 로그인하세요.`);
      return false;
    }
    return true;
  };

  const goSelect = (mode) => {
    if (!requireLogin(mode === 'edit' ? '수정' : '삭제')) return;
    if (myPostCount === 0) {
      Alert.alert('안내', '내가 작성한 글이 없습니다.');
      return;
    }
    navigation.navigate('CommunitySelectScreen', { mode, author: username });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={GREEN_DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>커뮤니티</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {posts.map((post) => {
          const key = `${post?.id ?? 'tmp'}-${post?.createdAt ?? 0}`;
          return (
            <TouchableOpacity
              key={key}
              style={styles.postBox}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CommunityDetailScreen', { postId: post.id })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.timeText}>{timeAgo(post.createdAt)}</Text>
              </View>
              <Text style={styles.postAuthor}>작성자: {post.author}</Text>
              {post.content ? (
                <Text style={styles.postContent} numberOfLines={2}>{post.content}</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.writeButton}
        onPress={() => navigation.navigate('CommunityWriteScreen')}
      >
        <Text style={styles.writeButtonText}>글 작성</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.editButton} onPress={() => goSelect('edit')}>
        <Text style={styles.manageButtonText}>내 글 수정</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={() => goSelect('delete')}>
        <Text style={[styles.manageButtonText, { color: GREEN_DARK }]}>내 글 삭제</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: '#fff',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: GREEN_DARK },
  content: { padding: 16, paddingTop: 12 },
  postBox: {
    padding: 16,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: GREEN_BG,
  },
  postTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, color: '#1f1f1f' },
  postAuthor: { fontSize: 13, color: GREEN_DARK },
  postContent: { fontSize: 14, color: '#2a2a2a', marginTop: 6, lineHeight: 20 },
  timeText: { fontSize: 12, color: '#6b7c70' },
  writeButton: {
    backgroundColor: GREEN,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  editButton: {
    backgroundColor: GREEN_SOFT,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: GREEN_MUTE,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 36,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: GREEN_BORDER,
  },
  writeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  manageButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
