type Sport = {
  id?: string;
  name: string;
  [key: string]: unknown;
};

const STORAGE_KEY = "isports_sports";

export const getCustomSports = (): Sport[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const storedSports = localStorage.getItem(STORAGE_KEY);

  if (!storedSports) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedSports);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
};

export const addCustomSport = (sport: Sport) => {
  const existingSports = getCustomSports();

  const updatedSports = [
    ...existingSports,
    sport,
  ];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedSports)
  );
};

// No static sports.
// Only sports created by admin are returned.
export const getAllSports = (): Sport[] => {
  return getCustomSports();
};