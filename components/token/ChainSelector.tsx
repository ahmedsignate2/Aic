// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Chain, ChainId, getChainConfig, getAllChains } from '../../class/services/token';
import { MalinText } from '../../MalinComponents';
import { useTheme } from '../themes';

interface ChainSelectorProps {
  selectedChainId: ChainId;
  onSelectChain: (chainId: ChainId) => void;
  chains?: Chain[];
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  selectedChainId,
  onSelectChain,
  chains,
}) => {
  const { colors } = useTheme();
  const availableChains = chains || getAllChains();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {availableChains.map((chain) => {
        const isSelected = chain.id === selectedChainId;
        
        return (
          <TouchableOpacity
            key={chain.id}
            style={[
              styles.chainItem,
              {
                backgroundColor: isSelected ? chain.color : colors.inputBackgroundColor,
                borderColor: isSelected ? chain.color : colors.hdborderColor,
              },
            ]}
            onPress={() => onSelectChain(chain.id)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: chain.logo }} style={styles.chainIcon} />
            <MalinText
              style={[
                styles.chainText,
                { color: isSelected ? '#FFFFFF' : colors.foregroundColor },
              ]}
            >
              {chain.name}
            </MalinText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  chainItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  chainIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  chainText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
