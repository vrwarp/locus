import { addDays, addMinutes, eachWeekOfInterval, getDay, isSameWeek, setHours, setMinutes, formatISO, subWeeks } from 'date-fns';

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
  console.log("Generating Households...");
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

    // Child Older Than Parent Generator (5% chance)
    const hasChildOlderThanParent = adultCount > 0 && Math.random() < 0.05;

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
      let birthYear = randomInt(2014, 2019);
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

      // If Child Older Than Parent anomaly, and this is the first child (to keep it simple)
      if (hasChildOlderThanParent && c === 0 && adults.length > 0) {
          const parent = adults[0];
          const parentBirthYear = parseInt(parent.attributes.birthdate.split('-')[0]);

          // Swap ages: Child becomes ~Parent Age, Parent becomes ~Child Age
          const newParentYear = birthYear;
          const newChildYear = parentBirthYear;

          // Update Parent
          parent.attributes.birthdate = `${newParentYear}-01-01`;

          // Update Child Year
          birthYear = newChildYear;
      }

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
  const today = new Date();
  const yearStart = subWeeks(today, 52); // Last 52 weeks
  const yearEnd = today;

  // Retreat Week: Just pick a week roughly 6 months ago to simulate a break
  const retreatStart = subWeeks(today, 26);
  const retreatEnd = addDays(retreatStart, 7);

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
      const baseTime = setMinutes(setHours(fridayDate, 19), 0); // 19:00

      // Randomly select kids (e.g. 60%)
      children.forEach(child => {
        if (Math.random() < 0.6) {
          const eventTime = addMinutes(baseTime, randomInt(-15, 15));
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
      const baseTime = setMinutes(setHours(sundayDate, 10), 0); // 10:00

      // Higher attendance on Sundays (e.g. 80%)
      children.forEach(child => {
        if (Math.random() < 0.8) {
          const eventTime = addMinutes(baseTime, randomInt(-20, 20)); // More spread for Sunday Morning
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
        const baseWorshipTime = setMinutes(setHours(sundayDate, 9), 0); // 9am Service
        const baseServingTime = setMinutes(setHours(sundayDate, 8), 30); // 8:30 Call time

        // 1. Linda: Serves (Kids Team), No Worship.
        // Make sure she serves consistently (e.g., > 90%)
        if (linda && Math.random() < 0.95) {
             const checkInTime = addMinutes(baseServingTime, randomInt(-10, 10));
             checkIns.push({
                id: String(checkInIdCounter++),
                type: 'CheckIn',
                attributes: { created_at: formatISO(checkInTime), kind: 'Volunteer' },
                relationships: { person: { data: { type: 'Person', id: linda.id } }, event: { data: { type: 'Event', id: '4' } } } // Kids Ministry
             });
        }

        // 2. Mark: Serves (Greeter) AND Worships
        if (mark) {
            if (Math.random() < 0.9) { // Serves
                const checkInTime = addMinutes(baseServingTime, randomInt(-10, 10));
                checkIns.push({
                    id: String(checkInIdCounter++),
                    type: 'CheckIn',
                    attributes: { created_at: formatISO(checkInTime), kind: 'Volunteer' },
                    relationships: { person: { data: { type: 'Person', id: mark.id } }, event: { data: { type: 'Event', id: '5' } } } // Greeter
                });
            }
            if (Math.random() < 0.9) { // Worships
                 const checkInTime = addMinutes(baseWorshipTime, randomInt(-15, 15));
                 checkIns.push({
                    id: String(checkInIdCounter++),
                    type: 'CheckIn',
                    attributes: { created_at: formatISO(checkInTime), kind: 'Regular' },
                    relationships: { person: { data: { type: 'Person', id: mark.id } }, event: { data: { type: 'Event', id: '3' } } } // Worship
                });
            }
        }

        // 3. Sarah: Worships Only
        if (sarah && Math.random() < 0.8) {
             const checkInTime = addMinutes(baseWorshipTime, randomInt(-15, 15));
             checkIns.push({
                id: String(checkInIdCounter++),
                type: 'CheckIn',
                attributes: { created_at: formatISO(checkInTime), kind: 'Regular' },
                relationships: { person: { data: { type: 'Person', id: sarah.id } }, event: { data: { type: 'Event', id: '3' } } } // Worship
            });
        }

        // 4. Other Regulars (Worship)
        regularAttendees.forEach(p => {
            if (Math.random() < 0.6) {
                const checkInTime = addMinutes(baseWorshipTime, randomInt(-15, 15));
                checkIns.push({
                    id: String(checkInIdCounter++),
                    type: 'CheckIn',
                    attributes: { created_at: formatISO(checkInTime), kind: 'Regular' },
                    relationships: { person: { data: { type: 'Person', id: p.id } }, event: { data: { type: 'Event', id: '3' } } }
                });
            }
        });

        // 5. Other Volunteers (Serve)
        volunteers.forEach(p => {
             if (Math.random() < 0.5) {
                const teamId = Math.random() > 0.5 ? '4' : '5';
                const checkInTime = addMinutes(baseServingTime, randomInt(-10, 10));
                checkIns.push({
                    id: String(checkInIdCounter++),
                    type: 'CheckIn',
                    attributes: { created_at: formatISO(checkInTime), kind: 'Volunteer' },
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

// 5. Generate Newcomers (Funnel Logic)
const generateNewcomers = () => {
  // Goal: Create ~40 Newcomers distributed across 2024
  // Retention Profiles:
  // 1. One-and-Done (40%): 1 visit
  // 2. Two-Time Visitor (30%): 2 visits
  // 3. Shopper (20%): 3 visits
  // 4. Sticker (10%): 4+ visits

  const newcomerCount = 40;

  for (let i = 0; i < newcomerCount; i++) {
    const isFemale = Math.random() > 0.5;
    const firstName = randomItem(isFemale ? femaleNames : maleNames);
    const lastName = randomItem(lastNames);
    const id = String(personIdCounter++);

    // Determine Start Date (First Visit) - Random week in 2024
    // Avoid last week to allow for return visits
    const startWeekIndex = randomInt(0, 48);
    const yearStart = new Date(2024, 0, 1);
    const firstVisitDate = addDays(yearStart, startWeekIndex * 7); // Rough approx

    // Determine Retention Profile
    const r = Math.random();
    let visitCount = 1;
    if (r > 0.4) visitCount = 2; // > 40%
    if (r > 0.7) visitCount = 3; // > 70%
    if (r > 0.9) visitCount = randomInt(4, 8); // > 90%

    // Create Person
    const person = {
      id,
      type: 'Person',
      attributes: {
        first_name: firstName,
        last_name: lastName,
        name: `${firstName} ${lastName}`,
        child: false, // Make them adults for simplicity or mix? Let's say adults/families.
        grade: null,
        birthdate: `${randomInt(1980, 2000)}-01-01`,
        addresses: [],
        email_addresses: [],
        phone_numbers: [],
        avatar: `https://i.pravatar.cc/150?u=${id}`,
        created_at: formatISO(firstVisitDate) // Metadata for "Newcomer" status if we used that field
      }
    };
    people.push(person);

    // Generate Check-Ins
    // Visit 1: On First Visit Date (Sunday)
    const sundayVisit1 = addDays(firstVisitDate, 0); // Assuming firstVisitDate aligns roughly.
    // Let's force it to be a Sunday
    const dayOfWeek = getDay(firstVisitDate);
    const daysUntilSunday = (7 - dayOfWeek) % 7; // If 0 (Sun) -> 0. If 1 (Mon) -> 6.

    // Actually simpler: iterate and add check-ins for `visitCount` consecutive weeks
    // or skip a week for "Shoppers".

    // Let's just do consecutive weeks for simplicity of "returning"
    let currentVisitDate = addDays(firstVisitDate, daysUntilSunday); // Align to next Sunday

    for (let v = 0; v < visitCount; v++) {
        // Ensure we don't go past current date (mocked as end of 2024)
        if (currentVisitDate > new Date(2024, 11, 31)) break;

        const baseTime = setMinutes(setHours(currentVisitDate, 10), 0); // 10:00 AM
        const eventTime = addMinutes(baseTime, randomInt(-20, 20));

        checkIns.push({
            id: String(checkInIdCounter++),
            type: 'CheckIn',
            attributes: {
              created_at: formatISO(eventTime),
              kind: 'Regular'
            },
            relationships: {
              person: { data: { type: 'Person', id: person.id } },
              event: { data: { type: 'Event', id: '3' } } // Worship Service
            }
        });

        // Next visit next week
        currentVisitDate = addDays(currentVisitDate, 7);
    }
  }
};

// Execute
generateHouseholds();
generateEvents();
generateCheckIns();
generateNewcomers();
generateGroups();
