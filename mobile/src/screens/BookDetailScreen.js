import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '../components/AppIcon'
import { colors } from '../constants/colors'
import { booksApi } from '../api/books'
import { borrowApi } from '../api/borrow'
import { readError } from '../api/client'
import { resolveBookCover } from '../components/BookCard'
import { Badge } from '../components/Badge'

function getFutureDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateDisplay(iso) {
  if (!iso) return ''
  const [y, m, d] = String(iso).split('-')
  if (d && m && y) return `${d}/${m}/${y}`
  return iso
}

export default function BookDetailScreen({ route, navigation }) {
  const { bookId } = route.params
  const [book, setBook] = useState(null)
  const [userLoans, setUserLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [borrowing, setBorrowing] = useState(false)
  const [selectedDays, setSelectedDays] = useState(10)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    Promise.allSettled([booksApi.get(bookId), borrowApi.history()])
      .then(([bookRes, loansRes]) => {
        if (bookRes.status === 'fulfilled') setBook(bookRes.value)
        if (loansRes.status === 'fulfilled') setUserLoans(loansRes.value || [])
      })
      .catch((err) => Alert.alert('Lỗi', readError(err)))
      .finally(() => setLoading(false))
  }, [bookId])

  if (loading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    )
  }

  if (!book) {
    return (
      <View style={styles.centerWrap}>
        <Text style={styles.errorText}>Không tìm thấy thông tin tác phẩm.</Text>
      </View>
    )
  }

  const coverUrl = resolveBookCover(book)
  const isAvailable = (book.quantityAvailable || 0) > 0
  const authorsText = (book.authorNames || []).join(', ') || 'Chưa cập nhật tác giả'

  // Borrow limits check matching BooksPage.jsx
  const activeLoans = userLoans.filter((r) => r.status === 'BORROWED')
  const pendingLoans = userLoans.filter((r) => r.status === 'PENDING')
  const totalActiveLoans = activeLoans.length + pendingLoans.length
  const reachedBorrowLimit = totalActiveLoans >= 2

  const isAlreadyBorrowingThisBook = userLoans.some(
    (r) => (r.status === 'BORROWED' || r.status === 'PENDING') && r.bookId === book.id
  )

  const requestedDueDate = getFutureDate(selectedDays)

  const handleBorrowSubmit = async () => {
    if (reachedBorrowLimit) {
      Alert.alert(
        'Đã đạt giới hạn',
        'Theo quy định thư viện, mỗi bạn đọc mượn tối đa 2 cuốn / 1 lần. Vui lòng trả sách trước khi mượn tiếp.'
      )
      return
    }

    if (isAlreadyBorrowingThisBook) {
      Alert.alert(
        'Đã có yêu cầu',
        'Bạn đang mượn hoặc đang có yêu cầu chờ duyệt cuốn sách này.'
      )
      return
    }

    setBorrowing(true)
    try {
      await borrowApi.borrow(book.id, requestedDueDate)
      Alert.alert(
        'Đăng ký thành công',
        `Yêu cầu mượn cuốn sách "${book.title}" đã được ghi nhận!\n• Hạn trả mong muốn: ${formatDateDisplay(requestedDueDate)}\n• Thời gian tiếp nhận: 1 – 3 ngày làm việc.\n• Quầy phục vụ: 08:00 – 17:30.`,
        [
          {
            text: 'Mở phiếu mượn',
            onPress: () => navigation.navigate('MyLoans'),
          },
          { text: 'Tiếp tục xem sách', style: 'cancel' },
        ]
      )
    } catch (err) {
      Alert.alert('Không thể mượn sách', readError(err))
    } finally {
      setBorrowing(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Chi tiết tài liệu
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Book Comp Banner */}
        <View style={styles.bookCompCard}>
          <View style={styles.coverFrame}>
            {coverUrl && !imageError ? (
              <Image
                source={{ uri: coverUrl }}
                style={styles.coverImg}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.coverFallback}>
                <Ionicons name="book-outline" size={48} color={colors.brand} />
                <Text style={styles.fallbackCat}>{book.categoryName || 'THƯ VIỆN'}</Text>
              </View>
            )}
          </View>

          <View style={styles.compInfo}>
            <View style={styles.badgeRow}>
              <Badge variant="neutral" hasDot={false}>
                {book.categoryName || 'Chưa phân loại'}
              </Badge>
              <Badge variant={isAvailable ? 'ok' : 'danger'} hasDot={true}>
                {isAvailable ? `Còn ${book.quantityAvailable} cuốn` : 'Hết hàng'}
              </Badge>
            </View>

            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookAuthor}>
              Tác giả: <Text style={styles.authorBold}>{authorsText}</Text>
            </Text>

            {book.isbn ? (
              <Text style={styles.bookMeta}>Mã ISBN: {book.isbn}</Text>
            ) : null}

            <Text style={styles.bookMeta}>
              Tổng số lượng trong kho: {book.quantityTotal || 1} cuốn
            </Text>
          </View>
        </View>

        {/* Book Description */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>TÓM TẮT NỘI DUNG</Text>
          <Text style={styles.descText}>
            {book.description ||
              'Tác phẩm hiện đang được bảo quản và phục vụ bạn đọc tại Thư viện. Vui lòng đăng ký mượn trực tuyến bên dưới để thủ thư chuẩn bị tài liệu trước khi bạn đến quầy lưu thông.'}
          </Text>
        </View>

        {/* Borrow Workflow Box matching book-detail-borrow-card */}
        <View style={styles.borrowWorkflowCard}>
          <View style={styles.borrowHeader}>
            <Text style={styles.borrowTitle}>Đăng ký mượn cuốn sách này</Text>
          </View>

          {/* Availability & Limit checks */}
          {!isAvailable ? (
            <View style={styles.alertDanger}>
              <Text style={styles.alertDangerText}>
                Sách hiện đã hết trong kho. Bạn đọc vui lòng quay lại sau khi có người hoàn trả.
              </Text>
            </View>
          ) : isAlreadyBorrowingThisBook ? (
            <View style={styles.alertWarning}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertWarningText}>
                  Bạn đang mượn hoặc đang có yêu cầu chờ duyệt cuốn sách này rồi.
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('MyLoans')}
                  style={{ marginTop: 6 }}
                >
                  <Text style={styles.alertLinkText}>Mở trang Mượn và trả sách →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : reachedBorrowLimit ? (
            <View style={styles.alertWarning}>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertWarningText}>
                  Theo quy định thư viện, mỗi bạn đọc mượn tối đa 2 cuốn / 1 lần. Hiện bạn đã có {totalActiveLoans} cuốn đang mượn hoặc chờ duyệt.
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('MyLoans')}
                  style={{ marginTop: 6 }}
                >
                  <Text style={styles.alertLinkText}>Mở trang Mượn và trả sách →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {totalActiveLoans > 0 && (
                <View style={styles.quotaNote}>
                  <Text style={styles.quotaNoteText}>
                    Bạn đang có {totalActiveLoans}/2 cuốn (còn 1 lượt mượn khả dụng).
                  </Text>
                </View>
              )}

              <Text style={styles.dueLabel}>Chọn thời gian mượn sách:</Text>

              {/* Quick Duration Chips */}
              <View style={styles.chipRow}>
                {[3, 5, 7, 10].map((d) => {
                  const isSelected = selectedDays === d
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.durationChip, isSelected && styles.durationChipActive]}
                      onPress={() => setSelectedDays(d)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.durationChipText,
                          isSelected && styles.durationChipTextActive,
                        ]}
                      >
                        +{d} ngày {d === 10 ? '(Tối đa)' : ''}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={styles.duePreview}>
                <Text style={styles.duePreviewText}>
                  Hạn hoàn trả dự kiến:{' '}
                  <Text style={styles.duePreviewBold}>{formatDateDisplay(requestedDueDate)}</Text>
                </Text>
              </View>

              {/* Policy Reminders */}
              <View style={styles.ruleReminderBox}>
                <Text style={styles.ruleReminderItem}>• Thời hạn mượn: Tối đa 10 ngày kể từ ngày nhận sách.</Text>
                <Text style={styles.ruleReminderItem}>• Thời gian đáp ứng: 1 – 3 ngày làm việc.</Text>
                <Text style={styles.ruleReminderItem}>• Phí dịch vụ: 20.000 đ / 1 lượt mượn.</Text>
                <Text style={styles.ruleReminderItem}>• Phí trễ hạn: 5.000 đ / cuốn / ngày quá hạn.</Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.borrowBtn, borrowing && styles.borrowBtnDisabled]}
                onPress={handleBorrowSubmit}
                disabled={borrowing}
                activeOpacity={0.85}
              >
                {borrowing ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.borrowBtnText}>Gửi yêu cầu mượn sách</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgCanvas,
  },
  errorText: {
    fontSize: 14,
    color: colors.dangerText,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 80,
  },
  backBtnText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  bookCompCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    flexDirection: 'row',
    gap: 16,
  },
  coverFrame: {
    width: 100,
    height: 145,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.brandSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  fallbackCat: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.brand,
    marginTop: 4,
  },
  compInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  bookAuthor: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  authorBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bookMeta: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  descText: {
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  borrowWorkflowCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.brand,
  },
  borrowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  borrowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  alertDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  alertDangerText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.dangerText,
    lineHeight: 18,
  },
  alertWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  alertWarningText: {
    fontSize: 12.5,
    color: colors.warningText,
    lineHeight: 18,
  },
  alertLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.brand,
  },
  quotaNote: {
    backgroundColor: colors.bgSubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  quotaNoteText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dueLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  durationChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  durationChipActive: {
    backgroundColor: colors.brandSurface,
    borderColor: colors.brand,
  },
  durationChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  durationChipTextActive: {
    color: colors.brand,
    fontWeight: '700',
  },
  duePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brandSurface,
    padding: 10,
    borderRadius: 6,
    marginBottom: 14,
  },
  duePreviewText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  duePreviewBold: {
    fontWeight: '700',
    color: colors.brand,
  },
  ruleReminderBox: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: colors.bgCanvas,
    marginBottom: 14,
    gap: 4,
  },
  ruleReminderItem: {
    fontSize: 11.5,
    color: colors.textTertiary,
    lineHeight: 17,
  },
  borrowBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowBtnDisabled: {
    opacity: 0.7,
  },
  borrowBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
})
