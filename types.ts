
export enum DrinkType {
  TEA = 'Tea',
  COFFEE = 'Coffee',
  MILK = 'Milk',
  BLACK_TEA = 'Black Tea',
  BLACK_COFFEE = 'Black Coffee'
}

export enum SugarPreference {
  WITH_SUGAR = 'With Sugar',
  WITHOUT_SUGAR = 'Without Sugar'
}

export enum TimeSlot {
  MORNING = '11:00 AM',
  AFTERNOON = '03:00 PM'
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface OrderItem {
  id: string;
  drink: DrinkType;
  sugar: SugarPreference;
  quantity: number;
  note?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  slot: TimeSlot;
  createdAt: string;
}

export interface AggregatedRow {
  drink: DrinkType;
  sugar: SugarPreference;
  morningCount: number;
  afternoonCount: number;
  total: number;
}

export interface OfficeSummary {
  totalDrinks: number;
  totalWithSugar: number;
  morningSummary: { total: number; withSugar: number };
  afternoonSummary: { total: number; withSugar: number };
  table: AggregatedRow[];
}
