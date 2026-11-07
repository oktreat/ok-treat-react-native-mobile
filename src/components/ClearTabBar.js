import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClearTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.base, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const selected = state.index === index;
          const label = options.tabBarLabel || options.title || route.name;
          const color = selected ? '#08779D' : '#263744';
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!selected && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={options.tabBarAccessibilityLabel || label}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              activeOpacity={0.75}
              style={[styles.tab, selected && styles.selected]}
            >
              {options.tabBarIcon?.({ focused: selected, color, size: 24 })}
              <Text numberOfLines={1} style={[styles.label, { color }]}>{label}</Text>
            </TouchableOpacity>
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
    shadowColor: '#173D4C', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10, shadowRadius: 10, elevation: 4,
  },
  tab: { flex: 1, minHeight: 62, justifyContent: 'center', alignItems: 'center', borderRadius: 29, paddingHorizontal: 2, paddingVertical: 8 },
  selected: { backgroundColor: '#E2F3FB' },
  label: { fontSize: 11, fontWeight: '600', marginTop: 4 },
});
