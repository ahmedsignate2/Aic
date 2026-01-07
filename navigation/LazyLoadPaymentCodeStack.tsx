// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { lazy, Suspense } from 'react';

import { LazyLoadingIndicator } from './LazyLoadingIndicator';

const PaymentCodesList = lazy(() => import('../screen/wallets/PaymentCodesList'));

const PaymentCodesListComponent = () => (
  <Suspense fallback={<LazyLoadingIndicator />}>
    <PaymentCodesList />
  </Suspense>
);

export default PaymentCodesListComponent;
