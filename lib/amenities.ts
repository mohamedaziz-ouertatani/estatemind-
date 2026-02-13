/**
 * Amenities data for Tunisia
 * Major schools, hospitals, metro stations, beaches, and shopping centers
 */

export interface Amenity {
  id: string;
  name: string;
  type: "school" | "hospital" | "metro" | "beach" | "shopping";
  governorate: string;
  latitude: number;
  longitude: number;
  icon: string;
}

export const AMENITIES: Amenity[] = [
  // Schools
  {
    id: "school_1",
    name: "École Primaire La Marsa",
    type: "school",
    governorate: "Tunis",
    latitude: 36.8783,
    longitude: 10.3247,
    icon: "🏫",
  },
  {
    id: "school_2",
    name: "Lycée Pierre Mendès France",
    type: "school",
    governorate: "Tunis",
    latitude: 36.8531,
    longitude: 10.3231,
    icon: "🏫",
  },
  {
    id: "school_3",
    name: "Collège Sadiki",
    type: "school",
    governorate: "Tunis",
    latitude: 36.7957,
    longitude: 10.1778,
    icon: "🏫",
  },
  {
    id: "school_4",
    name: "Université de Tunis",
    type: "school",
    governorate: "Tunis",
    latitude: 36.8433,
    longitude: 10.1825,
    icon: "🏫",
  },
  {
    id: "school_5",
    name: "École Internationale de Carthage",
    type: "school",
    governorate: "Tunis",
    latitude: 36.8545,
    longitude: 10.3245,
    icon: "🏫",
  },

  // Hospitals
  {
    id: "hospital_1",
    name: "Hôpital Charles Nicolle",
    type: "hospital",
    governorate: "Tunis",
    latitude: 36.8069,
    longitude: 10.1818,
    icon: "🏥",
  },
  {
    id: "hospital_2",
    name: "Clinique Pasteur",
    type: "hospital",
    governorate: "Tunis",
    latitude: 36.8011,
    longitude: 10.1854,
    icon: "🏥",
  },
  {
    id: "hospital_3",
    name: "Hôpital La Rabta",
    type: "hospital",
    governorate: "Tunis",
    latitude: 36.8125,
    longitude: 10.1778,
    icon: "🏥",
  },
  {
    id: "hospital_4",
    name: "Clinique Hannibal",
    type: "hospital",
    governorate: "Ariana",
    latitude: 36.8625,
    longitude: 10.1956,
    icon: "🏥",
  },
  {
    id: "hospital_5",
    name: "Hôpital Habib Thameur",
    type: "hospital",
    governorate: "Tunis",
    latitude: 36.7987,
    longitude: 10.1723,
    icon: "🏥",
  },

  // Metro/TGM Stations
  {
    id: "metro_1",
    name: "Station TGM La Marsa",
    type: "metro",
    governorate: "Tunis",
    latitude: 36.8783,
    longitude: 10.3247,
    icon: "🚇",
  },
  {
    id: "metro_2",
    name: "Station TGM Carthage Hannibal",
    type: "metro",
    governorate: "Tunis",
    latitude: 36.8531,
    longitude: 10.3231,
    icon: "🚇",
  },
  {
    id: "metro_3",
    name: "Station TGM Salammbô",
    type: "metro",
    governorate: "Tunis",
    latitude: 36.8345,
    longitude: 10.3156,
    icon: "🚇",
  },
  {
    id: "metro_4",
    name: "Station TGM Tunis Marine",
    type: "metro",
    governorate: "Tunis",
    latitude: 36.8065,
    longitude: 10.1815,
    icon: "🚇",
  },
  {
    id: "metro_5",
    name: "Station République",
    type: "metro",
    governorate: "Tunis",
    latitude: 36.8010,
    longitude: 10.1785,
    icon: "🚇",
  },

  // Beaches
  {
    id: "beach_1",
    name: "Plage de La Marsa",
    type: "beach",
    governorate: "Tunis",
    latitude: 36.8795,
    longitude: 10.3260,
    icon: "🏖️",
  },
  {
    id: "beach_2",
    name: "Plage de Gammarth",
    type: "beach",
    governorate: "Tunis",
    latitude: 36.9000,
    longitude: 10.3200,
    icon: "🏖️",
  },
  {
    id: "beach_3",
    name: "Plage de Port El Kantaoui",
    type: "beach",
    governorate: "Sousse",
    latitude: 35.8931,
    longitude: 10.5933,
    icon: "🏖️",
  },
  {
    id: "beach_4",
    name: "Plage de Hammamet",
    type: "beach",
    governorate: "Nabeul",
    latitude: 36.4000,
    longitude: 10.6167,
    icon: "🏖️",
  },
  {
    id: "beach_5",
    name: "Plage de Yasmine Hammamet",
    type: "beach",
    governorate: "Nabeul",
    latitude: 36.3950,
    longitude: 10.5667,
    icon: "🏖️",
  },

  // Shopping Centers
  {
    id: "shopping_1",
    name: "Tunisia Mall",
    type: "shopping",
    governorate: "Tunis",
    latitude: 36.8389,
    longitude: 10.1956,
    icon: "🛒",
  },
  {
    id: "shopping_2",
    name: "Carrefour Lac 2",
    type: "shopping",
    governorate: "Tunis",
    latitude: 36.8250,
    longitude: 10.2417,
    icon: "🛒",
  },
  {
    id: "shopping_3",
    name: "Centre Commercial Azur City",
    type: "shopping",
    governorate: "Tunis",
    latitude: 36.8433,
    longitude: 10.1900,
    icon: "🛒",
  },
  {
    id: "shopping_4",
    name: "Mall of Sousse",
    type: "shopping",
    governorate: "Sousse",
    latitude: 35.8256,
    longitude: 10.6364,
    icon: "🛒",
  },
  {
    id: "shopping_5",
    name: "Géant La Marsa",
    type: "shopping",
    governorate: "Tunis",
    latitude: 36.8783,
    longitude: 10.3200,
    icon: "🛒",
  },
];

export const getAmenitiesByType = (type: Amenity["type"]): Amenity[] => {
  return AMENITIES.filter((amenity) => amenity.type === type);
};

export const getAmenitiesByGovernorate = (governorate: string): Amenity[] => {
  return AMENITIES.filter((amenity) => amenity.governorate === governorate);
};

export const AMENITY_COLORS: Record<Amenity["type"], string> = {
  school: "#3B82F6", // blue
  hospital: "#EF4444", // red
  metro: "#10B981", // green
  beach: "#06B6D4", // cyan
  shopping: "#F59E0B", // orange
};

export const AMENITY_LABELS: Record<Amenity["type"], string> = {
  school: "École",
  hospital: "Hôpital",
  metro: "Transport",
  beach: "Plage",
  shopping: "Shopping",
};
