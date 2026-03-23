import React, { useState, useEffect } from 'react';
import './NewsletterArchitect.css';
import { generateNewsletterDraft } from '../utils/newsletter';
import { Student, PcoEvent } from '../utils/pco';

interface NewsletterArchitectProps {
    students: Student[];
    events: PcoEvent[];
}

export const NewsletterArchitect: React.FC<NewsletterArchitectProps> = ({ students, events }) => {
    const [draft, setDraft] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setDraft(generateNewsletterDraft(events, students));
    }, [events, students]);

    const handleCopy = () => {
        navigator.clipboard.writeText(draft).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="newsletter-architect">
            <header className="report-header">
                <h2>The Newsletter Architect</h2>
                <p>AI-drafted weekly newsletter based on upcoming calendar events and student birthdays.</p>

                <div className="header-actions">
                    <button
                        className={`action-button ${copied ? 'success' : 'primary'}`}
                        onClick={handleCopy}
                    >
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                </div>
            </header>

            <div className="report-content">
               <textarea
                   className="markdown-editor"
                   value={draft}
                   onChange={(e) => setDraft(e.target.value)}
                   spellCheck="false"
               />
            </div>
        </div>
    );
};