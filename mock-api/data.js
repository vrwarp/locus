import { addDays, eachWeekOfInterval, getDay, isSameWeek, setHours, setMinutes, formatISO } from 'date-fns';

export const people = [];
export const events = [];
export const checkIns = [];
export const groups = [];
export const groupMemberships = [];

// --- Helpers ---
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const femaleNames = ['Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia', 'Harper', 'Evelyn'];
const maleNames = ['Liam', 'Noah', 'Oliver', 'Elijah', 'William', 'James', 'Benjamin', 'Lucas', 'Henry', 'Alexander'];

let personIdCounter = 1;
let checkInIdCounter = 1;

// --- Generators ---

// 1. Generate Households
const generateHouseholds = () => {
  const householdCount = 35; // Target ~30-40

  for (let i = 0; i < householdCount; i++) {
    const lastName = randomItem(lastNames);

    // 1-2 Adults
    const adultCount = randomInt(1, 2);
    const adults = [];
    const householdId = String(personIdCounter); // Use the ID of the first adult as the household ID

    // Generate shared household address
    const streetNum = randomInt(100, 9999);
    const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Ct'];
    const cities = ['Springfield', 'Rivertown', 'Lakeside', 'Hill Valley'];
    const street = `${streetNum} ${randomItem(streets)}`;
    const city = randomItem(cities);
    const state = 'CA';
    const zip = String(randomInt(90000, 99999));

    // Address Anomaly Generator (5% chance)
    const hasAddressAnomaly = Math.random() < 0.05;
    const householdAddress = {
        street: street,
        city: city,
        state: state,
        zip: hasAddressAnomaly ? '' : zip, // Missing Zip
        location: 'Home'
    };

    // Spouse Gap Generator (5% chance, only if 2 adults)
    const hasSpouseGap = adultCount === 2 && Math.random() < 0.05;

    // Split Household Generator (5% chance)
    const hasSplitHousehold = Math.random() < 0.05;

    for (let a = 0; a < adultCount; a++) {
      const isFemale = Math.random() > 0.5;
      const firstName = randomItem(isFemale ? femaleNames : maleNames);
      const id = String(personIdCounter++);

      // Email Anomaly Generator (5% chance)
      const hasEmailAnomaly = Math.random() < 0.05;
      const email = hasEmailAnomaly
        ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}` // Missing @domain.com
        : `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1,99)}@example.com`;

      let birthYear = randomInt(1975, 1995);
      if (hasSpouseGap && a === 1) {
          // Make second spouse much older (e.g. +45 years)
          birthYear -= 45;
      }

      const adult = {
        id,
        type: 'Person',
        attributes: {
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`,
          child: false,
          grade: null,
          birthdate: `${birthYear}-01-01`, // Rough adult age
          phone_numbers: [{ location: 'Mobile', number: (() => {
            const r = Math.random();
            const n1 = randomInt(100, 999);
            const n2 = randomInt(1000, 9999);
            if (r < 0.05) return `555${n1}${n2}`; // Missing dashes
            if (r < 0.10) return `555.${n1}.${n2}`; // Dots
            if (r < 0.15) return `555-${randomInt(100, 999)}`; // Short / Missing
            return `555-${n1}-${n2}`; // Standard
          })() }],
          email_addresses: [{ location: 'Home', address: email }],
          addresses: [householdAddress],
          avatar: `https://i.pravatar.cc/150?u=${id}`,
          household_id: householdId
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

      const id = String(personIdCounter++);

      // If Split Household, use a NEW household ID for children
      // But keep the same address
      const childHouseholdId = hasSplitHousehold ? `${householdId}-split` : householdId;

      const child = {
        id,
        type: 'Person',
        attributes: {
          first_name: firstName,
          last_name: lastName,
          name: `${firstName} ${lastName}`,
          child: true,
          grade: grade,
          birthdate: `${birthYear}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
          household_id: childHouseholdId,
          addresses: [householdAddress],
          avatar: `https://i.pravatar.cc/150?u=${id}`
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
    },
    // New Events for Burnout Logic
    {
      id: '3',
      type: 'Event',
      attributes: { name: 'Sunday Worship Service', frequency: 'weekly' } // Worship
    },
    {
      id: '4',
      type: 'Event',
      attributes: { name: 'Kids Ministry Team', frequency: 'weekly' } // Serving
    },
    {
      id: '5',
      type: 'Event',
      attributes: { name: 'Greeter Team', frequency: 'weekly' } // Serving
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
  const children = people.filter(p => p.attributes.child);
  const adults = people.filter(p => !p.attributes.child);

  // Identify Specific Scenarios
  // 1. Burnout Candidate (Linda): High Serving, Zero Worship
  // 2. Healthy Volunteer (Mark): High Serving, High Worship
  // 3. Attendee Only (Sarah): High Worship, Zero Serving

  const linda = adults[0]; // First adult is Linda
  if(linda) linda.attributes.first_name = "Linda"; // Rename for clarity

  const mark = adults[1];
  if(mark) mark.attributes.first_name = "Mark";

  const sarah = adults[2];
  if(sarah) sarah.attributes.first_name = "Sarah";

  // Randomly assign other adults to be "Volunteers" (serving sometimes) or "Regulars" (worship sometimes)
  const volunteers = adults.slice(3).filter(() => Math.random() < 0.3); // 30% of remaining adults serve
  const regularAttendees = adults.slice(3).filter(() => Math.random() < 0.6); // 60% of remaining adults attend

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
      children.forEach(child => {
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
      children.forEach(child => {
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

    // --- Adult Check-Ins ---
    if (!isRetreatWeek(sundayDate) && sundayDate <= yearEnd) {
        const worshipTime = setMinutes(setHours(sundayDate, 9), 0); // 9am Service
        const servingTime = setMinutes(setHours(sundayDate, 8), 30); // 8:30 Call time

        // 1. Linda: Serves (Kids Team), No Worship.
        // Make sure she serves consistently (e.g., > 90%)
        if (linda && Math.random() < 0.95) {
             checkIns.push({
                id: String(checkInIdCounter++),
                type: 'CheckIn',
                attributes: { created_at: formatISO(servingTime), kind: 'Volunteer' },
                relationships: { person: { data: { type: 'Person', id: linda.id } }, event: { data: { type: 'Event', id: '4' } } } // Kids Ministry
             });
        }

        // 2. Mark: Serves (Greeter) AND Worships
        if (mark) {
            if (Math.random() < 0.9) { // Serves
                checkIns.push({
                    id: String(checkInIdCounter++),
                    type: 'CheckIn',
                    attributes: { created_at: formatISO(servingTime), kind: 'Volunteer' },
                    relationships: { person: { data: { type: 'Person', id: mark.id } }, event: { data: { type: 'Event', id: '5' } } } // Greeter
                });
            }
            if (Math.random() < 0.9) { // Worships
                 checkIns.push({
                    id: String(checkInIdCounter++),
                    type: 'CheckIn',
                    attributes: { created_at: formatISO(worshipTime), kind: 'Regular' },
                    relationships: { person: { data: { type: 'Person', id: mark.id } }, event: { data: { type: 'Event', id: '3' } } } // Worship
                });
            }
        }

        // 3. Sarah: Worships Only
        if (sarah && Math.random() < 0.8) {
             checkIns.push({
                id: String(checkInIdCounter++),
                type: 'CheckIn',
                attributes: { created_at: formatISO(worshipTime), kind: 'Regular' },
                relationships: { person: { data: { type: 'Person', id: sarah.id } }, event: { data: { type: 'Event', id: '3' } } } // Worship
            });
        }

        // 4. Other Regulars (Worship)
        regularAttendees.forEach(p => {
            if (Math.random() < 0.6) {
                checkIns.push({
                    id: String(checkInIdCounter++),
                    type: 'CheckIn',
                    attributes: { created_at: formatISO(worshipTime), kind: 'Regular' },
                    relationships: { person: { data: { type: 'Person', id: p.id } }, event: { data: { type: 'Event', id: '3' } } }
                });
            }
        });

        // 5. Other Volunteers (Serve)
        volunteers.forEach(p => {
             if (Math.random() < 0.5) {
                const teamId = Math.random() > 0.5 ? '4' : '5';
                checkIns.push({
                    id: String(checkInIdCounter++),
                    type: 'CheckIn',
                    attributes: { created_at: formatISO(servingTime), kind: 'Volunteer' },
                    relationships: { person: { data: { type: 'Person', id: p.id } }, event: { data: { type: 'Event', id: teamId } } }
                });
            }
        });
    }
  });
};

// 4. Generate Groups
const generateGroups = () => {
  groups.push(
    { id: '1', type: 'Group', attributes: { name: 'Kids Choir' } },
    { id: '2', type: 'Group', attributes: { name: 'Youth Band' } },
    { id: '3', type: 'Group', attributes: { name: 'Small Group Leaders' } }
  );

  let membershipIdCounter = 1;

  // Assign some kids to Kids Choir
  const kids = people.filter(p => p.attributes.child);
  kids.forEach(kid => {
    if (Math.random() < 0.3) {
      groupMemberships.push({
        id: String(membershipIdCounter++),
        type: 'GroupMembership',
        relationships: {
          person: { data: { type: 'Person', id: kid.id } },
          group: { data: { type: 'Group', id: '1' } }
        }
      });
    }
  });

  // Assign some adults to Small Group Leaders
  const adults = people.filter(p => !p.attributes.child);
  adults.forEach(adult => {
    if (Math.random() < 0.2) {
      groupMemberships.push({
        id: String(membershipIdCounter++),
        type: 'GroupMembership',
        relationships: {
          person: { data: { type: 'Person', id: adult.id } },
          group: { data: { type: 'Group', id: '3' } }
        }
      });
    }
  });
};

// Execute
generateHouseholds();
generateEvents();
generateCheckIns();
generateGroups();
