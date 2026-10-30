import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export function DashboardIcon({ size = 18, color = '#1e3a5f' }) {
  const w = size * 0.4
  return (
    <View style={[styles.dashboardWrap, { width: size, height: size }]}>
      <View style={[styles.dashRect, { width: w, height: w * 1.25, borderColor: color }]} />
      <View style={[styles.dashRect, { width: w, height: w * 0.75, borderColor: color }]} />
      <View style={[styles.dashRect, { width: w, height: w * 0.75, borderColor: color }]} />
      <View style={[styles.dashRect, { width: w, height: w * 1.25, borderColor: color }]} />
    </View>
  )
}

export function BookIcon({ size = 18, color = '#1e3a5f' }) {
  const w = size * 0.8
  const h = size
  return (
    <View style={[styles.bookOutline, { width: w, height: h, borderColor: color }]}>
      <View style={[styles.bookSpineLine, { backgroundColor: color }]} />
      <View style={[styles.bookSpineLine, { backgroundColor: color, width: '60%' }]} />
    </View>
  )
}

export function CirculationIcon({ size = 18, color = '#1e3a5f' }) {
  return (
    <Text style={{ fontSize: size, color, fontWeight: '700', lineHeight: size + 2, textAlign: 'center' }}>
      ⇄
    </Text>
  )
}

export function UserIcon({ size = 18, color = '#1e3a5f' }) {
  const head = size * 0.42
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: head, height: head, borderRadius: head / 2, borderWidth: 1.5, borderColor: color, marginBottom: 1.5 }} />
      <View style={{ width: size * 0.82, height: size * 0.4, borderTopLeftRadius: size * 0.4, borderTopRightRadius: size * 0.4, borderWidth: 1.5, borderColor: color, borderBottomWidth: 0 }} />
    </View>
  )
}

export function SearchIcon({ size = 16, color = '#64748b' }) {
  const r = size * 0.65
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View style={{ width: r, height: r, borderRadius: r / 2, borderWidth: 1.5, borderColor: color }} />
      <View style={{ position: 'absolute', right: 1, bottom: 2, width: size * 0.38, height: 1.5, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
    </View>
  )
}

export function ChevronRight({ size = 14, color = '#1e3a5f' }) {
  return (
    <Text style={{ fontSize: size + 2, color, fontWeight: '600', lineHeight: size + 2 }}>
      ›
    </Text>
  )
}

export function ChevronLeft({ size = 14, color = '#1e3a5f' }) {
  return (
    <Text style={{ fontSize: size + 2, color, fontWeight: '600', lineHeight: size + 2 }}>
      ‹
    </Text>
  )
}

export function CloseIcon({ size = 16, color = '#64748b' }) {
  return (
    <Text style={{ fontSize: size, color, fontWeight: '400', lineHeight: size + 2 }}>
      ✕
    </Text>
  )
}

export function CheckIcon({ size = 14, color = '#0f766e' }) {
  return (
    <Text style={{ fontSize: size, color, fontWeight: '700', lineHeight: size + 2 }}>
      ✓
    </Text>
  )
}

// Fallback compatibility wrapper
export function Ionicons({ name, size = 18, color = '#1e3a5f', style }) {
  if (name.includes('home') || name.includes('dashboard')) {
    return <DashboardIcon size={size} color={color} />
  }
  if (name.includes('library') || name.includes('catalog') || name.includes('book')) {
    return <BookIcon size={size} color={color} />
  }
  if (name.includes('repeat') || name.includes('circulation')) {
    return <CirculationIcon size={size} color={color} />
  }
  if (name.includes('person') || name.includes('user')) {
    return <UserIcon size={size} color={color} />
  }
  if (name.includes('search')) {
    return <SearchIcon size={size} color={color} />
  }
  if (name.includes('chevron-forward') || name.includes('chevron-right')) {
    return <ChevronRight size={size} color={color} />
  }
  if (name.includes('close')) {
    return <CloseIcon size={size} color={color} />
  }
  if (name.includes('check')) {
    return <CheckIcon size={size} color={color} />
  }
  if (name.includes('arrow-back')) {
    return <Text style={[{ fontSize: size, color, fontWeight: '700' }, style]}>←</Text>
  }

  // Return nothing for decorative icon clutter
  return null
}

const styles = StyleSheet.create({
  dashboardWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    padding: 1,
  },
  dashRect: {
    borderWidth: 1.5,
    borderRadius: 2,
  },
  bookOutline: {
    borderWidth: 1.5,
    borderRadius: 2.5,
    borderLeftWidth: 2.5,
    justifyContent: 'center',
    paddingHorizontal: 2,
    gap: 2.5,
  },
  bookSpineLine: {
    height: 1.2,
    width: '80%',
    borderRadius: 0.5,
  },
})

export default {
  DashboardIcon,
  BookIcon,
  CirculationIcon,
  UserIcon,
  SearchIcon,
  ChevronRight,
  ChevronLeft,
  CloseIcon,
  CheckIcon,
  Ionicons,
}

