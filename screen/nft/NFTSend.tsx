// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NFT, NFTStandard } from '../../class/services/nft/types';
import { MalinText } from '../../MalinComponents';
import { useTheme } from '../../components/themes';
import SafeArea from '../../components/SafeArea';
import Button from '../../components/Button';
import { useExtendedNavigation } from '../../hooks/useExtendedNavigation';
import { useStorage } from '../../hooks/context/useStorage';
import { EthereumWallet } from '../../class/wallets/ethereum-wallet';
import { SolanaWallet } from '../../class/wallets/solana-wallet';
import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';
// @ts-ignore
import { ETHEREUM_RPC_URL, SOLANA_RPC_URL } from '@env';

interface NFTSendProps {
  route: {
    params: {
      nft: NFT;
    };
  };
}

const NFTSend: React.FC<NFTSendProps> = ({ route }) => {
  const { nft } = route.params;
  const { colors } = useTheme();
  const navigation = useExtendedNavigation();
  const { wallets } = useStorage();

  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('1');
  const [loading, setLoading] = useState(false);
  const [gasFee, setGasFee] = useState<string | null>(null);
  const [estimatingGas, setEstimatingGas] = useState(false);

  // Find the wallet that owns this NFT
  const wallet = wallets.find((w) => {
    if (nft.chain === 'solana' && w.type === SolanaWallet.type) {
      return w.getAddress() === nft.owner;
    }
    if (nft.chain !== 'solana' && w.type === EthereumWallet.type) {
      return w.getAddress()?.toLowerCase() === nft.owner?.toLowerCase();
    }
    return false;
  });

  useEffect(() => {
    if (recipientAddress && isValidAddress(recipientAddress)) {
      estimateGas();
    }
  }, [recipientAddress, amount]);

  const isValidAddress = (address: string): boolean => {
    if (!address) return false;

    if (nft.chain === 'solana') {
      try {
        new PublicKey(address);
        return true;
      } catch {
        return false;
      }
    } else {
      return ethers.isAddress(address);
    }
  };

  const estimateGas = async () => {
    if (!wallet || !recipientAddress || !isValidAddress(recipientAddress)) return;

    setEstimatingGas(true);
    try {
      if (nft.chain === 'solana') {
        // Solana: flat fee approximation
        setGasFee('~0.00001 SOL');
      } else {
        // Ethereum: estimate gas
        const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
        const gasPrice = await provider.getFeeData();
        const estimatedGas = nft.standard === NFTStandard.ERC1155 ? 100000 : 80000; // Approximation
        const gasCost = ethers.formatEther((gasPrice.gasPrice || 0n) * BigInt(estimatedGas));
        setGasFee(`~${parseFloat(gasCost).toFixed(6)} ETH`);
      }
    } catch (error) {
      console.error('Error estimating gas:', error);
      setGasFee('Unable to estimate');
    } finally {
      setEstimatingGas(false);
    }
  };

  const handleSend = async () => {
    if (!wallet) {
      Alert.alert('Error', 'Wallet not found');
      return;
    }

    if (!recipientAddress || !isValidAddress(recipientAddress)) {
      Alert.alert('Invalid Address', 'Please enter a valid recipient address');
      return;
    }

    if (nft.standard === NFTStandard.ERC1155) {
      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum <= 0 || amountNum > (nft.balance || 1)) {
        Alert.alert('Invalid Amount', `Please enter a valid amount (1-${nft.balance || 1})`);
        return;
      }
    }

    Alert.alert(
      'Confirm Transfer',
      `Send ${nft.name} to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}?\n\nEstimated fee: ${gasFee || 'calculating...'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          style: 'destructive',
          onPress: () => executeSend(),
        },
      ]
    );
  };

  const executeSend = async () => {
    setLoading(true);
    try {
      if (nft.chain === 'solana') {
        await sendSolanaNFT();
      } else {
        if (nft.standard === NFTStandard.ERC721) {
          await sendERC721();
        } else if (nft.standard === NFTStandard.ERC1155) {
          await sendERC1155();
        }
      }

      Alert.alert('Success', 'NFT sent successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error sending NFT:', error);
      Alert.alert('Error', error.message || 'Failed to send NFT');
    } finally {
      setLoading(false);
    }
  };

  const sendERC721 = async () => {
    if (!wallet || wallet.type !== EthereumWallet.type) throw new Error('Invalid wallet');

    const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
    const signer = new ethers.Wallet(wallet.getSecret(), provider);

    // ERC-721 ABI for safeTransferFrom
    const abi = [
      'function safeTransferFrom(address from, address to, uint256 tokenId)',
    ];

    const contract = new ethers.Contract(nft.contractAddress, abi, signer);
    const walletAddress = wallet.getAddress();
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Invalid wallet address');
    }
    const tx = await contract.safeTransferFrom(
      walletAddress,
      recipientAddress,
      nft.tokenId
    );

    console.log('ERC-721 Transfer TX:', tx.hash);
    await tx.wait();
  };

  const sendERC1155 = async () => {
    if (!wallet || wallet.type !== EthereumWallet.type) throw new Error('Invalid wallet');

    const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
    const signer = new ethers.Wallet(wallet.getSecret(), provider);

    // ERC-1155 ABI for safeTransferFrom
    const abi = [
      'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
    ];

    const contract = new ethers.Contract(nft.contractAddress, abi, signer);
    const walletAddress = wallet.getAddress();
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw new Error('Invalid wallet address');
    }
    const tx = await contract.safeTransferFrom(
      walletAddress,
      recipientAddress,
      nft.tokenId,
      amount,
      '0x' // empty data
    );

    console.log('ERC-1155 Transfer TX:', tx.hash);
    await tx.wait();
  };

  const sendSolanaNFT = async () => {
    if (!wallet || wallet.type !== SolanaWallet.type) throw new Error('Invalid wallet');

    const connection = new Connection(SOLANA_RPC_URL);
    const secretKey = bs58.decode(wallet.getSecret());
    const fromKeypair = Keypair.fromSecretKey(secretKey);
    const toPublicKey = new PublicKey(recipientAddress);
    const mintPublicKey = new PublicKey(nft.mint!);

    // Get source token account
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      fromKeypair.publicKey
    );

    // Get or create destination token account
    const toTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      toPublicKey
    );

    const transaction = new Transaction();

    // Check if destination token account exists
    const accountInfo = await connection.getAccountInfo(toTokenAccount);
    if (!accountInfo) {
      // Create associated token account for recipient
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromKeypair.publicKey, // payer
          toTokenAccount, // associated token account
          toPublicKey, // owner
          mintPublicKey // mint
        )
      );
    }

    // Add transfer instruction (NFTs have amount = 1)
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromKeypair.publicKey,
        1, // NFTs are non-fungible, always transfer 1
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Send and confirm
    const signature = await connection.sendTransaction(transaction, [fromKeypair]);
    console.log('Solana NFT Transfer TX:', signature);
    await connection.confirmTransaction(signature);
  };

  const showERC1155Amount = nft.standard === NFTStandard.ERC1155 && (nft.balance || 1) > 1;

  return (
    <SafeArea style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* NFT Preview */}
          <View style={styles.nftPreview}>
            <Image source={{ uri: nft.image }} style={styles.nftImage} resizeMode="cover" />
            <View style={styles.nftInfo}>
              <MalinText style={[styles.nftName, { color: colors.foregroundColor }]}>
                {nft.name}
              </MalinText>
              {nft.collection && (
                <MalinText style={[styles.collection, { color: colors.alternativeTextColor }]}>
                  {nft.collection.name}
                </MalinText>
              )}
              <MalinText style={[styles.tokenId, { color: colors.alternativeTextColor2 }]}>
                Token ID: {nft.tokenId}
              </MalinText>
            </View>
          </View>

          {/* Recipient Address */}
          <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
            <MalinText style={[styles.label, { color: colors.foregroundColor }]}>
              Recipient Address
            </MalinText>
            <TextInput
              style={[styles.input, { color: colors.foregroundColor, borderColor: colors.formBorder }]}
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              placeholder={nft.chain === 'solana' ? 'Solana address' : 'Ethereum address (0x...)'}
              placeholderTextColor={colors.alternativeTextColor2}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {recipientAddress && !isValidAddress(recipientAddress) && (
              <MalinText style={styles.error}>Invalid address</MalinText>
            )}
          </View>

          {/* Amount (ERC-1155 only) */}
          {showERC1155Amount && (
            <View style={[styles.section, { backgroundColor: colors.inputBackgroundColor }]}>
              <MalinText style={[styles.label, { color: colors.foregroundColor }]}>
                Amount (Balance: {nft.balance})
              </MalinText>
              <TextInput
                style={[styles.input, { color: colors.foregroundColor, borderColor: colors.formBorder }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="1"
                placeholderTextColor={colors.alternativeTextColor2}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* Gas Fee Estimate */}
          {gasFee && (
            <View style={[styles.feeSection, { backgroundColor: colors.inputBackgroundColor }]}>
              <MalinText style={[styles.feeLabel, { color: colors.alternativeTextColor }]}>
                Estimated Network Fee
              </MalinText>
              <MalinText style={[styles.feeValue, { color: colors.foregroundColor }]}>
                {estimatingGas ? <ActivityIndicator size="small" /> : gasFee}
              </MalinText>
            </View>
          )}

          {/* Warning */}
          <View style={[styles.warning, { backgroundColor: colors.redBG }]}>
            <MalinText style={[styles.warningText, { color: colors.redText }]}>
              ⚠️ Double-check the recipient address. NFT transfers cannot be reversed.
            </MalinText>
          </View>
        </ScrollView>

        {/* Send Button */}
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <Button
            title={loading ? 'Sending...' : 'Send NFT'}
            onPress={handleSend}
            disabled={loading || !recipientAddress || !isValidAddress(recipientAddress)}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  nftPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  nftImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  nftInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nftName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  collection: {
    fontSize: 14,
    marginBottom: 2,
  },
  tokenId: {
    fontSize: 12,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  error: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  feeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  feeLabel: {
    fontSize: 14,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  warning: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default NFTSend;
