// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { useContext } from 'react';
import { StorageContext } from '../../components/Context/StorageProvider';

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (context === null) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};
