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
import { authApi } from '../api/auth'
import { readError } from '../api/client'
import LibraryLogo from '../components/LibraryLogo'

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [stage, setStage] = useState('register') // 'register' | 'verify' | 'verified'
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = async () => {
    setError('')
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setError('Vui lòng điền đầy đủ họ tên, email và mật khẩu.')
      return
    }

    if (form.password.length < 6) {
      setError('Mật khẩu phải có độ dài tối thiểu 6 ký tự.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setBusy(true)
    try {
      await authApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      setStage('verify')
      setNotice(`Mã xác thực đã được gửi tới email ${form.email}. Vui lòng kiểm tra hòm thư của bạn.`)
    } catch (err) {
      setError(readError(err) || 'Đăng ký không thành công. Vui lòng thử lại.')
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async () => {
    setError('')
    if (!code.trim()) {
      setError('Vui lòng nhập mã xác thực gồm 6 chữ số.')
      return
    }

    setBusy(true)
    try {
      const res = await authApi.verifyEmail(form.email.trim(), code.trim())
      setNotice(res.message || 'Tài khoản của bạn đã được kích hoạt thành công!')
      setStage('verified')
    } catch (err) {
      setError(readError(err) || 'Mã xác thực không hợp lệ hoặc đã hết hạn.')
    } finally {
      setBusy(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const res = await authApi.resendVerification(form.email.trim())
      setNotice(res.message || 'Mã xác thực mới đã được gửi lại vào email.')
    } catch (err) {
      setError(readError(err) || 'Không thể gửi lại mã xác thực.')
    } finally {
      setBusy(false)
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
        {/* Back Link */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>← Quay lại Đăng nhập</Text>
        </TouchableOpacity>

        {/* Card */}
        <View style={styles.authCard}>
          <View style={styles.authHeader}>
            <View style={styles.logoWrap}>
              <LibraryLogo size={1.05} />
            </View>
            <Text style={styles.title}>
              {stage === 'register'
                ? 'Đăng ký tài khoản'
                : stage === 'verify'
                ? 'Xác thực tài khoản'
                : 'Kích hoạt thành công'}
            </Text>
            <Text style={styles.subtitle}>
              {stage === 'register'
                ? 'Tạo tài khoản bạn đọc để mượn sách trực tuyến'
                : stage === 'verify'
                ? `Nhập mã xác thực đã gửi tới ${form.email}`
                : 'Bạn có thể đăng nhập ngay vào hệ thống thư viện'}
            </Text>
          </View>

          {/* Notices and Errors */}
          {notice ? (
            <View style={styles.alertNotice}>
              <Text style={styles.alertNoticeText}>{notice}</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.alertError}>
              <Text style={styles.alertErrorText}>{error}</Text>
            </View>
          ) : null}

          {/* STAGE 1: Registration Form */}
          {stage === 'register' && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Họ và tên độc giả</Text>
                <TextInput
                  style={styles.input}
                  value={form.fullName}
                  onChangeText={(val) => setForm({ ...form, fullName: val })}
                  placeholder="Nguyễn Văn A"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Địa chỉ Email</Text>
                <TextInput
                  style={styles.input}
                  value={form.email}
                  onChangeText={(val) => setForm({ ...form, email: val })}
                  placeholder="reader@library.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={styles.passwordInput}
                    value={form.password}
                    onChangeText={(val) => setForm({ ...form, password: val })}
                    placeholder="Tối thiểu 6 ký tự"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.visibilityToggleBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.visibilityToggleText}>
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <TextInput
                  style={styles.input}
                  value={form.confirmPassword}
                  onChangeText={(val) => setForm({ ...form, confirmPassword: val })}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
                onPress={handleRegister}
                disabled={busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Đăng ký thành viên</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* STAGE 2: Verification */}
          {stage === 'verify' && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Mã xác thực (OTP)</Text>
                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  placeholder="Nhập mã xác thực"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, busy && styles.submitBtnDisabled]}
                onPress={handleVerify}
                disabled={busy}
                activeOpacity={0.85}
              >
                {busy ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Xác thực tài khoản</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={handleResend}
                disabled={busy}
                activeOpacity={0.7}
              >
                <Text style={styles.resendBtnText}>Gửi lại mã xác thực</Text>
              </TouchableOpacity>
            </>
          )}

          {/* STAGE 3: Verified */}
          {stage === 'verified' && (
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          )}

          {/* Auth Switch */}
          <View style={styles.authSwitch}>
            <Text style={styles.authSwitchText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.authSwitchLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  backBtn: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 13,
    color: colors.brand,
    fontWeight: '600',
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
  alertNotice: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successBorder,
    marginBottom: 16,
  },
  alertNoticeText: {
    fontSize: 12.5,
    color: colors.successText,
    fontWeight: '500',
    lineHeight: 17,
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
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
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
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resendBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  resendBtnText: {
    fontSize: 13,
    color: colors.brand,
    fontWeight: '600',
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
})
