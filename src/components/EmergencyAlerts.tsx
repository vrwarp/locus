import React, { useState, useMemo } from 'react';
import type { Student } from '../utils/pco';
import './EmergencyAlerts.css';

interface EmergencyAlertsProps {
  students: Student[];
}

export const EmergencyAlerts: React.FC<EmergencyAlertsProps> = ({ students }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Filter for students with a valid phone number property
  const recipients = useMemo(() => {
    return students.filter(s => s.phoneNumber && s.phoneNumber.trim() !== '');
  }, [students]);

  const handleSend = () => {
    if (!message.trim() || recipients.length === 0) return;

    setIsSending(true);
    setSentSuccess(false);

    // Mock API call to Twilio
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      setMessage('');

      // Reset success message after 5 seconds
      setTimeout(() => setSentSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="emergency-alerts-container">
      <header className="report-header">
        <h2>Emergency Alerts (Twilio)</h2>
        <p>Send an SMS blast to {recipients.length} members with valid phone numbers.</p>
      </header>

      <div className="alert-form-card">
        {sentSuccess && (
          <div className="alert-success">
            SMS blast sent successfully to {recipients.length} members!
          </div>
        )}

        <div className="form-group">
          <label htmlFor="message">Alert Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your emergency alert message here..."
            rows={5}
            disabled={isSending}
          />
          <div className="char-count">
            {message.length} characters ({(Math.ceil((message.length || 1) / 160))} SMS message(s))
          </div>
        </div>

        <button
          className="btn-send-alert"
          onClick={handleSend}
          disabled={isSending || !message.trim() || recipients.length === 0}
        >
          {isSending ? 'Sending...' : 'Send SMS Blast'}
        </button>

        {recipients.length === 0 && (
            <p className="no-recipients-warning">No valid phone numbers found in the database.</p>
        )}
      </div>
    </div>
  );
};
