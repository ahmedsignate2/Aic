// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import React, { lazy, Suspense } from 'react';

import { LazyLoadingIndicator } from './LazyLoadingIndicator';

const ScanQRCode = lazy(() => import('../screen/send/ScanQRCode'));

export const ScanQRCodeComponent = () => (
  <Suspense fallback={<LazyLoadingIndicator />}>
    <ScanQRCode />
  </Suspense>
);
