// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { lazy, Suspense } from 'react';

import { LazyLoadingIndicator } from './LazyLoadingIndicator';

const SignVerify = lazy(() => import('../screen/wallets/signVerify'));

export const SignVerifyComponent = () => (
  <Suspense fallback={<LazyLoadingIndicator />}>
    <SignVerify />
  </Suspense>
);
