// Copyright (C) 2026 MalinWallet Infrastructure - All Rights Reserved

/**
 * NFT Standards
 */
export enum NFTStandard {
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  METAPLEX = 'METAPLEX',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Chain type for NFT
 */
export type NFTChain = 'ethereum' | 'polygon' | 'solana' | string;

/**
 * NFT Collection metadata
 */
export interface NFTCollection {
  name: string;
  description?: string;
  image?: string;
  externalUrl?: string;
  floorPrice?: number;
}

/**
 * NFT Metadata (OpenSea standard)
 */
export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  animation_url?: string;
  background_color?: string;
}

/**
 * Main NFT Interface
 */
export interface NFT {
  // Unique identifier
  id: string;

  // Basic info
  name: string;
  description?: string;
  image: string; // IPFS/HTTP URL

  // Collection info
  collection?: NFTCollection;

  // Token identification
  tokenId: string;
  contractAddress?: string; // Ethereum/EVM
  mint?: string; // Solana
  
  // Standard & Chain
  standard: NFTStandard;
  chain: NFTChain;

  // Ownership
  owner: string;
  balance?: number; // For ERC1155

  // Metadata
  metadata?: NFTMetadata;
  rawMetadata?: any;

  // Additional info
  tokenUri?: string;
  cached?: boolean;
  lastFetched?: number;
}

/**
 * NFT Fetch Options
 */
export interface NFTFetchOptions {
  owner: string;
  chain: NFTChain;
  pageKey?: string; // For pagination
  limit?: number;
}

/**
 * NFT Fetch Result
 */
export interface NFTFetchResult {
  nfts: NFT[];
  pageKey?: string; // For next page
  totalCount?: number;
}

/**
 * NFT Transfer params
 */
export interface NFTTransferParams {
  nft: NFT;
  from: string;
  to: string;
  amount?: number; // For ERC1155
}
