import React from 'react';
import { ActivityIndicator, View, ViewProps, ActivityIndicatorProps, StyleSheet } from 'react-native';
import { useTheme } from './themes';

interface MalinLoadingProps extends ViewProps, Pick<ActivityIndicatorProps, 'size' | 'color'> {}

export const MalinLoading: React.FC<MalinLoadingProps> = props => {
  const { color, size, ...otherProps } = props;
  const { colors } = useTheme();

  return (
    <View style={styles.container} {...otherProps}>
      <ActivityIndicator size={size} color={color || colors.buttonTextColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
});
