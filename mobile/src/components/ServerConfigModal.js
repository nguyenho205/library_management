import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { colors } from '../constants/colors'
import { Ionicons } from './AppIcon'
import {
  DEFAULT_API_HOST,
  getApiBaseUrl,
  setCustomApiBaseUrl,
} from '../constants/config'
import client from '../api/client'

export default function ServerConfigModal({ visible, onClose }) {
  const [url, setUrl] = useState('')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (visible) {
      getApiBaseUrl().then((val) => setUrl(val || DEFAULT_API_HOST))
    }
  }, [visible])

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert('Lỗi', 'Địa chỉ máy chủ không được để trống.')
      return
    }
    await setCustomApiBaseUrl(url.trim())
    Alert.alert('Thành công', 'Đã lưu cấu hình địa chỉ máy chủ API!')
    onClose()
  }

  const handleReset = async () => {
    await setCustomApiBaseUrl(null)
    setUrl(DEFAULT_API_HOST)
    Alert.alert('Đã đặt lại', `Địa chỉ mặc định: ${DEFAULT_API_HOST}`)
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const testUrl = url.trim()
      const res = await client.get('/categories', { baseURL: testUrl, timeout: 4000 })
      if (res.status === 200) {
        Alert.alert('Thành công', '✅ Kết nối máy chủ backend Spring Boot thành công!')
      } else {
        Alert.alert('Thông báo', `Máy chủ phản hồi với mã HTTP: ${res.status}`)
      }
    } catch (err) {
      Alert.alert(
        'Không thể kết nối',
        `❌ Lỗi: ${err.message || 'Không kết nối được'}\n\nLưu ý: Hãy chắc chắn Backend Spring Boot đang chạy ở cổng 8080 và điện thoại cùng mạng Wi-Fi với máy tính.`
      )
    } finally {
      setTesting(false)
    }
  }

  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <Text style={styles.title}>Cấu hình máy chủ Backend</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 18, color: colors.textSecondary, padding: 4 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>Địa chỉ API Backend (Spring Boot):</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="http://192.168.1.X:8080/api"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.hint}>
              • Máy ảo Android Emulator: dùng http://10.0.2.2:8080/api{'\n'}
              • Điện thoại thật (Expo Go): dùng địa chỉ IPv4 máy tính của bạn (VD: http://192.168.1.25:8080/api){'\n'}
              • Web / iOS Simulator: dùng http://localhost:8080/api
            </Text>

            <View style={styles.presets}>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setUrl('http://10.0.2.2:8080/api')}
              >
                <Text style={styles.presetBtnText}>10.0.2.2 (Emulator)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => setUrl('http://localhost:8080/api')}
              >
                <Text style={styles.presetBtnText}>localhost (Web/iOS)</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={testing}
            >
              <Ionicons name="flash-outline" size={16} color={colors.primary} />
              <Text style={styles.testBtnText}>
                {testing ? 'Đang kiểm tra kết nối...' : 'Kiểm tra kết nối tới Server'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Mặc định</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Lưu cấu hình</Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    padding: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 10,
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  presetBtnText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primarySurface,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  testBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  resetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  resetBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
})

