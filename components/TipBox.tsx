import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from './themes';
import { MalinText } from '../MalinComponents';

interface TipBoxProps {
  number?: string;
  title?: string;
  description?: string;
  additionalDescription?: string;
  containerStyle?: ViewStyle;
}

const TipBox: React.FC<TipBoxProps> = ({ number, title, description, additionalDescription, containerStyle }) => {
  const { colors } = useTheme();
  const stylesHook = StyleSheet.create({
    tipBox: {
      backgroundColor: colors.ballOutgoingExpired,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      ...containerStyle,
    },
    tipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: number || title ? 16 : 0,
    },
    tipHeaderText: {
      marginLeft: 4,
      flex: 1,
    },
    description: {
      marginBottom: additionalDescription ? 16 : 0,
    },
  });

  return (
    <View style={stylesHook.tipBox}>
      {(number || title) && (
        <View style={stylesHook.tipHeader}>
          {number && (
            <View style={styles.vaultKeyCircle}>
              <MalinText style={styles.vaultKeyText}>{number}</MalinText>
            </View>
          )}
          {title && (
            <MalinText bold style={stylesHook.tipHeaderText}>
              {title}
            </MalinText>
          )}
        </View>
      )}
      {description && <MalinText style={stylesHook.description}>{description}</MalinText>}
      {additionalDescription && <MalinText>{additionalDescription}</MalinText>}
    </View>
  );
};

const styles = StyleSheet.create({
  vaultKeyCircle: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vaultKeyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default TipBox;
