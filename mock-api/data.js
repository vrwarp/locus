import { addDays, eachWeekOfInterval, getDay, isSameWeek, setHours, setMinutes, formatISO } from 'date-fns';

export const people = [];
export const events = [];
export const checkIns = [];
export const donations = [];
export const groupMemberships = [];

// --- Helpers ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const femaleNames = ['Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia', 'Harper', 'Evelyn'];
const maleNames = ['Liam', 'Noah', 'Oliver', 'Elijah', 'William', 'James', 'Benjamin', 'Lucas', 'Henry', 'Alexander'];

let personIdCounter = 1;
let checkInIdCounter = 1;
let donationIdCounter = 1;
let membershipIdCounter = 1;

// --- Generators ---

// 1. Generate Households
const generateHouseholds = () => {
  const householdCount = 35; // Target ~30-40

  for (let i = 0; i < householdCount; i++) {
    const lastName = randomItem(lastNames);

    // 1-2 Adults
    const adultCount = randomInt(1, 2);
    const adults = [];
    for (let a = 0; a < adultCount; a++) {
      const isFemale = Math.random() > 0.5;
      const firstName = randomItem(isFemale ? femaleNames : maleNames);
      const adult = {
        id: String(personIdCounter++),
        type: 'Person',
        attributes: {
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`,
          child: false,
          grade: null,
          birthdate: `${randomInt(1975, 1995)}-01-01`, // Rough adult age
          phone_numbers: [{ location: 'Mobile', number: `555-${randomInt(100, 999)}-${randomInt(1000, 9999)}` }],
          email_addresses: [{ location: 'Home', address: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1,99)}@example.com` }]
        }
      };
      people.push(adult);
      adults.push(adult);
    }

    // 1-4 Children
    const childCount = randomInt(1, 4);
    for (let c = 0; c < childCount; c++) {
      const isFemale = Math.random() > 0.5;
      const firstName = randomItem(isFemale ? femaleNames : maleNames);

      // Age 5-11 (Grades K-5)
      // Current year approx 2024/2025 context.
      // Born 2014 (10yo, Gr5) to 2019 (5yo, K)
      const birthYear = randomInt(2014, 2019);
      // Simple grade calc: Year - 5 (approx)
      // 2019 (5) -> 0 (K)
      // 2014 (10) -> 5
      // Current date mock: late 2024
      const currentYear = 2024;
      const age = currentYear - birthYear;
      const grade = Math.max(0, age - 5);

      const child = {
        id: String(personIdCounter++),
        type: 'Person',
        attributes: {
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`,
          child: true,
          grade: grade,
          birthdate: `${birthYear}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
          household_id: adults[0].id // Loose linking for mock
        }
      };
      people.push(child);
    }
  }
};

// 2. Generate Events
const generateEvents = () => {
  events.push(
    {
      id: '1',
      type: 'Event',
      attributes: { name: 'Friday Night Live', frequency: 'weekly' }
    },
    {
      id: '2',
      type: 'Event',
      attributes: { name: 'Sunday Kids Church', frequency: 'weekly' }
    }
  );
};

// 3. Generate Check-Ins
const generateCheckIns = () => {
  const yearStart = new Date(2024, 0, 1); // Jan 1 2024
  const yearEnd = new Date(2024, 11, 31);

  // Retreat Week: 2nd Week of July 2024 (approx July 7-13)
  const retreatStart = new Date(2024, 6, 7); // Month is 0-indexed
  const retreatEnd = new Date(2024, 6, 14);

  const isRetreatWeek = (date) => {
    return date >= retreatStart && date < retreatEnd;
  };

  const weeks = eachWeekOfInterval({ start: yearStart, end: yearEnd });

  // Get all children for check-ins
  // Leave 20% of children as "Ghosts" (never check in)
  const children = people.filter(p => p.attributes.child);
  const activeChildren = children.filter(() => Math.random() > 0.2);

  weeks.forEach(weekStart => {
    // Skip if ANY day in this week falls in retreat?
    // Simply check if the specific event date falls in retreat

    // 1. Friday Night (Friday 7pm)
    // weekStart is usually Sunday or Monday depending on locale, let's derive Friday
    // date-fns startOfWeek defaults to Sunday.
    // Sunday = 0, Friday = 5.

    const sundayDate = addDays(weekStart, 0); // Assuming week starts Sunday
    const fridayDate = addDays(weekStart, 5);

    // Setup Friday Event (Event 1)
    if (!isRetreatWeek(fridayDate) && fridayDate <= yearEnd) {
      const eventTime = setMinutes(setHours(fridayDate, 19), 0); // 19:00

      // Randomly select kids (e.g. 60%)
      activeChildren.forEach(child => {
        if (Math.random() < 0.6) {
          checkIns.push({
            id: String(checkInIdCounter++),
            type: 'CheckIn',
            attributes: {
              created_at: formatISO(eventTime),
              kind: 'Regular'
            },
            relationships: {
              person: { data: { type: 'Person', id: child.id } },
              event: { data: { type: 'Event', id: '1' } }
            }
          });
        }
      });
    }

    // Setup Sunday Event (Event 2) (Sunday 10am)
    if (!isRetreatWeek(sundayDate) && sundayDate <= yearEnd) {
      const eventTime = setMinutes(setHours(sundayDate, 10), 0); // 10:00

      // Higher attendance on Sundays (e.g. 80%)
      activeChildren.forEach(child => {
        if (Math.random() < 0.8) {
          checkIns.push({
            id: String(checkInIdCounter++),
            type: 'CheckIn',
            attributes: {
              created_at: formatISO(eventTime),
              kind: 'Regular'
            },
            relationships: {
              person: { data: { type: 'Person', id: child.id } },
              event: { data: { type: 'Event', id: '2' } }
            }
          });
        }
      });
    }
  });
};

// 4. Generate Donations
const generateDonations = () => {
    // Adults and older kids (Grade 10+) might give
    const potentialDonors = people.filter(p => !p.attributes.child || (p.attributes.grade !== null && p.attributes.grade >= 10));

    potentialDonors.forEach(donor => {
        // 30% are donors
        if (Math.random() < 0.3) {
             const donationCount = randomInt(1, 12); // Once a month
             for(let i=0; i<donationCount; i++) {
                 donations.push({
                     id: String(donationIdCounter++),
                     type: 'Donation',
                     attributes: {
                         amount_cents: randomInt(1000, 50000), // $10 - $500
                         created_at: formatISO(new Date(2024, randomInt(0, 11), randomInt(1, 28)))
                     },
                     relationships: {
                         person: { data: { type: 'Person', id: donor.id } }
                     }
                 });
             }
        }
    });
};

// 5. Generate Group Memberships
const generateGroupMemberships = () => {
    // Adults and older kids in groups
    const potentialMembers = people.filter(p => !p.attributes.child || (p.attributes.grade !== null && p.attributes.grade >= 6));

    potentialMembers.forEach(member => {
        // 40% are in a group
        if (Math.random() < 0.4) {
             groupMemberships.push({
                 id: String(membershipIdCounter++),
                 type: 'GroupMembership',
                 attributes: {
                     role: 'member'
                 },
                 relationships: {
                     person: { data: { type: 'Person', id: member.id } },
                     group: { data: { type: 'Group', id: '1' } } // Dummy Group ID
                 }
             });
        }
    });
};

// Execute
generateHouseholds();
generateEvents();
generateCheckIns();
generateDonations();
generateGroupMemberships();
