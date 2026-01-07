// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { lazy, Suspense } from 'react';

import { LazyLoadingIndicator } from './LazyLoadingIndicator';

const AztecoRedeem = lazy(() => import('../screen/receive/AztecoRedeem'));
const SelectWallet = lazy(() => import('../screen/wallets/SelectWallet'));

export const AztecoRedeemComponent = () => (
  <Suspense fallback={<LazyLoadingIndicator />}>
    <AztecoRedeem />
  </Suspense>
);

export const SelectWalletComponent = () => (
  <Suspense fallback={<LazyLoadingIndicator />}>
    <SelectWallet />
  </Suspense>
);
