// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import { Linking, View, ViewStyle, StyleSheet } from 'react-native';
import Lnurl from '../class/lnurl';
import { EthereumTransaction, LightningTransaction, SolanaTransaction, Transaction } from '../class/wallets/types';
import TransactionExpiredIcon from '../components/icons/TransactionExpiredIcon';
import TransactionIncomingIcon from '../components/icons/TransactionIncomingIcon';
import TransactionOffchainIcon from '../components/icons/TransactionOffchainIcon';
import TransactionOffchainIncomingIcon from '../components/icons/TransactionOffchainIncomingIcon';
import TransactionOnchainIcon from '../components/icons/TransactionOnchainIcon';
import TransactionOutgoingIcon from '../components/icons/TransactionOutgoingIcon';
import TransactionPendingIcon from '../components/icons/TransactionPendingIcon';
import loc, { formatBalanceWithoutSuffix, transactionTimeToReadable } from '../loc';
import { BitcoinUnit } from '../models/bitcoinUnits';
import { useSettings } from '../hooks/context/useSettings';
import ListItem from './ListItem';
import { useTheme } from './themes';
import { Action, ToolTipMenuProps } from './types';
import { useExtendedNavigation } from '../hooks/useExtendedNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DetailViewStackParamList } from '../navigation/DetailViewStackParamList';
import { useStorage } from '../hooks/context/useStorage';
import ToolTipMenu from './TooltipMenu';
import { CommonToolTipActions } from '../typings/CommonToolTipActions';
import { pop } from '../NavigationService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HighlightedText from './HighlightedText';
import { EthereumWallet, SolanaWallet } from '../class';

const styles = StyleSheet.create({
  subtitle: {
    color: 'colors.foregroundColor',
    fontSize: 13,
  },
  highlight: {
    backgroundColor: '#FFF5C0',
    color: '#000000',
    fontSize: 13,
    fontWeight: '600',
  },
});

interface TransactionListItemProps {
  itemPriceUnit?: BitcoinUnit;
  walletID: string;
  item: Transaction | LightningTransaction | EthereumTransaction | SolanaTransaction;
  searchQuery?: string;
  style?: ViewStyle;
  renderHighlightedText?: (text: string, query: string) => JSX.Element;
  onPress?: () => void;
}

type NavigationProps = NativeStackNavigationProp<DetailViewStackParamList>;

const isBitcoinTransaction = (tx: any): tx is Transaction => typeof tx.txid === 'string';
const isLightningTransaction = (tx: any): tx is LightningTransaction => tx.type === 'user_invoice' || tx.type === 'payment_request' || tx.type === 'paid_invoice' || tx.type === 'bitcoind_tx';
const isEthereumTransaction = (tx: any): tx is EthereumTransaction => typeof tx.gasPrice === 'number';
const isSolanaTransaction = (tx: any): tx is SolanaTransaction => typeof tx.slot === 'number';

export const TransactionListItem: React.FC<TransactionListItemProps> = memo(
  ({
    item,
    itemPriceUnit = BitcoinUnit.BTC,
    walletID,
    searchQuery,
    style,
    renderHighlightedText,
    onPress: customOnPress,
  }: TransactionListItemProps) => {
    const [subtitleNumberOfLines, setSubtitleNumberOfLines] = useState(1);
    const { colors } = useTheme();
    const { navigate } = useExtendedNavigation<NavigationProps>();
    const menuRef = useRef<ToolTipMenuProps>();
    const { txMetadata, counterpartyMetadata, wallets } = useStorage();
    const { language, selectedBlockExplorer } = useSettings();
    const wallet = wallets.find(w => w.getID() === walletID);
    const insets = useSafeAreaInsets();
    const containerStyle = useMemo(
      () => ({
        backgroundColor: colors.background,
        borderBottomColor: colors.lightBorder,
        paddingLeft: 16,
        paddingRight: 16,
      }),
      [colors.background, colors.lightBorder],
    );

    const combinedStyle = useMemo(() => [containerStyle, style], [containerStyle, style]);

    const normalizedTx = useMemo(() => {
      if (isEthereumTransaction(item) && wallet) {
        const direction = item.from.toLowerCase() === wallet.getAddress().toLowerCase() ? 'sent' : 'received';
        const value = parseFloat(formatBalanceWithoutSuffix(item.value, BitcoinUnit.ETH).toString());
        return {
          hash: item.hash,
          value: direction === 'sent' ? -value : value,
          timestamp: item.timestamp,
          confirmations: item.confirmations,
          direction,
          memo: '',
        };
      } else if (isSolanaTransaction(item) && wallet) {
        const walletAddress = wallet.getAddress();
        const preBalance = item.preBalances[0] ?? 0;
        const postBalance = item.postBalances[0] ?? 0;
        const value = postBalance - preBalance;
        const direction = value > 0 ? 'received' : 'sent';
        return {
          hash: item.signature,
          value: parseFloat(formatBalanceWithoutSuffix(Math.abs(value), BitcoinUnit.SOL).toString()),
          timestamp: item.blockTime,
          confirmations: item.slot ? 1 : 0,
          direction,
          memo: item.memo ?? '',
        };
      } else if (isLightningTransaction(item)) {
         return {
          hash: (item.payment_hash && typeof item.payment_hash === 'string') ? item.payment_hash : '',
          value: item.value ?? 0,
          timestamp: item.timestamp,
          confirmations: 99, // LN txs are instant
          direction: item.value && item.value < 0 ? 'sent' : 'received',
          memo: item.memo ?? '',
        };
      } else if (isBitcoinTransaction(item)) {
        return {
          hash: item.hash,
          value: item.value,
          timestamp: item.timestamp,
          confirmations: item.confirmations,
          direction: item.value && item.value < 0 ? 'sent' : 'received',
          memo: txMetadata[item.hash]?.memo ?? '',
        };
      }
      return null;
    }, [item, wallet, txMetadata]);

    const shortenContactName = (name: string): string => {
      if (name.length < 16) return name;
      return name.substr(0, 7) + '...' + name.substr(name.length - 7, 7);
    };

    const title = useMemo(() => {
      if (normalizedTx && normalizedTx.confirmations === 0) {
        return loc.transactions.pending;
      } else if (normalizedTx) {
        return transactionTimeToReadable(normalizedTx.timestamp);
      }
      return '';
    }, [normalizedTx, language]);

    let counterparty;
    if ('counterparty' in item && item.counterparty) {
      counterparty = counterpartyMetadata?.[item.counterparty]?.label ?? item.counterparty;
    }
    const txMemo = (counterparty ? `[${shortenContactName(counterparty)}] ` : '') + (normalizedTx?.memo ?? '');
    const subtitle = useMemo(() => {
      if (!normalizedTx) return '';
      let sub = Number(normalizedTx.confirmations) < 7 ? loc.formatString(loc.transactions.list_conf, { number: normalizedTx.confirmations }) : '';
      if (sub !== '') sub += ' ';
      sub += txMemo;
      if (isLightningTransaction(item) && item.memo) sub += item.memo;
      return sub || undefined;
    }, [normalizedTx, txMemo, item]);

    const formattedAmount = useMemo(() => {
      if (!normalizedTx) return '';
      return formatBalanceWithoutSuffix(normalizedTx.value, itemPriceUnit, true).toString();
    }, [normalizedTx, itemPriceUnit]);

    const rowTitle = useMemo(() => {
      if (isLightningTransaction(item) && (item.type === 'user_invoice' || item.type === 'payment_request')) {
        const currentDate = new Date();
        const now = Math.floor(currentDate.getTime() / 1000);
        const invoiceExpiration = item.timestamp! + (item.expire_time ?? 0);
        if (invoiceExpiration > now || item.ispaid) {
          return formattedAmount;
        } else {
          return loc.lnd.expired;
        }
      }
      return formattedAmount;
    }, [item, formattedAmount]);

    const rowTitleStyle = useMemo(() => {
      if (!normalizedTx) return {};
      let color = colors.successColor;

      if (isLightningTransaction(item) && (item.type === 'user_invoice' || item.type === 'payment_request')) {
        const currentDate = new Date();
        const now = (currentDate.getTime() / 1000) | 0;
        const invoiceExpiration = item.timestamp! + (item.expire_time ?? 0);

        if (invoiceExpiration > now) {
          color = colors.successColor;
        } else if (invoiceExpiration < now) {
          if (item.ispaid) {
            color = colors.successColor;
          } else {
            color = '#9AA0AA';
          }
        }
      } else if (normalizedTx.direction === 'sent') {
        color = colors.foregroundColor;
      }

      return {
        color,
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'right',
        paddingRight: insets.right,
        paddingLeft: insets.left,
      };
    }, [
      colors.successColor,
      colors.foregroundColor,
      item,
      normalizedTx,
      insets.right,
      insets.left,
    ]);

    const determineTransactionTypeAndAvatar = () => {
      if (!normalizedTx) return { label: '', icon: null };
      if (isLightningTransaction(item)) {
        if (item.category === 'receive' && item.confirmations! < 3) {
            return {
            label: loc.transactions.pending_transaction,
            icon: <TransactionPendingIcon />,
            };
        }

        if (item.type && item.type === 'bitcoind_tx') {
            return {
            label: loc.transactions.onchain,
            icon: <TransactionOnchainIcon />,
            };
        }

        if (item.type === 'paid_invoice') {
            return {
            label: loc.transactions.offchain,
            icon: <TransactionOffchainIcon />,
            };
        }

        if (item.type === 'user_invoice' || item.type === 'payment_request') {
            const currentDate = new Date();
            const now = (currentDate.getTime() / 1000) | 0; // eslint-disable-line no-bitwise
            const invoiceExpiration = item.timestamp! + (item.expire_time ?? 0);
            if (!item.ispaid && invoiceExpiration < now) {
            return {
                label: loc.transactions.expired_transaction,
                icon: <TransactionExpiredIcon />,
            };
            } else if (!item.ispaid) {
            return {
                label: loc.transactions.expired_transaction,
                icon: <TransactionPendingIcon />,
            };
            } else {
            return {
                label: loc.transactions.incoming_transaction,
                icon: <TransactionOffchainIncomingIcon />,
            };
            }
        }
      }

      if (!normalizedTx.confirmations) {
        return {
          label: loc.transactions.pending_transaction,
          icon: <TransactionPendingIcon />,
        };
      } else if (normalizedTx.direction === 'sent') {
        return {
          label: loc.transactions.outgoing_transaction,
          icon: <TransactionOutgoingIcon />,
        };
      } else {
        return {
          label: loc.transactions.incoming_transaction,
          icon: <TransactionIncomingIcon />,
        };
      }
    };

    const { label: transactionTypeLabel, icon: avatar } = determineTransactionTypeAndAvatar();

    const amountWithUnit = useMemo(() => {
      const unitSuffix = itemPriceUnit === BitcoinUnit.BTC || itemPriceUnit === BitcoinUnit.SATS || itemPriceUnit === BitcoinUnit.ETH || itemPriceUnit === BitcoinUnit.SOL ? ` ${itemPriceUnit}` : ' ';
      return `${formattedAmount}${unitSuffix}`;
    }, [formattedAmount, itemPriceUnit]);

    useEffect(() => {
      setSubtitleNumberOfLines(1);
    }, [subtitle]);

    const onPress = useCallback(async () => {
      menuRef?.current?.dismissMenu?.();
      if (customOnPress) {
        customOnPress();
        return;
      }

      if (normalizedTx?.hash) {
        if (renderHighlightedText) {
          pop();
        }
        if (wallet?.type === EthereumWallet.type || wallet?.type === SolanaWallet.type || wallet?.type.startsWith('bitcoin')) {
          navigate('TransactionStatus', { hash: normalizedTx.hash, walletID });
        }
      } else if (isLightningTransaction(item) && (item.type === 'user_invoice' || item.type === 'payment_request' || item.type === 'paid_invoice')) {
        const lightningWallet = wallets.find(w => w.getID() === item.walletID);
        if (lightningWallet) {
          try {
            const LN = new Lnurl(false, AsyncStorage);
            let paymentHash = item.payment_hash!;
            if (typeof paymentHash === 'object') {
              paymentHash = Buffer.from(paymentHash.data).toString('hex');
            }
            const loaded = await LN.loadSuccessfulPayment(paymentHash);
            if (loaded) {
              navigate('ScanLNDInvoiceRoot', {
                screen: 'LnurlPaySuccess',
                params: {
                  paymentHash,
                  justPaid: false,
                  fromWalletID: lightningWallet.getID(),
                },
              });
              return;
            }
          } catch (e) {
            console.debug(e);
          }

          navigate('LNDViewInvoice', {
            invoice: item,
            walletID: lightningWallet.getID(),
          });
        }
      } else {
        console.log('cant handle press');
      }
    }, [normalizedTx, item, renderHighlightedText, navigate, walletID, wallets, customOnPress, wallet]);

    const handleOnExpandNote = useCallback(() => {
      setSubtitleNumberOfLines(0);
    }, []);

    const handleOnDetailsPress = useCallback(() => {
      if (walletID && normalizedTx && normalizedTx.hash) {
        navigate('TransactionDetails', { tx: item, hash: normalizedTx.hash, walletID });
      } else if (isLightningTransaction(item)) {
        const lightningWallet = wallets.find(w => w.getID() === item.walletID);
        if (lightningWallet) {
          navigate('LNDViewInvoice', {
            invoice: item,
            walletID: lightningWallet.getID(),
          });
        }
      }
    }, [item, navigate, walletID, wallets, normalizedTx]);

    const handleOnCopyAmountTap = useCallback(() => Clipboard.setString(rowTitle.replace(/[\s\-]/g, '')), [rowTitle]);
    const handleOnCopyTransactionID = useCallback(() => Clipboard.setString(normalizedTx?.hash ?? ''), [normalizedTx]);
    const handleOnCopyNote = useCallback(() => Clipboard.setString(subtitle ?? ''), [subtitle]);
    
    const handleOnViewOnBlockExplorer = useCallback(() => {
      let url = '';
      if (wallet?.type === EthereumWallet.type) {
        url = `https://etherscan.io/tx/${normalizedTx?.hash}`;
      } else if (wallet?.type === SolanaWallet.type) {
        url = `https://solscan.io/tx/${normalizedTx?.hash}`;
      } else {
        url = `${selectedBlockExplorer.url}/tx/${normalizedTx?.hash}`;
      }

      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        }
      });
    }, [normalizedTx, wallet, selectedBlockExplorer]);
    
    const handleCopyOpenInBlockExplorerPress = useCallback(() => {
      let url = '';
      if (wallet?.type === EthereumWallet.type) {
        url = `https://etherscan.io/tx/${normalizedTx?.hash}`;
      } else if (wallet?.type === SolanaWallet.type) {
        url = `https://solscan.io/tx/${normalizedTx?.hash}`;
      } else {
        url = `${selectedBlockExplorer.url}/tx/${normalizedTx?.hash}`;
      }
      Clipboard.setString(url);
    }, [normalizedTx, wallet, selectedBlockExplorer]);

    const onToolTipPress = useCallback(
      (id: any) => {
        if (id === CommonToolTipActions.CopyAmount.id) {
          handleOnCopyAmountTap();
        } else if (id === CommonToolTipActions.CopyNote.id) {
          handleOnCopyNote();
        } else if (id === CommonToolTipActions.OpenInBlockExplorer.id) {
          handleOnViewOnBlockExplorer();
        } else if (id === CommonToolTipActions.ExpandNote.id) {
          handleOnExpandNote();
        } else if (id === CommonToolTipActions.CopyBlockExplorerLink.id) {
          handleCopyOpenInBlockExplorerPress();
        } else if (id === CommonToolTipActions.CopyTXID.id) {
          handleOnCopyTransactionID();
        } else if (id === CommonToolTipActions.Details.id) {
          handleOnDetailsPress();
        }
      },
      [
        handleCopyOpenInBlockExplorerPress,
        handleOnCopyAmountTap,
        handleOnCopyNote,
        handleOnCopyTransactionID,
        handleOnDetailsPress,
        handleOnExpandNote,
        handleOnViewOnBlockExplorer,
      ],
    );
    const toolTipActions = useMemo((): Action[] => {
      const actions: (Action | Action[])[] = [
        {
          ...CommonToolTipActions.CopyAmount,
          hidden: rowTitle === loc.lnd.expired,
        },
        {
          ...CommonToolTipActions.CopyNote,
          hidden: !subtitle,
        },
        {
          ...CommonToolTipActions.CopyTXID,
          hidden: !normalizedTx?.hash,
        },
        {
          ...CommonToolTipActions.CopyBlockExplorerLink,
          hidden: !normalizedTx?.hash,
        },
        [{ ...CommonToolTipActions.OpenInBlockExplorer, hidden: !normalizedTx?.hash }, CommonToolTipActions.Details],
        [
          {
            ...CommonToolTipActions.ExpandNote,
            hidden: subtitleNumberOfLines !== 1,
          },
        ],
      ];

      return actions as Action[];
    }, [rowTitle, subtitle, normalizedTx, subtitleNumberOfLines]);

    const accessibilityState = useMemo(() => {
      return {
        expanded: subtitleNumberOfLines === 0,
      };
    }, [subtitleNumberOfLines]);

    const subtitleProps = useMemo(() => ({ numberOfLines: subtitleNumberOfLines }), [subtitleNumberOfLines]);

    return (
      <ToolTipMenu
        isButton
        actions={toolTipActions}
        onPressMenuItem={onToolTipPress}
        onPress={onPress}
        accessibilityLabel={`${transactionTypeLabel}, ${amountWithUnit}, ${subtitle ?? title}`}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
      >
        <ListItem
          leftAvatar={avatar}
          title={title}
          subtitleNumberOfLines={subtitleNumberOfLines}
          subtitle={
            subtitle ? (
              renderHighlightedText ? (
                renderHighlightedText(subtitle, searchQuery ?? '')
              ) : (
                <HighlightedText
                  text={subtitle}
                  query={searchQuery ?? ''}
                  caseSensitive={false}
                  highlightOnlyFirstMatch={searchQuery ? searchQuery.length === 1 : false}
                  style={styles.subtitle}
                />
              )
            ) : undefined
          }
          Component={View}
          subtitleProps={subtitleProps}
          chevron={false}
          rightTitle={rowTitle}
          rightTitleStyle={rowTitleStyle}
          containerStyle={combinedStyle}
          testID="TransactionListItem"
        />
      </ToolTipMenu>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.hash === nextProps.item.hash &&
      prevProps.item.timestamp === nextProps.item.timestamp &&
      prevProps.itemPriceUnit === nextProps.itemPriceUnit &&
      prevProps.walletID === nextProps.walletID &&
      prevProps.searchQuery === nextProps.searchQuery
    );
  },
);