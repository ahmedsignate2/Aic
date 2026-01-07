// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved
import { DetailViewStackParamList } from './DetailViewStackParamList';

export type DrawerParamList = {
  DetailViewStackScreensStack: {
    screen?: keyof DetailViewStackParamList;
    params?: object;
  };
};
