import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native'
import { Ionicons } from '../components/AppIcon'
import { colors } from '../constants/colors'
import { borrowApi } from '../api/borrow'
import { readError } from '../api/client'
import { Badge, ConditionBadge } from '../components/Badge'
import DueStamp from '../components/DueStamp'
import GuideModal from '../components/GuideModal'
import LibraryLogo from '../components/LibraryLogo'
import { resolveBookCover } from '../components/BookCard'

function formatDate(iso) {
  if (!iso) return 'Chưa cập nhật'
  const parts = String(iso).split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return iso
}

function formatMoney(amount) {
  if (!amount || Number(amount) === 0) return '0 đ'
  return Number(amount).toLocaleString('vi-VN') + ' đ'
}

const overdue = (record) =>
  Boolean(
    record?.overdue ||
      (record?.status === 'BORROWED' &&
        new Date(record?.dueDate) < new Date(new Date().toDateString()))
  )

export default function MyLoansScreen({ navigation }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [guideRecord, setGuideRecord] = useState(null)
  const [historyTab, setHistoryTab] = useState('ALL') // 'ALL' | 'RETURNED' | 'REJECTED' | 'PENALTY'
  const [busyId, setBusyId] = useState(null)

  const fetchRecords = useCallback(async () => {
    try {
      const data = await borrowApi.history()
      setHistory(data || [])
    } catch {
      // Ignore
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchRecords().finally(() => setLoading(false))
  }, [fetchRecords])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchRecords()
    setRefreshing(false)
  }

  // Cancel pending request matching CirculationPage.jsx
  const handleCancelRequest = (record) => {
    Alert.alert(
      'Xác nhận huỷ',
      `Bạn có chắc chắn muốn huỷ yêu cầu mượn cuốn sách "${record.bookTitle}"?`,
      [
        { text: 'Bỏ qua', style: 'cancel' },
        {
          text: 'Huỷ yêu cầu',
          style: 'destructive',
          onPress: async () => {
            setBusyId(record.id)
            try {
              await borrowApi.cancel(record.id)
              Alert.alert('Thành công', 'Đã huỷ yêu cầu mượn sách thành công.')
              await fetchRecords()
            } catch (err) {
              Alert.alert('Lỗi', readError(err))
            } finally {
              setBusyId(null)
            }
          },
        },
      ]
    )
  }

  // Derived sections matching CirculationPage.jsx
  const activeLoans = useMemo(
    () => history.filter((r) => r.status === 'BORROWED'),
    [history]
  )
  const pendingRequests = useMemo(
    () => history.filter((r) => r.status === 'PENDING'),
    [history]
  )
  const completedHistory = useMemo(
    () => history.filter((r) => r.status !== 'PENDING'),
    [history]
  )

  const counts = useMemo(
    () => ({
      all: completedHistory.length,
      returned: completedHistory.filter((r) => r.status === 'RETURNED').length,
      rejected: completedHistory.filter((r) => r.status === 'REJECTED').length,
      penalty: completedHistory.filter(
        (r) => r.penaltyAmount && Number(r.penaltyAmount) > 0
      ).length,
    }),
    [completedHistory]
  )

  const filteredHistory = useMemo(() => {
    return completedHistory.filter((r) => {
      if (historyTab === 'RETURNED' && r.status !== 'RETURNED') return false
      if (historyTab === 'REJECTED' && r.status !== 'REJECTED') return false
      if (historyTab === 'PENALTY' && (!r.penaltyAmount || Number(r.penaltyAmount) <= 0))
        return false
      return true
    })
  }, [completedHistory, historyTab])

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <LibraryLogo compact={false} size={0.88} />
        </View>
        <Text style={styles.headerTitle}>Mượn và trả sách</Text>
        <Text style={styles.headerSubtitle}>
          Theo dõi tình trạng mượn, hạn trả và quy trình hoàn trả tại quầy
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.brand]}
          />
        }
      >
        {/* SECTION 1: SÁCH ĐANG MƯỢN */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Sách đang mượn ({activeLoans.length}/2 cuốn)
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.brand} style={{ padding: 16 }} />
          ) : activeLoans.length > 0 ? (
            activeLoans.map((loan) => {
              const isOver = overdue(loan)
              const cover = resolveBookCover({ title: loan.bookTitle, imgUrl: loan.bookImgUrl })
              return (
                <View
                  key={loan.id}
                  style={[
                    styles.loanSlipCard,
                    isOver && styles.loanSlipCardOverdue,
                  ]}
                >
                  <View style={styles.slipMain}>
                    {/* Thumbnail */}
                    <View style={styles.thumbWrap}>
                      {cover ? (
                        <Image source={{ uri: cover }} style={styles.thumbImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.thumbFallback}>
                          <Ionicons name="book-outline" size={20} color={colors.brand} />
                        </View>
                      )}
                    </View>

                    <View style={styles.slipBody}>
                      <View style={styles.slipTopRow}>
                        <DueStamp dueDate={loan.dueDate} overdue={isOver} />
                        {isOver ? (
                          <Badge variant="danger" hasDot={true}>
                            Quá hạn {loan.overdueDays} ngày
                          </Badge>
                        ) : null}
                      </View>

                      <Text style={styles.slipBookTitle}>{loan.bookTitle}</Text>
                      <Text style={styles.slipMeta}>
                        Ngày mượn: <Text style={styles.metaBold}>{formatDate(loan.borrowDate)}</Text>
                      </Text>

                      {isOver && loan.penaltyAmount && Number(loan.penaltyAmount) > 0 ? (
                        <Text style={styles.fineText}>
                          Tiền phạt tích luỹ: {formatMoney(loan.penaltyAmount)}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.returnGuideBtn}
                    onPress={() => setGuideRecord(loan)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.returnGuideBtnText}>Trả sách tại quầy</Text>
                  </TouchableOpacity>
                </View>
              )
            })
          ) : (
            <View style={styles.emptyLoanBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyLoanTitle}>
                  Hiện tại bạn không mượn cuốn sách nào
                </Text>
                <Text style={styles.emptyLoanDesc}>
                  Theo quy định, bạn có thể mượn tối đa 2 cuốn sách cùng lúc với thời hạn 10 ngày.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.catalogNavBtn}
                onPress={() => navigation.navigate('Catalog')}
                activeOpacity={0.8}
              >
                <Text style={styles.catalogNavBtnText}>Tìm sách</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* SECTION 2: YÊU CẦU ĐANG CHỜ DUYỆT */}
        {pendingRequests.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                Yêu cầu mượn đang chờ duyệt ({pendingRequests.length})
              </Text>
              <Text style={styles.sectionHint}>Xử lý trong 1 – 3 ngày</Text>
            </View>

            {pendingRequests.map((req) => (
              <View key={req.id} style={styles.pendingSlipCard}>
                <View style={styles.pendingSlipTop}>
                  <View style={styles.pendingBadge}>
                    <View style={styles.pendingDot} />
                    <Text style={styles.pendingBadgeText}>
                      Đang chờ duyệt (1 – 3 ngày)
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.cancelReqBtn}
                    onPress={() => handleCancelRequest(req)}
                    disabled={busyId === req.id}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelReqBtnText}>Huỷ yêu cầu</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.slipBookTitle}>{req.bookTitle}</Text>
                <Text style={styles.slipMeta}>
                  Gửi ngày: {formatDate(req.borrowDate)} · Hạn trả mong muốn:{' '}
                  <Text style={{ fontWeight: '700', color: colors.brand }}>
                    {formatDate(req.dueDate)}
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* SECTION 3: LỊCH SỬ MƯỢN TRẢ CỦA BẠN */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Lịch sử mượn & trả sách</Text>
          </View>

          {/* Subtabs matching CirculationPage.jsx */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subtabsRow}
          >
            <TouchableOpacity
              style={[
                styles.subtabBtn,
                historyTab === 'ALL' && styles.subtabBtnActive,
              ]}
              onPress={() => setHistoryTab('ALL')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.subtabBtnText,
                  historyTab === 'ALL' && styles.subtabBtnTextActive,
                ]}
              >
                Tất cả ({counts.all})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.subtabBtn,
                historyTab === 'RETURNED' && styles.subtabBtnActive,
              ]}
              onPress={() => setHistoryTab('RETURNED')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.subtabBtnText,
                  historyTab === 'RETURNED' && styles.subtabBtnTextActive,
                ]}
              >
                Đã hoàn trả ({counts.returned})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.subtabBtn,
                historyTab === 'REJECTED' && styles.subtabBtnActive,
              ]}
              onPress={() => setHistoryTab('REJECTED')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.subtabBtnText,
                  historyTab === 'REJECTED' && styles.subtabBtnTextActive,
                ]}
              >
                Bị từ chối ({counts.rejected})
              </Text>
            </TouchableOpacity>

            {counts.penalty > 0 && (
              <TouchableOpacity
                style={[
                  styles.subtabBtn,
                  historyTab === 'PENALTY' && styles.subtabBtnActive,
                ]}
                onPress={() => setHistoryTab('PENALTY')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.subtabBtnText,
                    historyTab === 'PENALTY' && styles.subtabBtnTextActive,
                  ]}
                >
                  Có phí phạt ({counts.penalty})
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Filtered History Items */}
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item) => {
              const cover = resolveBookCover({ title: item.bookTitle, imgUrl: item.bookImgUrl })
              return (
                <View key={item.id} style={styles.historyRowCard}>
                  <View style={styles.historyThumb}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={styles.thumbImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.thumbFallback}>
                        <Ionicons name="book-outline" size={18} color={colors.brand} />
                      </View>
                    )}
                  </View>

                  <View style={styles.historyBody}>
                    <Text style={styles.historyBookTitle}>{item.bookTitle}</Text>
                    <Text style={styles.historyDates}>
                      Mượn: {formatDate(item.borrowDate)} · Trả: {formatDate(item.returnDate || item.dueDate)}
                    </Text>

                    <View style={styles.historyStatusRow}>
                      {item.status === 'RETURNED' ? (
                        <Badge variant="ok" hasDot={true}>
                          Đã hoàn trả
                        </Badge>
                      ) : item.status === 'REJECTED' ? (
                        <Badge variant="danger" hasDot={true}>
                          Bị từ chối
                        </Badge>
                      ) : (
                        <Badge variant="neutral" hasDot={false}>
                          {item.status}
                        </Badge>
                      )}

                      {/* Condition badge from librarian check */}
                      {item.bookCondition ? (
                        <ConditionBadge condition={item.bookCondition} />
                      ) : null}
                    </View>

                    {item.notes ? (
                      <Text style={styles.historyNotes}>Ghi chú: {item.notes}</Text>
                    ) : null}

                    {item.penaltyAmount && Number(item.penaltyAmount) > 0 ? (
                      <Text style={styles.historyPenaltyText}>
                        Phí phạt / bồi hoàn: {formatMoney(item.penaltyAmount)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )
            })
          ) : (
            <View style={styles.emptyHistoryBox}>
              <Text style={styles.emptyHistoryText}>
                Không có dữ liệu trong mục lịch sử này.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Guide Modal */}
      <GuideModal
        visible={Boolean(guideRecord)}
        record={guideRecord}
        onClose={() => setGuideRecord(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  header: {
    backgroundColor: colors.bgSurface,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  headerTop: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  sectionWrap: {
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  // Loan Slip
  loanSlipCard: {
    backgroundColor: colors.bgCanvas,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    marginBottom: 10,
  },
  loanSlipCardOverdue: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  slipMain: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  thumbWrap: {
    width: 48,
    height: 70,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.brandSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slipBody: {
    flex: 1,
  },
  slipTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  slipBookTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  slipMeta: {
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  metaBold: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  fineText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dangerText,
    marginTop: 4,
  },
  returnGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingVertical: 8,
    borderRadius: 6,
  },
  returnGuideBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.brand,
  },
  emptyLoanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.bgCanvas,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  emptyLoanIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLoanTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyLoanDesc: {
    fontSize: 11.5,
    color: colors.textTertiary,
    marginTop: 2,
  },
  catalogNavBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  catalogNavBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Pending
  pendingSlipCard: {
    backgroundColor: colors.warningBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    marginBottom: 10,
  },
  pendingSlipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warning,
  },
  pendingBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.warningText,
  },
  cancelReqBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  cancelReqBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.dangerText,
  },
  // History
  subtabsRow: {
    gap: 8,
    marginBottom: 12,
  },
  subtabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.bgCanvas,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  subtabBtnActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  subtabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  subtabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  historyRowCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  historyThumb: {
    width: 42,
    height: 60,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.brandSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  historyBody: {
    flex: 1,
  },
  historyBookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  historyDates: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 6,
  },
  historyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  historyNotes: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  historyPenaltyText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.dangerText,
    marginTop: 4,
  },
  emptyHistoryBox: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 12.5,
    color: colors.textTertiary,
  },
})
