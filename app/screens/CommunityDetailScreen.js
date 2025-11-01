// app/screens/CommunityDetailScreen.js
import React, { useMemo, useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { usePostContext } from "../components/PostContext";
import { UserContext } from "../context/UserContext";

/* ===== BARO GREEN Palette ===== */
const GREEN_MAIN   = "#2DB36F";   // 메인
const GREEN_MID    = "#6ECB91";   // 버튼/포인트 중간톤
const GREEN_LIGHT  = "#E8F6EE";   // 연한 배경
const GREEN_BORDER = "#CBEAD8";   // 테두리
const GREEN_DARK   = "#1E8A52";   // 진한 포인트
const GREEN_PILL   = "#E6F4EA";   // 칩/배경

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = (n) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function CommunityDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params || {};

  const { posts, toggleLike, addComment, syncComments } = usePostContext();

  // 로그인 사용자(없으면 guest)
  const { user } = useContext(UserContext) || {};
  const username =
    user?.displayName ||
    user?.name ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "guest";

  const post = useMemo(
    () => posts.find((p) => p.id === postId),
    [posts, postId]
  );

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  // ✅ 화면 진입/갱신 시 서버에서 최신 댓글 동기화
  useEffect(() => {
    if (postId) {
      syncComments(postId).catch(() => {});
    }
  }, [postId, syncComments]);

  const roots = (post?.comments ?? []).filter((c) => c.parentId == null);
  const childrenOf = (pid) =>
    (post?.comments ?? []).filter((c) => c.parentId === pid);

  const onSend = async () => {
    const text = commentText.trim();
    if (!text) return;
    try {
      await addComment(postId, {
        author: username,
        content: text,
        parentId: replyTo,
      });
      setCommentText("");
      setReplyTo(null);
      syncComments(postId).catch(() => {});
    } catch {
      // 오류 토스트/Alert는 PostContext에서 처리
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={GREEN_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>글 상세</Text>
        <View style={{ width: 24 }} />
      </View>

      {!post ? (
        <View style={{ padding: 20 }}>
          <Text>글을 찾을 수 없습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.contentWrap}>
          <View style={styles.card}>
            <Text style={styles.title}>{post.title}</Text>

            <View style={styles.metaRow}>
              <Ionicons
                name="person-circle-outline"
                size={18}
                color={GREEN_DARK}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.metaText}>작성자</Text>
              <Text style={styles.metaValue}>{post.author}</Text>
              <Text style={styles.dot}>·</Text>
              <Ionicons
                name="time-outline"
                size={16}
                color="#7C8B7F"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.metaValue}>{formatDate(post.createdAt)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.bodyBox}>
              <Text style={styles.bodyLabel}>본문</Text>
              <Text style={styles.bodyText} selectable>
                {post.content?.trim()?.length
                  ? post.content
                  : "내용이 없습니다."}
              </Text>
            </View>

            {/* 좋아요 */}
            <View style={styles.likeRow}>
              <TouchableOpacity
                style={styles.likeBtn}
                onPress={() => toggleLike(post.id, username)}
              >
                <Ionicons
                  name={
                    (post.likedBy ?? []).includes(username)
                      ? "heart"
                      : "heart-outline"
                  }
                  size={18}
                  color={GREEN_MAIN}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.likeText}>좋아요 {post.likes ?? 0}</Text>
              </TouchableOpacity>
            </View>

            {/* 댓글 */}
            <View style={styles.commentsWrap}>
              <Text style={styles.commentsTitle}>댓글</Text>
              {roots.length === 0 && (
                <Text style={{ color: "#6b7c70" }}>아직 댓글이 없습니다.</Text>
              )}

              {roots.map((c) => {
                const key = `c-${c.id}-${c.createdAt ?? ""}`;
                return (
                  <View key={key} style={styles.commentItem}>
                    <Text style={styles.commentHeader}>
                      {c.author}{" "}
                      <Text style={styles.commentTime}>
                        {formatDate(c.createdAt)}
                      </Text>
                    </Text>
                    <Text style={styles.commentBody}>{c.content}</Text>
                    <TouchableOpacity onPress={() => setReplyTo(c.id)}>
                      <Text style={styles.replyBtn}>답글</Text>
                    </TouchableOpacity>

                    {childrenOf(c.id).map((rc) => {
                      const childKey = `rc-${rc.id}-${rc.createdAt ?? ""}`;
                      return (
                        <View key={childKey} style={styles.replyItem}>
                          <Text style={styles.commentHeader}>
                            {rc.author}{" "}
                            <Text style={styles.commentTime}>
                              {formatDate(rc.createdAt)}
                            </Text>
                          </Text>
                          <Text style={styles.commentBody}>{rc.content}</Text>
                        </View>
                      );
                    })}
                  </View>
                );
              })}

              {replyTo && (
                <View style={styles.replyToBar}>
                  <Text style={{ color: "#555" }}>답글 대상: #{replyTo}</Text>
                  <TouchableOpacity onPress={() => setReplyTo(null)}>
                    <Ionicons name="close-circle" size={18} color="#666" />
                  </TouchableOpacity>
                </View>
              )}

              {/* 입력창 */}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder={
                    replyTo ? "답글을 입력하세요" : "댓글을 입력하세요"
                  }
                  placeholderTextColor="#99a9a0"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity style={styles.sendBtn} onPress={onSend}>
                  <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_LIGHT },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 10 : 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: GREEN_BORDER,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: GREEN_DARK },

  contentWrap: { padding: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  title: { fontSize: 20, fontWeight: "800", color: "#1f1f1f", marginBottom: 8 },

  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  metaText: { fontSize: 13, color: "#607566", marginRight: 6 },
  metaValue: { fontSize: 13, color: "#374151", fontWeight: "600", marginRight: 6 },
  dot: { marginHorizontal: 6, color: "#9aa79f" },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: GREEN_BORDER,
    marginVertical: 12,
  },

  bodyBox: {
    backgroundColor: "#F4FBF7",
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 10,
    padding: 12,
  },
  bodyLabel: { fontSize: 12, color: "#607566", marginBottom: 6, letterSpacing: 0.2 },
  bodyText: { fontSize: 16, lineHeight: 24, color: "#1F2937" },

  likeRow: { marginTop: 14, alignItems: "flex-start" },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GREEN_PILL,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  likeText: { color: GREEN_DARK, fontWeight: "700" },

  commentsWrap: { marginTop: 18 },
  commentsTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 8, color: GREEN_DARK },

  commentItem: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: GREEN_BORDER,
  },
  replyItem: { marginLeft: 14, paddingVertical: 8 },

  commentHeader: { fontSize: 13, color: "#374151", marginBottom: 4, fontWeight: "600" },
  commentTime: { fontSize: 12, color: "#7f8f84", fontWeight: "400" },
  commentBody: { fontSize: 14, color: "#111" },

  replyBtn: { marginTop: 6, color: GREEN_DARK, fontSize: 13 },

  replyToBar: {
    marginTop: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F0FAF5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  inputRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    maxHeight: 120,
    color: "#222",
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: GREEN_MID,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
});
