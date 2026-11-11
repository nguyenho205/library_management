import React, { useEffect, useState } from 'react'
import { Alert, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native'
import { ratingsApi } from '../api/ratings'
import { colors } from '../constants/colors'
import { readError } from '../api/client'

export default function BookRatingEditor({ bookId, borrowRecordId, existing, onSaved }) {
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(existing?.score || 0)
  const [comment, setComment] = useState(existing?.comment || '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setScore(existing?.score || 0)
    setComment(existing?.comment || '')
  }, [existing?.score, existing?.comment])

  const submit = async () => {
    if (!score) return Alert.alert('Chọn số sao', 'Vui lòng chọn từ 1 đến 5 sao.')
    setBusy(true)
    try {
      await ratingsApi.save(bookId, { borrowRecordId, score, comment })
      setOpen(false)
      onSaved?.()
      Alert.alert('Đã lưu', 'Cảm ơn bạn đã chia sẻ cảm nhận về cuốn sách.')
    } catch (error) {
      Alert.alert('Chưa lưu được đánh giá', readError(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen((value) => !value)} activeOpacity={0.75}>
        <Text style={styles.triggerStars}>{existing ? '★'.repeat(existing.score) : '☆'}</Text>
        <Text style={styles.triggerLabel}>{open ? 'Đóng' : existing ? 'Sửa đánh giá' : 'Đánh giá sách'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.editor}>
          <Text style={styles.prompt}>{existing ? 'Cập nhật cảm nhận của bạn' : 'Bạn đánh giá cuốn sách này thế nào?'}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => <TouchableOpacity key={value} onPress={() => setScore(value)} accessibilityRole="button" accessibilityLabel={`${value} sao`}><Text style={[styles.star, value <= score && styles.starSelected]}>★</Text></TouchableOpacity>)}
          </View>
          <TextInput value={comment} onChangeText={setComment} placeholder="Chia sẻ cảm nhận (không bắt buộc)" multiline maxLength={1000} textAlignVertical="top" style={styles.input} />
          <View style={styles.footer}><Text style={styles.count}>{comment.length}/1000</Text><TouchableOpacity disabled={!score || busy} onPress={submit} style={[styles.save, (!score || busy) && styles.saveDisabled]}><Text style={styles.saveText}>{busy ? 'Đang lưu…' : 'Lưu đánh giá'}</Text></TouchableOpacity></View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  trigger: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#e6d4b5', backgroundColor: '#fffaf1' },
  triggerStars: { color: '#b7812e', fontSize: 13, letterSpacing: 1 },
  triggerLabel: { color: '#79591f', fontSize: 11, fontWeight: '700' },
  editor: { marginTop: 9, padding: 12, borderRadius: 11, borderWidth: 1, borderColor: '#ead9bb', backgroundColor: '#fffdf8', gap: 9 },
  prompt: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  stars: { flexDirection: 'row', gap: 5 },
  star: { color: '#c8c1b3', fontSize: 27 },
  starSelected: { color: '#c08a36' },
  input: { minHeight: 68, padding: 9, borderWidth: 1, borderColor: colors.borderDefault, borderRadius: 8, backgroundColor: '#fff', color: colors.textPrimary, fontSize: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { color: colors.textTertiary, fontSize: 10 },
  save: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7, backgroundColor: colors.brand },
  saveDisabled: { opacity: 0.45 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 11 },
})
