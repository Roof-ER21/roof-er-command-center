/**
 * Roleplay Training Scenarios
 * Adapted from Agnes-21 roleplay system
 */

export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  ROOKIE = 'ROOKIE',
  PRO = 'PRO',
  VETERAN = 'VETERAN',
  ELITE = 'ELITE',
}

export interface RoleplayScenario {
  id: string;
  name: string;
  icon: string;
  description: string;
  difficulty: DifficultyLevel;
  context: string;
  initialMessage: string;
  objections: string[];
  successCriteria: string[];
  doorSlamThreshold: number;
}

// Insurance Division Scenarios
export const INSURANCE_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'eager-learner',
    name: 'The Eager Learner',
    icon: '🌱',
    description: 'A homeowner who wants roofing help and is excited to learn',
    difficulty: DifficultyLevel.BEGINNER,
    context: 'Homeowner has been looking for a roofer and is happy someone knocked on their door.',
    initialMessage: 'Oh hi! Come on in. What can I help you with?',
    objections: [],
    successCriteria: [
      'Introduce yourself',
      'Explain who Roof ER is',
      'Mention the recent storm',
      'Offer free inspection',
      'Get agreement for inspection',
    ],
    doorSlamThreshold: Infinity,
  },
  {
    id: 'friendly-neighbor',
    name: 'The Friendly Neighbor',
    icon: '🏡',
    description: 'Retired homeowner who enjoys chatting and wants you to succeed',
    difficulty: DifficultyLevel.ROOKIE,
    context: 'Retired, home most of the day, remembers the storm last month.',
    initialMessage: 'Oh hello! How are you today?',
    objections: [
      'What was your name again?',
      'So you inspect roofs? Tell me more.',
    ],
    successCriteria: [
      'Introduce yourself clearly',
      'Explain Roof ER services',
      'Mention local storm',
      'Offer inspection',
      'Show patience and respect',
    ],
    doorSlamThreshold: 5,
  },
  {
    id: 'busy-parent',
    name: 'The Busy Parent',
    icon: '👨‍👩‍👧',
    description: 'Making dinner with loud kids in background. Limited time.',
    difficulty: DifficultyLevel.PRO,
    context: "It's 5:45 PM. Kids are fighting in background. 2-3 minutes max.",
    initialMessage: "I'm pretty busy right now, can you come back later?",
    objections: [
      'Can you get to the point? I\'m making dinner',
      'How long will this take?',
      'I really don\'t have time for this',
    ],
    successCriteria: [
      'Respect their time immediately',
      'Quick, focused pitch',
      'Emphasize free inspection',
      'Offer to schedule for better time',
      'Stay professional under pressure',
    ],
    doorSlamThreshold: 3,
  },
  {
    id: 'skeptical-homeowner',
    name: 'The Skeptic (Scam Victim)',
    icon: '😠',
    description: 'Lost $3,000 to a fake roofer. Hostile and suspicious.',
    difficulty: DifficultyLevel.VETERAN,
    context: 'A "roofer" took deposit 6 months ago and vanished. Very defensive.',
    initialMessage: 'What do you want?',
    objections: [
      'I\'m not interested. Please leave.',
      'You\'re just trying to rip me off',
      'Show me your license RIGHT NOW',
      'I\'ve heard about roofing scams',
      'Get off my property',
    ],
    successCriteria: [
      'Stay calm despite hostility',
      'Build trust with credentials',
      'Reference specific storm with proof',
      'Acknowledge their concerns',
      'Professional boundaries',
    ],
    doorSlamThreshold: 2,
  },
  {
    id: 'price-conscious',
    name: 'The Budget-Conscious Customer',
    icon: '💰',
    description: 'Very careful with money. Every expense is scrutinized.',
    difficulty: DifficultyLevel.PRO,
    context: 'Just had a baby, money is tight. Worried about ANY cost.',
    initialMessage: 'How much is this going to cost me out of pocket?',
    objections: [
      'What\'s the catch? Why would you do this for free?',
      'What if insurance denies it?',
      'Will my rates go up?',
      'This sounds expensive',
    ],
    successCriteria: [
      'Explain insurance covers cost',
      'Clarify deductible is only expense',
      'Reassure about rate increases',
      'Explain free inspection clearly',
      'Build value without pressure',
    ],
    doorSlamThreshold: 3,
  },
  {
    id: 'comparison-shopper',
    name: 'The Comparison Shopper',
    icon: '📊',
    description: 'Getting multiple quotes. Will challenge claims.',
    difficulty: DifficultyLevel.VETERAN,
    context: 'Already gotten 2 other quotes. Looking for best value.',
    initialMessage: 'I\'ve already gotten 2 other quotes from roofing companies.',
    objections: [
      'ABC Roofing said they could start next week',
      'Why should I go with you over them?',
      'That seems higher than what I\'ve been quoted',
      'I need to compare all my options first',
    ],
    successCriteria: [
      'Acknowledge other quotes professionally',
      'Differentiate Roof ER services',
      'Emphasize insurance expertise',
      'Build value beyond price',
      'Confident without being pushy',
    ],
    doorSlamThreshold: 2,
  },
  {
    id: 'storm-chaser-victim',
    name: 'Storm Chaser Victim',
    icon: '🌪️',
    description: 'Had bad experience with storm chasers. Trusts no one.',
    difficulty: DifficultyLevel.ELITE,
    context: 'Previous contractor did shoddy work after storm. Extremely cautious.',
    initialMessage: 'Are you one of those storm chasers? I\'m not falling for that again.',
    objections: [
      'How do I know you\'re legitimate?',
      'The last company took my money and ran',
      'I need to see proof you\'re licensed',
      'I\'m calling the BBB about this',
      'You people are all the same',
    ],
    successCriteria: [
      'Distance from storm chasers',
      'Provide credentials immediately',
      'Reference local presence',
      'Build extreme trust',
      'Professional despite aggression',
    ],
    doorSlamThreshold: 1,
  },
  {
    id: 'elderly-homeowner',
    name: 'The Grateful Senior',
    icon: '👵',
    description: 'Elderly homeowner who needs things explained simply',
    difficulty: DifficultyLevel.ROOKIE,
    context: '70+ years old, lives alone, appreciates patience.',
    initialMessage: 'I\'m sorry, what did you say? Could you speak up a little?',
    objections: [
      'Can you explain that again?',
      'Is this safe? How do I know I can trust you?',
      'Do I need to pay anything today?',
    ],
    successCriteria: [
      'Speak clearly and slowly',
      'Explain things simply',
      'Show patience and respect',
      'Emphasize safety and trust',
      'Repeat key information',
    ],
    doorSlamThreshold: 5,
  },
  {
    id: 'diy-enthusiast',
    name: 'The DIY Expert',
    icon: '🔧',
    description: 'Thinks they know more than any sales rep',
    difficulty: DifficultyLevel.ELITE,
    context: 'Has done "research" and thinks they\'re an expert on roofing.',
    initialMessage: 'I\'ve already researched this extensively. I know how insurance works.',
    objections: [
      'Actually, that\'s not how insurance works',
      'You clearly don\'t understand insurance policies',
      'I can do this myself',
      'I know my rights and you can\'t do that',
    ],
    successCriteria: [
      'Acknowledge their knowledge',
      'Demonstrate superior expertise',
      'Use technical language appropriately',
      'Build credibility with facts',
      'Stay humble and professional',
    ],
    doorSlamThreshold: 2,
  },
  {
    id: 'emergency-repair',
    name: 'Emergency Repair Needed',
    icon: '🚨',
    description: 'Active leak, needs immediate help',
    difficulty: DifficultyLevel.PRO,
    context: 'Roof is actively leaking after recent storm. Stressed.',
    initialMessage: 'My roof is leaking RIGHT NOW. Can you help or not?',
    objections: [
      'I don\'t have time for a sales pitch',
      'When can you actually fix this?',
      'How much will this cost?',
    ],
    successCriteria: [
      'Address emergency immediately',
      'Provide clear timeline',
      'Explain emergency process',
      'Balance urgency with professionalism',
      'Get commitment quickly',
    ],
    doorSlamThreshold: 3,
  },
];

// Retail Division Scenarios
export const RETAIL_SCENARIOS: RoleplayScenario[] = [
  {
    id: 'eager-homeowner-retail',
    name: 'The Eager Homeowner',
    icon: '🏠',
    description: 'Wants to hear about home improvement services',
    difficulty: DifficultyLevel.BEGINNER,
    context: 'Been thinking about updating home. Windows are 12 years old.',
    initialMessage: 'Oh, you do windows? I\'ve been meaning to look into that!',
    objections: [],
    successCriteria: [
      'Warm opening with ice breaker',
      'Neighbor hook with point gesture',
      'Free quotes offer',
      'Alternative close',
      'Three simple steps',
    ],
    doorSlamThreshold: Infinity,
  },
  {
    id: 'busy-professional-retail',
    name: 'The Busy Professional',
    icon: '💼',
    description: 'Just got home from work, protective of evening time',
    difficulty: DifficultyLevel.PRO,
    context: 'It\'s 5:45 PM. Dinner to make, emails to check.',
    initialMessage: 'I\'m really busy right now.',
    objections: [
      'Can you get to the point?',
      'I don\'t have time for this',
    ],
    successCriteria: [
      'Acknowledge time pressure',
      'Use "my job is simple" rebuttal',
      'Quick three steps',
      'Alternative close',
      'Leave professional impression',
    ],
    doorSlamThreshold: 3,
  },
  {
    id: 'not-interested-retail',
    name: 'The Skeptic',
    icon: '😠',
    description: 'Been burned by home improvement salespeople before',
    difficulty: DifficultyLevel.ELITE,
    context: 'Contractor took deposit and did poor work.',
    initialMessage: 'I\'m not interested.',
    objections: [
      'I don\'t do business at the door',
      'How do I know you\'re legitimate?',
      'I\'ve been ripped off before',
      'Leave before I call the HOA',
    ],
    successCriteria: [
      'Use "Totally fair" rebuttal',
      'Pivot to other products',
      'Build trust professionally',
      'Stay calm despite hostility',
      'Professional exit if needed',
    ],
    doorSlamThreshold: 2,
  },
];

// Get scenario by ID
export function getScenarioById(id: string): RoleplayScenario | undefined {
  return [...INSURANCE_SCENARIOS, ...RETAIL_SCENARIOS].find(s => s.id === id);
}

// Get scenarios by difficulty
export function getScenariosByDifficulty(difficulty: DifficultyLevel): RoleplayScenario[] {
  return [...INSURANCE_SCENARIOS, ...RETAIL_SCENARIOS].filter(s => s.difficulty === difficulty);
}

// Get scenarios by division
export function getScenariosByDivision(division: 'insurance' | 'retail'): RoleplayScenario[] {
  return division === 'insurance' ? INSURANCE_SCENARIOS : RETAIL_SCENARIOS;
}
