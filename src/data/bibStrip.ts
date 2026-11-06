// The bottom strip of the race BIB: sponsor logos on the left half, what the runner gets on the right half
// (medal, food, drink, jersey size). Used by the website's BIB (RaceBib.tsx) and the printable BIB (server/documents.tsx).

/** Sponsor logos: 17, shown as two centred rows (9 + 8). */
export const BIB_SPONSOR_LOGOS: string[] = [
  'bpp',
  'chang',
  'thonglor-pet-hospital',
  'bpp-police',
  'msd-animal-health',
  'kitchen-flavor',
  'vif',
  'dr-choice',
  'konvy',
  'we-are-family-for-pet',
  'solid-gold',
  'credo-plus',
  'vetsynova',
  'bestie',
  'dogster',
  'amor',
  'yumove',
].map((n) => `/images/sponsors/${n}.webp`);

const svg = (inner: string) =>
  `<svg viewBox="0 0 48 48" fill="none" stroke="#3B1883" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

/** The three tear-off perks (icon + Thai label); the jersey size box is drawn separately because it holds the runner's size. */
export const BIB_PERKS: { id: 'medal' | 'food' | 'drink'; label: string; icon: string }[] = [
  {
    id: 'medal',
    label: 'เหรียญ',
    icon: svg('<circle cx="24" cy="30" r="10"/><path d="M15 6h7l4 13M33 6h-7l-4 13"/><path d="M24 25.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#3B1883" stroke="none"/>'),
  },
  {
    id: 'food',
    label: 'อาหาร',
    icon: svg('<circle cx="24" cy="25" r="9.5"/><circle cx="24" cy="25" r="4.5"/><path d="M8 9v9a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3V9M11.5 9v32M40 9c-3.5 2-5 6-5 11v6h5v15"/>'),
  },
  {
    id: 'drink',
    label: 'เครื่องดื่ม',
    icon: svg('<path d="M20 5h8v5l3 5v24a3.5 3.5 0 0 1-3.5 3.5h-7A3.5 3.5 0 0 1 17 39V15l3-5z"/><path d="M17 22h14M17 32h14"/>'),
  },
];

export const BIB_SIZE_LABEL = 'ไซซ์เสื้อ';
