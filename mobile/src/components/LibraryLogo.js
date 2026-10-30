import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../constants/colors'

export default function LibraryLogo({ compact = false, size = 1 }) {
  const scale = size

  return (
    <View style={[styles.container, { transform: [{ scale }] }]}>
      {/* Visual Book Spines (replicating logo-full.svg) */}
      <View style={styles.spinesWrap}>
        {/* Book 1 - Orange/Red */}
        <View style={styles.book1}>
          <View style={styles.stripeWhite} />
          <View style={styles.stripeWhite} />
        </View>

        {/* Book 2 - Yellow with round top & dot */}
        <View style={styles.book2}>
          <View style={styles.yellowDot} />
          <View style={styles.stripeDark} />
        </View>

        {/* Book 3 - Teal */}
        <View style={styles.book3}>
          <View style={styles.stripeWhite} />
          <View style={[styles.stripeWhite, { height: 1.5 }]} />
        </View>

        {/* Book 4 - Leaning Navy Book */}
        <View style={styles.book4Wrap}>
          <View style={styles.book4}>
            <View style={styles.stripeOrange} />
            <View style={[styles.stripeOrange, { height: 1.5 }]} />
          </View>
        </View>

        {/* Shelf Base Line */}
        <View style={styles.shelfLine} />
      </View>

      {/* Typography unless in compact mode */}
      {!compact && (
        <View style={styles.textWrap}>
          <Text style={styles.brandTitle}>Thư Viện</Text>
          <Text style={styles.brandSub}>LIBRARY MANAGEMENT</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spinesWrap: {
    width: 62,
    height: 44,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  shelfLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 4,
    height: 3,
    backgroundColor: '#1B1B2F',
    borderRadius: 2,
  },
  book1: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    width: 9,
    height: 34,
    backgroundColor: '#F2542D',
    borderTopLeftRadius: 2.5,
    borderTopRightRadius: 2.5,
    justifyContent: 'space-around',
    paddingVertical: 6,
    alignItems: 'center',
  },
  stripeWhite: {
    width: 7,
    height: 2.2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 0.5,
  },
  book2: {
    position: 'absolute',
    bottom: 3,
    left: 14,
    width: 10,
    height: 22,
    backgroundColor: '#FFC531',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    alignItems: 'center',
    paddingTop: 3,
    gap: 5,
  },
  yellowDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#1B1B2F',
    opacity: 0.85,
  },
  stripeDark: {
    width: 8,
    height: 2,
    backgroundColor: '#1B1B2F',
    opacity: 0.85,
  },
  book3: {
    position: 'absolute',
    bottom: 3,
    left: 26,
    width: 9,
    height: 40,
    backgroundColor: '#0FA3A3',
    borderTopLeftRadius: 2.5,
    borderTopRightRadius: 2.5,
    paddingTop: 8,
    alignItems: 'center',
    gap: 4,
  },
  book4Wrap: {
    position: 'absolute',
    bottom: 3,
    left: 38,
    transform: [{ rotate: '18deg' }],
  },
  book4: {
    width: 9,
    height: 34,
    backgroundColor: '#1B1B2F',
    borderTopLeftRadius: 2.5,
    borderTopRightRadius: 2.5,
    paddingTop: 6,
    alignItems: 'center',
    gap: 3,
  },
  stripeOrange: {
    width: 7,
    height: 2,
    backgroundColor: '#F2542D',
  },
  textWrap: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1B1B2F',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#F2542D',
    letterSpacing: 1.5,
    marginTop: -1,
  },
})

