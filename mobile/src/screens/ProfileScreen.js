import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '../components/AppIcon'
import { colors } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth'
import { readError } from '../api/client'
import ServerConfigModal from '../components/ServerConfigModal'
import LibraryLogo from '../components/LibraryLogo'
import { Badge } from '../components/Badge'

export default function ProfileScreen() {
  const { user, isAdmin, logout } = useAuth()
  const [serverModalVisible, setServerModalVisible] = useState(false)

  // Change password form
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPwd, setChangingPwd] = useState(false)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdNotice, setPwdNotice] = useState('')

  const handleLogout = () => {
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => logout(),
      },
    ])
  }

  const handleChangePassword = async () => {
    setPwdError('')
    setPwdNotice('')

    if (!oldPassword || !newPassword) {
      setPwdError('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.')
      return
    }
    if (newPassword.length < 6) {
      setPwdError('Mật khẩu mới phải có tối thiểu 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Mật khẩu xác nhận không trùng khớp.')
      return
    }

    setChangingPwd(true)
    try {
      await authApi.changePassword(oldPassword, newPassword)
      setPwdNotice('Đổi mật khẩu thành công!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwdError(readError(err) || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.')
    } finally {
      setChangingPwd(false)
    }
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U'
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Bạn đọc'

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <LibraryLogo compact={false} size={0.88} />
        </View>
        <Text style={styles.headerTitle}>Tài khoản của tôi</Text>
        <Text style={styles.headerSubtitle}>
          Quản lý thông tin bạn đọc và thiết lập bảo mật
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Member Profile Card */}
        <View style={styles.memberCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>

          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{displayName}</Text>
            <Text style={styles.memberEmail}>{user?.email}</Text>
            <View style={styles.badgeRow}>
              <Badge variant={isAdmin ? 'brand' : 'ok'} hasDot={true}>
                {isAdmin ? 'Quản trị viên / Thủ thư' : 'Bạn đọc chính thức'}
              </Badge>
            </View>
          </View>
        </View>

        {/* Change Password Card matching SettingsPage.jsx PasswordSection */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Đổi mật khẩu</Text>
              <Text style={styles.sectionDesc}>Cập nhật mật khẩu định kỳ để bảo vệ tài khoản</Text>
            </View>
          </View>

          {pwdNotice ? (
            <View style={styles.alertNotice}>
              <Text style={styles.alertNoticeText}>{pwdNotice}</Text>
            </View>
          ) : null}

          {pwdError ? (
            <View style={styles.alertError}>
              <Text style={styles.alertErrorText}>{pwdError}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Mật khẩu hiện tại</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showOld}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowOld(!showOld)} style={styles.eyeBtn}>
                <Text style={styles.eyeBtnText}>{showOld ? 'Ẩn' : 'Hiện'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mật khẩu mới</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showNew}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeBtn}>
                <Text style={styles.eyeBtnText}>{showNew ? 'Ẩn' : 'Hiện'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showNew}
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, changingPwd && styles.saveBtnDisabled]}
            onPress={handleChangePassword}
            disabled={changingPwd}
            activeOpacity={0.85}
          >
            {changingPwd ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Lưu thay đổi mật khẩu</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Server Config & Utilities Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Kết nối máy chủ Backend</Text>
              <Text style={styles.sectionDesc}>Cấu hình địa chỉ IP máy chủ Spring Boot API</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setServerModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.settingRowTitle}>Địa chỉ máy chủ API</Text>
              <Text style={styles.settingRowDesc}>
                Nhấp để đổi giữa 10.0.2.2 (máy ảo) hoặc IP Wi-Fi
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: colors.textTertiary }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>Đăng xuất khỏi tài khoản</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Server Config Modal */}
      <ServerConfigModal
        visible={serverModalVisible}
        onClose={() => setServerModalVisible(false)}
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
  memberCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  sectionCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.brandSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionDesc: {
    fontSize: 11.5,
    color: colors.textTertiary,
  },
  alertNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 6,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    marginBottom: 12,
  },
  alertNoticeText: {
    fontSize: 12,
    color: colors.successText,
    fontWeight: '500',
  },
  alertError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 6,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    marginBottom: 12,
  },
  alertErrorText: {
    fontSize: 12,
    color: colors.dangerText,
    fontWeight: '500',
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCanvas,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.brand,
  },
  saveBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  settingRowTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  settingRowDesc: {
    fontSize: 11.5,
    color: colors.textTertiary,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingVertical: 12,
    borderRadius: 10,
  },
  logoutBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.dangerText,
  },
})
