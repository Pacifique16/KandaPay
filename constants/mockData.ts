export type Transaction = {
  id: string;
  name: string;
  phone?: string;
  amount: number;
  type: "debit" | "credit";
  category: "food" | "transport" | "bills" | "school" | "shopping" | "transfer";
  date: string;
  time: string;
};

export type TransportCard = {
  id: string;
  name: string;
  cardNumber: string;
  balance: number;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  initials?: string;
  color?: string;
};

export type NearbyMerchant = {
  id: string;
  name: string;
  code: string;
  category: string;
  color: string;
};

export type ReportTransaction = {
  id: string;
  name: string;
  phone?: string;
  amount: number;
  type: "credit" | "debit";
  isMerchant?: boolean;
  category?: string;
  color?: string;
};

export type ReportSection = {
  sectionType: "date" | "week-summary";
  title: string;
  dayName?: string;
  dayNum?: string;
  totalSpent?: number;
  fees?: number;
  chartData?: { day: string; amount: number }[];
  data: ReportTransaction[];
};

export const TRANSACTIONS: Transaction[] = [
  { id: "1", name: "MTN Mobile Money", phone: "078XXXXXXX", amount: 15000, type: "debit", category: "transfer", date: "Today", time: "09:24 AM" },
  { id: "2", name: "Airtel Airtime", phone: "073XXXXXXX", amount: 2000, type: "debit", category: "bills", date: "Today", time: "07:10 AM" },
  { id: "3", name: "Received from Jean", phone: "072XXXXXXX", amount: 50000, type: "credit", category: "transfer", date: "Yesterday", time: "03:45 PM" },
  { id: "4", name: "RSSB Health Premium", amount: 8500, type: "debit", category: "bills", date: "Yesterday", time: "10:00 AM" },
  { id: "5", name: "Nyamirambo Market", amount: 6200, type: "debit", category: "food", date: "Mon", time: "12:30 PM" },
  { id: "6", name: "Tap & Go Recharge", amount: 5000, type: "debit", category: "transport", date: "Mon", time: "07:15 AM" },
  { id: "7", name: "School Fees - INES", amount: 250000, type: "debit", category: "school", date: "Sun", time: "09:00 AM" },
  { id: "8", name: "Kigali Heights Mall", amount: 12400, type: "debit", category: "shopping", date: "Sat", time: "02:20 PM" },
];

export const RECENT_RECIPIENTS: Contact[] = [
  { id: "r1", name: "Christian", phone: "0787 164 108", initials: "C", color: "#6C63FF" },
  { id: "r2", name: "1754318", phone: "1754318", initials: "?", color: "#1A237E" },
  { id: "r3", name: "DINEKA LTD", phone: "005619", initials: "D", color: "#00C9A7" },
  { id: "r4", name: "0793 755 678", phone: "0793 755 678", initials: "?", color: "#1A237E" },
  { id: "r5", name: "VUMILIYA", phone: "025440", initials: "V", color: "#6C63FF" },
];

export const CONTACTS: Contact[] = [
  { id: "c1", name: "Jeilo", phone: "+250798346510", initials: "J", color: "#6C63FF" },
  { id: "c2", name: "Pacifique Nkusi", phone: "+250788234567", initials: "P", color: "#1A237E" },
  { id: "c3", name: "Amani Uwase", phone: "+250722345678", initials: "A", color: "#00C9A7" },
  { id: "c4", name: "Bosco Habimana", phone: "+250782345678", initials: "B", color: "#4A47A3" },
  { id: "c5", name: "Claudine Mukamana", phone: "+250788765432", initials: "C", color: "#6C63FF" },
  { id: "c6", name: "David Niyonsenga", phone: "+250721234567", initials: "D", color: "#1A237E" },
  { id: "c7", name: "Espérance Tuyizere", phone: "+250788123456", initials: "E", color: "#00C9A7" },
  { id: "c8", name: "Fidèle Nzamwita", phone: "+250798654321", initials: "F", color: "#4A47A3" },
  { id: "c9", name: "Grace Ingabire", phone: "+250721876543", initials: "G", color: "#6C63FF" },
  { id: "c10", name: "Hirwa Iradukunda", phone: "+250788345678", initials: "H", color: "#1A237E" },
  { id: "c11", name: "Ines Uwimana", phone: "+250722876543", initials: "I", color: "#00C9A7" },
  { id: "c12", name: "Jean-Pierre Habimana", phone: "+250782876543", initials: "J", color: "#6C63FF" },
];

export const NEARBY_MERCHANTS: NearbyMerchant[] = [
  { id: "nm1", name: "PATEL GROCERIES", code: "*182*1*56789#", category: "Supermarket", color: "#6C63FF" },
  { id: "nm2", name: "POIVRE NOIR", code: "*182*1*34567#", category: "Restaurant", color: "#00C9A7" },
  { id: "nm3", name: "KIGALI HEIGHTS", code: "*182*1*23456#", category: "Mall", color: "#1A237E" },
  { id: "nm4", name: "WAKA FITNESS", code: "*182*1*12345#", category: "Sports", color: "#4A47A3" },
  { id: "nm5", name: "SIMBA FUEL", code: "*182*1*98765#", category: "Fuel", color: "#6C63FF" },
];

export const REPORT_SECTIONS: ReportSection[] = [
  {
    sectionType: "date",
    title: "Fri 8",
    dayName: "Fri",
    dayNum: "8",
    data: [
      { id: "rs1", name: "Ariane ISHIMWE", phone: "+250 7** *** 998", amount: 20000, type: "credit" },
      { id: "rs2", name: "John DOE", phone: "+250 780 123 456", amount: 2600, type: "debit" },
    ],
  },
  {
    sectionType: "date",
    title: "Thu 7",
    dayName: "Thu",
    dayNum: "7",
    data: [
      { id: "rs3", name: "PATEL GROCERIES", category: "supermarket", amount: 26950, type: "debit", isMerchant: true, color: "#6C63FF" },
      { id: "rs4", name: "POIVRE NOIR", category: "restaurant", amount: 76480, type: "debit", isMerchant: true, color: "#00C9A7" },
      { id: "rs5", name: "Jean Marie VIANE", phone: "+250 7** *** 656", amount: 125000, type: "credit" },
      { id: "rs6", name: "WAKA FITNESS", category: "sports", amount: 60000, type: "debit", isMerchant: true, color: "#4A47A3" },
    ],
  },
  {
    sectionType: "week-summary",
    title: "Week 47",
    totalSpent: 1072780,
    fees: 3220,
    chartData: [
      { day: "M", amount: 0 },
      { day: "T", amount: 84000 },
      { day: "W", amount: 9000 },
      { day: "T", amount: 8000 },
      { day: "F", amount: 177000 },
      { day: "S", amount: 36000 },
      { day: "S", amount: 0 },
    ],
    data: [{ id: "w47-ph", name: "", amount: 0, type: "debit" }],
  },
  {
    sectionType: "date",
    title: "Mon 25",
    dayName: "Mon",
    dayNum: "25",
    data: [
      { id: "rs7", name: "POIVRE NOIR", category: "restaurant", amount: 76480, type: "debit", isMerchant: true, color: "#00C9A7" },
    ],
  },
  {
    sectionType: "date",
    title: "Sat 23",
    dayName: "Sat",
    dayNum: "23",
    data: [
      { id: "rs8", name: "Ariane ISHIMWE", phone: "+250 7** *** 998", amount: 35000, type: "credit" },
      { id: "rs9", name: "John DOE", phone: "+250 780 123 456", amount: 700, type: "debit" },
    ],
  },
  {
    sectionType: "week-summary",
    title: "Week 46",
    totalSpent: 314780,
    fees: 1840,
    chartData: [
      { day: "M", amount: 0 },
      { day: "T", amount: 45000 },
      { day: "W", amount: 75000 },
      { day: "T", amount: 0 },
      { day: "F", amount: 120000 },
      { day: "S", amount: 35000 },
      { day: "S", amount: 39780 },
    ],
    data: [{ id: "w46-ph", name: "", amount: 0, type: "debit" }],
  },
];

export const TRANSPORT_CARDS: TransportCard[] = [
  { id: "1", name: "Pacifique", cardNumber: "C24D77B1", balance: 4851 },
  { id: "2", name: "Pacifique", cardNumber: "A98F32C4", balance: 1200 },
];

export const CATEGORY_COLORS: Record<Transaction["category"], string> = {
  food: "#6C63FF",
  transport: "#1A237E",
  bills: "#4A47A3",
  school: "#00C9A7",
  shopping: "#6C63FF",
  transfer: "#1A237E",
};

export const CATEGORY_LABELS: Record<Transaction["category"], string> = {
  food: "Food",
  transport: "Transport",
  bills: "Bills",
  school: "School",
  shopping: "Shopping",
  transfer: "Transfer",
};

export const CATEGORIES = ["Rent", "Transport", "Food", "School Fees"] as const;
export type CategoryType = (typeof CATEGORIES)[number];

export const EXPENSE_TAGS = ["house", "school_fees", "transport", "food", "bills"] as const;
export type ExpenseTag = (typeof EXPENSE_TAGS)[number];
