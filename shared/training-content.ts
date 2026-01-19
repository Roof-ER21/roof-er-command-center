// Ported from Agnes-21 Standalone App
// Contains Phone Scripts, Retail Pitches, and Mini-Module Prompts

export interface TrainingScript {
  id: string;
  title: string;
  category: string;
  division: 'insurance' | 'retail' | 'both';
  description: string;
  content: string;
}

export const TRAINING_CONTENT = {
  scripts: [
    {
      id: 'full-approval-estimate',
      title: 'Full Approval Estimate Phone Call',
      category: 'estimate',
      division: 'insurance',
      description: 'Call to make when you receive a full approval estimate from insurance',
      content: 'Full Approval Estimate Phone Call... (See Agnes-21 for full text)'
    },
    {
      id: 'retail-pitch',
      title: 'The Power Retail Pitch (5-Phase)',
      category: 'retail',
      division: 'retail',
      description: 'Complete 5-phase door-to-door pitch: Hook, Pivot, Close, Stop Signs, Rehash',
      content: 'THE POWER RETAIL PITCH - Full Field Guide... (See Agnes-21 for full text)'
    }
  ] as TrainingScript[],
  
  miniModules: {
    insurance: {
      opening: {
        id: 'opening',
        title: 'Just Opening',
        description: 'Master the 5 non-negotiables in 30 seconds',
        systemPrompt: 'You are Agnes, a homeowner...'
      },
      objections: {
        id: 'objection-gauntlet',
        title: 'Objection Gauntlet',
        description: 'Handle insurance objections rapid-fire',
        systemPrompt: 'You are Agnes, running an OBJECTION GAUNTLET...'
      }
    },
    retail: {
      opening: {
        id: 'opening',
        title: 'Retail Opening',
        description: 'Nail your introduction and value prop',
        systemPrompt: 'You are Agnes, a homeowner...'
      },
      objections: {
        id: 'objection-gauntlet',
        title: 'Retail Objections',
        description: 'Handle customer pushback rapid-fire',
        systemPrompt: 'You are Agnes, running a RETAIL OBJECTION GAUNTLET...'
      }
    }
  }
};

export const FULL_SCRIPTS_DB = [
  {
    id: 'insurance-pushback',
    title: 'Insurance Pushback & Arguments',
    category: 'pushback',
    division: 'insurance',
    content: 'Insurance Pushback & Arguments Playbook Content'
  },
  {
    id: 'retail-stop-signs',
    title: 'Power Pitch Stop Signs',
    category: 'retail',
    division: 'retail',
    content: 'POWER PITCH STOP SIGNS - Enhanced Rebuttals'
  }
];
