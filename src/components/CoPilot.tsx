import React, { useState, useEffect, useRef } from 'react';
import './CoPilot.css';
import { processQuery, type CoPilotContext } from '../utils/copilot';
import type { Student } from '../utils/pco';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import { calculateHealthStats } from '../utils/analytics';

interface CoPilotProps {
  students: Student[];
  auth: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  data?: any[];
  timestamp: number;
}

export const CoPilot: React.FC<CoPilotProps> = ({ students, auth }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hi! I'm Locus, your Pastoral Co-Pilot. I can help you find health stats, burnout risks, or specific students. Try asking 'What is my health score?' or 'Find high burnout risk'.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<CoPilotContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load context on mount
  useEffect(() => {
    let isMounted = true;
    const loadContext = async () => {
      if (!auth) return;
      try {
        const [events, checkIns] = await Promise.all([
          fetchEvents(auth),
          fetchRecentCheckIns(auth)
        ]);

        if (isMounted) {
            const stats = calculateHealthStats(students);
            setContext({
                students,
                checkIns,
                events,
                stats
            });
        }
      } catch (error) {
        console.error("CoPilot failed to load context", error);
      }
    };
    loadContext();
    return () => { isMounted = false; };
  }, [auth, students]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !context) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate processing delay for "natural" feel
    setTimeout(() => {
        const response = processQuery(userMsg.text, context);

        const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: response.message,
            data: response.data,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    }, 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="copilot-container">
      <div className="copilot-header">
        <span style={{fontSize: '1.5rem'}}>🤖</span>
        <h2>Pastoral Co-Pilot</h2>
      </div>

      <div className="copilot-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className="message-content">{msg.text}</div>

            {msg.data && msg.data.length > 0 && (
                <div className="data-card-list">
                    {msg.data.map((item: any, idx: number) => (
                        <div key={idx} className="data-card">
                            <span className="card-icon">{item.icon || '📄'}</span>
                            <div className="card-info">
                                <span className="card-primary">{item.primary}</span>
                                {item.secondary && <span className="card-secondary">{item.secondary}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        ))}
        {isTyping && (
           <div className="message bot typing-indicator">
               <div className="typing-dot"></div>
               <div className="typing-dot"></div>
               <div className="typing-dot"></div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="copilot-input-area">
        <input
          type="text"
          placeholder="Ask Locus something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={!context}
        />
        <button onClick={handleSend} disabled={!context || !input.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
};
