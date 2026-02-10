export const detectNameAnomaly = (name: string): boolean => {
  if (!name || name.trim().length === 0) return false;

  const trimmedName = name.trim();

  // Check if all uppercase (and contains letters)
  const isAllUpperCase = trimmedName === trimmedName.toUpperCase() && /[a-zA-Z]/.test(trimmedName);

  // Check if all lowercase
  const isAllLowerCase = trimmedName === trimmedName.toLowerCase();

  return isAllUpperCase || isAllLowerCase;
};

export const fixName = (name: string): string => {
  if (!name) return '';

  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
