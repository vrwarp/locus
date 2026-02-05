import type { Student } from './pco';

export interface FamilyIssue {
  type: 'Critical' | 'Warning';
  message: string;
  householdId: string;
  familyName: string;
  members: Student[];
}

export const analyzeFamilies = (students: Student[]): FamilyIssue[] => {
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
    // Only analyze if we have at least 2 members to compare
    if (members.length < 2) return;

    // Separate parents and children based on isChild flag
    // If isChild is not reliable (e.g. not set), we could try to infer, but for now rely on flag.
    const parents = members.filter(m => !m.isChild);
    const children = members.filter(m => m.isChild);

    // If no parents or no children, we can't really do parent-child comparison
    // But we could check for "All Children" household which is weird?
    if (parents.length === 0 && children.length > 0) {
       // Optional: Warning for kids without adults in household?
       // For now, skip.
       return;
    }

    // Determine Family Name (Try to find a common last name or use the first parent's name)
    const firstParent = parents[0];
    const familyName = firstParent ? firstParent.name.split(' ').pop() || 'Family' : 'Family';

    children.forEach(child => {
      parents.forEach(parent => {
        const ageDiff = parent.age - child.age;

        if (ageDiff < 0) {
            // Child is older than parent!
            issues.push({
                type: 'Critical',
                message: `Child (${child.name}, ${child.age}) is older than Parent (${parent.name}, ${parent.age})`,
                householdId,
                familyName,
                members
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

  return issues;
};
