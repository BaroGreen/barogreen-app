// app/screens/CommunityWriteScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePostContext } from '../components/PostContext';
import { UserContext } from '../context/UserContext';

const GREEN_MID = '#6ECB91';
const GREEN_LIGHT = '#E8F6EE';
const GREEN_BORDER = '#CBEAD8';
const GREEN_DARK = '#1E8A52';

export default function CommunityWriteScreen() {
  const navigation = useNavigation();
  const { addPost } = usePostContext();
  const { user } = useContext(UserContext) || {};

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    const uname =
      user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : '');
    if (uname && !author) setAuthor(uname);
  }, [user, author]);

  const handleSubmit = async () => {
    if (!title || !author) {
      Alert.alert('안내', '제목과 작성자를 모두 입력해주세요.');
      return;
    }

    const res = await addPost({ title, author, content });
    if (res?.ok) {
      if (res.server === 'local') {
        Alert.alert(
          '작성 완료',
          '네트워크/서버 문제로 임시로 기기에 저장했습니다.\n온라인이 복구되면 다시 시도해주세요.'
        );
      } else {
        Alert.alert('작성 완료', '글이 성공적으로 등록되었습니다.');
      }
      navigation.goBack();
    } else {
      Alert.alert('오류', `글 등록에 실패했습니다.\n${res?.message ?? ''}`.trim());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={GREEN_DARK} />
        </TouchableOpacity>
        <Text style={styles.title}>글 작성</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          placeholder="제목을 입력하세요"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>작성자</Text>
        <TextInput
          style={styles.input}
          placeholder="작성자 이름"
          value={author}
          onChangeText={setAuthor}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>본문 (내용)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="본문을 입력하세요"
          value={content}
          onChangeText={setContent}
          multiline
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>작성 완료</Text>
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: '#fff',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: GREEN_DARK },
  form: { padding: 20 },
  label: {
    fontSize: 14,
    marginTop: 16,
    marginBottom: 6,
    color: GREEN_DARK,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: '#222',
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: GREEN_MID,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 28,
    alignItems: 'center',
    elevation: 2,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
