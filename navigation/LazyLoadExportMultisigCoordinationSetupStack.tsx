// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { lazy, Suspense } from 'react';

import { LazyLoadingIndicator } from './LazyLoadingIndicator';

const ExportMultisigCoordinationSetup = lazy(() => import('../screen/wallets/ExportMultisigCoordinationSetup'));

export const ExportMultisigCoordinationSetupComponent = () => (
  <Suspense fallback={<LazyLoadingIndicator />}>
    <ExportMultisigCoordinationSetup />
  </Suspense>
);
