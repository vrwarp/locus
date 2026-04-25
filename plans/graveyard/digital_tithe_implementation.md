# Digital Tithe Implementation Notes

## Overview
Implemented "The Digital Tithe" (Concept #40). This feature provides a mock frontend flow for converting cryptocurrency (ETH) into standard church donations (USD).

## What Was Done
1. **Component Creation**:
   - `src/components/DigitalTithe.tsx`
   - `src/components/DigitalTithe.css`
   - Created an interactive UI mimicking a digital crypto wallet donation portal.
   - Built a dynamic mock QR code using CSS gradients.
   - Handled state transitions for generating the QR code, simulating a scan/send from an external device, and recording the final transaction.
   - Used a static conversion rate ($3,500/ETH) to map crypto to USD.

2. **Integration**:
   - Added a new navigation item in `src/components/Sidebar.tsx` under the "Giving" section.
   - Wired up the route in `src/App.tsx` conditionally rendering based on `currentView === 'digital-tithe'`.

3. **Testing**:
   - Created `src/components/DigitalTithe.test.tsx`.
   - Used `vi.useFakeTimers()` to verify the 1.5-second simulated network delay correctly transforms the UI state from 'Processing...' to success.
   - Tested edge cases (disabling generation for zero or empty inputs).

## Discoveries
- Faking timers with Vitest in functional components (`act(() => vi.advanceTimersByTime(...))`) is highly reliable for simulating these "wait for scan" and "wait for network" UX flows without slowing down the test runner.
- Rendering a CSS-only QR code placeholder is a clean way to mock external device integration (like scanning via a phone) without needing external image assets or complex SVG libraries in a prototype context.

## Future Ideas
- **Dynamic Conversion Rates**: Instead of a hardcoded rate, hit a real crypto API (like CoinGecko) to get the live ETH/USD price.
- **Smart Contract Integration**: Connect a library like `ethers.js` or `wagmi` to allow a user to connect a real MetaMask or WalletConnect wallet and send actual testnet ETH.
- **PCO Integration**: Use the Planning Center API to actually log the USD equivalent into the user's `Donations` tab after a successful on-chain transaction.