// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { useContext } from 'react';
import { StorageContext } from '../../components/Context/StorageProvider';

export const useStorage = () => useContext(StorageContext);
