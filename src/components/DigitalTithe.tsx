import React, { useState } from 'react';
import './DigitalTithe.css';

interface Transaction {
  id: string;
  ethAmount: number;
  usdAmount: number;
  date: string;
  status: 'pending' | 'completed';
}

export const DigitalTithe: React.FC = () => {
  const [ethAmount, setEthAmount] = useState<string>('0.1');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showQR, setShowQR] = useState<boolean>(false);

  // Mock conversion rate
  const ethToUsdRate = 3500;

  const handleGenerateQR = () => {
    setShowQR(true);
  };

  const handleSimulateScan = () => {
    setIsSimulating(true);

    setTimeout(() => {
      const parsedEth = parseFloat(ethAmount) || 0;
      const usdValue = parsedEth * ethToUsdRate;

      const newTx: Transaction = {
        id: `tx-${Math.random().toString(36).substr(2, 9)}`,
        ethAmount: parsedEth,
        usdAmount: usdValue,
        date: new Date().toISOString(),
        status: 'completed'
      };

      setTransactions(prev => [newTx, ...prev]);
      setIsSimulating(false);
      setShowQR(false);
    }, 1500);
  };

  const totalUsdDonated = transactions.reduce((acc, tx) => acc + tx.usdAmount, 0);

  return (
    <div className="digital-tithe-container">
      <header className="tithe-header">
        <h2>Digital Tithe Portal</h2>
        <p>Support the ministry securely via cryptocurrency.</p>
      </header>

      <div className="tithe-content">
        <div className="tithe-panel donate-panel">
          <h3>Make a Donation</h3>

          <div className="input-group">
            <label htmlFor="eth-amount">Amount (ETH)</label>
            <div className="input-wrapper">
              <span className="currency-symbol">Ξ</span>
              <input
                id="eth-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <p className="usd-preview">
              ≈ ${(parseFloat(ethAmount || '0') * ethToUsdRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </p>
          </div>

          <button
            className="primary-btn generate-btn"
            onClick={handleGenerateQR}
            disabled={!parseFloat(ethAmount) || parseFloat(ethAmount) <= 0}
          >
            Generate QR Code
          </button>

          {showQR && (
            <div className="qr-section">
              <div className="qr-placeholder" data-testid="qr-code">
                <div className="qr-squares"></div>
              </div>
              <p className="wallet-address">Wallet: 0xAb58...3fC9</p>

              <button
                className="simulate-btn"
                onClick={handleSimulateScan}
                disabled={isSimulating}
              >
                {isSimulating ? 'Processing...' : 'Simulate Scan & Send ETH'}
              </button>
            </div>
          )}
        </div>

        <div className="tithe-panel history-panel">
          <h3>Your Giving History</h3>
          <div className="history-summary">
            <span className="summary-label">Total Given (USD Equivalent):</span>
            <span className="summary-value">${totalUsdDonated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {transactions.length === 0 ? (
            <p className="empty-state">No transactions yet. Start giving above!</p>
          ) : (
            <ul className="transaction-list">
              {transactions.map(tx => (
                <li key={tx.id} className="transaction-item">
                  <div className="tx-details">
                    <span className="tx-eth">{tx.ethAmount} ETH</span>
                    <span className="tx-usd">(${tx.usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                  </div>
                  <div className="tx-meta">
                    <span className="tx-date">{new Date(tx.date).toLocaleDateString()}</span>
                    <span className={`tx-status ${tx.status}`}>{tx.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
