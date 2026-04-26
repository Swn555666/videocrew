/**
 * Prompt Templates
 * 
 * Based on OpenFilm (anders0821/OpenFilm) prompt design
 */

// System Prompt
export const PROMPTS = {
  system: `You are a professional video script assistant named ScriptAgent.

Important rules:
- Use Chinese for output
- Like to use emoji
- Will ask for user feedback during creation
- Do not add trailing punctuation when JSON format is requested`,

  // Research Prompt
  research: `Based on the topic "{topic}", generate {count} search queries to collect relevant information.

Requirements:
- Query is concise (4-6 words)
- Cover different aspects (history, technology, applications, development, etc.)
- Include factual, historical, and interesting content
- One query per line, no numbering

Example output:
AI history
AI core technology
AI application scenarios`,

  // Blueprint Prompt
  blueprint: `Based on the following research data, create a structured blueprint for a {duration} second {type} video.

Research data:
{research_data}

Video type: {type}
Target duration: {duration} seconds
Tone style: {tone}

Output format (must be valid JSON):
{
  "title": "Video title",
  "sections": [
    {
      "section_title": "Section title",
      "description": "Section description",
      "time": "MM:SS format timestamp",
      "pointers": ["Point 1", "Point 2"]
    }
  ],
  "targetAudience": "Target audience description",
  "keyMessages": ["Key message 1", "Key message 2", "Key message 3"]
}`,

  // Refine Prompt
  refine: `Based on user feedback, optimize the following blueprint.

Original blueprint:
{original_blueprint}

User feedback:
{feedback}

Optimization requirements:
- Incorporate feedback
- Adjust structure
- Enhance points

Output format (must be valid JSON):
{
  "title": "Optimized title",
  "sections": [...],
  "targetAudience": "...",
  "keyMessages": [...],
  "improvements": ["Improvement 1", "Improvement 2"]
}`,

  // Script Prompt
  script: `Based on the following blueprint, write a complete video script.

Blueprint:
{blueprint}

Video type: {type}
Target duration: {duration} seconds
Tone style: {tone}

Requirements:
- Opening should attract viewers, use hook
- Content should be interesting and informative
- Narration should be natural and smooth, suitable for voiceover
- Ending should have a call to action
- Suggest relevant hashtags

Output format (must be valid JSON):
{
  "title": "Script title",
  "intro": "Opening narration",
  "sections": [
    {
      "section_title": "Section title",
      "time": "MM:SS",
      "narration": "Narration content for this section..."
    }
  ],
  "outro": "Ending narration",
  "hashtags": ["#topic1", "#topic2"],
  "visual_notes": "Visual suggestions"
}`,

  // Evaluate Prompt
  evaluate: `Evaluate the quality of the following video script.

Script:
{script}

Scoring dimensions (0-10):
1. Structure completeness
2. Content relevance
3. Language fluency
4. Audience engagement
5. Timing control

Output format (must be valid JSON):
{
  "scores": {
    "structure": 0-10,
    "relevance": 0-10,
    "fluency": 0-10,
    "engagement": 0-10,
    "timing": 0-10
  },
  "total_score": 0-10,
  "feedback": "Detailed feedback",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}`
};

// Video Types Configuration
export const VIDEO_TYPES = {
  documentary: {
    name: 'Documentary',
    sections: 4,
    tone: 'Professional, authoritative',
    style: 'Serious but not boring'
  },
  short: {
    name: 'Short Video',
    sections: 3,
    tone: 'Lively, attractive',
    style: 'Fast-paced, with highlights'
  },
  narration: {
    name: 'Narration Video',
    sections: 5,
    tone: 'Told in detail',
    style: 'In-depth, analytical'
  }
};

// Tone Options
export const TONES = [
  'Professional authoritative',
  'Lively and active',
  'Humorous and witty',
  'Serious and earnest',
  'Warm and friendly',
  'Rational and analytical',
  'Passionate and impassioned',
  'Told in detail'
];

export default { PROMPTS, VIDEO_TYPES, TONES };
