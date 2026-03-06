import type { Student } from './pco';

export interface DuplicateGroup {
  id: string; // A unique identifier for the group
  criteria: string; // What matched (e.g., "Name + Email", "Name + Phone")
  students: Student[];
}

// Helper to calculate Levenshtein distance between two strings
export const levenshteinDistance = (a: string, b: string): number => {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

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

  // Fuzzy matching: Same address, similar name
  // First, group by address to reduce comparisons
  const addressMap = new Map<string, Student[]>();

  for (const student of students) {
    if (student.address && student.address.street && student.address.zip) {
        // Create a normalized address key
        const street = student.address.street.toLowerCase().trim();
        const zip = student.address.zip.trim();
        const addressKey = `${street}|${zip}`;

        if (!addressMap.has(addressKey)) {
            addressMap.set(addressKey, []);
        }
        addressMap.get(addressKey)!.push(student);
    }
  }

  // Iterate through address groups and look for similar names
  for (const [addressKey, peopleAtAddress] of addressMap.entries()) {
    if (peopleAtAddress.length > 1) {
        // Compare each person to others at the same address
        for (let i = 0; i < peopleAtAddress.length; i++) {
            for (let j = i + 1; j < peopleAtAddress.length; j++) {
                const p1 = peopleAtAddress[i];
                const p2 = peopleAtAddress[j];

                if (p1.name && p2.name) {
                    const n1 = p1.name.toLowerCase().trim();
                    const n2 = p2.name.toLowerCase().trim();

                    const fullDist = levenshteinDistance(n1, n2);

                    let isMatch = false;

                    if (fullDist === 0) {
                        // Exact name match at the exact same address
                        isMatch = true;
                    } else if (fullDist <= 2) {
                        // Fuzzy match (typo). To prevent false positives with siblings who have short first names
                        // (e.g. "Ava" vs "Mia" is dist 2), we check the proportional distance of the first names.
                        const parts1 = n1.split(/\s+/);
                        const parts2 = n2.split(/\s+/);
                        const first1 = parts1[0] || '';
                        const first2 = parts2[0] || '';

                        const firstDist = levenshteinDistance(first1, first2);
                        const maxFirstLen = Math.max(first1.length, first2.length);

                        // If first names match exactly, or their typo distance is <= 40% of the name's length
                        if (maxFirstLen > 0 && (firstDist === 0 || (firstDist / maxFirstLen) <= 0.4)) {
                            isMatch = true;
                        }
                    }

                    if (isMatch) {
                        const idKey = [p1.id, p2.id].sort().join(',');

                        if (!groupedSets.has(idKey)) {
                            groupedSets.add(idKey);
                            groups.push({
                                id: `dup_${idKey}`,
                                criteria: fullDist === 0 ? 'Same Name & Address' : 'Similar Name & Same Address',
                                students: [p1, p2]
                            });
                        }
                    }
                }
            }
        }
    }
  }

  return groups;
};
