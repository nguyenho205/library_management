import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../constants/colors'

export function Badge({ children, variant = 'neutral', hasDot = true, style }) {
  let bg = colors.bgSubtle
  let text = colors.textSecondary
  let border = colors.borderDefault
  let dotColor = colors.textTertiary

  if (variant === 'ok' || variant === 'success') {
    bg = colors.successBg
    text = colors.successText
    border = colors.successBorder
    dotColor = colors.success
  } else if (variant === 'warn' || variant === 'warning') {
    bg = colors.warningBg
    text = colors.warningText
    border = colors.warningBorder
    dotColor = colors.warning
  } else if (variant === 'danger' || variant === 'error') {
    bg = colors.dangerBg
    text = colors.dangerText
    border = colors.dangerBorder
    dotColor = colors.danger
  } else if (variant === 'brand') {
    bg = colors.brandSurface
    text = colors.brand
    border = colors.brandBorder
    dotColor = colors.brand
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }, style]}>
      {hasDot && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <Text style={[styles.badgeText, { color: text }]}>{children}</Text>
    </View>
  )
}

export function StatusBadge({ status, overdue, overdueDays, style }) {
  if (overdue || overdueDays > 0) {
    return (
      <Badge variant="danger" hasDot={true} style={style}>
        Quá hạn {overdueDays ? `${overdueDays} ngày` : ''}
      </Badge>
    )
  }

  if (status === 'BORROWED') {
    return (
      <Badge variant="warn" hasDot={true} style={style}>
        Đang mượn
      </Badge>
    )
  }

  if (status === 'PENDING') {
    return (
      <Badge variant="warn" hasDot={true} style={style}>
        Chờ duyệt (1 – 3 ngày)
      </Badge>
    )
  }

  if (status === 'RETURNED') {
    return (
      <Badge variant="ok" hasDot={true} style={style}>
        Đã hoàn trả
      </Badge>
    )
  }

  if (status === 'REJECTED') {
    return (
      <Badge variant="danger" hasDot={true} style={style}>
        Bị từ chối
      </Badge>
    )
  }

  return (
    <Badge variant="neutral" hasDot={false} style={style}>
      {status || 'Chưa cập nhật'}
    </Badge>
  )
}

export function ConditionBadge({ condition, style }) {
  if (!condition) return null

  if (condition === 'INTACT') {
    return (
      <Badge variant="ok" hasDot={true} style={style}>
        Nguyên vẹn
      </Badge>
    )
  }

  if (condition === 'LIGHT_DAMAGE') {
    return (
      <Badge variant="warn" hasDot={true} style={style}>
        Hư hỏng nhẹ
      </Badge>
    )
  }

  if (condition === 'HEAVY_DAMAGE') {
    return (
      <Badge variant="danger" hasDot={true} style={style}>
        Hư hỏng nặng
      </Badge>
    )
  }

  if (condition === 'LOST') {
    return (
      <Badge variant="danger" hasDot={true} style={style}>
        Mất tài liệu
      </Badge>
    )
  }

  return (
    <Badge variant="neutral" hasDot={false} style={style}>
      {condition}
    </Badge>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
})

export default Badge
