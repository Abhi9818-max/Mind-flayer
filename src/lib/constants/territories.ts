// Mapping of territory (college) IDs to their database UUIDs
// These must match the values in database/seeds/002_seed_ncr.sql

export const TERRITORY_IDS = {
    "DU North Campus": "770e8400-e29b-41d4-a716-446655440001",
    "DU South Campus": "770e8400-e29b-41d4-a716-446655440002",
    "JNU": "770e8400-e29b-41d4-a716-446655440003",
    "Jamia Millia Islamia": "770e8400-e29b-41d4-a716-446655440004",
    "Amity University": "770e8400-e29b-41d4-a716-446655440005",
    "JIIT Noida": "770e8400-e29b-41d4-a716-446655440006",
    "GBU": "770e8400-e29b-41d4-a716-446655440007",
    "Sharda University": "770e8400-e29b-41d4-a716-446655440008",
    "GD Goenka": "770e8400-e29b-41d4-a716-446655440009",
    "Sushant University": "770e8400-e29b-41d4-a716-446655440010",
    "MDU Rohtak": "770e8400-e29b-41d4-a716-446655440011",
    "Bennett University": "770e8400-e29b-41d4-a716-446655440012",
    "GL Bajaj": "770e8400-e29b-41d4-a716-446655440013",
    "NIET": "770e8400-e29b-41d4-a716-446655440014",
    "Galgotias University": "770e8400-e29b-41d4-a716-446655440015"
} as const;

export type TerritoryName = keyof typeof TERRITORY_IDS;
