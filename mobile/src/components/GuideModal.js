import React from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { colors } from '../constants/colors'
import { Ionicons } from './AppIcon'

export default function GuideModal({ visible, record, onClose }) {
  if (!visible || !record) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Quy trình trả sách tại quầy</Text>
              <Text style={styles.subtitle}>
                Thủ thư thẩm định tình trạng trước khi duyệt trả
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ fontSize: 18, color: colors.textSecondary, padding: 4 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Book Info Card */}
            <View style={styles.bookInfoCard}>
              <Text style={styles.bookTitle} numberOfLines={2}>
                {record.bookTitle}
              </Text>
              <Text style={styles.bookMeta}>
                Mã mượn: #{record.id} · Hạn trả: {record.dueDate}
              </Text>
            </View>

            {/* 4 Steps */}
            <View style={styles.stepsWrap}>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepHeading}>Mang sách đến quầy thủ thư:</Text>
                  <Text style={styles.stepDesc}>
                    Đem tài liệu cùng mã mượn (#{record.id}) tới quầy lưu thông thư viện trong giờ phục vụ.
                  </Text>
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepHeading}>Thẩm định tình trạng sách:</Text>
                  <Text style={styles.stepDesc}>
                    Thủ thư sẽ trực tiếp kiểm tra độ nguyên vẹn của bìa, gáy sách và nội dung trang sách.
                  </Text>
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepHeading}>Thanh toán chi phí phát sinh:</Text>
                  <Text style={styles.stepDesc}>
                    {record.overdue
                      ? `Sách quá hạn ${record.overdueDays} ngày: Phí trễ hạn 5.000 đ/ngày.`
                      : 'Nếu sách đúng hạn và nguyên vẹn, bạn đọc không mất thêm bất kỳ chi phí nào.'}
                  </Text>
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepHeading}>Xác nhận hoàn tất:</Text>
                  <Text style={styles.stepDesc}>
                    Thủ thư bấm duyệt trả trên hệ thống và số lượng sách được nhập lại kho lưu thông.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeBtnText}>Tôi đã hiểu quy trình</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.bgSurface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  body: {
    padding: 18,
  },
  bookInfoCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    marginBottom: 16,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bookMeta: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  stepsWrap: {
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepDesc: {
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  closeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
})

