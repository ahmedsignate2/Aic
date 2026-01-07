// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { useContext } from 'react';
import { SettingsContext } from '../../components/Context/SettingsProvider';

export const useSettings = () => useContext(SettingsContext);
