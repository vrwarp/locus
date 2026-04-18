import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DigitalTithe } from './DigitalTithe';

describe('DigitalTithe Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders the component with initial state', () => {
    render(<DigitalTithe />);

    expect(screen.getByText('Digital Tithe Portal')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount (ETH)')).toHaveValue(0.1);
    expect(screen.getByText('Generate QR Code')).toBeInTheDocument();
    expect(screen.getByText('No transactions yet. Start giving above!')).toBeInTheDocument();
  });

  it('generates QR code when button is clicked', () => {
    render(<DigitalTithe />);

    const generateBtn = screen.getByText('Generate QR Code');
    fireEvent.click(generateBtn);

    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    expect(screen.getByText(/Wallet: 0xAb58...3fC9/i)).toBeInTheDocument();
    expect(screen.getByText('Simulate Scan & Send ETH')).toBeInTheDocument();
  });

  it('simulates a successful transaction and updates history', () => {
    render(<DigitalTithe />);

    // Change amount to 1 ETH (1 ETH = $3500 USD in mock)
    const input = screen.getByLabelText('Amount (ETH)');
    fireEvent.change(input, { target: { value: '1' } });

    // Generate QR
    const generateBtn = screen.getByText('Generate QR Code');
    fireEvent.click(generateBtn);

    // Simulate scan
    const simulateBtn = screen.getByText('Simulate Scan & Send ETH');
    fireEvent.click(simulateBtn);

    // Should show processing state
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(simulateBtn).toBeDisabled();

    // Fast forward timer to complete transaction
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // QR section should disappear
    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument();

    // History should update
    expect(screen.queryByText('No transactions yet. Start giving above!')).not.toBeInTheDocument();
    expect(screen.getByText('1 ETH')).toBeInTheDocument();
    expect(screen.getByText('($3,500.00)')).toBeInTheDocument(); // 1 * 3500
    expect(screen.getByText('completed')).toBeInTheDocument();

    // Summary should update
    const summaryValue = screen.getByText('$3,500.00');
    expect(summaryValue).toHaveClass('summary-value');
  });

  it('disables generation if amount is invalid or zero', () => {
    render(<DigitalTithe />);

    const input = screen.getByLabelText('Amount (ETH)');
    const generateBtn = screen.getByText('Generate QR Code');

    // Valid initial state
    expect(generateBtn).not.toBeDisabled();

    // Zero
    fireEvent.change(input, { target: { value: '0' } });
    expect(generateBtn).toBeDisabled();

    // Negative
    fireEvent.change(input, { target: { value: '-1' } });
    expect(generateBtn).toBeDisabled();

    // Empty
    fireEvent.change(input, { target: { value: '' } });
    expect(generateBtn).toBeDisabled();
  });

  it('accumulates total USD amount across multiple transactions', () => {
    render(<DigitalTithe />);

    const input = screen.getByLabelText('Amount (ETH)');
    const generateBtn = screen.getByText('Generate QR Code');

    // First tx: 0.1 ETH ($350)
    fireEvent.change(input, { target: { value: '0.1' } });
    fireEvent.click(generateBtn);
    fireEvent.click(screen.getByText('Simulate Scan & Send ETH'));
    act(() => vi.advanceTimersByTime(1500));

    // Second tx: 0.2 ETH ($700)
    fireEvent.change(input, { target: { value: '0.2' } });
    fireEvent.click(generateBtn);
    fireEvent.click(screen.getByText('Simulate Scan & Send ETH'));
    act(() => vi.advanceTimersByTime(1500));

    // Total should be $1050
    expect(screen.getByText('$1,050.00')).toBeInTheDocument();
    expect(screen.getByText('0.1 ETH')).toBeInTheDocument();
    expect(screen.getByText('0.2 ETH')).toBeInTheDocument();
  });
});
