// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ETHStakingService } from '../../class/services/defi/eth-staking-service';
import { SolanaStakingService } from '../../class/services/defi/solana-staking-service';
import {
  StakingOpportunity,
  StakingPosition,
  StakingRewards,
} from '../../class/services/defi/staking-types';

interface StakingProps {
  navigation: any;
  route: any;
}

export const Staking: React.FC<StakingProps> = ({ navigation, route }) => {
  const { wallet, asset } = route.params || {}; // 'ETH' or 'SOL'

  const [tab, setTab] = useState<'opportunities' | 'positions'>('opportunities');
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<StakingOpportunity[]>([]);
  const [positions, setPositions] = useState<StakingPosition[]>([]);
  const [rewards, setRewards] = useState<StakingRewards | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [staking, setStaking] = useState(false);

  const ethService = ETHStakingService.getInstance();
  const solService = SolanaStakingService.getInstance();

  useEffect(() => {
    loadData();
  }, [asset]);

  /**
   * Load staking data
   */
  const loadData = async () => {
    try {
      setLoading(true);

      const address = wallet.getAddress();

      // Load opportunities
      const opps = asset === 'ETH'
        ? await ethService.getOpportunities()
        : await solService.getOpportunities();
      setOpportunities(opps);

      // Load positions
      const pos = asset === 'ETH'
        ? await ethService.getPositions(address)
        : await solService.getPositions(address);
      setPositions(pos);

      // Load rewards
      const rew = asset === 'ETH'
        ? await ethService.getRewards(address)
        : await solService.getRewards(address);
      setRewards(rew);

    } catch (error) {
      console.error('Error loading staking data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Stake tokens
   */
  const handleStake = async (opportunity: StakingOpportunity) => {
    const amount = parseFloat(stakeAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount < opportunity.minStake) {
      Alert.alert('Error', `Minimum stake is ${opportunity.minStake} ${asset}`);
      return;
    }

    try {
      setStaking(true);

      const service = asset === 'ETH' ? ethService : solService;
      const result = await service.stake(
        {
          protocol: opportunity.protocol.toLowerCase() as any,
          asset,
          amount,
        },
        wallet
      );

      if (result.success) {
        Alert.alert(
          'Success!',
          `Staked ${amount} ${asset}\n\nTransaction: ${result.txHash}`,
          [{ text: 'OK', onPress: () => loadData() }]
        );
        setStakeAmount('');
      } else {
        Alert.alert('Error', result.error || 'Staking failed');
      }
    } catch (error) {
      console.error('Error staking:', error);
      Alert.alert('Error', 'Failed to stake tokens');
    } finally {
      setStaking(false);
    }
  };

  /**
   * Unstake tokens
   */
  const handleUnstake = async (position: StakingPosition) => {
    Alert.alert(
      'Unstake Confirmation',
      `Unstake ${position.stakedAmount} ${position.asset}?\n\nCooldown: ${position.protocol === 'lido' ? 'Instant (swap)' : '~2 days'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unstake',
          onPress: async () => {
            try {
              const service = asset === 'ETH' ? ethService : solService;
              const result = await service.unstake(
                { positionId: position.id, amount: position.stakedAmount },
                wallet
              );

              if (result.success) {
                Alert.alert('Success', 'Unstaking initiated', [
                  { text: 'OK', onPress: () => loadData() },
                ]);
              } else {
                Alert.alert('Error', result.error || 'Unstaking failed');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to unstake');
            }
          },
        },
      ]
    );
  };

  /**
   * Render opportunities tab
   */
  const renderOpportunities = () => {
    return (
      <ScrollView style={styles.tabContent}>
        {opportunities.map((opp, index) => (
          <View key={index} style={styles.oppCard}>
            <View style={styles.oppHeader}>
              <Text style={styles.oppProtocol}>{opp.protocol}</Text>
              <Text style={styles.oppAsset}>{opp.asset}</Text>
            </View>

            <View style={styles.oppStats}>
              <View style={styles.oppStat}>
                <Text style={styles.oppStatLabel}>APY</Text>
                <Text style={styles.oppStatValue}>{opp.apy.toFixed(2)}%</Text>
              </View>
              <View style={styles.oppStat}>
                <Text style={styles.oppStatLabel}>Min Stake</Text>
                <Text style={styles.oppStatValue}>{opp.minStake} {opp.asset}</Text>
              </View>
              <View style={styles.oppStat}>
                <Text style={styles.oppStatLabel}>Lockup</Text>
                <Text style={styles.oppStatValue}>{opp.lockupPeriod}d</Text>
              </View>
            </View>

            <Text style={styles.oppDescription}>{opp.description}</Text>

            <View style={styles.stakeInput}>
              <TextInput
                style={styles.input}
                value={stakeAmount}
                onChangeText={setStakeAmount}
                placeholder={`Amount (${opp.asset})`}
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                style={[styles.stakeButton, staking && styles.stakeButtonDisabled]}
                onPress={() => handleStake(opp)}
                disabled={staking}
              >
                {staking ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.stakeButtonText}>Stake</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  /**
   * Render positions tab
   */
  const renderPositions = () => {
    if (positions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No staking positions yet</Text>
          <Text style={styles.emptySubtext}>Start staking to earn rewards</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tabContent}>
        {/* Rewards Summary */}
        {rewards && (
          <View style={styles.rewardsCard}>
            <Text style={styles.rewardsTitle}>Total Rewards Earned</Text>
            <Text style={styles.rewardsAmount}>
              {rewards.totalEarned.toFixed(6)} {asset}
            </Text>
            <Text style={styles.rewardsUSD}>
              ${rewards.totalEarnedUSD.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Positions */}
        {positions.map((pos, index) => (
          <View key={index} style={styles.posCard}>
            <View style={styles.posHeader}>
              <View>
                <Text style={styles.posProtocol}>{pos.protocol}</Text>
                <Text style={styles.posStatus}>{pos.status.toUpperCase()}</Text>
              </View>
              <View style={styles.posAmounts}>
                <Text style={styles.posStaked}>{pos.stakedAmount.toFixed(4)} {pos.asset}</Text>
                <Text style={styles.posRewards}>+{pos.rewardAmount.toFixed(6)}</Text>
              </View>
            </View>

            <View style={styles.posStats}>
              <View style={styles.posStat}>
                <Text style={styles.posStatLabel}>APY</Text>
                <Text style={styles.posStatValue}>{pos.apy.toFixed(2)}%</Text>
              </View>
              <View style={styles.posStat}>
                <Text style={styles.posStatLabel}>Staked</Text>
                <Text style={styles.posStatValue}>
                  {Math.floor((Date.now() - pos.stakedAt) / (1000 * 60 * 60 * 24))}d ago
                </Text>
              </View>
            </View>

            {pos.status === 'active' && (
              <TouchableOpacity
                style={styles.unstakeButton}
                onPress={() => handleUnstake(pos)}
              >
                <Text style={styles.unstakeButtonText}>Unstake</Text>
              </TouchableOpacity>
            )}

            {pos.status === 'unstaking' && pos.cooldownEnd && (
              <Text style={styles.cooldownText}>
                Cooldown ends: {new Date(pos.cooldownEnd).toLocaleDateString()}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FCD600" />
        <Text style={styles.loadingText}>Loading staking...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Stake {asset}</Text>
        <Text style={styles.subtitle}>Earn rewards while you sleep</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'opportunities' && styles.tabActive]}
          onPress={() => setTab('opportunities')}
        >
          <Text style={[styles.tabText, tab === 'opportunities' && styles.tabTextActive]}>
            Opportunities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, tab === 'positions' && styles.tabActive]}
          onPress={() => setTab('positions')}
        >
          <Text style={[styles.tabText, tab === 'positions' && styles.tabTextActive]}>
            My Stakes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === 'opportunities' ? renderOpportunities() : renderPositions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#212121',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#AAA',
  },
  header: {
    padding: 20,
    backgroundColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FCD600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAA',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FCD600',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAA',
  },
  tabTextActive: {
    color: '#FCD600',
  },
  tabContent: {
    flex: 1,
  },
  oppCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  oppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  oppProtocol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  oppAsset: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FCD600',
  },
  oppStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  oppStat: {
    alignItems: 'center',
  },
  oppStatLabel: {
    fontSize: 10,
    color: '#AAA',
    marginBottom: 4,
  },
  oppStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  oppDescription: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 16,
    lineHeight: 18,
  },
  stakeInput: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    color: '#FFF',
    fontSize: 16,
  },
  stakeButton: {
    paddingHorizontal: 24,
    backgroundColor: '#FCD600',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stakeButtonDisabled: {
    opacity: 0.5,
  },
  stakeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  rewardsCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4ADE80',
    alignItems: 'center',
  },
  rewardsTitle: {
    fontSize: 12,
    color: '#AAA',
    marginBottom: 8,
  },
  rewardsAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4ADE80',
    marginBottom: 4,
  },
  rewardsUSD: {
    fontSize: 16,
    color: '#AAA',
  },
  posCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  posHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  posProtocol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  posStatus: {
    fontSize: 10,
    color: '#FCD600',
    fontWeight: '600',
  },
  posAmounts: {
    alignItems: 'flex-end',
  },
  posStaked: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  posRewards: {
    fontSize: 12,
    color: '#4ADE80',
    marginTop: 2,
  },
  posStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  posStat: {
    alignItems: 'center',
  },
  posStatLabel: {
    fontSize: 10,
    color: '#AAA',
    marginBottom: 4,
  },
  posStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  unstakeButton: {
    padding: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    alignItems: 'center',
  },
  unstakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  cooldownText: {
    fontSize: 12,
    color: '#AAA',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#AAA',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
});
