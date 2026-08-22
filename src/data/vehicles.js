// ============================================================================
// TOURS
// ============================================================================

export const tours = [
  {
    id: 'pahalgam',
    name: 'Srinagar to Pahalgam day tour',
    destination: 'Pahalgam',
  },

  {
    id: 'gulmarg',
    name: 'Srinagar to Gulmarg day tour',
    destination: 'Gulmarg',
  },

  {
    id: 'sonamarg',
    name: 'Srinagar to Sonamarg day tour',
    destination: 'Sonamarg',
  },

  {
    id: 'srinagar-local',
    name: 'Srinagar Local Sightseeing',
    destination: 'Srinagar Local Sightseeing',
  },
]


// ============================================================================
// VEHICLES
// ============================================================================

export const vehicles = [
  {
    id: 'sedan',
    name: 'Sedan',
    seats: 'Up to 4 guests',
    luggage: '2 bags',
    icon: '🚘',
    note: 'Comfortable for couples and small families',
  },

  {
    id: 'innova',
    name: 'Innova',
    seats: 'Up to 6 guests',
    luggage: '4 bags',
    icon: '🚙',
    note: 'A comfortable family choice',
  },

  {
    id: 'tempo',
    name: 'Tempo Traveller',
    seats: 'Up to 12 guests',
    luggage: '8 bags',
    icon: '🚌',
    note: 'Made for groups travelling together',
  },

  {
    id: 'urbania',
    name: 'Urbania',
    seats: 'Up to 17 guests',
    luggage: '12 bags',
    icon: '🚐',
    note: 'Spacious transport for larger groups',
  },
]


// ============================================================================
// DEFAULT PLACES
// ============================================================================
//
// These are ONLY the initial places.
//
// IMPORTANT:
// After the Firebase catalog is created, the dashboard becomes the
// source of truth for places.
//
// Therefore, removing a place from the dashboard will actually remove
// it from the Booking Dialog.
//
// ============================================================================

export const places = [
  'Srinagar',
  'Sonamarg',
  'Gulmarg',
  'Pahalgam',
  'Srinagar Local Sightseeing',
  'Airport',
]