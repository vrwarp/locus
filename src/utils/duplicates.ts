import type { Student } from './pco';

export interface DuplicateGroup {
  id: string; // A unique identifier for the group
  criteria: string; // What matched (e.g., "Name + Email", "Name + Phone")
  students: Student[];
}

export const detectDuplicates = (students: Student[]): DuplicateGroup[] => {
  const groups: DuplicateGroup[] = [];

  // Group by exact match Name + Email
  const nameEmailMap = new Map<string, Student[]>();
  // Group by exact match Name + Phone
  const namePhoneMap = new Map<string, Student[]>();

  for (const student of students) {
    if (!student.name) continue;

    const normalizedName = student.name.toLowerCase().trim();

    if (student.email) {
      const normalizedEmail = student.email.toLowerCase().trim();
      const key = `${normalizedName}|${normalizedEmail}`;
      if (!nameEmailMap.has(key)) {
        nameEmailMap.set(key, []);
      }
      nameEmailMap.get(key)!.push(student);
    }

    if (student.phoneNumber) {
      const normalizedPhone = student.phoneNumber.replace(/\D/g, ''); // Keep only digits
      if (normalizedPhone.length >= 10) { // Require at least 10 digits for a valid match
        const key = `${normalizedName}|${normalizedPhone}`;
        if (!namePhoneMap.has(key)) {
          namePhoneMap.set(key, []);
        }
        namePhoneMap.get(key)!.push(student);
      }
    }
  }

  // To avoid adding the same duplicate pair multiple times (e.g., they matched both Email and Phone),
  // we keep track of sets of IDs that have already been grouped together.
  const groupedSets = new Set<string>();

  const addGroup = (map: Map<string, Student[]>, criteriaName: string) => {
    for (const [key, matchingStudents] of map.entries()) {
      if (matchingStudents.length > 1) {
        // Sort by ID to create a stable unique key for this exact group of students
        const idKey = matchingStudents.map(s => s.id).sort().join(',');

        if (!groupedSets.has(idKey)) {
            groupedSets.add(idKey);
            groups.push({
                id: `dup_${idKey}`,
                criteria: criteriaName,
                students: matchingStudents
            });
        }
      }
    }
  };

  addGroup(nameEmailMap, 'Name & Email Match');
  addGroup(namePhoneMap, 'Name & Phone Match');

  return groups;
};
