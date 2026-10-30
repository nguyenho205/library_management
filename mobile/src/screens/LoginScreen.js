import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { colors } from '../constants/colors'
import { useAuth } from '../context/AuthContext'
import { readError } from '../api/client'
import LibraryLogo from '../components/LibraryLogo'
import ServerConfigModal from '../components/ServerConfigModal'

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('admin@library.local')
  const [password, setPassword] = useState('Admin@123')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [configVisible, setConfigVisible] = useState(false)

  const handleLogin = async () => {
    setErrorMessage('')
    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ địa chỉ email và mật khẩu.')
      return
    }

    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setErrorMessage(readError(err) || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar with clean server link */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.serverBtn}
            onPress={() => setConfigVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.serverBtnText}>Cấu hình máy chủ API</Text>
          </TouchableOpacity>
        </View>

        {/* Auth Card matching .auth-card in index.css */}
        <View style={styles.authCard}>
          <View style={styles.authHeader}>
            <View style={styles.logoWrap}>
              <LibraryLogo size={1.05} />
            </View>
            <Text style={styles.title}>Đăng nhập</Text>
            <Text style={styles.subtitle}>
              Hệ thống quản lý tài liệu và mượn trả sách
            </Text>
          </View>

          {/* Clean error box matching web Alert.jsx */}
          {errorMessage ? (
            <View style={styles.alertError}>
              <Text style={styles.alertErrorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email Field - Clean input matching web, NO ICON */}
          <View style={styles.field}>
            <Text style={styles.label}>Địa chỉ Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@library.com"
              placeholderTextColor={colors.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Field - Clean input matching web with simple toggle text */}
          <View style={styles.field}>
            <View style={styles.passwordHeader}>
              <Text style={styles.label}>Mật khẩu</Text>
            </View>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.visibilityToggleBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Text style={styles.visibilityToggleText}>
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Đăng nhập vào hệ thống</Text>
            )}
          </TouchableOpacity>

          {/* Auth Switch */}
          <View style={styles.authSwitch}>
            <Text style={styles.authSwitchText}>Chưa có thẻ thành viên? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.authSwitchLink}>Đăng ký tài khoản</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Box - Clean typography */}
        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Tài khoản mẫu thư viện:</Text>
          <Text style={styles.demoItem}>• Độc giả: <Text style={styles.demoCode}>reader@library.local</Text> / Reader@123</Text>
          <Text style={styles.demoItem}>• Quản trị: <Text style={styles.demoCode}>admin@library.local</Text> / Admin@123</Text>
        </View>
      </ScrollView>

      <ServerConfigModal visible={configVisible} onClose={() => setConfigVisible(false)} />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgCanvas,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  serverBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  serverBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  authCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrap: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  alertError: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    marginBottom: 16,
  },
  alertErrorText: {
    fontSize: 12.5,
    color: colors.dangerText,
    fontWeight: '500',
    lineHeight: 17,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    backgroundColor: colors.bgCanvas,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCanvas,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  visibilityToggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  visibilityToggleText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.brand,
  },
  submitBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  authSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  authSwitchText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  authSwitchLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand,
  },
  demoBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    backgroundColor: colors.brandSurface,
    borderWidth: 1,
    borderColor: colors.brandBorder,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brand,
    marginBottom: 4,
  },
  demoItem: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  demoCode: {
    fontFamily: 'monospace',
    fontWeight: '600',
    color: colors.brandHover,
  },
})
