// English text of the FAQ (keyed by the FAQ id in eventData.ts). Thai stays in eventData.ts.
export const FAQ_EN: Record<string, { question: string; answer: string }> = {
  'faq-1': {
    question: 'Where is CHANG SUEK RUN 2027 held?',
    answer:
      'At Naresuan Camp, Border Patrol Police Headquarters, on the beach in front of the Sea Sand Sun hotel, Cha-am, Phetchaburi (between Cha-am and Hua Hin, Phetkasem Road km 219).',
  },
  'faq-2': {
    question: 'How do the 4 km, 5 km and 10 km routes differ?',
    answer:
      'The 4 km (Fun Run) is a flat route along the beach, great for families and children. The 5 km (Challenge Run) adds a stretch inside Naresuan Camp. The 10 km (War Dog Trail) is a mini-marathon mixed with trail through nature, ponds, mangrove and the war-dog training ground.',
  },
  'faq-3': {
    question: 'Are there recommended hotels near the venue?',
    answer:
      'There are 42 pet-friendly hotels and resorts around Naresuan Camp, such as Radisson Resort (1.92 km), Cera Resort (2.20 km), VALA Hua Hin (2.28 km), AVANI+ (2.8 km) and Mida De Sea (5.2 km). See the full list with phone numbers in the "Find a stay" section.',
  },
  'faq-4': {
    question: 'Can I run with my dog or another pet?',
    answer:
      'Dogs can join only the Dog Run 1 km and 4 km categories. Your dog must be at least 1 year old, show proof of full vaccination, stay on a leash at all times, and you must bring waste bags.',
  },
  'faq-5': {
    question: 'How do I collect my shirt and race bib (BIB)?',
    answer:
      'The organiser will announce the race-kit collection day and time through its official channels. Collect it in person by showing your BIB number or digital ticket.',
  },
  'faq-6': {
    question: 'Is there bag drop and parking?',
    answer:
      'Free bag drop is available (opening hours to be announced). Parking for 800+ cars in Zones A and B plus a motorbike area, with staff on duty.',
  },
  'faq-7': {
    question: 'Are there water stations and medical teams along the route?',
    answer:
      'Water stations every 1.5–2 km, with electrolytes and fresh fruit on the 5 km and 10 km. Doctors, emergency nurses and an ambulance are on standby throughout the race.',
  },
  'faq-8': {
    question: 'What happens if it rains?',
    answer:
      'In light rain the event goes on as normal. In a severe thunderstorm or dangerous conditions the race committee may delay the start or change the route in line with safety standards.',
  },
};

export const FAQ_CATEGORIES_EN: Record<string, string> = {
  all: 'All questions',
  general: 'General & event',
  pet: 'Running with your dog',
  routes: 'Routes & cut-off',
  transport: 'Parking & travel',
  race_pack: 'Race pack & bib',
};
