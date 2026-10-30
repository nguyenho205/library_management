import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native'
import { colors } from '../constants/colors'
import { BookIcon } from './WebIcon'
import { Badge } from './Badge'
import { DEFAULT_API_HOST } from '../constants/config'

export const CURATED_COVERS = {
  'tắt đèn': '/anhbia/tatden.jpg',
  'số đỏ': '/anhbia/sodo.webp',
  'truyện kiều': '/anhbia/truyenkieu.webp',
  'nhà giả kim': '/anhbia/nhagiakim.jpg',
  'đắc nhân tâm': '/anhbia/dacnhantam.jpg',
  'dế mèn': '/anhbia/demenphieuluuky.jpg',
  'giải tích': '/anhbia/giaitich1.jpg',
  'toán': '/anhbia/giaitich1.jpg',
  'lược sử thời gian': '/anhbia/luocsuthoigian.webp',
  'lược sử loài người': '/anhbia/luocsuloainguoi.jpg',
  'sapiens': '/anhbia/luocsuloainguoi.jpg',
  'vật lý': '/anhbia/vatlydaicuong.png',
  'clean architecture': '/anhbia/CleanArchitecture.jpg',
  'clean code': '/anhbia/CleanArchitecture.jpg',
  'spring boot in action': '/anhbia/springbootinaction.webp',
  'spring in action': '/anhbia/springbootinaction.webp',
  'spring': '/anhbia/springboot.jpg',
  'cấu trúc dữ liệu': '/anhbia/cautrucdulieuvagiaithuat.jpg',
  'giải thuật': '/anhbia/cautrucdulieuvagiaithuat.jpg',
  'cơ sở dữ liệu': '/anhbia/cosodulieuquanhe.jpg',
  'mạng máy tính': '/anhbia/mangmaytinh.jpg',
  'java': '/anhbia/javacore.jpg',
}

export function toFullImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const cleanPath = url.startsWith('/') ? url : `/${url}`
  const origin = DEFAULT_API_HOST.replace(/\/api\/?$/, '')
  return `${origin}${cleanPath}`
}

export function resolveBookCover(book) {
  let url = null
  if (book?.imgUrl) {
    url = book.imgUrl
  } else {
    const title = (book?.title || '').toLowerCase()
    for (const [key, cover] of Object.entries(CURATED_COVERS)) {
      if (title.includes(key)) {
        url = cover
        break
      }
    }
    if (!url) {
      const cat = (book?.categoryName || '').toLowerCase()
      if (cat.includes('văn học') || cat.includes('tiểu thuyết')) {
        url = '/anhbia/truyenkieu.webp'
      } else if (cat.includes('lập trình') || cat.includes('công nghệ') || cat.includes('tin học')) {
        url = '/anhbia/javacore.jpg'
      } else if (cat.includes('khoa học') || cat.includes('toán') || cat.includes('vật lý')) {
        url = '/anhbia/luocsuthoigian.webp'
      }
    }
  }
  return toFullImageUrl(url)
}

export default function BookCard({
  book,
  onPress,
  variant = 'horizontal', // 'horizontal' | 'grid'
  onBorrowPress,
  isHolding = false,
  limitReached = false,
}) {
  const [imageError, setImageError] = useState(false)
  const coverUrl = resolveBookCover(book)
  const isAvailable = book?.quantityAvailable > 0
  const authorsText = (book?.authorNames || []).join(', ') || 'Chưa cập nhật tác giả'

  if (variant === 'grid') {
    // E-commerce card style (CustomerDashboardPage.jsx)
    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => onPress && onPress(book)}
        activeOpacity={0.88}
      >
        <View style={styles.gridCoverFrame}>
          {coverUrl && !imageError ? (
            <Image
              source={{ uri: coverUrl }}
              style={styles.gridCoverImg}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.coverFallback}>
              <BookIcon size={24} color={colors.brand} />
              <Text style={styles.fallbackCategory} numberOfLines={1}>
                {book?.categoryName || 'THƯ VIỆN'}
              </Text>
            </View>
          )}
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText} numberOfLines={1}>
              {book?.categoryName || 'Chưa phân loại'}
            </Text>
          </View>
        </View>

        <View style={styles.gridContent}>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {book?.title}
          </Text>
          <Text style={styles.gridAuthor} numberOfLines={1}>
            {authorsText}
          </Text>

          <View style={styles.gridBottom}>
            <View style={styles.stockRow}>
              <View
                style={[
                  styles.stockDot,
                  { backgroundColor: isAvailable ? colors.success : colors.danger },
                ]}
              />
              <Text
                style={[
                  styles.stockText,
                  { color: isAvailable ? colors.successText : colors.dangerText },
                ]}
              >
                {isAvailable ? `Còn ${book.quantityAvailable} cuốn` : 'Hết sách'}
              </Text>
            </View>

            {isHolding ? (
              <View style={styles.disabledBtn}>
                <Text style={styles.disabledBtnText}>Đang giữ sách</Text>
              </View>
            ) : limitReached ? (
              <View style={styles.disabledBtn}>
                <Text style={styles.disabledBtnText}>Đạt tối đa (2/2)</Text>
              </View>
            ) : isAvailable && onBorrowPress ? (
              <TouchableOpacity
                style={styles.quickBorrowBtn}
                onPress={() => onBorrowPress(book)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickBorrowBtnText}>Mượn sách</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Horizontal Card (BooksPage.jsx Catalog)
  return (
    <TouchableOpacity
      style={styles.horizontalCard}
      onPress={() => onPress && onPress(book)}
      activeOpacity={0.88}
    >
      <View style={styles.horizontalCoverWrap}>
        {coverUrl && !imageError ? (
          <Image
            source={{ uri: coverUrl }}
            style={styles.horizontalCoverImg}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.horizontalCoverFallback}>
            <BookIcon size={22} color={colors.brand} />
            <Text style={styles.fallbackCategory} numberOfLines={1}>
              {book?.categoryName || 'THƯ VIỆN'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.horizontalContent}>
        <View style={styles.tagRow}>
          <Badge variant="neutral" hasDot={false}>
            {book?.categoryName || 'Chưa phân loại'}
          </Badge>
          {book?.isbn ? (
            <Text style={styles.isbnText}>ISBN: {book.isbn}</Text>
          ) : null}
        </View>

        <Text style={styles.horizontalTitle} numberOfLines={2}>
          {book?.title}
        </Text>

        <Text style={styles.horizontalAuthor} numberOfLines={1}>
          Tác giả: <Text style={styles.authorBold}>{authorsText}</Text>
        </Text>

        {book?.description ? (
          <Text style={styles.horizontalDesc} numberOfLines={2}>
            {book.description}
          </Text>
        ) : null}

        <View style={styles.horizontalFooter}>
          <Badge variant={isAvailable ? 'ok' : 'danger'} hasDot={true}>
            {isAvailable ? `Còn ${book.quantityAvailable} cuốn` : 'Tạm hết sách'}
          </Badge>

          <View style={styles.actionLink}>
            <Text style={styles.actionLinkText}>
              {isAvailable ? 'Chi tiết & Mượn ›' : 'Xem chi tiết ›'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  // Grid Card (Customer Dashboard)
  gridCard: {
    width: 170,
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    overflow: 'hidden',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 12,
  },
  gridCoverFrame: {
    width: '100%',
    height: 140,
    backgroundColor: colors.brandSurface,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCoverImg: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  fallbackCategory: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.brand,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  categoryPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: '85%',
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  gridContent: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  gridTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 3,
  },
  gridAuthor: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  gridBottom: {
    gap: 6,
    marginTop: 'auto',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickBorrowBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBorrowBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabledBtn: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtnText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Horizontal Card (Catalog)
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  horizontalCoverWrap: {
    width: 84,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.brandSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  horizontalCoverImg: {
    width: '100%',
    height: '100%',
  },
  horizontalCoverFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  horizontalContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  isbnText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: 'monospace',
  },
  horizontalTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 19,
    marginBottom: 2,
  },
  horizontalAuthor: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  authorBold: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  horizontalDesc: {
    fontSize: 11.5,
    color: colors.textTertiary,
    lineHeight: 16,
    marginBottom: 8,
  },
  horizontalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand,
  },
})
