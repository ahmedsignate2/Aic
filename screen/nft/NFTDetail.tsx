// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity } from 'react-native';
import { NFT } from '../../class/services/nft/types';
import { MalinText } from '../../MalinComponents';
import { useTheme } from '../../components/themes';
import SafeArea from '../../components/SafeArea';
import Button from '../../components/Button';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';

interface NFTDetailProps {
  route: {
    params: {
      nft: NFT;
    };
  };
}

const NFTDetail: React.FC<NFTDetailProps> = ({ route }) => {
  const { nft } = route.params;
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();

  const handleSend = () => {
    navigation.navigate('NFTSend', { nft });
  };

  return (
    <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* NFT Image */}
        <Image
          source={{ uri: nft.image }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* NFT Info */}
        <View style={styles.info}>
          <MalinText style={[styles.name, { color: colors.foregroundColor }]}>
            {nft.name}
          </MalinText>

          {nft.collection && (
            <MalinText style={[styles.collection, { color: colors.alternativeTextColor }]}>
              {nft.collection.name}
            </MalinText>
          )}

          {nft.description && (
            <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
              <MalinText style={[styles.sectionTitle, { color: colors.foregroundColor }]}>
                Description
              </MalinText>
              <MalinText style={[styles.sectionText, { color: colors.alternativeTextColor }]}>
                {nft.description}
              </MalinText>
            </View>
          )}

          {/* Properties */}
          {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
              <MalinText style={[styles.sectionTitle, { color: colors.foregroundColor }]}>
                Properties
              </MalinText>
              <View style={styles.attributes}>
                {nft.metadata.attributes.map((attr, index) => (
                  <View key={index} style={[styles.attribute, { borderColor: colors.hdborderColor }]}>
                    <MalinText style={[styles.attrType, { color: colors.alternativeTextColor2 }]}>
                      {attr.trait_type}
                    </MalinText>
                    <MalinText style={[styles.attrValue, { color: colors.foregroundColor }]}>
                      {attr.value}
                    </MalinText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Details */}
          <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
            <MalinText style={[styles.sectionTitle, { color: colors.foregroundColor }]}>
              Details
            </MalinText>
            <View style={styles.detail}>
              <MalinText style={[styles.detailLabel, { color: colors.alternativeTextColor2 }]}>
                Contract
              </MalinText>
              <MalinText style={[styles.detailValue, { color: colors.alternativeTextColor }]} numberOfLines={1}>
                {nft.contractAddress || nft.mint}
              </MalinText>
            </View>
            <View style={styles.detail}>
              <MalinText style={[styles.detailLabel, { color: colors.alternativeTextColor2 }]}>
                Token ID
              </MalinText>
              <MalinText style={[styles.detailValue, { color: colors.alternativeTextColor }]}>
                {nft.tokenId}
              </MalinText>
            </View>
            <View style={styles.detail}>
              <MalinText style={[styles.detailLabel, { color: colors.alternativeTextColor2 }]}>
                Standard
              </MalinText>
              <MalinText style={[styles.detailValue, { color: colors.alternativeTextColor }]}>
                {nft.standard}
              </MalinText>
            </View>
            <View style={styles.detail}>
              <MalinText style={[styles.detailLabel, { color: colors.alternativeTextColor2 }]}>
                Chain
              </MalinText>
              <MalinText style={[styles.detailValue, { color: colors.alternativeTextColor }]}>
                {nft.chain}
              </MalinText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button title="Send NFT" onPress={handleSend} />
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  image: {
    width: '100%',
    height: 400,
    backgroundColor: '#f0f0f0',
  },
  info: {
    padding: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  collection: {
    fontSize: 16,
    marginBottom: 20,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  attributes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  attribute: {
    margin: 4,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
  },
  attrType: {
    fontSize: 12,
    marginBottom: 4,
  },
  attrValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
});

export default NFTDetail;
