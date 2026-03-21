import React, { useEffect, useState } from 'react';
import type { Student, PcoEvent } from '../utils/pco';
import { fetchEvents } from '../utils/pco';
import { generateNewsletterDraft } from '../utils/newsletter';
import './NewsletterArchitect.css';

interface NewsletterArchitectProps {
    students: Student[];
    auth: string;
}

export const NewsletterArchitect: React.FC<NewsletterArchitectProps> = ({ students, auth }) => {
    const [events, setEvents] = useState<PcoEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [draft, setDraft] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const loadEvents = async () => {
            setLoading(true);
            try {
                const fetchedEvents = await fetchEvents(auth);
                if (isMounted) {
                    setEvents(fetchedEvents);
                    setDraft(generateNewsletterDraft(fetchedEvents, students));
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Failed to load events for newsletter:', err);
                    setError('Failed to load upcoming events.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (auth) {
            loadEvents();
        }
    }, [auth, students]);

    const handleCopy = () => {
        navigator.clipboard.writeText(draft).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    if (loading) return <div className="loading-spinner">Drafting Newsletter...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="newsletter-architect">
            <header className="report-header">
                <h2>The Newsletter Architect</h2>
                <p>AI-assisted weekly newsletter drafts based on upcoming calendar events and birthdays.</p>
            </header>

            <div className="newsletter-container">
                <div className="newsletter-actions">
                    <button className="settings-btn primary" onClick={handleCopy}>
                        {copied ? 'Copied to Clipboard! ✓' : 'Copy Newsletter (Markdown)'}
                    </button>
                    <button className="settings-btn" onClick={() => setDraft(generateNewsletterDraft(events, students))}>
                        Regenerate
                    </button>
                </div>

                <div className="newsletter-preview">
                    <textarea
                        className="newsletter-editor"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        aria-label="Newsletter Draft"
                    />
                </div>
            </div>
        </div>
    );
};
