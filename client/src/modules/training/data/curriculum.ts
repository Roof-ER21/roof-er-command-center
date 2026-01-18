/**
 * Complete 12-Module Training Curriculum
 * Imported from Lite Training System
 */

export interface CurriculumModule {
  id: number;
  title: string;
  description: string;
  type: 'content' | 'script' | 'game' | 'ai-chat' | 'quiz';
  estimatedMinutes: number;
  xpReward: number;
  content?: ModuleContent;
  script?: ScriptContent;
  game?: GameContent;
  quiz?: QuizContent;
}

export interface ModuleContent {
  sections: ContentSection[];
  images?: ImageResource[];
  videos?: VideoResource[];
}

export interface ContentSection {
  heading: string;
  body: string;
  bulletPoints?: string[];
  keyTakeaways?: string[];
}

export interface ScriptContent {
  scenario: string;
  script: string;
  tips: string[];
  practicePrompts: string[];
}

export interface GameContent {
  type: 'objection-handling' | 'sales-cycle';
  instructions: string;
  items?: ObjectionItem[] | SalesCycleItem[];
}

export interface ObjectionItem {
  objection: string;
  responses: {
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

export interface SalesCycleItem {
  id: string;
  phase: string;
  description: string;
  order: number;
}

export interface QuizContent {
  passingScore: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface ImageResource {
  url: string;
  caption: string;
  alt: string;
}

export interface VideoResource {
  url: string;
  title: string;
  duration: string;
}

// ============================================================================
// MODULE 1: WELCOME & COMPANY INTRO
// ============================================================================

const MODULE_1: CurriculumModule = {
  id: 1,
  title: "Welcome & Company Intro",
  description: "Introduction to Roof ER, our mission, values, and what makes us the premier roofing company",
  type: "content",
  estimatedMinutes: 15,
  xpReward: 100,
  content: {
    sections: [
      {
        heading: "Welcome to Roof ER",
        body: "Welcome to the Roof ER family! You're joining one of the fastest-growing roofing companies in the industry. Our mission is to provide exceptional roofing solutions while building lasting relationships with our customers.",
        keyTakeaways: [
          "Roof ER is a customer-first roofing company",
          "We specialize in insurance claims and quality installations",
          "Our success is built on integrity and excellence"
        ]
      },
      {
        heading: "Our Mission & Values",
        body: "At Roof ER, we believe in doing the right thing, every time. Our core values guide everything we do:",
        bulletPoints: [
          "Integrity First - We always do what's right for the customer",
          "Quality Workmanship - Every roof is installed to perfection",
          "Customer Service Excellence - We treat every homeowner like family",
          "Team Collaboration - We succeed together",
          "Continuous Improvement - Always learning, always growing"
        ]
      },
      {
        heading: "What Makes Us Different",
        body: "Roof ER stands out in the roofing industry for several key reasons:",
        bulletPoints: [
          "Insurance Claim Specialists - We navigate the entire insurance process",
          "Free Inspections - No obligation, comprehensive roof inspections",
          "Premium Materials - We use only the best shingles and materials",
          "Lifetime Workmanship Warranty - We stand behind our work",
          "A+ BBB Rating - Proven track record of customer satisfaction"
        ]
      },
      {
        heading: "Your Role as a Sales Representative",
        body: "As a Roof ER sales representative, you are the face of our company. Your job is to help homeowners understand their roofing needs and guide them through the insurance claim process. You'll be their advocate, educator, and trusted advisor.",
        keyTakeaways: [
          "You help homeowners navigate insurance claims",
          "You educate customers about roofing damage and solutions",
          "You represent Roof ER's values in every interaction"
        ]
      }
    ]
  }
};

// ============================================================================
// MODULE 2: YOUR COMMITMENT
// ============================================================================

const MODULE_2: CurriculumModule = {
  id: 2,
  title: "Your Commitment",
  description: "Understanding what it takes to succeed in roofing sales and your commitment to excellence",
  type: "content",
  estimatedMinutes: 10,
  xpReward: 100,
  content: {
    sections: [
      {
        heading: "The Roofing Sales Mindset",
        body: "Success in roofing sales requires dedication, persistence, and a genuine desire to help people. This isn't just a job—it's a career that rewards those who commit to excellence.",
        bulletPoints: [
          "Expect rejection - not every homeowner needs a roof today",
          "Stay persistent - success comes from consistent effort",
          "Learn continuously - the best reps never stop improving",
          "Help first, sell second - when you genuinely help, sales follow"
        ]
      },
      {
        heading: "Your Daily Commitment",
        body: "To succeed in this role, you must commit to these daily activities:",
        bulletPoints: [
          "Door knocking - minimum 50-100 doors per day",
          "Follow-up calls - contact previous leads and schedule appointments",
          "Inspections - conduct thorough roof inspections",
          "Learning - study materials, practice scripts, improve skills",
          "Team meetings - participate and learn from top performers"
        ]
      },
      {
        heading: "Time Management",
        body: "Your time is your most valuable asset. Successful reps structure their days for maximum productivity:",
        bulletPoints: [
          "Morning prep (8-9am) - Review leads, plan route, mental preparation",
          "Door knocking (9am-1pm) - Peak homeowner availability",
          "Lunch break (1-2pm) - Rest and recharge",
          "Inspections (2-6pm) - Scheduled appointments and walk-ups",
          "Follow-up (6-7pm) - Calls, texts, scheduling for next day"
        ]
      },
      {
        heading: "Compensation & Success",
        body: "Roof ER offers one of the most competitive compensation plans in the industry. Your earning potential is unlimited and directly tied to your performance.",
        keyTakeaways: [
          "Commission-based structure with high earning potential",
          "Top performers earn $100k-$300k+ annually",
          "Bonuses and incentives for hitting milestones",
          "Career advancement opportunities for consistent achievers"
        ]
      }
    ]
  }
};

// ============================================================================
// MODULE 3: THE INITIAL PITCH
// ============================================================================

const MODULE_3: CurriculumModule = {
  id: 3,
  title: "The Initial Pitch",
  description: "Master the door-knocking script and initial homeowner approach",
  type: "script",
  estimatedMinutes: 20,
  xpReward: 150,
  script: {
    scenario: "You're approaching a home in a neighborhood where you've identified potential hail damage. The homeowner answers the door.",
    script: `Hi there! My name is [Your Name] with Roof ER. We're in your neighborhood today doing free roof inspections because we noticed some storm damage in the area.

[PAUSE - Let them respond]

Have you noticed any issues with your roof? Any leaks, missing shingles, or anything like that?

[LISTEN to their response]

Well, the reason I'm here is that we've been working with several of your neighbors who had damage from the recent [storm/hail event]. Your insurance company will actually cover a full roof replacement if there's enough damage, and we handle the entire claim process for you.

The inspection is completely free, takes about 15 minutes, and there's absolutely no obligation. I can check it right now if you have a few minutes, or I can schedule a time that works better for you.

[WAIT for response - book appointment or inspect now]

Great! Let me grab my ladder and I'll take a quick look. While I'm up there, can I ask - who's your insurance company?

[Note their insurance provider]

Perfect. I'll be down in about 15 minutes to show you what I find.`,
    tips: [
      "Smile and maintain confident body language",
      "Speak clearly and at a moderate pace",
      "Use the homeowner's name if they provide it",
      "Point to other houses if you've worked in the area",
      "Never be pushy - you're offering a free service",
      "If they say no, politely leave a card and move on"
    ],
    practicePrompts: [
      "Practice with a partner playing the homeowner",
      "Record yourself and listen back",
      "Try different objection scenarios",
      "Memorize the core script until it feels natural"
    ]
  }
};

// ============================================================================
// MODULE 4: THE INSPECTION PROCESS
// ============================================================================

const MODULE_4: CurriculumModule = {
  id: 4,
  title: "The Inspection Process",
  description: "Learn how to conduct a professional roof inspection and document damage",
  type: "content",
  estimatedMinutes: 25,
  xpReward: 150,
  content: {
    sections: [
      {
        heading: "Safety First",
        body: "Before you climb any ladder, safety must be your top priority. Never rush an inspection and always follow proper safety protocols.",
        bulletPoints: [
          "Always use a stable, properly positioned ladder",
          "Wear non-slip shoes with good tread",
          "Never inspect in wet, icy, or extremely windy conditions",
          "Use proper ladder angle (4:1 ratio)",
          "Have someone spot you when possible",
          "Inspect from ground level first to assess accessibility"
        ]
      },
      {
        heading: "What to Look For",
        body: "During your inspection, you're looking for signs of storm damage, wear and tear, and potential insurance claim triggers:",
        bulletPoints: [
          "Hail damage - circular dents, bruising on shingles",
          "Wind damage - lifted, creased, or missing shingles",
          "Missing or damaged ridge cap shingles",
          "Damaged or dented vents, flashing, and metal components",
          "Granule loss - check gutters and exposed mat",
          "Soft spots or degraded decking",
          "Age-related wear - brittleness, curling, cracking"
        ]
      },
      {
        heading: "Documentation is Critical",
        body: "Proper documentation makes or breaks an insurance claim. You must thoroughly document all damage:",
        bulletPoints: [
          "Take clear, close-up photos of all damage",
          "Include wide shots showing roof sections",
          "Photograph vents, flashing, and ridge caps",
          "Document test squares (exposed hits in concentrated area)",
          "Get ground-level shots showing damage visibility",
          "Note damage locations on diagram/sketch",
          "Count approximate number of hits per section"
        ]
      },
      {
        heading: "Inspection Best Practices",
        body: "Professional inspectors follow a systematic approach:",
        bulletPoints: [
          "Start from one end and work methodically across the roof",
          "Inspect all four roof faces if possible",
          "Check every roof penetration (vents, pipes, chimneys)",
          "Look in gutters for granule accumulation",
          "Test shingle flexibility (age assessment)",
          "Document manufacturer, shingle type, and approximate age",
          "Take your time - rushing leads to missed damage"
        ],
        keyTakeaways: [
          "Safety is always the first priority",
          "Thorough documentation is essential for claims",
          "Look for both obvious and subtle damage",
          "Professional inspections build customer trust"
        ]
      }
    ]
  }
};

// ============================================================================
// MODULE 5: POST-INSPECTION PITCH
// ============================================================================

const MODULE_5: CurriculumModule = {
  id: 5,
  title: "Post-Inspection Pitch",
  description: "Deliver your findings and transition to the insurance claim conversation",
  type: "script",
  estimatedMinutes: 20,
  xpReward: 150,
  script: {
    scenario: "You've completed the inspection and found significant hail damage. The homeowner is waiting to hear your findings.",
    script: `[Approach with tablet/phone showing photos]

Alright, so I've completed the inspection and I definitely found damage up there. Let me show you what I'm seeing.

[Show photos on device]

See these circular marks here? That's textbook hail damage. And over here, you can see where the wind lifted these shingles. I found this kind of damage across all sections of your roof.

Now, here's the good news: this is 100% covered by your insurance. Your roof qualifies for a full replacement, and your insurance company will pay for it minus your deductible.

[PAUSE - let this sink in]

Here's how it works: We file the claim with [their insurance company], and they'll send out an adjuster to verify the damage. We'll meet with the adjuster, walk them through everything I documented, and make sure they see all the damage.

Once the claim is approved, your insurance cuts you a check. We handle all the paperwork, pull all the permits, order your new roof, and complete the installation. The entire process typically takes 2-4 weeks from claim approval to completion.

[Show sample color options]

You'll get to choose from premium architectural shingles in whatever color you want. These aren't cheap shingles - we're talking about high-quality materials with a 50-year warranty.

Your out-of-pocket cost is just your insurance deductible - typically $1,000 to $2,500 depending on your policy. That's it. You get a brand new roof for just your deductible.

Now, I need to be upfront with you: insurance claims have a statute of limitations. In most states, you have one year from the date of the storm to file. After that, you lose this benefit and you'd have to pay out of pocket - which for a roof this size would be $15,000 to $25,000.

So the question is really just: would you like us to file the claim and get you a new roof, or would you prefer to wait and risk losing this coverage?

[WAIT for response]

Great! Let me get some information from you and we'll get started right away.`,
    tips: [
      "Show confidence - you're the expert",
      "Use visual evidence - show them the damage",
      "Emphasize the insurance benefit and limited time window",
      "Create urgency without being pushy",
      "Use assumptive language ('when we install' vs 'if you decide')",
      "Address concerns directly and honestly"
    ],
    practicePrompts: [
      "Practice transitioning from inspection to pitch",
      "Rehearse handling common objections at this stage",
      "Role-play with different homeowner personalities",
      "Perfect your photo presentation technique"
    ]
  }
};

// ============================================================================
// MODULE 6: HANDLING OBJECTIONS
// ============================================================================

const MODULE_6: CurriculumModule = {
  id: 6,
  title: "Handling Objections",
  description: "Interactive game to practice overcoming common homeowner objections",
  type: "game",
  estimatedMinutes: 30,
  xpReward: 200,
  game: {
    type: "objection-handling",
    instructions: "For each objection, select the most effective response. You'll receive immediate feedback on your choice.",
    items: [
      {
        objection: "I need to talk to my spouse first.",
        responses: [
          {
            text: "No problem! When will they be home? I can come back and go over everything with both of you.",
            isCorrect: true,
            feedback: "Excellent! This shows respect for their decision-making process while keeping the opportunity alive. Scheduling a return visit is key."
          },
          {
            text: "This is a time-sensitive insurance matter. You really should make a decision today.",
            isCorrect: false,
            feedback: "Too pushy. Pressuring homeowners backfires and damages trust. Respect their process while creating a clear next step."
          },
          {
            text: "I understand. Here's my card - give me a call when you're ready.",
            isCorrect: false,
            feedback: "You're giving up control. Instead of leaving it open-ended, schedule a specific time to follow up or return."
          }
        ]
      },
      {
        objection: "I don't want my insurance rates to go up.",
        responses: [
          {
            text: "I understand that concern. Here's the truth: filing a storm damage claim typically doesn't increase your rates because it's an 'Act of God' claim, not a fault claim. Your insurance company budgets for these. Would you like me to explain how that works?",
            isCorrect: true,
            feedback: "Perfect! You acknowledged the concern, provided factual information, and offered to educate further. This builds trust and credibility."
          },
          {
            text: "Don't worry about that - everyone files claims and it's fine.",
            isCorrect: false,
            feedback: "Too dismissive. The homeowner's concern is legitimate. Always acknowledge concerns and provide specific, factual responses."
          },
          {
            text: "That's just a myth. Insurance rates don't go up from storm claims.",
            isCorrect: false,
            feedback: "While factually closer, calling their concern a 'myth' can feel condescending. Frame it more diplomatically and offer to explain the details."
          }
        ]
      },
      {
        objection: "I want to get multiple bids.",
        responses: [
          {
            text: "That makes sense - it's a big decision. Here's the thing though: with insurance claims, all companies are quoting the same price because it's determined by your insurance company. The real difference is in quality, service, and getting the claim approved. Can I show you why Roof ER stands out?",
            isCorrect: true,
            feedback: "Excellent reframe! You acknowledged their desire, educated them on how insurance pricing works, and shifted focus to your differentiators."
          },
          {
            text: "Sure, get other bids. Here's my card when you're ready.",
            isCorrect: false,
            feedback: "You just lost the sale. Instead of educating them and differentiating yourself, you gave up. Always explain the insurance claim pricing reality."
          },
          {
            text: "You don't need other bids - we're the best in the business and our price is unbeatable.",
            isCorrect: false,
            feedback: "Too aggressive and doesn't address their actual concern. Educate them about how insurance claims work rather than just claiming you're the best."
          }
        ]
      },
      {
        objection: "I don't see any damage.",
        responses: [
          {
            text: "Most people don't - hail damage isn't always obvious from the ground. That's why I take photos during my inspection. Let me show you exactly what I found up there.",
            isCorrect: true,
            feedback: "Perfect! You validated their observation, explained why, and used your documentation to prove the damage. Visual evidence is powerful."
          },
          {
            text: "Trust me, it's there. I've been doing this for years and I know damage when I see it.",
            isCorrect: false,
            feedback: "Asking for blind trust doesn't work. Always show them the evidence. Photos and documentation overcome skepticism."
          },
          {
            text: "Well, I found it on the roof. Your insurance will see it too when their adjuster comes out.",
            isCorrect: false,
            feedback: "You're being defensive. Instead, use this as an opportunity to educate and show your documented findings."
          }
        ]
      },
      {
        objection: "I just had my roof replaced 5 years ago.",
        responses: [
          {
            text: "That's actually not uncommon - storms don't care how old your roof is. The good news is that if there's damage from a recent storm, your insurance will still cover the replacement. Plus, you'll get brand new materials with an updated warranty. Want me to show you what I found?",
            isCorrect: true,
            feedback: "Excellent! You acknowledged their situation, explained how insurance works, highlighted a benefit, and moved forward with evidence."
          },
          {
            text: "5 years isn't that long - roofs can get damaged at any age.",
            isCorrect: false,
            feedback: "Too brief and doesn't really address their concern or move the conversation forward. Expand on why age doesn't matter with storm damage."
          },
          {
            text: "Then you'll definitely want to file a claim - you deserve a quality roof and this is your chance.",
            isCorrect: false,
            feedback: "This sounds like you're just trying to sell regardless of their situation. First acknowledge their concern, then explain the insurance benefit."
          }
        ]
      },
      {
        objection: "I can't afford it right now.",
        responses: [
          {
            text: "I completely understand - that's exactly why the insurance claim is so valuable. Your out-of-pocket cost is only your deductible, which is typically $1,000-$2,500. The insurance pays for everything else. And we can even work with you on payment plans for the deductible if needed. The alternative is paying $15,000-$25,000 out of pocket if you wait and lose the insurance option.",
            isCorrect: true,
            feedback: "Perfect! You empathized, clarified the actual cost, offered a solution for the deductible, and created contrast with the alternative."
          },
          {
            text: "Don't worry about the cost - insurance covers it.",
            isCorrect: false,
            feedback: "Too vague. They need to understand the specific cost structure: just the deductible, not the full roof cost."
          },
          {
            text: "We offer financing options for the full project if you prefer to skip insurance.",
            isCorrect: false,
            feedback: "You just made it more expensive by suggesting they skip insurance! Always emphasize the insurance benefit first."
          }
        ]
      }
    ]
  }
};

// ============================================================================
// MODULE 7: SHINGLE TYPES
// ============================================================================

const MODULE_7: CurriculumModule = {
  id: 7,
  title: "Shingle Types",
  description: "Understanding different shingle types, manufacturers, and material options",
  type: "content",
  estimatedMinutes: 20,
  xpReward: 150,
  content: {
    sections: [
      {
        heading: "Architectural vs. 3-Tab Shingles",
        body: "Understanding the two main categories of asphalt shingles is essential for educating homeowners.",
        bulletPoints: [
          "3-Tab Shingles - Older, flat design with single layer, 20-25 year lifespan",
          "Architectural Shingles - Multi-layered, dimensional appearance, 30-50 year warranty",
          "Architectural shingles are now the industry standard",
          "Better aesthetics, longer warranty, higher wind resistance",
          "Insurance companies typically approve architectural upgrades"
        ]
      },
      {
        heading: "Major Manufacturers",
        body: "Roof ER works with top-tier shingle manufacturers to ensure quality and warranty coverage:",
        bulletPoints: [
          "GAF - Industry leader, Timberline HDZ series, 50-year warranty",
          "Owens Corning - Duration series, excellent color selection",
          "CertainTeed - Landmark series, strong warranty program",
          "Malarkey - Premium shingles with impact resistance",
          "IKO - Budget-friendly option with good performance"
        ]
      },
      {
        heading: "Impact-Resistant (IR) Shingles",
        body: "Many areas now require or incentivize impact-resistant shingles, especially in hail-prone regions:",
        bulletPoints: [
          "Class 4 impact rating - highest available",
          "Insurance discounts in most states (up to 30%)",
          "Reinforced construction resists hail damage better",
          "GAF Timberline HDZ, OC Duration Storm, CertainTeed IR options",
          "Required in some municipalities after severe hail events"
        ],
        keyTakeaways: [
          "IR shingles provide long-term savings through insurance discounts",
          "Better protection against future storm damage",
          "Often covered by insurance as part of replacement"
        ]
      },
      {
        heading: "Color Selection",
        body: "Helping homeowners choose the right color is an important part of the sales process:",
        bulletPoints: [
          "Match or complement the home's exterior colors",
          "Consider neighborhood aesthetics and resale value",
          "Lighter colors reflect heat (better for warm climates)",
          "Darker colors absorb heat (better for cold climates)",
          "Show samples in natural light when possible",
          "Popular colors: Charcoal, Weathered Wood, Pewter Gray, Mission Brown"
        ]
      },
      {
        heading: "Warranties and Protection",
        body: "Understanding warranty coverage helps you explain value to homeowners:",
        bulletPoints: [
          "Manufacturer warranty - defect coverage (30-50 years)",
          "Workmanship warranty - Roof ER installation guarantee (lifetime)",
          "Wind resistance - typically 110-130 mph ratings",
          "Algae resistance - most premium shingles include this",
          "Transferable warranties - add value for home resales"
        ]
      }
    ]
  }
};

// ============================================================================
// MODULE 8: ROOFING & DAMAGE IDENTIFICATION
// ============================================================================

const MODULE_8: CurriculumModule = {
  id: 8,
  title: "Roofing & Damage Identification",
  description: "Advanced training on roof components, damage types, and identification techniques",
  type: "content",
  estimatedMinutes: 30,
  xpReward: 200,
  content: {
    sections: [
      {
        heading: "Roof Components",
        body: "Every roof system consists of multiple components that work together:",
        bulletPoints: [
          "Shingles - primary weather protection layer",
          "Underlayment - secondary water barrier (felt or synthetic)",
          "Ice & Water Shield - protection for vulnerable areas",
          "Decking/Sheathing - structural base (usually plywood or OSB)",
          "Ridge cap - specialized shingles covering the roof peak",
          "Flashing - metal components around chimneys, vents, valleys",
          "Drip edge - metal edge protection along eaves and rakes",
          "Ventilation - intake (soffit) and exhaust (ridge or box vents)",
          "Gutters & downspouts - water management system"
        ]
      },
      {
        heading: "Hail Damage Identification",
        body: "Hail damage is the most common insurance claim trigger. Learn to identify it accurately:",
        bulletPoints: [
          "Random pattern - hits are irregular, not uniform",
          "Circular or oval impact marks",
          "Shiny spots where granules are displaced",
          "Soft dents that feel spongy to touch",
          "Black substrate visible (asphalt showing through)",
          "Check all roof faces - damage may be directional",
          "Inspect metal components - dents are definitive proof",
          "Functional vs. cosmetic - insurance covers functional damage"
        ],
        keyTakeaways: [
          "Look for test squares - concentrated areas of hits",
          "Metal damage (vents, flashing) confirms hail occurred",
          "Document damage thoroughly for insurance"
        ]
      },
      {
        heading: "Wind Damage Identification",
        body: "Wind damage occurs during high-wind events and severe storms:",
        bulletPoints: [
          "Lifted shingles - edges curled up or bent",
          "Creased shingles - horizontal lines from lifting and settling",
          "Missing shingles - blown off entirely",
          "Torn or ripped shingles - partial removal",
          "Exposed nail heads - shingles shifted upward",
          "Ridge cap damage - most vulnerable to wind",
          "Check for directional patterns - wind comes from specific direction"
        ]
      },
      {
        heading: "Age-Related Wear & Deterioration",
        body: "Understanding normal aging helps differentiate from storm damage:",
        bulletPoints: [
          "Granule loss - protective coating wears away",
          "Curling - shingle edges curl up due to thermal cycling",
          "Cracking - brittleness from UV exposure and age",
          "Blistering - moisture trapped under shingle surface",
          "Algae/moss growth - organic staining and growth",
          "Sagging - structural issues with decking",
          "Uniform vs. random - age damage is typically uniform"
        ],
        keyTakeaways: [
          "Insurance covers storm damage, not normal wear",
          "Age context matters - 25-year-old roof vs. 5-year-old roof",
          "Combination claims possible - old roof with recent storm damage"
        ]
      },
      {
        heading: "Interior Damage Signs",
        body: "Sometimes damage is visible from inside the home:",
        bulletPoints: [
          "Water stains on ceilings or walls",
          "Drips or active leaks during rain",
          "Daylight visible through roof boards in attic",
          "Moisture or water staining on attic decking",
          "Mold or mildew growth in attic space",
          "Sagging ceiling areas",
          "Peeling paint near roofline"
        ]
      },
      {
        heading: "Documentation Best Practices",
        body: "Professional documentation is critical for insurance claim approval:",
        bulletPoints: [
          "Take minimum 20-30 photos per roof",
          "Close-up shots of individual damage points",
          "Wide shots showing damage distribution",
          "Photos of all metal components (vents, flashing, gutters)",
          "Directional labels - note which roof face",
          "Reference objects - use coin or marker for size context",
          "Before/after comparisons when possible",
          "Organize photos by roof section for adjuster meeting"
        ]
      }
    ]
  }
};

// ============================================================================
// MODULE 9: THE SALES CYCLE
// ============================================================================

const MODULE_9: CurriculumModule = {
  id: 9,
  title: "The Sales Cycle",
  description: "Interactive game to learn the complete sales process from door knock to installation",
  type: "game",
  estimatedMinutes: 25,
  xpReward: 200,
  game: {
    type: "sales-cycle",
    instructions: "Drag and drop the sales phases into the correct order. Understanding the complete cycle helps you guide customers through each step.",
    items: [
      {
        id: "door-knock",
        phase: "Initial Door Knock",
        description: "First contact with homeowner, introduce yourself and Roof ER, schedule inspection",
        order: 1
      },
      {
        id: "inspection",
        phase: "Roof Inspection",
        description: "Conduct thorough roof inspection, document all damage with photos, assess claim viability",
        order: 2
      },
      {
        id: "presentation",
        phase: "Damage Presentation",
        description: "Show homeowner the damage, explain insurance claim process, overcome objections",
        order: 3
      },
      {
        id: "contract",
        phase: "Contract Signing",
        description: "Review and sign installation agreement, collect insurance information, explain next steps",
        order: 4
      },
      {
        id: "claim-filing",
        phase: "Insurance Claim Filing",
        description: "Submit claim to insurance company with documentation, schedule adjuster meeting",
        order: 5
      },
      {
        id: "adjuster-meeting",
        phase: "Adjuster Meeting",
        description: "Meet with insurance adjuster on-site, walk through damage, ensure proper documentation",
        order: 6
      },
      {
        id: "claim-approval",
        phase: "Claim Approval",
        description: "Insurance approves claim and issues payment, review scope with homeowner",
        order: 7
      },
      {
        id: "material-selection",
        phase: "Material Selection",
        description: "Homeowner selects shingle color and style, finalize product specifications",
        order: 8
      },
      {
        id: "permits",
        phase: "Permits & Scheduling",
        description: "Pull required permits, order materials, schedule installation crew",
        order: 9
      },
      {
        id: "installation",
        phase: "Roof Installation",
        description: "Professional installation team completes roof replacement (1-3 days typically)",
        order: 10
      },
      {
        id: "final-inspection",
        phase: "Final Inspection",
        description: "City/county inspection for permit closure, quality check, customer walkthrough",
        order: 11
      },
      {
        id: "payment-completion",
        phase: "Payment & Completion",
        description: "Collect final payment, provide warranty documentation, request review/referral",
        order: 12
      }
    ]
  }
};

// ============================================================================
// MODULE 10: FILING A CLAIM & CLOSING
// ============================================================================

const MODULE_10: CurriculumModule = {
  id: 10,
  title: "Filing a Claim & Closing",
  description: "Master the claim filing process and closing techniques to secure the sale",
  type: "script",
  estimatedMinutes: 25,
  xpReward: 200,
  script: {
    scenario: "The homeowner has agreed to move forward. You're now explaining the claim filing process and getting them to sign the contract.",
    script: `Perfect! Let me explain exactly what happens next so you know what to expect.

[Take out contract and iPad/laptop]

First, I'm going to fill out this installation agreement with you. This authorizes us to file the insurance claim on your behalf and locks in your project. There's no money due today - this is just getting the paperwork started.

[Begin filling out contract]

I'll need some basic information: your full name, property address, phone number, email, and insurance company information. Do you have your insurance card handy?

[Collect information]

Great. Now, here's how the insurance claim process works step by step:

**Step 1 - Claim Filing (Today)**
We submit the claim to [Insurance Company] along with all the documentation I gathered today. They typically respond within 3-5 business days to schedule an adjuster.

**Step 2 - Adjuster Meeting (1-2 weeks)**
The insurance company sends an adjuster to verify the damage. I'll meet them here at your property and walk them through everything I documented. This ensures they see all the damage and approve the full replacement.

**Step 3 - Claim Approval (1-2 weeks after adjuster)**
Once the adjuster completes their report, the insurance company approves the claim and sends you a check. This usually covers the full replacement cost minus your deductible.

**Step 4 - Material Selection & Scheduling (After approval)**
You'll select your shingle color and style from our premium options. We'll order materials, pull permits, and schedule your installation - usually 2-3 weeks out.

**Step 5 - Installation (1-3 days)**
Our professional crew arrives and completes your roof replacement. We protect your property, handle all cleanup, and ensure quality workmanship.

**Step 6 - Final Inspection & Payment**
City inspector approves the work, we do a final walkthrough with you, and collect the final payment. You receive all warranty documentation.

The entire process typically takes 4-8 weeks from start to finish, depending on insurance response times and weather.

[Show payment breakdown on paper]

Now, let's talk about the financial piece because this is important:

Your insurance company will send you two checks:
- **First check (ACV)** - Actual Cash Value, usually 50-70% of total claim
- **Second check (RCV)** - Recoverable depreciation, remaining 30-50% after completion

Your total out-of-pocket cost is just your deductible: $[amount] based on your policy.

We collect payment in two parts:
1. **After insurance approval** - Your deductible plus any upgrades you choose
2. **After final inspection** - The RCV check from insurance (signed over to us)

Make sense so far?

[Answer any questions]

The last thing I want to mention: we have a statute of limitations on insurance claims. In [state], you have one year from the storm date to file. If you wait and miss that window, you lose this coverage and would have to pay the full $15,000-$25,000 out of pocket.

That's why I recommend we get this filed now while you're 100% covered.

[Turn contract toward them]

Alright, let me show you what you're signing here. This agreement authorizes Roof ER to:
- File the insurance claim on your behalf
- Meet with the adjuster to ensure proper damage assessment
- Complete the roof installation per the approved scope
- Pull all necessary permits

It also outlines our workmanship warranty - lifetime guarantee on labor.

I just need your signature here, here, and initial here.

[Point to signature lines]

And I'll need a copy of your insurance card and driver's license for the claim filing.

[Collect signatures and documents]

Perfect! You're all set. I'm going to submit this claim today, and you should hear from [Insurance Company] within 3-5 business days. I'll be your single point of contact throughout this entire process, so if you have any questions at all, just call or text me directly.

Let me give you my card with my cell number on it. I'm available pretty much anytime.

[Hand them business card]

One last thing: if any other roofing companies come by, you can let them know you're already working with Roof ER and have a claim filed. That'll save you from multiple pitches.

Welcome to the Roof ER family! We're going to take great care of you.`,
    tips: [
      "Go slow through the process explanation - don't rush",
      "Use visual aids - show the timeline on paper",
      "Create urgency with statute of limitations fact",
      "Use assumptive language - 'when we install' not 'if'",
      "Address money concerns directly and clearly",
      "Make signing feel like a natural next step, not a big decision",
      "Always end with reassurance and next steps"
    ],
    practicePrompts: [
      "Practice explaining the payment structure clearly",
      "Rehearse the timeline walkthrough",
      "Role-play common closing objections",
      "Perfect your contract explanation delivery"
    ]
  }
};

// ============================================================================
// MODULE 11: AI ROLE-PLAY SIMULATOR
// ============================================================================

const MODULE_11: CurriculumModule = {
  id: 11,
  title: "AI Role-Play Simulator",
  description: "Practice your pitch with an AI homeowner that provides realistic objections and feedback",
  type: "ai-chat",
  estimatedMinutes: 30,
  xpReward: 250,
  content: {
    sections: [
      {
        heading: "AI Role-Play Training",
        body: "This module uses advanced AI to simulate realistic homeowner interactions. You'll practice your pitch, handle objections, and receive detailed feedback on your performance.",
        bulletPoints: [
          "Realistic homeowner personalities and objections",
          "Real-time feedback on your responses",
          "Practice different scenarios (skeptical, interested, budget-conscious)",
          "Unlimited practice sessions to build confidence",
          "Performance scoring based on key criteria"
        ]
      },
      {
        heading: "How to Use the Simulator",
        body: "The AI role-play simulator guides you through a complete sales interaction:",
        bulletPoints: [
          "Select a scenario (door knock, post-inspection, closing)",
          "Choose homeowner personality type",
          "Conduct the conversation naturally",
          "Receive instant feedback on your approach",
          "Review performance metrics and improvement areas"
        ],
        keyTakeaways: [
          "Practice makes perfect - use this tool daily",
          "Experiment with different approaches",
          "Learn from the feedback to continuously improve"
        ]
      }
    ]
  }
};

// ============================================================================
// MODULE 12: FINAL QUIZ
// ============================================================================

const MODULE_12: CurriculumModule = {
  id: 12,
  title: "Final Quiz",
  description: "Test your knowledge across all training modules to earn certification",
  type: "quiz",
  estimatedMinutes: 30,
  xpReward: 300,
  quiz: {
    passingScore: 80,
    questions: [
      {
        id: 1,
        question: "What is Roof ER's primary value proposition to homeowners?",
        options: [
          "We offer the cheapest roofs in the area",
          "We handle the entire insurance claim process for storm-damaged roofs",
          "We only work with luxury homes",
          "We offer financing for all roof replacements"
        ],
        correctAnswer: 1,
        explanation: "Roof ER specializes in insurance claim processing for storm-damaged roofs. We guide homeowners through the entire process from inspection to installation, handling all insurance interactions."
      },
      {
        id: 2,
        question: "During the initial door knock, what should you offer the homeowner?",
        options: [
          "A discount on their new roof",
          "A free roof cleaning service",
          "A free, no-obligation roof inspection",
          "An immediate price quote without seeing the roof"
        ],
        correctAnswer: 2,
        explanation: "The initial pitch focuses on offering a free, no-obligation roof inspection. This low-pressure approach gets you on the roof to document damage."
      },
      {
        id: 3,
        question: "What is the primary indicator of hail damage on asphalt shingles?",
        options: [
          "Straight cracks across multiple shingles",
          "Circular or oval impact marks with granule displacement",
          "Uniform color fading across the entire roof",
          "Moss and algae growth"
        ],
        correctAnswer: 1,
        explanation: "Hail damage appears as circular or oval impact marks where the hail struck the shingle. These hits often displace granules, creating shiny spots or exposing the black asphalt underneath."
      },
      {
        id: 4,
        question: "What is a homeowner's typical out-of-pocket cost for an insurance-covered roof replacement?",
        options: [
          "The full cost of the roof ($15,000-$25,000)",
          "50% of the total roof cost",
          "Just their insurance deductible ($1,000-$2,500)",
          "Nothing - insurance covers everything"
        ],
        correctAnswer: 2,
        explanation: "When insurance approves a claim, the homeowner's only out-of-pocket cost is their policy deductible, typically $1,000-$2,500. Insurance covers the remaining cost of the full roof replacement."
      },
      {
        id: 5,
        question: "How should you respond when a homeowner says 'I need to get multiple bids'?",
        options: [
          "Say 'Sure, here's my card' and leave",
          "Tell them they're wasting their time",
          "Explain that insurance determines the price, so the real difference is quality and service",
          "Offer to beat any competitor's price"
        ],
        correctAnswer: 2,
        explanation: "The correct response educates the homeowner that insurance claims work differently than traditional bids - the insurance company sets the price. The real decision factors are company quality, service, and ability to get the claim approved."
      },
      {
        id: 6,
        question: "What are the two main types of asphalt shingles?",
        options: [
          "Wooden and composite",
          "3-tab and architectural",
          "Metal and asphalt",
          "Ceramic and clay"
        ],
        correctAnswer: 1,
        explanation: "The two main types of asphalt shingles are 3-tab (older, flat, single-layer) and architectural (modern, dimensional, multi-layered). Architectural shingles are now the industry standard."
      },
      {
        id: 7,
        question: "What is the statute of limitations for filing a storm damage insurance claim in most states?",
        options: [
          "30 days from the storm",
          "6 months from the storm",
          "1 year from the storm",
          "There is no time limit"
        ],
        correctAnswer: 2,
        explanation: "Most states have a one-year statute of limitations for filing insurance claims from the date of the storm. After that window, homeowners lose their insurance coverage and must pay out of pocket."
      },
      {
        id: 8,
        question: "What should you always do during a roof inspection to support the insurance claim?",
        options: [
          "Rush through it to save time",
          "Only look at the front-facing roof sections",
          "Thoroughly document all damage with clear, detailed photos",
          "Avoid taking photos to save phone storage"
        ],
        correctAnswer: 2,
        explanation: "Thorough photo documentation is critical for insurance claim approval. Take close-up shots of damage, wide shots showing distribution, and photos of all metal components. Minimum 20-30 photos per roof."
      },
      {
        id: 9,
        question: "When a homeowner says 'I don't want my rates to go up,' what's the best response?",
        options: [
          "Don't worry, rates never go up from storm claims",
          "That's just a myth people believe",
          "Acknowledge the concern and explain that Act of God claims typically don't increase rates like fault claims do",
          "Tell them to call their insurance agent"
        ],
        correctAnswer: 2,
        explanation: "Acknowledge their legitimate concern, then educate them that storm damage claims (Act of God) are typically treated differently than fault claims and don't usually increase rates because insurance companies budget for weather events."
      },
      {
        id: 10,
        question: "What is the correct order of the sales cycle?",
        options: [
          "Contract, Inspection, Door Knock, Installation",
          "Door Knock, Inspection, Presentation, Contract, Claim Filing, Adjuster Meeting, Installation",
          "Inspection, Door Knock, Contract, Installation",
          "Claim Filing, Door Knock, Inspection, Installation"
        ],
        correctAnswer: 1,
        explanation: "The correct sales cycle is: Door Knock → Inspection → Damage Presentation → Contract Signing → Claim Filing → Adjuster Meeting → Claim Approval → Material Selection → Installation → Final Inspection → Payment."
      },
      {
        id: 11,
        question: "What are Class 4 impact-resistant shingles?",
        options: [
          "Shingles that last 4 years",
          "The cheapest type of shingles available",
          "Reinforced shingles with the highest impact rating that often qualify for insurance discounts",
          "Shingles that come in 4 different colors"
        ],
        correctAnswer: 2,
        explanation: "Class 4 (IR) shingles have the highest impact resistance rating, are reinforced to better resist hail damage, and often qualify homeowners for insurance discounts of up to 30% in most states."
      },
      {
        id: 12,
        question: "When presenting damage to a homeowner, what should you do first?",
        options: [
          "Tell them the total cost",
          "Show them photos of the damage you documented",
          "Ask them to climb on the roof with you",
          "Start discussing shingle colors"
        ],
        correctAnswer: 1,
        explanation: "Always start with visual evidence. Show the homeowner clear photos of the damage you found. Seeing is believing - photos build credibility and help them understand why they need a roof replacement."
      },
      {
        id: 13,
        question: "What documentation should you collect from a homeowner when signing a contract?",
        options: [
          "Just their signature",
          "Insurance card, driver's license, and signed contract",
          "Only their insurance information",
          "Their credit card for immediate payment"
        ],
        correctAnswer: 1,
        explanation: "You need: signed contract, copy of insurance card (for claim filing), and driver's license (for identity verification). No payment is collected at contract signing for insurance claims."
      },
      {
        id: 14,
        question: "What should you do if a homeowner says 'I just had my roof replaced 5 years ago'?",
        options: [
          "Apologize and leave immediately",
          "Tell them they're lying",
          "Explain that storms don't care about roof age, and if there's damage, insurance will still cover it",
          "Suggest they sue the previous roofer"
        ],
        correctAnswer: 2,
        explanation: "Age doesn't matter with storm damage. Acknowledge their situation, explain that recent storms can damage newer roofs, and emphasize that insurance will cover qualifying damage regardless of roof age."
      },
      {
        id: 15,
        question: "What is the most important safety rule during roof inspections?",
        options: [
          "Inspect as quickly as possible",
          "Never use a ladder",
          "Always prioritize safety - use proper ladder technique and don't inspect in dangerous conditions",
          "Bring the homeowner on the roof with you"
        ],
        correctAnswer: 2,
        explanation: "Safety is always the top priority. Use proper ladder positioning (4:1 ratio), wear appropriate footwear, never inspect in wet/icy/windy conditions, and take your time. Your safety is more important than any sale."
      }
    ]
  }
};

// ============================================================================
// EXPORT ALL MODULES
// ============================================================================

export const TRAINING_CURRICULUM: CurriculumModule[] = [
  MODULE_1,
  MODULE_2,
  MODULE_3,
  MODULE_4,
  MODULE_5,
  MODULE_6,
  MODULE_7,
  MODULE_8,
  MODULE_9,
  MODULE_10,
  MODULE_11,
  MODULE_12,
];

// Helper function to get module by ID
export function getModuleById(id: number): CurriculumModule | undefined {
  return TRAINING_CURRICULUM.find((module) => module.id === id);
}

// Helper function to calculate total training time
export function getTotalTrainingMinutes(): number {
  return TRAINING_CURRICULUM.reduce((total, module) => total + module.estimatedMinutes, 0);
}

// Helper function to calculate total possible XP
export function getTotalPossibleXP(): number {
  return TRAINING_CURRICULUM.reduce((total, module) => total + module.xpReward, 0);
}
