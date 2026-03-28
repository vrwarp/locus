import type { Student } from './pco';

export interface PrayerMatch {
    personA: Student;
    personB?: Student; // Optional if odd number
    topic: string;
}

export const matchPrayerPartners = (people: Student[]): PrayerMatch[] => {
    // 1. Filter and group by prayerTopic
    const groups = new Map<string, Student[]>();

    people.forEach(person => {
        if (person.prayerTopic) {
            const topic = person.prayerTopic;
            if (!groups.has(topic)) {
                groups.set(topic, []);
            }
            groups.get(topic)!.push(person);
        }
    });

    const matches: PrayerMatch[] = [];

    // 2. Shuffle and pair within each group
    groups.forEach((students, topic) => {
        // Simple Fisher-Yates shuffle
        const shuffled = [...students];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        // Pair them up
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                matches.push({
                    personA: shuffled[i],
                    personB: shuffled[i + 1],
                    topic
                });
            } else {
                // Odd person out
                matches.push({
                    personA: shuffled[i],
                    topic
                });
            }
        }
    });

    return matches;
};
