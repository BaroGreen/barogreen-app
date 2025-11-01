// app/screens/CommunityEditScreen.js
import React, { useMemo, useState, useContext } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  SafeAreaView, Platform, StatusBar, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePostContext } from '../components/PostContext';
import { UserContext } from '../context/UserContext';
import { API_BASE } from '../core/config';

/* ===== BARO GREEN Palette ===== */
const GREEN_MAIN   = '#2DB36F';   // 메인
const GREEN_MID    = '#6ECB91';   // 중간톤 버튼
const GREEN_LIGHT  = '#E8F6EE';   // 배경
const GREEN_BORDER = '#CBEAD8';   // 테두리
const GREEN_DARK   = '#1E8A52';   // 포인트

export default function CommunityEditScreen(){
  const navigation = useNavigation();
  const route = useRoute();
  const postId = route.params?.postId;

  const { posts, setPosts } = usePostContext();
  const target = useMemo(()=>posts.find(p=>p.id===postId),[posts,postId]);

  const { user } = useContext(UserContext) || {};
  const username =
    user?.displayName || user?.name || (user?.email ? user.email.split('@')[0] : null);

  const [title, setTitle] = useState(target?.title ?? '');
  const [content, setContent] = useState(target?.content ?? '');
  const [saving, setSaving] = useState(false);

  if (!target) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={GREEN_DARK}/>
          </TouchableOpacity>
          <Text style={styles.title}>글 수정</Text>
          <View style={{width:24}}/>
        </View>
        <View style={{padding:20}}><Text>해당 글을 찾을 수 없습니다.</Text></View>
      </SafeAreaView>
    );
  }

  // 프론트 권한 체크(표시용)
  if (username && target.author && username !== target.author) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={()=>navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={GREEN_DARK}/>
          </TouchableOpacity>
        <Text style={styles.title}>글 수정</Text>
          <View style={{width:24}}/>
        </View>
        <View style={{padding:20}}>
          <Text>본인이 작성한 글만 수정할 수 있습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('입력 확인','제목을 입력하세요.'); return; }
    setSaving(true);
    try {
      const payload = { title: title.trim(), content, author: target.author };
      const url = `${API_BASE}/api/posts/${postId}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      setPosts(prev => prev.map(p => (
        p.id === postId ? { ...p, title: payload.title, content: payload.content } : p
      )));

      Alert.alert('수정 완료','글이 수정되었습니다.');
      navigation.popToTop();
    } catch (e) {
      console.error('[Edit] PUT failed:', e);
      Alert.alert('오류', '수정 중 문제가 발생했습니다.\n' + (e?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={GREEN_DARK}/>
        </TouchableOpacity>
        <Text style={styles.title}>글 수정</Text>
        <View style={{width:24}}/>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          placeholder="제목"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          editable={!saving}
        />

        <Text style={styles.label}>본문 (내용)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="본문을 입력하세요"
          placeholderTextColor="#999"
          value={content}
          onChangeText={setContent}
          multiline
          editable={!saving}
        />

        <TouchableOpacity
          style={[styles.submitButton, saving && {opacity:0.6}]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color="#fff"/> :
            <Text style={styles.submitText}>수정 완료</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles=StyleSheet.create({
  container:{ flex:1, backgroundColor: GREEN_LIGHT },

  header:{
    paddingHorizontal:16, paddingVertical:14,
    paddingTop:Platform.OS==='android'?(StatusBar.currentHeight||0)+10:14,
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    borderBottomWidth:1, borderColor: GREEN_BORDER, backgroundColor:'#fff'
  },
  title:{ fontSize:18, fontWeight:'bold', color: GREEN_DARK },

  form:{ padding:20 },
  label:{ fontSize:14, marginTop:16, marginBottom:6, color: GREEN_DARK, fontWeight:'600' },

  input:{
    borderWidth:1, borderColor: GREEN_BORDER, borderRadius:8,
    paddingHorizontal:12, paddingVertical:10, backgroundColor:'#fff', color:'#222'
  },
  textArea:{ height:120, textAlignVertical:'top' },

  submitButton:{
    backgroundColor: GREEN_MID,
    paddingVertical:14,
    borderRadius:10,
    marginTop:24,
    alignItems:'center',
    elevation:2,
  },
  submitText:{ color:'#fff', fontSize:16, fontWeight:'bold' },
});
