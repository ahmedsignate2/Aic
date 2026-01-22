# WalletConnect v2 Implementation

## Overview
MalinWallet now supports WalletConnect v2, allowing users to connect to any DApp (Uniswap, OpenSea, PancakeSwap, etc.) and sign transactions securely.

## Features Implemented
- ✅ WalletConnect v2 SDK integration
- ✅ Multi-chain support (Ethereum + EVM chains, Solana ready)
- ✅ QR code pairing with DApps
- ✅ Session management (approve/reject/disconnect)
- ✅ Transaction signing (eth_sendTransaction, personal_sign, eth_signTypedData_v4)
- ✅ Active sessions viewer
- ✅ UI integration in Settings and Home screen

## Setup Instructions

### 1. Get WalletConnect Project ID
1. Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in
3. Create a new project
4. Copy your **Project ID**

### 2. Configure Environment Variables
Add to your `.env` file:
```
WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Update the Service
Edit `class/services/walletconnect-service.ts` line 6:
```typescript
const WALLETCONNECT_PROJECT_ID = process.env.WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE';
```

## Usage

### For Users
1. **Connect to a DApp:**
   - Open the app
   - Tap "WC" button on home screen or go to Settings → WalletConnect
   - Scan QR code from DApp (e.g., Uniswap.org)
   - Approve the connection request

2. **Sign Transactions:**
   - When a DApp requests a transaction, a popup will appear
   - Review the transaction details
   - Approve or reject

3. **Manage Sessions:**
   - Go to Settings → WalletConnect
   - View all active connections
   - Tap to disconnect

### For Developers

#### Initialize WalletConnect
```typescript
import WalletConnectService from './class/services/walletconnect-service';

// Initialize (done automatically in StorageProvider)
await WalletConnectService.initialize();
```

#### Pair with a DApp
```typescript
const uri = 'wc:...'; // From QR code
await WalletConnectService.pair(uri);
```

#### Handle Session Proposal
The service automatically emits `session_proposal` events. Navigate to `WCSessionRequest` screen to show UI.

#### Handle Transaction Requests
```typescript
import { WalletConnectRequestHandler } from './class/services/walletconnect-request-handler';

// In your request handler
const result = await WalletConnectRequestHandler.handleEthereumRequest(request, wallet);
await WalletConnectRequestHandler.approveRequest(topic, id, result);
```

## Supported Methods

### Ethereum (EIP-155)
- ✅ `eth_sendTransaction` - Send Ethereum transactions
- ✅ `personal_sign` - Sign messages
- ✅ `eth_sign` - Sign raw data
- ✅ `eth_signTypedData_v4` - Sign EIP-712 typed data
- ✅ `eth_signTransaction` - Sign without broadcasting

### Solana
- ⏳ `solana_signTransaction` (TODO)
- ⏳ `solana_signMessage` (TODO)

## Supported Chains
- ✅ Ethereum Mainnet (eip155:1)
- ✅ Polygon (eip155:137)
- ✅ BSC (eip155:56)
- ✅ Arbitrum (eip155:42161)
- ✅ Optimism (eip155:10)
- ⏳ Solana (solana:mainnet)

## Architecture

### Files Created
```
class/services/
  ├── walletconnect-service.ts          # Core WC service
  └── walletconnect-request-handler.ts  # Request handlers

screen/walletconnect/
  ├── WCPair.tsx                        # Scan QR / Pair
  ├── WCSessionRequest.tsx              # Approve connection
  ├── WCSignRequest.tsx                 # Sign transaction
  └── WCSessions.tsx                    # Manage sessions
```

### Integration Points
- `components/Context/StorageProvider.tsx` - Auto-init on app start
- `navigation/DetailViewScreensStack.tsx` - Screen routes
- `screen/settings/Settings.tsx` - Settings menu entry
- `screen/wallets/WalletsList.tsx` - Home screen button

## Testing

### Test with Popular DApps
1. **Uniswap** (https://app.uniswap.org)
   - Connect wallet → WalletConnect
   - Try a token swap

2. **OpenSea** (https://opensea.io)
   - Connect wallet
   - View your NFTs (once NFT support is added)

3. **PancakeSwap** (https://pancakeswap.finance)
   - Test multi-chain (BSC)

## Security Notes
- ⚠️ Always verify the DApp URL before approving
- ⚠️ Review transaction details carefully
- ⚠️ Sessions expire after 7 days by default
- ⚠️ Private keys never leave the device

## Troubleshooting

### "WalletConnect not initialized"
- Check that `WALLETCONNECT_PROJECT_ID` is set in `.env`
- Verify StorageProvider mounts correctly

### "Invalid URI"
- Ensure QR code starts with `wc:`
- Try pasting URI manually

### Sessions not persisting
- Sessions are stored in AsyncStorage automatically
- Clear app data to reset

## Next Steps (TODO)
- [ ] Add Solana request handlers
- [ ] Implement deep link support (`wc:` protocol)
- [ ] Add push notifications for requests
- [ ] Transaction simulation preview
- [ ] Gas fee estimation display
- [ ] Spending limits per session

## Resources
- [WalletConnect Docs](https://docs.walletconnect.com/)
- [Web3Wallet SDK](https://docs.walletconnect.com/web3wallet/about)
- [EIP-712 Spec](https://eips.ethereum.org/EIPS/eip-712)
