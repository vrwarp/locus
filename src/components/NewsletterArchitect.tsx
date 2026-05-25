import React, { useState, useEffect, useMemo } from 'react';
import { fetchEvents } from '../utils/pco';
import type { Student, PcoEvent } from '../utils/pco';
import { generateNewsletter } from '../utils/newsletter';
import { GENERATIONS } from '../utils/demographics';
import './NewsletterArchitect.css';

interface NewsletterArchitectProps {
    students: Student[];
    auth: string;
}

export const NewsletterArchitect: React.FC<NewsletterArchitectProps> = ({ students, auth }) => {
    const [events, setEvents] = useState<PcoEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

const [sermonTopic, setSermonTopic] = useState('');
    const [pastorNotes, setPastorNotes] = useState('');
    const [targetAudience, setTargetAudience] = useState('All');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadEvents = async () => {
            if (!auth) return;
            try {
                setLoading(true);
                setError(null);
                const fetchedEvents = await fetchEvents(auth);
                setEvents(fetchedEvents);
            } catch (err) {
                console.error("Error loading events for newsletter:", err);
                setError("Failed to load events. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        loadEvents();
    }, [auth]);

    const generatedMarkdown = useMemo(() => {
        let filteredStudents = students;
        if (targetAudience !== 'All') {
            const gen = GENERATIONS.find(g => g.name === targetAudience);
            if (gen) {
                filteredStudents = students.filter(s => {
                    if (!s.birthdate) return false;
                    const birthYear = new Date(s.birthdate).getFullYear();
                    return birthYear >= gen.start && birthYear <= gen.end;
                });
            }
        }
        return generateNewsletter(events, filteredStudents, {
            sermonTopic: sermonTopic.trim(),
            pastorNotes: pastorNotes.trim()
        });
    }, [events, students, sermonTopic, pastorNotes, targetAudience]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedMarkdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return <div className="newsletter-architect"><div className="loading-state">Loading Newsletter Data...</div></div>;
    }

    if (error) {
        return <div className="newsletter-architect"><div className="error-state">{error}</div></div>;
    }

    return (
        <div className="newsletter-architect">
            <div className="newsletter-header">
                <h2>Newsletter Architect</h2>
                <p>AI-assisted markdown drafts based on upcoming calendar events and student birthdays.</p>
            </div>

            <div className="newsletter-content">
                <div className="newsletter-controls">
                    <div className="control-group">
                        <label htmlFor="sermonTopic">Sermon Topic (Optional)</label>
                        <input
                            type="text"
                            id="sermonTopic"
                            placeholder="e.g. The Prodigal Son"
                            value={sermonTopic}
                            onChange={(e) => setSermonTopic(e.target.value)}
                        />
                    </div>

                    <div className="control-group">
                        <label htmlFor="pastorNotes">Pastor's Notes (Optional)</label>
                        <textarea
                            id="pastorNotes"
                            placeholder="Write a brief intro message to the congregation..."
                            value={pastorNotes}
                            onChange={(e) => setPastorNotes(e.target.value)}
                        />
                    </div>

                    <div className="control-group">
                        <label htmlFor="targetAudience">Target Audience</label>
                        <select
                            id="targetAudience"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                        >
                            <option value="All">All</option>
                            <option value="Gen Alpha">Gen Alpha</option>
                            <option value="Gen Z">Gen Z</option>
                            <option value="Millennials">Millennials</option>
                            <option value="Gen X">Gen X</option>
                            <option value="Boomers">Boomers</option>
                            <option value="Silent">Silent</option>
                            <option value="Greatest">Greatest</option>
                        </select>
                    </div>
                </div>

                <div className="newsletter-preview">
                    <div className="preview-header">
                        <h3>Markdown Preview</h3>
                        <button
                            className={`copy-button ${copied ? 'success' : ''}`}
                            onClick={handleCopy}
                        >
                            {copied ? 'Copied!' : 'Copy Markdown'}
                        </button>
                    </div>
                    <div className="preview-markdown">
                        {generatedMarkdown}
                    </div>
                </div>
            </div>
        </div>
    );
};
