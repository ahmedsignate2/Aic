// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import { NFT } from '../../class/services/nft/types';
import { useTheme } from '../themes';
import { MalinText } from '../../MalinComponents';

interface NFTCardProps {
  nft: NFT;
  onPress: (nft: NFT) => void;
  size?: 'small' | 'medium' | 'large';
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, onPress, size = 'medium' }) => {
  const { colors } = useTheme();

  const cardSize = {
    small: 100,
    medium: 150,
    large: 200,
  }[size];

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardSize, backgroundColor: colors.inputBackgroundColor }]}
      onPress={() => onPress(nft)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: nft.image || 'https://via.placeholder.com/150' }}
        style={[styles.image, { height: cardSize }]}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <MalinText style={[styles.name, { color: colors.foregroundColor }]} numberOfLines={1}>
          {nft.name}
        </MalinText>
        {nft.collection && (
          <MalinText style={[styles.collection, { color: colors.alternativeTextColor }]} numberOfLines={1}>
            {nft.collection.name}
          </MalinText>
        )}
      </View>
      {nft.balance && nft.balance > 1 && (
        <View style={[styles.badge, { backgroundColor: colors.buttonBackgroundColor }]}>
          <Text style={styles.badgeText}>x{nft.balance}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  info: {
    padding: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  collection: {
    fontSize: 12,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
