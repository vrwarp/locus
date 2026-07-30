import React, { useMemo, useState } from 'react';
import type { Student } from '../utils/pco';
import {
    getUpcomingBirthdays,
    gradePromotionBacklog,
    getCollegeSendOffs,
    getExpiringBackgroundChecks,
    getExpiredBackgroundChecks,
    getFirstTimeGivers,
    getNewBabies,
    getElderlyCare
} from '../utils/automations';
import './AutomationsReport.css';
import type { GraderOptions } from '../utils/grader';

interface AutomationsReportProps {
    students: Student[];
    graderOptions: GraderOptions;
    /**
     * Writes the promotions to Planning Center. Absent means the screen has no
     * write path, in which case the Promote button is not rendered at all —
     * a control that claims to fix data and doesn't is worse than no control.
     */
    onPromoteGrades?: (updates: { original: Student, updated: Student }[]) => Promise<void>;
}

export const AutomationsReport: React.FC<AutomationsReportProps> = ({ students, graderOptions, onPromoteGrades }) => {
    // Note: To make this testable and consistent, we normally inject the date, but for the UI we use Date.now()
    // For demo purposes and to ensure "August" logic triggers, you might want to mock the date in tests.
    const today = new Date();

    const [dismissedBirthdays, setDismissedBirthdays] = useState<Set<string>>(new Set());
    const [dismissedPromotions, setDismissedPromotions] = useState<Set<string>>(new Set());
    const [dismissedSendOffs, setDismissedSendOffs] = useState<Set<string>>(new Set());
    const [dismissedExpiringChecks, setDismissedExpiringChecks] = useState<Set<string>>(new Set());
    const [dismissedExpiredChecks, setDismissedExpiredChecks] = useState<Set<string>>(new Set());
    const [dismissedNewBabies, setDismissedNewBabies] = useState<Set<string>>(new Set());
    const [dismissedFirstTimeGivers, setDismissedFirstTimeGivers] = useState<Set<string>>(new Set());
    const [dismissedElderlyCare, setDismissedElderlyCare] = useState<Set<string>>(new Set());
    const [promotionConfirm, setPromotionConfirm] = useState('');
    const [promoting, setPromoting] = useState(false);

    const newBabies = useMemo(() => {
        return getNewBabies(students).filter(s => !dismissedNewBabies.has(s.id));
    }, [students, dismissedNewBabies]);

    const birthdays = useMemo(() => {
        return getUpcomingBirthdays(students, 7, today).filter(b => !dismissedBirthdays.has(b.person.id));
    }, [students, today, dismissedBirthdays]);

    const { readyToPromote, needsReview } = useMemo(
        () => gradePromotionBacklog(students, today, graderOptions),
        [students, today, graderOptions]);

    const promotions = useMemo(
        () => readyToPromote.filter(p => !dismissedPromotions.has(p.person.id)),
        [readyToPromote, dismissedPromotions]);

    const sendOffs = useMemo(() => {
        return getCollegeSendOffs(students, today).filter(c => !dismissedSendOffs.has(c.person.id));
    }, [students, today, dismissedSendOffs]);

    const expiringChecks = useMemo(() => {
        return getExpiringBackgroundChecks(students, 30, today).filter(c => !dismissedExpiringChecks.has(c.person.id));
    }, [students, today, dismissedExpiringChecks]);

    const expiredChecks = useMemo(() => {
        return getExpiredBackgroundChecks(students, today).filter(c => !dismissedExpiredChecks.has(c.person.id));
    }, [students, today, dismissedExpiredChecks]);

    const firstTimeGivers = useMemo(() => {
        return getFirstTimeGivers(students, 7, today).filter(g => !dismissedFirstTimeGivers.has(g.person.id));
    }, [students, today, dismissedFirstTimeGivers]);

    const elderlyCare = useMemo(() => {
        return getElderlyCare(students).filter(s => !dismissedElderlyCare.has(s.id));
    }, [students, dismissedElderlyCare]);

    const totalActions = birthdays.length + promotions.length + sendOffs.length + expiringChecks.length + expiredChecks.length + firstTimeGivers.length + elderlyCare.length;

    const handleDismissBirthday = (id: string) => setDismissedBirthdays(prev => new Set(prev).add(id));
    const handleDismissPromotion = (id: string) => setDismissedPromotions(prev => new Set(prev).add(id));
    const handleDismissSendOff = (id: string) => setDismissedSendOffs(prev => new Set(prev).add(id));
    const handleDismissExpiringCheck = (id: string) => setDismissedExpiringChecks(prev => new Set(prev).add(id));
    const handleDismissExpiredCheck = (id: string) => setDismissedExpiredChecks(prev => new Set(prev).add(id));
    const handleDismissNewBaby = (id: string) => setDismissedNewBabies(prev => new Set(prev).add(id));
    const handleDismissFirstTimeGiver = (id: string) => setDismissedFirstTimeGivers(prev => new Set(prev).add(id));
    const handleDismissElderlyCare = (id: string) => setDismissedElderlyCare(prev => new Set(prev).add(id));

    // Simulated "Approve" actions
    const handleApprove = (id: string, action: string) => {
        alert(`Action "${action}" approved for student ${id}. (Mocked action)`);
        if (action === 'Email Parent') handleDismissBirthday(id);
        if (action === 'Move to College') handleDismissSendOff(id);
        if (action === 'Email Reminder') handleDismissExpiringCheck(id);
        if (action === 'Remove from Roster') handleDismissExpiredCheck(id);
        if (action === 'Send DoorDash') handleDismissNewBaby(id);
        if (action === 'Send Slack Alert') handleDismissFirstTimeGiver(id);
        if (action === 'Send Uber Ride') handleDismissElderlyCare(id);
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
                {/* First Time Giver Alert */}
                <section className="automation-lane">
                    <h3>
                        <span className="icon">🎉</span>
                        First Time Giver Alert
                        <span className="count">{firstTimeGivers.length}</span>
                    </h3>
                    {firstTimeGivers.length === 0 ? (
                        <p className="empty-state">No new first time givers this week.</p>
                    ) : (
                        <ul className="action-list">
                            {firstTimeGivers.map(({ person, daysSinceFirstGift }) => (
                                <li key={person.id} className="action-item">
                                    <div className="action-details">
                                        <strong>{person.name}</strong>
                                        <div className="meta">Gave {daysSinceFirstGift === 0 ? 'today' : `${daysSinceFirstGift} days ago`}</div>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="btn-approve" onClick={() => handleApprove(person.id, 'Send Slack Alert')}>Notify Pastor in Slack</button>
                                        <button className="btn-dismiss" onClick={() => handleDismissFirstTimeGiver(person.id)}>Dismiss</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* New Baby Alert (DoorDash) */}
                <section className="automation-lane">
                    <h3>
                        <span className="icon">🍼</span>
                        New Baby Alert (DoorDash)
                        <span className="count">{newBabies.length}</span>
                    </h3>
                    {newBabies.length === 0 ? (
                        <p className="empty-state">No new babies detected.</p>
                    ) : (
                        <ul className="action-list">
                            {newBabies.map((person) => (
                                <li key={person.id} className="action-item">
                                    <div className="action-details">
                                        <strong>{person.name}</strong>
                                        <div className="meta">Age 0 • Send Meal</div>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="btn-approve" onClick={() => handleApprove(person.id, 'Send DoorDash')}>Send DoorDash Meal</button>
                                        <button className="btn-dismiss" onClick={() => handleDismissNewBaby(person.id)}>Dismiss</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Elderly Care (Uber Rides) */}
                <section className="automation-lane">
                    <h3>
                        <span className="icon">🚗</span>
                        Elderly Care (Uber Rides)
                        <span className="count">{elderlyCare.length}</span>
                    </h3>
                    {elderlyCare.length === 0 ? (
                        <p className="empty-state">No elderly care actions needed.</p>
                    ) : (
                        <ul className="action-list">
                            {elderlyCare.map((person) => (
                                <li key={person.id} className="action-item">
                                    <div className="action-details">
                                        <strong>{person.name}</strong>
                                        <div className="meta">Age {person.age} • Needs Sunday Ride</div>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="btn-approve" onClick={() => handleApprove(person.id, 'Send Uber Ride')}>Send Uber Ride</button>
                                        <button className="btn-dismiss" onClick={() => handleDismissElderlyCare(person.id)}>Dismiss</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

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

                {/* Expiring Background Checks */}
                <section className="automation-lane">
                    <h3>
                        <span className="icon">⚠️</span>
                        Background Checks (Expiring Soon)
                        <span className="count">{expiringChecks.length}</span>
                    </h3>
                    {expiringChecks.length === 0 ? (
                        <p className="empty-state">No background checks expiring soon.</p>
                    ) : (
                        <ul className="action-list">
                            {expiringChecks.map(({ person, daysUntilExpiry }) => (
                                <li key={person.id} className="action-item">
                                    <div className="action-details">
                                        <strong>{person.name}</strong>
                                        <div className="meta">Expires in {daysUntilExpiry} days</div>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="btn-approve" onClick={() => handleApprove(person.id, 'Email Reminder')}>Email Reminder</button>
                                        <button className="btn-dismiss" onClick={() => handleDismissExpiringCheck(person.id)}>Dismiss</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Expired Background Checks */}
                <section className="automation-lane">
                    <h3>
                        <span className="icon">🛑</span>
                        Expired Background Checks (Safe Sanctuary)
                        <span className="count critical">{expiredChecks.length}</span>
                    </h3>
                    {expiredChecks.length === 0 ? (
                        <p className="empty-state">No expired background checks.</p>
                    ) : (
                        <ul className="action-list">
                            {expiredChecks.map(({ person, daysUntilExpiry }) => (
                                <li key={person.id} className="action-item critical-item">
                                    <div className="action-details">
                                        <strong>{person.name}</strong>
                                        <div className="meta">Expired {Math.abs(daysUntilExpiry)} days ago</div>
                                    </div>
                                    <div className="action-buttons">
                                        <button className="btn-approve critical" onClick={() => handleApprove(person.id, 'Remove from Roster')}>Remove from Roster</button>
                                        <button className="btn-dismiss" onClick={() => handleDismissExpiredCheck(person.id)}>Dismiss</button>
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
                        <>
                            <p className="lane-note">
                                One grade behind the school year, which is the ordinary August
                                rollover. Promoting writes the new grade to Planning Center for
                                everyone listed; Undo reverses it.
                            </p>
                            <ul className="action-list">
                                {promotions.map(({ person, currentGrade, expectedGrade }) => (
                                    <li key={person.id} className="action-item">
                                        <div className="action-details">
                                            <strong>{person.name}</strong>
                                            <div className="meta">Grade {currentGrade} → <strong>{expectedGrade}</strong></div>
                                        </div>
                                        <div className="action-buttons">
                                            <button className="btn-dismiss" onClick={() => handleDismissPromotion(person.id)}>Skip</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            {onPromoteGrades && (
                                <div className="lane-commit">
                                    <label htmlFor="promote-confirm">
                                        Type <b>PROMOTE</b> to roll over all {promotions.length}
                                    </label>
                                    <input
                                        id="promote-confirm"
                                        type="text"
                                        value={promotionConfirm}
                                        onChange={(e) => setPromotionConfirm(e.target.value)}
                                        disabled={promoting}
                                        autoComplete="off"
                                    />
                                    <button
                                        className="btn-approve"
                                        disabled={promoting || promotionConfirm.trim().toUpperCase() !== 'PROMOTE'}
                                        onClick={async () => {
                                            setPromoting(true);
                                            try {
                                                await onPromoteGrades(promotions.map(({ person, expectedGrade }) => ({
                                                    original: person,
                                                    updated: { ...person, pcoGrade: expectedGrade },
                                                })));
                                                setPromotionConfirm('');
                                            } finally {
                                                setPromoting(false);
                                            }
                                        }}
                                    >
                                        {promoting ? 'Writing to Planning Center…' : `Promote ${promotions.length}`}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* Grades that are further out than a rollover explains */}
                {needsReview.length > 0 && (
                    <section className="automation-lane">
                        <h3>
                            <span className="icon">🔎</span>
                            Grades needing a look
                            <span className="count">{needsReview.length}</span>
                        </h3>
                        <p className="lane-note">
                            Two or more grades behind, so this is not the annual rollover — more
                            likely a wrong birthdate or a grade that was never updated. These are
                            not promoted in bulk; check them individually in Data Health.
                        </p>
                        <ul className="action-list">
                            {needsReview.map(({ person, currentGrade, expectedGrade }) => (
                                <li key={person.id} className="action-item">
                                    <div className="action-details">
                                        <strong>{person.name}</strong>
                                        <div className="meta">On file as {currentGrade}, school year suggests {expectedGrade}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

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
