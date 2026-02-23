import type { Student } from './pco';

export interface FamilyIssue {
  type: 'Critical' | 'Warning';
  message: string;
  householdId: string;
  familyName: string;
  members: Student[];
  fixType?: 'Swap';
  studentId?: string;
  parentId?: string;
  studentName?: string;
  parentName?: string;
}

const checkSpouseGap = (parents: Student[], householdId: string, familyName: string, members: Student[], issues: FamilyIssue[]) => {
  if (parents.length === 2) {
    const p1 = parents[0];
    const p2 = parents[1];
    const ageDiff = Math.abs(p1.age - p2.age);
    if (ageDiff > 40) {
      issues.push({
        type: 'Critical',
        message: `Large age gap (${ageDiff}y) between Spouses: ${p1.name} (${p1.age}) & ${p2.name} (${p2.age})`,
        householdId,
        familyName,
        members
      });
    }
  }
};

const checkSplitHouseholds = (students: Student[], households: Record<string, Student[]>, issues: FamilyIssue[]) => {
  // Group by Address (serialized), Email, Phone
  const addressMap: Record<string, Set<string>> = {};
  const emailMap: Record<string, Set<string>> = {};
  const phoneMap: Record<string, Set<string>> = {};

  students.forEach(s => {
    if (s.householdId) {
      if (s.address) {
        // Simple serialization of address for key
        const addrKey = `${s.address.street}|${s.address.city}|${s.address.zip}`.toLowerCase();
        // Skip empty addresses
        if (addrKey.replace(/\|/g, '').trim().length > 0) {
            if (!addressMap[addrKey]) addressMap[addrKey] = new Set();
            addressMap[addrKey].add(s.householdId);
        }
      }
      if (s.email) {
        const emailKey = s.email.toLowerCase();
        if (!emailMap[emailKey]) emailMap[emailKey] = new Set();
        emailMap[emailKey].add(s.householdId);
      }
      if (s.phoneNumber) {
        const phoneKey = s.phoneNumber.replace(/\D/g, ''); // strip non-digits
        if (phoneKey.length >= 10) { // minimum length to be useful
             if (!phoneMap[phoneKey]) phoneMap[phoneKey] = new Set();
             phoneMap[phoneKey].add(s.householdId);
        }
      }
    }
  });

  const checkMap = (map: Record<string, Set<string>>, type: string) => {
    Object.entries(map).forEach(([key, householdIds]) => {
      if (householdIds.size > 1) {
        const householdIdArray = Array.from(householdIds);

        // Gather all members from these households
        let allMembers: Student[] = [];
        householdIdArray.forEach(hid => {
            if (households[hid]) {
                allMembers = allMembers.concat(households[hid]);
            }
        });

        const familyNames = householdIdArray.map(hid => {
            const hMembers = households[hid];
            // Try to find a parent name
            const parent = hMembers.find(m => !m.isChild);
            return parent ? parent.lastName : (hMembers[0]?.lastName || 'Unknown');
        }).filter((v, i, a) => a.indexOf(v) === i).join(' & '); // Unique family names

        issues.push({
          type: 'Warning',
          message: `Potential Split Household: ${householdIds.size} households share ${type} (${key})`,
          householdId: householdIdArray.join(', '),
          familyName: familyNames,
          members: allMembers
        });
      }
    });
  };

  checkMap(addressMap, 'Address');
  checkMap(emailMap, 'Email');
  checkMap(phoneMap, 'Phone');
};

export const analyzeFamilies = (students: Student[]): FamilyIssue[] => {
  console.log(`Analyzing families for ${students.length} students...`);
  const issues: FamilyIssue[] = [];

  // 1. Group by Household
  const households: Record<string, Student[]> = {};
  students.forEach(student => {
    if (student.householdId) {
      if (!households[student.householdId]) {
        households[student.householdId] = [];
      }
      households[student.householdId].push(student);
    }
  });

  // 2. Analyze each household
  Object.entries(households).forEach(([householdId, members]) => {
    // Determine Family Name
    const parents = members.filter(m => !m.isChild);
    const children = members.filter(m => m.isChild);
    const firstParent = parents[0];
    const familyName = firstParent ? firstParent.name.split(' ').pop() || 'Family' : (members[0]?.lastName || 'Family');

    // Check Spouse Gap
    checkSpouseGap(parents, householdId, familyName, members, issues);

    // Only analyze parent/child if we have at least 2 members to compare
    if (members.length < 2) return;

    children.forEach(child => {
      parents.forEach(parent => {
        const ageDiff = parent.age - child.age;

        if (ageDiff < 0) {
            console.log(`Found anomaly: Child ${child.name} (${child.age}) > Parent ${parent.name} (${parent.age})`);
            // Child is older than parent!
            issues.push({
                type: 'Critical',
                message: `Child (${child.name}, ${child.age}) is older than Parent (${parent.name}, ${parent.age})`,
                householdId,
                familyName,
                members,
                fixType: 'Swap',
                studentId: child.id,
                parentId: parent.id,
                studentName: child.name,
                parentName: parent.name
            });
        } else if (ageDiff < 15) {
             // Parent is very young (< 15 years older)
             issues.push({
                type: 'Warning',
                message: `Small age gap (${ageDiff}y) between Parent (${parent.name}, ${parent.age}) and Child (${child.name}, ${child.age})`,
                householdId,
                familyName,
                members
            });
        }
      });
    });
  });

  // 3. Analyze across households (Split Households)
  checkSplitHouseholds(students, households, issues);

  return issues;
};
