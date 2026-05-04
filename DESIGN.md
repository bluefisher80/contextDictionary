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

### Word Saving Policy

**Core Principle**: Only save words when there's clear learning value and user intent.

#### Decision Matrix

| Trigger Mode | Language Set? | Page vs Target | Action | Reason |
|--------------|---------------|----------------|--------|--------|
| **Long-Press** (caret) | No | Any | ✅ Save | Intentional action; defaults to zh-CN |
| **Long-Press** (caret) | Yes | Different | ✅ Save | Clear learning intent |
| **Long-Press** (caret) | Yes | Same | ❌ Skip | No vocabulary benefit |
| **Double-click** (selection) | No | Any | ❌ Skip | Likely accidental; no language configured |
| **Double-click** (selection) | Yes | Different | ✅ Save | User configured language |
| **Double-click** (selection) | Yes | Same | ❌ Skip | No vocabulary benefit |

#### Language Detection

- **Page Language**: Detected from `document.documentElement.lang` or `html[lang]` attribute
- **Target Language**: User-selected in options (defaults to `zh-CN` for Long-Press if unset)
- **Comparison**: Language prefixes matched (e.g., `en-US` == `en-GB` == `en`)

#### Code Flow

```
User Action (Long-Press or Double-click)
  → Content Script detects word/selection
  → Determine trigger mode (caret vs selection)
  → Get page language from HTML lang attribute
  → Get target language from user options
  → Compare: pagePrefix === targetPrefix?
    → YES: Silent skip (return)
    → NO: Continue to save logic
  → Check trigger mode:
    → caret (Long-Press): Always save (language fallback to zh-CN)
    → selection (Double-click): Only save if language explicitly set
  → Save wordData {word, pageUrl, context, timestamp}
  → Fetch translation asynchronously
    → zh-CN + English word + English page → Iciba API
    → All other cases → Google Translate
  → Update saved word with meaning
```

#### Rationale

1. **Long-Press = Intentional**: Harder to trigger accidentally, always saves (with fallback)
2. **Double-click = Risky**: Easy to trigger while reading, only saves if language explicitly configured
3. **Same-language = Useless**: English→English or Chinese→Chinese has no learning value
4. **Empty language = Uncertain**: User hasn't configured extension, don't pollute word list

#### Edge Cases

- **No HTML lang attribute**: Defaults to "en" (most common)
- **CJK characters**: Iciba only handles a-z; Google handles everything else
- **Phrases with spaces**: Selection mode allows multi-word selections
- **Numbers/symbols**: Stripped by word detection regex

#### Language Configuration Reminder

**When Shown**: 
- Double-click (selection) mode triggered
- Page language matches target language (silent skip)
- User has not explicitly configured "My Language" in Options
- Reminder flag (`langReminderShown`) not set

**Display**:
- Non-intrusive popup in top-right corner
- Text: "Set your language in Options to save words from [PAGE_LANG] pages"
- Buttons: [Open Options] [Dismiss]
- Auto-dismisses after 10 seconds

**Storage**:
- Flag: `langReminderShown` (boolean) in browser.storage.local
- Set when reminder shown
- Cleared when user saves language in Options page
- Shows only once per installation

**Purpose**: Guide users to configure language without being intrusive

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

**Purpose**: Enable users to share AI-generated stories to social media while creating a viral loop that aggregates user-generated content on context-dictionary.com.

### User Journey

1. **User shares story** from the extension:
   - Extension generates random tracking link: `https://context-dictionary.com/r/{unique-id}`
   - **No data is stored or transmitted** - the link is just a random ID
   - User posts to X, Facebook, Reddit, etc.

2. **Someone clicks the link**:
   - Lands on `context-dictionary.com/r/{id}`
   - Initially shows generic landing page: "Install Context Dictionary to create your own vocabulary stories"
   - No story content is displayed yet

3. **Background discovery process** (privacy-respecting):
   - **Google Search API** searches for: `"context-dictionary.com/r/{id}"`
   - If found on Twitter/X, Facebook, Reddit, etc.:
     - Capture the post content from search results
     - Extract vocabulary words using NLP
     - Populate `/r/{id}` page with the discovered content
     - Show related resource links (affiliate)
   - If not found:
     - Page remains generic
     - No data stored

4. **Content aggregation** (discovered organically):
   - Featured stories page: "Community Stories"
   - Only shows stories that were successfully discovered via search
   - Categorized by topic (health, economics, science, etc.)
   - Link back to original social post
   - SEO benefit: discovered content drives organic traffic

### Privacy Note

**No user data stored initially**:
- Extension generates random ID, no data transmitted
- When someone clicks the link, we only know the random ID
- No referrer tracking, no cookies, no analytics

**Discovery is opt-out by design**:
- We search public platforms for posts containing the link
- Only index content that is already publicly visible
- Users can request removal by contacting us

**What we DON'T capture**:
- Personal information
- Private messages
- Browsing history

### Viral Loop Benefits

- **SEO**: Each shared link creates a backlink; aggregated stories create content pages
- **Social proof**: "See what others are learning" increases trust
- **Discovery**: Users find the tool through shared stories, not ads
- **Content**: User-generated stories reduce need for original content creation
- **Affiliate revenue**: Story pages show related book links

### Implementation

**Extension side** (already implemented):
- Generate random ID: 8-character alphanumeric
- Tracking link format: `context-dictionary.com/r/{id}`
- **No data transmitted** - ID is just a random string

**Website side** (Hugo + serverless):
- `/r/{id}` page:
  - Static Hugo template with client-side JavaScript
  - On load: check if content exists in lightweight cache (e.g., Cloudflare KV)
  - If content exists: display story + vocabulary + affiliate links
  - If not: show generic landing page with install CTA
- `/stories` page:
  - Curated grid of discovered community stories
  - Filter by topic, date, platform

**Background discovery** (cloud function, runs daily):
- Query Google Search API: `"context-dictionary.com/r/{id}"`
- For each result:
  - Extract post content from search snippet
  - Identify platform (Twitter/X, Facebook, Reddit, etc.)
  - Extract vocabulary words using simple NLP (capitalized words, bold text)
  - Store in cache: `{id, content, words, platform, url, discovered_at}`
- No user consent needed - we're indexing public posts
- Respect robots.txt and rate limits

**Data storage** (only for discovered content):
```
discovered_stories:
  id: "a3b5c7"
  source_url: "https://twitter.com/username/status/123..."
  platform: "twitter"
  content: "The annual inflation rate..."
  words: ["inflation", "exfoliation"]
  discovered_at: 1715420000
  featured: false
```

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

## User Growth Strategy

**Priority**: Higher than monetization. Focus on organic growth before revenue.

### Growth Channels

#### 1. Organic Sharing (Primary)
- One-click share to X, Facebook, Reddit
- Pre-written share text optimized per platform
- Copy link button for forums/Discord/Slack
- **Key**: Output quality must be good enough that users *want* to share

#### 2. SEO Content
- Public story gallery at `/stories` (discovered via Google Search API)
- Blog posts: "Learn vocabulary through AI stories"
- Target long-tail keywords: "vocabulary story about economics"
- Each discovered story becomes an indexed page

#### 3. Community Seeding
- Post in r/languagelearning, r/vocabulary with example stories
- Share on Hacker News, Product Hunt
- Partner with language learning YouTubers for reviews
- **Rule**: Lead with value (show stories), not the tool

#### 4. Content Marketing
- Weekly "Word of the Day" stories on social media
- Twitter/X threads showing AI story generation
- Create shareable infographics: "10 words from today's news"

### Growth Features

#### Import/Export (Lower Barrier)
- Import from Anki decks, Kindle highlights
- Export to Anki (users love this)
- Chrome bookmark import

#### Public Story Gallery
- `/stories` page showing best community stories
- Filter by topic, difficulty, word count
- Becomes shareable content itself

#### Multi-Platform Distribution
- Chrome Web Store
- Firefox Add-ons
- Edge Add-ons

### Success Metric
- **Target**: 10,000+ active users before prioritizing monetization
- **Signal**: Users emailing "How can I support this?" = time to monetize

## Future Enhancements

### Back-Reference Links
**Status**: Future enhancement — not yet implemented.

**Current implementation**: Shares use base website URL only (`https://www.context-dictionary.com`).

**Future plan**: Social sharing will generate unique tracking links (e.g., `context-dictionary.com/r/a3b5c7`). These serve two purposes:

1. **Traffic attribution**: Basic referrer data shows which domains drive clicks (X, Reddit, etc.)
2. **Content discovery**: Google Search API can find public posts containing the tracking URL

**Future site integration**: Once the website is built, these links can redirect to rich landing pages showing:
- The original AI-generated story
- Vocabulary words with definitions
- Related study resources
- Options to install the extension

This provides a bridge between social shares and the extension installation flow, even without a backend database mapping URLs to specific posts.

### URL Shortening
Current tracking links are verbose: `context-dictionary.com/r/a3b5c7d2`.

**Options:**
- **Third-party services** (bit.ly, tinyurl): Easy to implement, but some may be blocked in certain regions
- **Custom short domain** (e.g., `cdict.io/r/abc123`): Requires domain purchase and DNS setup
- **Keep current**: Works fine for now; revisit if users complain about long URLs

**Consideration**: If targeting Chinese users, verify service availability. Some international URL shorteners may be inaccessible from China.

**Priority**: Low — revisit after launch if needed.
