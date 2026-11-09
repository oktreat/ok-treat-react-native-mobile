import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import TreatCoinMark from './TreatCoinMark';

// One short motion only. Text and balances are never animated.
export default function TreatCoinMotion({ celebration = false }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [still, setStill] = useState(true);
  useEffect(() => {
    let live = true;
    let animation;
    const apply = reduced => {
      animation?.stop(); progress.setValue(0);
      if (!live || reduced) { if (live) setStill(true); return; }
      setStill(false);
      animation = Animated.timing(progress, { toValue: 1, duration: celebration ? 800 : 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
      animation.start(({ finished }) => { if (live && finished) setStill(true); });
    };
    AccessibilityInfo.isReduceMotionEnabled().then(apply).catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', apply);
    return () => { live = false; animation?.stop(); listener.remove(); };
  }, [celebration, progress]);
  const rise = progress.interpolate({ inputRange: [0, .5, 1], outputRange: [0, -22, 0] });
  return <View accessible={false} style={{ height: 112, alignItems: 'center', justifyContent: 'center' }}>
    <Animated.View style={{ transform: [{ translateY: celebration && !still ? rise : 0 }] }}><TreatCoinMark size={64} /></Animated.View>
    {[0, 1].map(i => <Animated.View key={i} style={{ position: 'absolute', transform: [{ translateX: celebration ? (i ? 62 : -62) : progress.interpolate({ inputRange: [0, .25, .5, .75, 1], outputRange: i ? [62, 0, -62, 0, 62] : [-62, 0, 62, 0, -62] }) }, { translateY: celebration ? (still ? 0 : rise) : progress.interpolate({ inputRange: [0, .25, .5, .75, 1], outputRange: i ? [0, -25, 0, 25, 0] : [0, 25, 0, -25, 0] }) }], opacity: celebration || !still ? 1 : 0 }}><TreatCoinMark size={28} /></Animated.View>)}
  </View>;
}
