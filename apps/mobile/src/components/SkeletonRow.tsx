import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

export function SkeletonRow({ height = 64 }: { height?: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { height, opacity }]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    marginHorizontal: 12,
    marginTop: 10,
  },
});
