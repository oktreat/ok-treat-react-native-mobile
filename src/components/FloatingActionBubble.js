import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/** A gently floating home shortcut that pauses when the screen is hidden or
 * the user has enabled Reduce Motion. Only its visual wrapper moves; the
 * touch target stays the same size and position. */
export default function FloatingActionBubble({
  children,
  onPress,
  accessibilityLabel,
  style,
  delay = 0,
  disabled = false,
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const focused = useIsFocused();
  const [reduceMotion, setReduceMotion] = useState(true);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => { if (mounted) setReduceMotion(value); })
      .catch(() => {});
    const motionListener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const appListener = AppState.addEventListener('change', state => setAppActive(state === 'active'));
    return () => {
      mounted = false;
      motionListener.remove();
      appListener.remove();
    };
  }, []);

  useEffect(() => {
    if (disabled || reduceMotion || !focused || !appActive) {
      translateY.stopAnimation();
      translateY.setValue(0);
      return undefined;
    }
    const floating = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(translateY, {
        toValue: -4,
        duration: 1500,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1500,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]));
    floating.start();
    return () => floating.stop();
  }, [appActive, delay, disabled, focused, reduceMotion, translateY]);

  return (
    <Animated.View style={[style, { transform: [{ translateY }] }]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.82}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
