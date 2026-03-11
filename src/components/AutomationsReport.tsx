import React, { useMemo, useState } from 'react';
import type { Student } from '../utils/pco';
import {
    getUpcomingBirthdays,
    getPendingGradePromotions,
    getCollegeSendOffs,
    type BirthdayAction,
    type PromotionAction,
    type CollegeSendOffAction
} from '../utils/automations';
import './AutomationsReport.css';
import type { GraderOptions } from '../utils/grader';

interface AutomationsReportProps {
    students: Student[];
    graderOptions: GraderOptions;
}

export const AutomationsReport: React.FC<AutomationsReportProps> = ({ students, graderOptions }) => {
    // Note: To make this testable and consistent, we normally inject the date, but for the UI we use Date.now()
    // For demo purposes and to ensure "August" logic triggers, you might want to mock the date in tests.
    const today = new Date();

    const [dismissedBirthdays, setDismissedBirthdays] = useState<Set<string>>(new Set());
    const [dismissedPromotions, setDismissedPromotions] = useState<Set<string>>(new Set());
    const [dismissedSendOffs, setDismissedSendOffs] = useState<Set<string>>(new Set());

    const birthdays = useMemo(() => {
        return getUpcomingBirthdays(students, 7, today).filter(b => !dismissedBirthdays.has(b.person.id));
    }, [students, today, dismissedBirthdays]);

    const promotions = useMemo(() => {
        return getPendingGradePromotions(students, today, graderOptions).filter(p => !dismissedPromotions.has(p.person.id));
    }, [students, today, graderOptions, dismissedPromotions]);

    const sendOffs = useMemo(() => {
        return getCollegeSendOffs(students, today).filter(c => !dismissedSendOffs.has(c.person.id));
    }, [students, today, dismissedSendOffs]);

    const totalActions = birthdays.length + promotions.length + sendOffs.length;

    const handleDismissBirthday = (id: string) => setDismissedBirthdays(prev => new Set(prev).add(id));
    const handleDismissPromotion = (id: string) => setDismissedPromotions(prev => new Set(prev).add(id));
    const handleDismissSendOff = (id: string) => setDismissedSendOffs(prev => new Set(prev).add(id));

    // Simulated "Approve" actions
    const handleApprove = (id: string, action: string) => {
        alert(`Action "${action}" approved for student ${id}. (Mocked action)`);
        if (action === 'Email Parent') handleDismissBirthday(id);
        if (action === 'Promote Grade') handleDismissPromotion(id);
        if (action === 'Move to College') handleDismissSendOff(id);
    };

    return (
        <div className="automations-report">
            <header className="report-header">
                <h2>Locus Automate</h2>
                <p>Proactive ministry workflows based on your data.</p>
                <div className="status-badge">
                    {totalActions} Pending Actions
                </div>
            </header>

            <div className="automation-lanes">
                {/* Birthday Bot */}
                <section className="automation-lane">
                    <h3>
                        <span className="icon">🎂</span>
                        Birthday Bot (7 Days Out)
                        <span className="count">{birthdays.length}</span>
                    </h3>
                    {birthdays.length === 0 ? (
                        <p className="empty-state">No upcoming birthdays to process.</p>
                    ) : (
                        <ul className="action-list">
                            {birthdays.map(({ person, daysUntil }) => (
                                <li key={person.id} className="action-item">
                                    <div className="action-details">
                                        <strong>{person.name}</strong>
                                        <div className="meta">Turning {person.age + 1} in {daysUntil} days</div>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="btn-approve" onClick={() => handleApprove(person.id, 'Email Parent')}>Draft Email to Parent</button>
                                        <button className="btn-dismiss" onClick={() => handleDismissBirthday(person.id)}>Dismiss</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Grade Promotions */}
                <section className="automation-lane">
                    <h3>
                        <span className="icon">📈</span>
                        Grade Promotions
                        <span className="count">{promotions.length}</span>
                    </h3>
                    {promotions.length === 0 ? (
                        <p className="empty-state">No pending grade promotions.</p>
                    ) : (
                        <ul className="action-list">
                            {promotions.map(({ person, currentGrade, expectedGrade }) => (
                                <li key={person.id} className="action-item">
                                    <div className="action-details">
                                        <strong>{person.name}</strong>
                                        <div className="meta">Grade {currentGrade} → <strong>{expectedGrade}</strong></div>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="btn-approve" onClick={() => handleApprove(person.id, 'Promote Grade')}>Promote</button>
                                        <button className="btn-dismiss" onClick={() => handleDismissPromotion(person.id)}>Dismiss</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* College Send-offs */}
                <section className="automation-lane">
                    <h3>
                        <span className="icon">🎓</span>
                        College Send-offs (August Only)
                        <span className="count">{sendOffs.length}</span>
                    </h3>
                    {sendOffs.length === 0 ? (
                        <p className="empty-state">No pending college send-offs.</p>
                    ) : (
                        <ul className="action-list">
                            {sendOffs.map(({ person, age }) => (
                                <li key={person.id} className="action-item">
                                    <div className="action-details">
                                        <strong>{person.name}</strong>
                                        <div className="meta">Age {age} • Move to Young Adults</div>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="btn-approve" onClick={() => handleApprove(person.id, 'Move to College')}>Send-off</button>
                                        <button className="btn-dismiss" onClick={() => handleDismissSendOff(person.id)}>Dismiss</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
};
