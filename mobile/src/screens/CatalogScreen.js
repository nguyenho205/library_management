import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { Ionicons } from '../components/AppIcon'
import { colors } from '../constants/colors'
import { booksApi } from '../api/books'
import BookCard from '../components/BookCard'
import LibraryLogo from '../components/LibraryLogo'

export default function CatalogScreen({ navigation }) {
  const [keyword, setKeyword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState([])
  const [selectedCatId, setSelectedCatId] = useState(null)

  const [books, setBooks] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load categories
  useEffect(() => {
    booksApi
      .getCategories()
      .then((data) => setCategories(data || []))
      .catch(() => {})
  }, [])

  // Fetch books matching BooksPage.jsx
  const fetchBooks = useCallback(
    async (pageNum = 0, isRefresh = false) => {
      if (loading) return
      setLoading(true)
      try {
        const params = {
          page: pageNum,
          size: 10,
          status: 'IN_CIRCULATION',
          title: searchQuery.trim() || undefined,
          categoryId: selectedCatId || undefined,
        }
        const data = await booksApi.search(params)
        const list = data?.content || []

        if (isRefresh || pageNum === 0) {
          setBooks(list)
        } else {
          setBooks((prev) => [...prev, ...list])
        }
        setPage(pageNum)
        setTotalPages(data?.totalPages || 1)
        if (data?.totalElements != null) setTotalElements(data.totalElements)
      } catch {
        // Ignore
      } finally {
        setLoading(false)
      }
    },
    [searchQuery, selectedCatId]
  )

  useEffect(() => {
    fetchBooks(0, true)
  }, [fetchBooks])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchBooks(0, true)
    setRefreshing(false)
  }

  const handleEndReached = () => {
    if (!loading && page + 1 < totalPages) {
      fetchBooks(page + 1, false)
    }
  }

  const handleSearchSubmit = () => {
    setSearchQuery(keyword)
  }

  const handleClearSearch = () => {
    setKeyword('')
    setSearchQuery('')
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <LibraryLogo compact={false} size={0.88} />
        </View>

        <Text style={styles.pageTitle}>Tra cứu danh mục sách</Text>
        <Text style={styles.pageSubtitle}>
          Khám phá {totalElements > 0 ? `${totalElements} đầu sách` : 'kho tài liệu'} đang lưu hành tại thư viện
        </Text>

        {/* Search Bar matching BooksPage.jsx */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            placeholder="Tìm theo tên tác phẩm, tác giả, ISBN..."
            placeholderTextColor={colors.textTertiary}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          {keyword ? (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearchSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.searchBtnText}>Tìm</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCatId === null && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCatId(null)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCatId === null && styles.categoryChipTextActive,
              ]}
            >
              Tất cả thể loại
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isSelected = selectedCatId === cat.id
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isSelected && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCatId(isSelected ? null : cat.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Book List matching BooksPage customer-catalog-list */}
      <FlatList
        data={books}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <BookCard
            book={item}
            variant="horizontal"
            onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator color={colors.brand} style={{ padding: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Không tìm thấy sách phù hợp</Text>
              <Text style={styles.emptyDesc}>
                Vui lòng thử tìm kiếm bằng từ khoá khác hoặc xoá bộ lọc thể loại.
              </Text>
              {(searchQuery || selectedCatId) && (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => {
                    handleClearSearch()
                    setSelectedCatId(null)
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetFilterBtnText}>Đặt lại bộ lọc</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
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
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCanvas,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: colors.textTertiary,
    fontSize: 13,
    paddingHorizontal: 4,
  },
  searchBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  searchBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.bgCanvas,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  categoryChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFilterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.brandSurface,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },
  resetFilterBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.brand,
  },
})
