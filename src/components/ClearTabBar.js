import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppearance } from '../context/AppearanceContext';

function TabButton({ label, selected, color, icon, onPress, onLongPress, accessibilityLabel, testID, onLayout }) {
  const labelProgress = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(labelProgress, {
      toValue: selected ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [labelProgress, selected]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel || label}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      onLayout={onLayout}
      style={styles.tab}
    >
      <View style={styles.iconSlot}>{icon?.({ focused: selected, color, size: 24 })}</View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.labelSlot,
          {
            opacity: labelProgress,
            transform: [{ translateY: labelProgress.interpolate({ inputRange: [0, 1], outputRange: [5, 0] }) }],
          },
        ]}
      >
        <Text numberOfLines={1} style={[styles.label, { color }]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function ClearTabBar({ state, descriptors, navigation }) {
  const { t } = useTranslation();
  const { dark } = useAppearance();
  const insets = useSafeAreaInsets();
  const [tabLayouts, setTabLayouts] = useState({});
  const highlightX = useRef(new Animated.Value(0)).current;
  const highlightWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const layout = tabLayouts[state.index];
    if (!layout) return;
    Animated.parallel([
      Animated.spring(highlightX, { toValue: layout.x, damping: 20, stiffness: 210, mass: 0.8, useNativeDriver: false }),
      Animated.spring(highlightWidth, { toValue: layout.width, damping: 20, stiffness: 210, mass: 0.8, useNativeDriver: false }),
    ]).start();
  }, [highlightWidth, highlightX, state.index, tabLayouts]);

  const sitterTabs = state.routes.some(route => route.name.startsWith('Sitter'));
  const accent = sitterTabs ? '#2AAE9B' : '#1689C3';
  const surface = dark ? '#111C2B' : '#FFFFFF';
  const muted = dark ? '#A9B7C7' : '#263744';
  const highlight = dark ? (sitterTabs ? '#153D3C' : '#173850') : (sitterTabs ? '#E3F5F1' : '#E2F3FB');

  return (
    <View style={[styles.base, { paddingBottom: insets.bottom + 8, backgroundColor: surface }]}>
      <View style={[styles.bar, { backgroundColor: surface, borderColor: dark ? '#304153' : '#E5ECF0' }]}>
        <Animated.View pointerEvents="none" style={[styles.selectedHighlight, { left: highlightX, width: highlightWidth, backgroundColor: highlight }]} />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const selected = state.index === index;
          const rawLabel = options.tabBarLabel || options.title || route.name;
          const label = t(`tabs.${route.name}`, { defaultValue: rawLabel });
          const color = selected ? accent : muted;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <TabButton
              key={route.key}
              label={label}
              selected={selected}
              color={color}
              icon={options.tabBarIcon}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              onLayout={event => {
                const { x, width } = event.nativeEvent.layout;
                setTabLayouts(current => current[index]?.x === x && current[index]?.width === width
                  ? current
                  : { ...current, [index]: { x, width } });
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingTop: 8, paddingHorizontal: 10, backgroundColor: '#FFFFFF' },
  bar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 34,
    padding: 5, borderWidth: 1, borderColor: '#E5ECF0',
    position: 'relative',
    shadowColor: '#173D4C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10, shadowRadius: 10, elevation: 4,
  },
  selectedHighlight: { position: 'absolute', top: 5, bottom: 5, backgroundColor: '#E2F3FB', borderRadius: 29 },
  tab: { flex: 1, minHeight: 62, justifyContent: 'center', alignItems: 'center', borderRadius: 29, paddingHorizontal: 2, paddingVertical: 8, zIndex: 1 },
  iconSlot: { alignItems: 'center', justifyContent: 'center' },
  labelSlot: { position: 'absolute', bottom: 5, left: 2, right: 2, alignItems: 'center' },
  label: { fontSize: 10, fontWeight: '600' },
});
