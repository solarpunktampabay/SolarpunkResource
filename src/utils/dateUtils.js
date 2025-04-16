// Helper function to parse MM-DD-YYYY string into a Date object (UTC start of day)
// Returns null if the format is invalid or the date doesn't exist
export const parseMMDDYYYYToUTCDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  const parts = dateString.split('-'); // Expects MM-DD-YYYY
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Basic validation for numeric parts
    if (isNaN(month) || isNaN(day) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31) {
      // console.warn(`Invalid date components in: ${dateString}`); // Optional: keep for debugging
      return null;
    }

    // Use Date.UTC to create the date timestamp (milliseconds since epoch)
    const utcTimestamp = Date.UTC(year, month - 1, day);
    const date = new Date(utcTimestamp);

    // Final validation: Check if the components match (catches invalid dates like 02-30)
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
       // console.warn(`Invalid date detected after UTC conversion: ${dateString}`); // Optional: keep for debugging
       return null;
    }
    return date; // Return the valid Date object representing UTC start of day
  }
  // console.warn(`Invalid date format encountered (expected MM-DD-YYYY): ${dateString}`); // Optional: keep for debugging
  return null; // Return null for invalid format
};

// Helper function to format a UTC Date object into MM-DD-YYYY string
// Returns null if the input is not a valid Date object
export const formatUTCDateToMMDDYYYY = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${month}-${day}-${year}`;
}; 