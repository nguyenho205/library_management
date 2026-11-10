import React, { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { notificationsApi } from '../api/notifications'
import { colors } from '../constants/colors'

function relativeTime(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}

export default function NotificationsScreen({ navigation, onUnreadChange }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    try { setItems(await notificationsApi.list()); onUnreadChange?.() } catch { /* screen remains available offline */ }
    finally { setLoading(false); setRefreshing(false) }
  }, [onUnreadChange])

  useFocusEffect(useCallback(() => {
    load()
    return undefined
  }, [load]))

  const markAll = async () => {
    await notificationsApi.markAllRead().catch(() => {})
    setItems((current) => current.map((item) => ({ ...item, read: true })))
    onUnreadChange?.()
  }

  const openItem = async (item) => {
    if (!item.read) {
      await notificationsApi.markRead(item.id).catch(() => {})
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry))
      onUnreadChange?.()
    }
    if (item.targetUrl?.includes('my-loans')) navigation.navigate('MyLoans')
    if (item.targetUrl?.includes('catalog')) navigation.navigate('Catalog')
  }

  const unreadCount = items.filter((item) => !item.read).length

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headingRow}>
          <View style={styles.iconWrap}><MaterialCommunityIcons name="bell-outline" size={21} color={colors.brand} /></View>
          <View style={styles.headingCopy}><Text style={styles.eyebrow}>CẬP NHẬT THƯ VIỆN</Text><Text style={styles.title}>Thông báo</Text></View>
        </View>
        {unreadCount > 0 && <Pressable onPress={markAll}><Text style={styles.markAll}>Đọc tất cả</Text></Pressable>}
      </View>
      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.brand} /></View> : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={items.length ? styles.list : styles.emptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.brand} />}
          ListEmptyComponent={<View style={styles.empty}><MaterialCommunityIcons name="inbox-outline" size={42} color={colors.textTertiary} /><Text style={styles.emptyTitle}>Chưa có thông báo</Text><Text style={styles.emptyText}>Cập nhật về yêu cầu mượn và hạn trả sẽ xuất hiện ở đây.</Text></View>}
          renderItem={({ item }) => (
            <Pressable onPress={() => openItem(item)} style={[styles.item, !item.read && styles.unreadItem]}>
              <View style={[styles.itemIcon, !item.read && styles.unreadIcon]}><MaterialCommunityIcons name={item.type?.includes('DUE') || item.type?.includes('OVERDUE') ? 'clock-alert-outline' : 'book-open-page-variant-outline'} size={19} color={!item.read ? colors.brand : colors.textTertiary} /></View>
              <View style={styles.itemCopy}><View style={styles.titleLine}><Text style={styles.itemTitle}>{item.title}</Text>{!item.read && <View style={styles.unreadDot} />}</View><Text style={styles.message}>{item.message}</Text><Text style={styles.time}>{relativeTime(item.createdAt)}</Text></View>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCanvas },
  header: { paddingTop: 52, paddingBottom: 17, paddingHorizontal: 18, backgroundColor: colors.bgSurface, borderBottomWidth: 1, borderBottomColor: colors.borderDefault, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSurface },
  headingCopy: { gap: 2 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1, color: colors.textTertiary },
  title: { fontSize: 21, fontWeight: '800', color: colors.textPrimary },
  markAll: { fontSize: 12, fontWeight: '700', color: colors.brand },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 14, gap: 9 },
  emptyList: { flexGrow: 1, padding: 20 },
  item: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 13, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.borderDefault },
  unreadItem: { borderColor: colors.brandBorder, backgroundColor: '#fffdf8' },
  itemIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.bgCanvas, alignItems: 'center', justifyContent: 'center' },
  unreadIcon: { backgroundColor: colors.brandSurface },
  itemCopy: { flex: 1, gap: 4 },
  titleLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemTitle: { flex: 1, fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brand },
  message: { fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  time: { marginTop: 2, fontSize: 10.5, color: colors.textTertiary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 8 },
  emptyTitle: { marginTop: 8, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  emptyText: { maxWidth: 260, fontSize: 12, lineHeight: 18, textAlign: 'center', color: colors.textTertiary },
})
