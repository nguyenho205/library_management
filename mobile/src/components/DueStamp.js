import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../constants/colors'

export default function DueStamp({ dueDate, overdue = false }) {
  if (!dueDate) return null

  let dateText = dueDate
  try {
    const [year, month, day] = String(dueDate).split('-')
    if (day && month && year) {
      dateText = `${day}/${month}/${year}`
    }
  } catch (e) {
    dateText = String(dueDate)
  }

  return (
    <View style={[styles.badge, overdue && styles.badgeOverdue]}>
      <Text style={[styles.text, overdue && styles.textOverdue]}>
        Hạn trả: {dateText}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    backgroundColor: colors.bgSubtle,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    alignSelf: 'flex-start',
  },
  badgeOverdue: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  textOverdue: {
    color: colors.dangerText,
    fontWeight: '700',
  },
})
