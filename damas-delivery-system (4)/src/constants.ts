export const COMMUNES_ALGIERS = [
  "Alger Centre", "Sidi M'Hamed", "El Madania", "Belouizdad", "Bab El Oued", "Bologhine", "Casbah", "Oued Koriche",
  "Bir Mourad Rais", "El Biar", "Bouzareah", "Ben Aknoun", "Hydra", "El Achour", "Draria", "Baba Hassen", "Douera",
  "Kharacia", "Saoula", "Birtouta", "Ouled Chebel", "Tessala El Merdja", "Birkhadem", "Djasr Kasentina", "El Harrach",
  "Oued Smar", "Bourouba", "Hussein Dey", "Kouba", "Bachedjerah", "Dar El Beida", "Bab Ezzouar",
  "Bordj El Kiffan", "Bordj El Bahri", "El Marsa", "Mohammadia", "Rouiba", "Reghaia", "Ain Taya", "Heuraoua",
  "Ain Benian", "Cheraga", "Ouled Fayet", "El Hammamet", "Staoueli", "Zeralda", "Mahelma", "Rahmania", "Souidania",
  "Beni Messous", "Les Eucalyptus", "Sidi Moussa", "Baraki", "Meftah", "Larbaa"
].sort();

export const BOX_SIZES = [
  { value: 'صغير', label: 'صغير (Small)' },
  { value: 'متوسط', label: 'متوسط (Medium)' },
  { value: 'كبير', label: 'كبير (Large)' },
];

export const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  delivering: 'جار التوصيل',
  delivered: 'تم الاستلام',
  failed: 'لم يتم الاستلام',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  delivering: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};
