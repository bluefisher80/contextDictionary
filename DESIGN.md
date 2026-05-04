# Context Dictionary - Design Document

## Overview

A browser extension for language learners that enables contextual vocabulary collection with AI-powered story generation and spaced repetition study mode.

**Target Users**: Advanced language learners who want to save words from web pages and review them through AI-generated stories and flashcards.

## Core Philosophy

- **Context-first**: Words are saved with their original context from web pages
- **Minimal definitions**: This tool is for advanced learners who don't need inline definitions
- **Active learning**: Words appear in AI-generated stories for natural reinforcement
- **Spaced repetition**: SM-2 algorithm ensures efficient long-term retention

## Architecture

### Browser Extension (Manifest V3)
- **Content Script** (`lookup.js`): Injected into all web pages
- **Background Service Worker** (`background.js`): Handles API calls and data persistence
- **Word List Page** (`wordList.html` + `wordList.js`): Main dashboard
- **Options Page** (`options/`): Extension settings

### Data Flow

```
User Action (web page)
  → Content Script detects word/selection
  → Background Script saves word + context
  → Dictionary API fetches definition (async)
  → Word List Page displays collection
  → AI generates story with words
  → Study Mode reviews with SM-2 algorithm
```

## Features

### 1. Word Collection

Two interaction modes:

#### Caret Mode (Long Press)
- **Trigger**: Long press (hold 700ms) on any word
- **Mechanism**: Uses `caretPositionFromPoint` to detect word at cursor
- **Word Detection**: Matches Unicode letters, excludes CJK characters
- **Selection**: Auto-selects the word under cursor
- **Saving**: Word + URL + surrounding context saved to storage

#### Selection Mode (Keyboard + Click)
- **Trigger**: Select text + hold trigger key (Ctrl/Alt/Shift) + click
- **Mechanism**: Uses `window.getSelection()`
- **Flexibility**: Works with any selection length
- **Context**: Uses selection text or anchor node text as context

### 2. Dictionary Integration

**Iciba API** (English → Chinese):
- Used for: Single English words on English pages
- Returns: Phonetic, part of speech, definitions
- Format: XML response

**Google Translate** (All other cases):
- Used for: Phrases, non-English, CJK languages
- Free API: `clients5.google.com/translate_a/single`
- Returns: Translation + dictionary entries

**Note**: Definitions are fetched asynchronously and updated in storage after initial save.

### 3. AI Story Generation

**Providers**: Gemini, OpenAI, Anthropic

**Process**:
1. Select up to 10 words (prioritize due-for-review words)
2. Generate prompt with word list only (no definitions)
3. AI creates engaging story with bold target words
4. Display formatted story in `story-container`

**Story Settings**:
- Style: Engaging, Funny, Dramatic, Mysterious
- Length: Short (~200w), Medium (~300w), Long (~500w)

**Design Decision**: No tooltips or inline definitions. Advanced learners should infer meaning from context.

### 4. Study Mode (SM-2 Spaced Repetition)

**Algorithm**: Standard SM-2
- **Rating 1 (Again)**: Reset, interval = 1 day
- **Rating 2 (Hard)**: Reset, interval = 1 day, decrease ease
- **Rating 3 (Good)**: Standard progression
- **Rating 4 (Easy)**: Faster progression, increase ease

**UI**:
- Flashcard: Word on front, meaning + context on back
- TTS button for pronunciation
- Rating buttons with interval hints
- Progress stats (cards remaining)

**Stats Tracking**:
- Total reviews, accuracy
- Daily stats, streak
- Words learned (interval > 0)

### 5. Word List Dashboard

**Features**:
- Search/filter words
- Sort by date or review status
- Delete individual words
- Statistics dashboard (7-day activity chart)
- Due count badge

## Data Model

### Saved Word
```javascript
{
  word: "string",
  pageUrl: "string",
  context: "string",        // Surrounding text
  timestamp: "ISO string",
  meaning: "string|null",   // Fetched asynchronously
  // SM-2 fields (added when studied)
  interval: number,         // Days until next review
  repetitions: number,      // Successful review count
  easeFactor: number,       // Learning difficulty
  nextReviewDate: "ISO|null",
  lastReviewed: "ISO|null"
}
```

### Study Stats
```javascript
{
  totalReviews: number,
  totalCorrect: number,
  dailyStats: { "YYYY-MM-DD": { reviews, correct } },
  streak: number,
  lastStudyDate: "YYYY-MM-DD",
  wordsLearned: number
}
```

### Cached Story
```javascript
{
  content: "string",        // Raw AI response
  words: [{ word: "string" }],
  timestamp: number         // Unix ms
}
```

## UI Components

### Main Page (`wordList.html`)
```
┌─────────────────────────────────────┐
│  My Vocabulary                      │
├─────────────────────────────────────┤
│  [Study Mode] (3 due) [Gen Story ⚙️]│
├─────────────────────────────────────┤
│  Story Settings (dropdown)          │
│  Story Container (hidden by default)│
├─────────────────────────────────────┤
│  Statistics Dashboard               │
│  [Total] [Learned] [Streak] [...]   │
├─────────────────────────────────────┤
│  [Search...] [Clear]                │
├─────────────────────────────────────┤
│  Word List                          │
│  • word - context excerpt           │
│    [Delete]                         │
└─────────────────────────────────────┘
```

### Study Mode Overlay
```
┌─────────────────────────────────────┐
│  [Word]              [🔊]           │
│                                     │
│  [Show Answer]                      │
├─────────────────────────────────────┤
│  Meaning: ...                       │
│  Context: ...                       │
│  Source: example.com                │
├─────────────────────────────────────┤
│  [Again] [Hard] [Good] [Easy]       │
│  (1d)    (1d)   (3d)   (5d)        │
├─────────────────────────────────────┤
│  3 / 10              [Exit]         │
└─────────────────────────────────────┘
```

## Key Design Decisions

1. **No inline definitions in story**: Advanced learners infer from context
2. **Two trigger modes**: Caret for speed, Selection for flexibility
3. **Async definition fetching**: Word saved instantly, definition updated later
4. **SM-2 over simpler algorithms**: Proven long-term retention
5. **Story cache**: 1-hour cache to reduce API costs
6. **Cross-browser support**: Firefox (browser namespace) + Chrome (chrome namespace)

## File Structure

```
/
├── manifest.json              # Extension manifest
├── background.js              # Service worker (API calls, storage)
├── wordList.html              # Main dashboard
├── wordList.js                # Dashboard logic (SM-2, story, study)
├── wordList.css               # Dashboard styles
├── include/
│   └── lookup.js              # Content script (word detection, popup)
├── common/
│   ├── ai-service.js          # AI service abstraction
│   └── browser-polyfill.js    # Cross-browser compatibility
├── options/
│   ├── options.html           # Settings page
│   ├── options.js             # Settings logic
│   └── options.css            # Settings styles
├── img/                       # Icons and images
└── dist/                      # Built output
```

## Build System

- **Webpack**: Bundles for Chrome/Firefox/Edge
- **Babel**: ES6+ transpilation
- **Obfuscation**: Optional code obfuscation

## Future Considerations

- Export to Anki/other SRS
- Word frequency analysis
- Pronunciation audio (TTS)
- Collaborative story sharing
- Mobile app companion

## Social Platform Sharing

**Purpose**: Enable users to share AI-generated stories to social media while promoting context-dictionary.com and tracking viral spread.

**Mechanism**:
1. **Share Button**: Add a "Share to Social" button in the story container
2. **Fake Link Injection**: Append a tracking link to the shared content:
   - Format: `https://context-dictionary.com/r/{unique-id}`
   - The unique ID maps to the specific story + user session
3. **Landing Page**: When someone clicks the shared link:
   - Detect referrer from HTTP headers
   - Store referrer URL + story content
   - Redirect to context-dictionary.com homepage
4. **Referrer Display**: On the homepage, show:
   - "This story was shared from: [referrer domain]" (e.g., "Shared from twitter.com")
   - Generic call-to-action: "Install the extension to create your own vocabulary stories"
   - Note: We cannot fetch the actual story content or link to the specific social post due to platform restrictions and privacy settings

**Benefits**:
- Organic marketing through user sharing
- Backlink generation to context-dictionary.com
- Viral tracking via unique IDs
- Community engagement through shared stories

**Implementation Notes**:
- Need server-side endpoint to handle `/r/{id}` redirects
- Store mapping: unique ID → story content + timestamp
- Track click counts per shared link
- Referrer detection: Only the domain is reliably available (e.g., "twitter.com"), not the specific post URL
- Cannot fetch story content from social platforms due to CORS/API restrictions
- Respect privacy: don't expose user data

## Monetization Strategy

**Context**: Google AdSense is prohibited in browser extensions (software application policy). Revenue will be generated through the website (context-dictionary.com) and extension premium features.

### Revenue Streams

#### 1. Website Affiliate Links (Primary)
On shared story landing pages (`context-dictionary.com/r/{id}`):
- Show vocabulary words from the story
- Below each word: "📚 Related Resources" → affiliate links
- Context-aware recommendations:
  - "exfoliation" → skincare/health books
  - "inflation" → economics books
  - "synthesis" → science/academic books
- Affiliate programs:
  - Amazon Associates (pending approval)
  - Bookshop.org (independent bookstores)
  - Merriam-Webster/Oxford dictionary referrals

#### 2. Premium Tier ($3-5/month)
Extension upgrade for heavy users:
- Unlimited AI stories per day (vs. 3/day free)
- Custom story lengths (500+ words)
- Export to Anki/Quizlet
- Advanced analytics (word frequency, learning curves)
- Custom study schedules
- Priority AI model access (faster generation)
- No branding

#### 3. Sponsored Integrations
Partner with language learning platforms:
- Dictionary API referrals (Oxford, Cambridge)
- Language app promotions (Duolingo, Babbel)
- Flashcard tool integrations

#### 4. Donations & Merchandise
- Buy Me a Coffee / GitHub Sponsors
- Vocabulary notebooks, flashcards, posters
- "Word of the Day" merchandise

### Implementation Priority
1. **Phase 1**: Add affiliate links to shared story pages (passive, immediate)
2. **Phase 2**: Premium tier launch (recurring revenue)
3. **Phase 3**: Partner integrations (scalable)
4. **Phase 4**: Merchandise (community building)

### Website Landing Page Monetization
```
┌─────────────────────────────────────┐
│  [Shared Story Title]               │
│                                     │
│  Story text with bold words...      │
│                                     │
├─────────────────────────────────────┤
│  Vocabulary in this story:          │
│  • exfoliation  [📚 Related books]  │
│  • inflation    [📚 Learn more]     │
│  • synthesis    [📚 Related books]  │
├─────────────────────────────────────┤
│  Create your own vocabulary stories │
│  [Install Extension - Free]         │
├─────────────────────────────────────┤
│  [Context Dictionary Pro]           │
│  Unlimited stories · Export · More  │
│  [Upgrade $4/month]                 │
└─────────────────────────────────────┘
```

### Disclosure Requirements
- All affiliate links must include disclosure
- "We may earn a commission from purchases"
- Transparent about premium features vs. free
- Comply with FTC endorsement guidelines
