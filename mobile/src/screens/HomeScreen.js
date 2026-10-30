import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '../components/AppIcon'
import { colors } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { booksApi } from '../api/books'
import { borrowApi } from '../api/borrow'
import LibraryLogo from '../components/LibraryLogo'
import BookCard, { CURATED_COVERS, resolveBookCover } from '../components/BookCard'
import DueStamp from '../components/DueStamp'
import GuideModal from '../components/GuideModal'

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật'
  const [year, month, day] = String(value).split('-')
  if (day && month && year) return `${day}/${month}/${year}`
  return value
}

const overdue = (record) =>
  Boolean(
    record?.overdue ||
      (record?.status === 'BORROWED' &&
        new Date(record?.dueDate) < new Date(new Date().toDateString()))
  )

export default function HomeScreen({ navigation }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('CATEGORY') // 'CATEGORY' | 'AUTHOR' | 'POPULAR'
  const [tabData, setTabData] = useState({ CATEGORY: [], AUTHOR: [], POPULAR: [] })
  const [totalCatalogCount, setTotalCatalogCount] = useState(0)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [guideRecord, setGuideRecord] = useState(null)

  const loadDashboard = useCallback(async () => {
    try {
      const [histRes, countRes, catalogRes] = await Promise.allSettled([
        borrowApi.history(),
        booksApi.search({ page: 0, size: 1, status: 'IN_CIRCULATION' }),
        booksApi.search({ page: 0, size: 100, status: 'IN_CIRCULATION' }),
      ])

      const userHistory = histRes.status === 'fulfilled' ? histRes.value || [] : []
      setHistory(userHistory)

      if (countRes.status === 'fulfilled' && countRes.value?.totalElements != null) {
        setTotalCatalogCount(countRes.value.totalElements)
      }

      // Try backend recommendations or client-side fallback
      let backendData = null
      try {
        const [catRes, authRes, popRes] = await Promise.all([
          booksApi.getRecommendations('CATEGORY', 6),
          booksApi.getRecommendations('AUTHOR', 6),
          booksApi.getRecommendations('POPULAR', 6),
        ])
        if (Array.isArray(catRes) && catRes.length > 0) {
          backendData = {
            CATEGORY: catRes,
            AUTHOR: Array.isArray(authRes) && authRes.length > 0 ? authRes : catRes,
            POPULAR: Array.isArray(popRes) && popRes.length > 0 ? popRes : catRes,
          }
        }
      } catch {
        // Fallback below
      }

      if (backendData) {
        setTabData(backendData)
      } else {
        const pool =
          catalogRes.status === 'fulfilled' && catalogRes.value?.content
            ? [...catalogRes.value.content]
            : []
        // Client-side categorization
        setTabData({
          CATEGORY: pool.slice(0, 6),
          AUTHOR: [...pool].reverse().slice(0, 6),
          POPULAR: pool.filter((b) => b.quantityAvailable > 0).slice(0, 6),
        })
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboard()
    setRefreshing(false)
  }

  // Derived state matching CustomerDashboardPage.jsx
  const activeLoans = useMemo(
    () => history.filter((r) => r.status === 'BORROWED'),
    [history]
  )
  const pendingLoans = useMemo(
    () => history.filter((r) => r.status === 'PENDING'),
    [history]
  )
  const totalActiveLoans = activeLoans.length + pendingLoans.length
  const reachedBorrowLimit = totalActiveLoans >= 2

  const completedCount = useMemo(
    () => history.filter((r) => r.status === 'RETURNED').length,
    [history]
  )

  const totalUnpaidFines = useMemo(() => {
    return history
      .filter((r) => overdue(r) && r.penaltyAmount)
      .reduce((sum, r) => sum + Number(r.penaltyAmount || 0), 0)
  }, [history])

  const currentBooks = tabData[activeTab] || []

  const userName = user?.fullName || user?.email?.split('@')[0] || 'Bạn đọc'

  return (
    <View style={styles.container}>
      {/* Top Navbar matching Layout.jsx */}
      <View style={styles.navbar}>
        <LibraryLogo compact={false} size={0.92} />
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.8}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
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
        {/* Reader Hero Banner matching .reader-hero */}
        <View style={styles.readerHero}>
          <View style={styles.heroDecoRing} />
          <Text style={styles.heroEyebrow}>CỔNG BẠN ĐỌC TRỰC TUYẾN</Text>
          <Text style={styles.heroTitle}>Chào mừng, {userName}!</Text>
          <Text style={styles.heroSubtitle}>
            Tra cứu tài liệu lưu thông, quản lý phiếu mượn và cập nhật hạn hoàn trả sách.
          </Text>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={() => navigation.navigate('Catalog')}
              activeOpacity={0.85}
            >
              <Text style={styles.heroPrimaryBtnText}>Tra cứu kho sách →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => navigation.navigate('MyLoans')}
              activeOpacity={0.8}
            >
              <Text style={styles.heroSecondaryBtnText}>Phiếu mượn của tôi</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reader Stats Bar matching .reader-stats */}
        <View style={styles.readerStats}>
          {/* Stat 1: Sách đang mượn */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sách đang mượn</Text>
            <Text style={styles.statNumber}>
              {loading ? '…' : `${String(totalActiveLoans).padStart(2, '0')} / 02`}
            </Text>
            <Text style={styles.statDesc} numberOfLines={2}>
              {totalActiveLoans >= 2
                ? 'Đã đạt tối đa 2 cuốn'
                : totalActiveLoans === 1
                ? 'Còn 1 lượt mượn'
                : 'Mượn tối đa 2 cuốn / 1 lần'}
            </Text>
          </View>

          {/* Stat 2: Đã hoàn thành */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Đã hoàn thành</Text>
            <Text style={styles.statNumber}>
              {loading ? '…' : String(completedCount).padStart(2, '0')}
            </Text>
            <Text style={styles.statDesc} numberOfLines={2}>
              Lượt mượn trả thành công
            </Text>
          </View>

          {/* Stat 3: Tiền phạt trễ hạn */}
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Tiền phạt trễ hạn</Text>
            <Text
              style={[
                styles.statNumber,
                totalUnpaidFines > 0 && { color: colors.danger },
              ]}
            >
              {loading ? '…' : totalUnpaidFines > 0 ? `${totalUnpaidFines.toLocaleString('vi-VN')} đ` : '0 đ'}
            </Text>
            <Text style={styles.statDesc} numberOfLines={2}>
              {totalUnpaidFines > 0 ? 'Cần thanh toán tại quầy' : 'Không có phí phát sinh'}
            </Text>
          </View>
        </View>

        {/* Section 1: Active Loan Slips matching reader-loan-section */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>
              {activeLoans.length > 0
                ? `Sách đang mượn (${activeLoans.length}/2 cuốn)`
                : pendingLoans.length > 0
                ? `Yêu cầu mượn chờ duyệt (${pendingLoans.length})`
                : 'Sách đang mượn'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MyLoans')}
              style={styles.sectionLink}
            >
              <Text style={styles.sectionLinkText}>Xem tất cả ›</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.brand} style={{ padding: 20 }} />
          ) : activeLoans.length > 0 ? (
            activeLoans.map((loan) => {
              const isOver = overdue(loan)
              return (
                <View
                  key={loan.id}
                  style={[
                    styles.currentLoanCard,
                    isOver && styles.currentLoanCardOverdue,
                  ]}
                >
                  <View style={styles.loanCardTop}>
                    <DueStamp dueDate={loan.dueDate} overdue={isOver} />
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isOver ? colors.dangerBg : colors.warningBg,
                          borderColor: isOver ? colors.dangerBorder : colors.warningBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isOver ? colors.dangerText : colors.warningText },
                        ]}
                      >
                        {isOver ? `Quá hạn ${loan.overdueDays || 1} ngày` : 'Đang đọc'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.loanBookTitle}>{loan.bookTitle}</Text>

                  <Text style={styles.loanMeta}>
                    Mượn ngày {formatDate(loan.borrowDate)}
                    {isOver && loan.penaltyAmount && Number(loan.penaltyAmount) > 0 ? (
                      <Text style={{ color: colors.dangerText, fontWeight: '700' }}>
                        {' '}· Phí phạt: {Number(loan.penaltyAmount).toLocaleString('vi-VN')} đ
                      </Text>
                    ) : null}
                  </Text>

                  <View style={styles.loanCardActions}>
                    <TouchableOpacity
                      style={styles.returnCounterBtn}
                      onPress={() => setGuideRecord(loan)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.returnCounterBtnText}>Trả sách tại quầy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })
          ) : pendingLoans.length > 0 ? (
            pendingLoans.map((pending) => (
              <View key={pending.id} style={styles.pendingCard}>
                <View style={styles.pendingBadge}>
                  <View style={styles.pendingDot} />
                  <Text style={styles.pendingBadgeText}>
                    Đang chờ duyệt (1 – 3 ngày)
                  </Text>
                </View>
                <Text style={styles.loanBookTitle}>{pending.bookTitle}</Text>
                <Text style={styles.loanMeta}>
                  Gửi ngày {formatDate(pending.borrowDate)} · Hạn trả mong muốn:{' '}
                  <Text style={{ fontWeight: '700', color: colors.brand }}>
                    {formatDate(pending.dueDate)}
                  </Text>
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.noLoanCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.noLoanTitle}>Bạn chưa có sách đang mượn</Text>
                <Text style={styles.noLoanDesc}>
                  Chọn một cuốn sách còn trên kệ để bắt đầu lượt đọc tiếp theo.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.findBookBtn}
                onPress={() => navigation.navigate('Catalog')}
                activeOpacity={0.8}
              >
                <Text style={styles.findBookBtnText}>Tìm sách</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Section 2: Recommendation Tabs matching reader-discover-section */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Sách gợi ý hôm nay</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Catalog')}
              style={styles.sectionLink}
            >
              <Text style={styles.sectionLinkText}>Xem toàn bộ kho ({totalCatalogCount}) ›</Text>
            </TouchableOpacity>
          </View>

          {/* 3 Tabs */}
          <View style={styles.tabsBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'CATEGORY' && styles.tabBtnActive]}
              onPress={() => setActiveTab('CATEGORY')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, activeTab === 'CATEGORY' && styles.tabBtnTextActive]}>
                Thể loại yêu thích
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'AUTHOR' && styles.tabBtnActive]}
              onPress={() => setActiveTab('AUTHOR')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, activeTab === 'AUTHOR' && styles.tabBtnTextActive]}>
                Tác giả quan tâm
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'POPULAR' && styles.tabBtnActive]}
              onPress={() => setActiveTab('POPULAR')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabBtnText, activeTab === 'POPULAR' && styles.tabBtnTextActive]}>
                Mượn nhiều nhất
              </Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Grid of Books */}
          {loading ? (
            <ActivityIndicator color={colors.brand} style={{ padding: 20 }} />
          ) : currentBooks.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalBooksScroll}
            >
              {currentBooks.map((book) => {
                const isHolding = history.some(
                  (r) =>
                    (r.status === 'BORROWED' || r.status === 'PENDING') &&
                    r.bookId === book.id
                )
                return (
                  <BookCard
                    key={book.id}
                    book={book}
                    variant="grid"
                    isHolding={isHolding}
                    limitReached={reachedBorrowLimit}
                    onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
                    onBorrowPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
                  />
                )
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyTab}>
              <Text style={styles.emptyTabText}>
                Hiện chưa có đầu sách trong mục này. Vui lòng quay lại sau.
              </Text>
            </View>
          )}
        </View>

        {/* Section 3: Library Rules & Fees Card matching .reader-rules-card */}
        <View style={styles.rulesCard}>
          <View style={styles.rulesHeader}>
            <View>
              <Text style={styles.rulesTitle}>Quy định mượn trả & Biểu phí dịch vụ</Text>
              <Text style={styles.rulesSub}>Thực hiện theo Nội quy Thư viện hiện hành</Text>
            </View>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleItemTitle}>• Hạn mức mượn:</Text>
            <Text style={styles.ruleItemDesc}>Tối đa 02 cuốn / 1 lần mượn. Thời hạn giữ sách: 10 ngày.</Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleItemTitle}>• Phí dịch vụ mượn sách:</Text>
            <Text style={styles.ruleItemDesc}>20.000 đ / 1 lượt mượn (đã bao gồm phí phục hồi & bảo quản).</Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleItemTitle}>• Phí phạt trễ hạn:</Text>
            <Text style={styles.ruleItemDesc}>5.000 đ / cuốn / ngày quá hạn so với ngày cam kết trả.</Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleItemTitle}>• Biểu phí bồi hoàn khi hư hỏng / mất sách:</Text>
            <Text style={styles.ruleItemDesc}>
              - Hư hỏng nhẹ (sờn bìa, nếp gấp): 20.000 đ{'\n'}
              - Hư hỏng nặng (rách nát, ướt nước): 100.000 đ{'\n'}
              - Mất tài liệu: 200.000 đ (bồi hoàn chi phí bổ sung sách mới)
            </Text>
          </View>

          <View style={styles.rulesFooter}>
            <Text style={styles.rulesFooterText}>
              Giờ phục vụ tại quầy: Thứ 2 – Thứ 7 (08:00 – 17:30)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Counter Return Guidance Modal */}
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
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  avatarBtn: {
    padding: 2,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brandSurface,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  // Hero
  readerHero: {
    backgroundColor: colors.brand,
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  heroDecoRing: {
    position: 'absolute',
    right: -40,
    bottom: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroEyebrow: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#d7e3ef',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  heroPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand,
  },
  heroSecondaryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  heroSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
  // Stats
  readerStats: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  // Section Wrap
  sectionWrap: {
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.brand,
  },
  // Current Loan Card
  currentLoanCard: {
    backgroundColor: colors.bgCanvas,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    marginBottom: 10,
  },
  currentLoanCardOverdue: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  loanCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loanBookTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  loanMeta: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  loanCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  returnCounterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  returnCounterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand,
  },
  pendingCard: {
    backgroundColor: colors.warningBg,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    marginBottom: 10,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
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
  noLoanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.bgCanvas,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  noLoanIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noLoanTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  noLoanDesc: {
    fontSize: 11.5,
    color: colors.textTertiary,
    marginTop: 2,
  },
  findBookBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  findBookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Tabs
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    marginBottom: 12,
    gap: 6,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.brand,
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: colors.brand,
    fontWeight: '700',
  },
  horizontalBooksScroll: {
    paddingVertical: 4,
  },
  emptyTab: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTabText: {
    fontSize: 12.5,
    color: colors.textTertiary,
  },
  // Rules
  rulesCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  rulesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  rulesIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.brandSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rulesSub: {
    fontSize: 11.5,
    color: colors.textTertiary,
  },
  ruleItem: {
    marginBottom: 10,
  },
  ruleItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  ruleItemDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  rulesFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: 4,
  },
  rulesFooterText: {
    fontSize: 11.5,
    color: colors.textTertiary,
  },
})
