import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Mac dinh: 10.0.2.2 cho Android Emulator, localhost cho iOS/Web
export const DEFAULT_API_HOST =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080/api'
    : 'http://localhost:8080/api'

export const STORAGE_KEYS = {
  TOKEN: '@library_token',
  REFRESH_TOKEN: '@library_refresh_token',
  USER: '@library_user',
  CUSTOM_API_URL: '@library_api_url',
}

export async function getApiBaseUrl() {
  try {
    const custom = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_API_URL)
    if (custom && custom.trim()) {
      return custom.trim()
    }
  } catch {
    // fallback
  }
  return DEFAULT_API_HOST
}

export async function setCustomApiBaseUrl(url) {
  if (!url || !url.trim()) {
    await AsyncStorage.removeItem(STORAGE_KEYS.CUSTOM_API_URL)
  } else {
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_API_URL, url.trim())
  }
}

