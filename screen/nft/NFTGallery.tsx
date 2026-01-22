// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, View, ActivityIndicator, RefreshControl } from 'react-native';
import { NFT } from '../../class/services/nft/types';
import { NFTService } from '../../class/services/nft';
import { NFTCard } from '../../components/nft/NFTCard';
import { MalinText } from '../../MalinComponents';
import { useTheme } from '../../components/themes';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import SafeArea from '../../components/SafeArea';

interface NFTGalleryProps {
  route: {
    params: {
      walletID: string;
      address: string;
      chain: string;
    };
  };
}

const NFTGallery: React.FC<NFTGalleryProps> = ({ route }) => {
  const { address, chain } = route.params;
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNFTs();
  }, [address, chain]);

  const loadNFTs = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      await NFTService.clearCache(address, chain);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const result = await NFTService.fetchNFTs({ owner: address, chain });
      setNfts(result.nfts);
    } catch (err: any) {
      console.error('Error loading NFTs:', err);
      setError(err.message || 'Failed to load NFTs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleNFTPress = (nft: NFT) => {
    navigation.navigate('NFTDetail', { nft });
  };

  const handleRefresh = () => {
    loadNFTs(true);
  };

  const renderNFT = ({ item }: { item: NFT }) => (
    <View style={styles.nftItem}>
      <NFTCard nft={item} onPress={handleNFTPress} />
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <MalinText style={[styles.emptyIcon]}>🖼️</MalinText>
        <MalinText style={[styles.emptyText, { color: colors.alternativeTextColor }]}>
          {error ? error : 'No NFTs found'}
        </MalinText>
        <MalinText style={[styles.emptySubtext, { color: colors.alternativeTextColor2 }]}>
          {error ? 'Pull to retry' : 'NFTs you collect will appear here'}
        </MalinText>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.foregroundColor} />
          <MalinText style={[styles.loadingText, { color: colors.alternativeTextColor }]}>
            Loading NFTs...
          </MalinText>
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={nfts}
        renderItem={renderNFT}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.foregroundColor}
          />
        }
      />
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  nftItem: {
    flex: 1,
    margin: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default NFTGallery;
