const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// ============================================
// SM-2 Spaced Repetition Algorithm
// ============================================

const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

function initializeSM2(wordData) {
  if (!wordData.hasOwnProperty('interval')) {
    wordData.interval = 0;
    wordData.repetitions = 0;
    wordData.easeFactor = DEFAULT_EASE_FACTOR;
    wordData.nextReviewDate = null; // null = new card, due immediately
    wordData.lastReviewed = null;
  }
  return wordData;
}

function calculateNextReview(wordData, rating) {
  let { interval, repetitions, easeFactor } = wordData;
  
  // Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
  if (rating < 3) {
    // Failed - reset
    repetitions = 0;
    interval = 1; // 1 day
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
  } else {
    // Success
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
    
    // Adjust ease factor based on rating
    if (rating === 2) {
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
    } else if (rating === 3) {
      easeFactor = easeFactor + 0.1 - (5 - 3) * (0.08 + (5 - 3) * 0.02); // Standard SM-2 formula
    } else if (rating === 4) {
      easeFactor = easeFactor + 0.15;
    }
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor);
  }
  
  const now = new Date();
  const nextReviewDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
  
  return {
    ...wordData,
    interval,
    repetitions,
    easeFactor,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewed: now.toISOString()
  };
}

function getDueWords(savedWords) {
  const now = new Date().toISOString();
  return savedWords.filter(w => {
    if (!w.nextReviewDate) return true; // New cards are always due
    return w.nextReviewDate <= now;
  });
}

function speakWord(word) {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported');
    return;
  }
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function formatInterval(days) {
  if (days === 0) return 'new';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}

function getIntervalHint(wordData, rating) {
  const simulated = calculateNextReview({...wordData}, rating);
  return formatInterval(simulated.interval);
}

// ============================================
// Study Mode Logic
// ============================================

let studyQueue = [];
let currentCardIndex = 0;
let savedWords = [];
let isStudyMode = false;
let searchTerm = '';

function initStudyMode() {
  const dueWords = getDueWords(savedWords);
  if (dueWords.length === 0) {
    document.getElementById('study-complete').style.display = 'block';
    document.getElementById('flashcard').style.display = 'none';
    document.getElementById('flashcard-controls').style.display = 'none';
    document.getElementById('study-stats').style.display = 'none';
    return;
  }
  
  // Shuffle the due words
  studyQueue = dueWords.sort(() => Math.random() - 0.5);
  currentCardIndex = 0;
  
  document.getElementById('study-container').style.display = 'block';
  document.getElementById('messages-container').style.display = 'none';
  document.getElementById('story-button').style.display = 'none';
  document.getElementById('story_prompt').style.display = 'none';
  document.getElementById('study-complete').style.display = 'none';
  document.getElementById('flashcard').style.display = 'block';
  document.getElementById('flashcard-controls').style.display = 'block';
  document.getElementById('study-stats').style.display = 'block';
  
  showCurrentCard();
}

function showCurrentCard() {
  if (currentCardIndex >= studyQueue.length) {
    // Study session complete
    document.getElementById('flashcard').style.display = 'none';
    document.getElementById('flashcard-controls').style.display = 'none';
    document.getElementById('study-stats').style.display = 'none';
    document.getElementById('study-complete').style.display = 'block';
    document.getElementById('study-complete').querySelector('p').textContent = 
      `You reviewed ${studyQueue.length} cards.`;
    return;
  }
  
  const card = studyQueue[currentCardIndex];
  
  // Reset card state
  document.getElementById('flashcard-front').style.display = 'block';
  document.getElementById('flashcard-back').style.display = 'none';
  document.getElementById('show-answer-btn').style.display = 'inline-block';
  document.getElementById('rating-buttons').style.display = 'none';
  
  // Set word
  document.getElementById('flashcard-word').textContent = card.word;
  
  // Setup TTS button
  const ttsBtn = document.getElementById('tts-button');
  ttsBtn.onclick = (e) => {
    e.stopPropagation();
    speakWord(card.word);
  };
  
  // Set meaning, context and source for back
  const meaningDiv = document.getElementById('flashcard-meaning');
  if (card.meaning) {
    meaningDiv.textContent = card.meaning;
    meaningDiv.style.display = 'block';
  } else {
    meaningDiv.style.display = 'none';
  }
  
  const contextSpan = document.getElementById('flashcard-context');
  const regex = new RegExp(`(${card.word})`, 'gi');
  const highlightedContext = card.context ? card.context.replace(regex, '<mark>$1</mark>') : '(no context)';
  contextSpan.innerHTML = highlightedContext;
  
  const sourceDiv = document.getElementById('flashcard-source');
  sourceDiv.innerHTML = `Source: <a href="${card.pageUrl}" target="_blank">${new URL(card.pageUrl).hostname}</a>`;
  
  // Update stats
  document.getElementById('cards-remaining').textContent = 
    `${currentCardIndex + 1} / ${studyQueue.length}`;
  
  // Update interval hints
  document.getElementById('again-interval').textContent = getIntervalHint(card, 1);
  document.getElementById('hard-interval').textContent = getIntervalHint(card, 2);
  document.getElementById('good-interval').textContent = getIntervalHint(card, 3);
  document.getElementById('easy-interval').textContent = getIntervalHint(card, 4);
}

function showAnswer() {
  document.getElementById('flashcard-front').style.display = 'none';
  document.getElementById('flashcard-back').style.display = 'block';
  document.getElementById('show-answer-btn').style.display = 'none';
  document.getElementById('rating-buttons').style.display = 'flex';
}

async function rateCard(rating) {
  const card = studyQueue[currentCardIndex];
  const updatedCard = calculateNextReview(card, rating);
  
  // Update in savedWords array
  const cardIndex = savedWords.findIndex(w => 
    w.word === card.word && 
    w.pageUrl === card.pageUrl && 
    w.timestamp === card.timestamp
  );
  
  if (cardIndex !== -1) {
    savedWords[cardIndex] = updatedCard;
  }
  
  // Track study statistics
  await trackStudyStats(rating);
  
  // Save to storage
  await browserAPI.storage.local.set({ savedWords });
  
  currentCardIndex++;
  showCurrentCard();
}

async function trackStudyStats(rating) {
  const today = new Date().toISOString().split('T')[0];
  const result = await browserAPI.storage.local.get('studyStats');
  const stats = result.studyStats || {
    totalReviews: 0,
    totalCorrect: 0,
    dailyStats: {},
    streak: 0,
    lastStudyDate: null,
    wordsLearned: 0
  };
  
  stats.totalReviews++;
  if (rating >= 3) {
    stats.totalCorrect++;
  }
  
  // Update daily stats
  if (!stats.dailyStats[today]) {
    stats.dailyStats[today] = { reviews: 0, correct: 0 };
  }
  stats.dailyStats[today].reviews++;
  if (rating >= 3) {
    stats.dailyStats[today].correct++;
  }
  
  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (stats.lastStudyDate === today) {
    // Already studied today, keep streak
  } else if (stats.lastStudyDate === yesterdayStr) {
    stats.streak++;
  } else {
    stats.streak = 1;
  }
  stats.lastStudyDate = today;
  
  // Count words with interval > 0 as "learned"
  stats.wordsLearned = savedWords.filter(w => w.interval > 0).length;
  
  await browserAPI.storage.local.set({ studyStats: stats });
}

function exitStudyMode() {
  isStudyMode = false;
  document.getElementById('study-container').style.display = 'none';
  document.getElementById('messages-container').style.display = 'block';
  document.getElementById('story-button').style.display = 'inline-block';
  document.getElementById('story_prompt').style.display = 'block';
  renderWordList();
  updateStatsDisplay();
  updateDueCount();
}

function updateDueCount() {
  const dueWords = getDueWords(savedWords);
  const dueCountEl = document.getElementById('due-count');
  if (dueWords.length > 0) {
    dueCountEl.textContent = `(${dueWords.length} due)`;
  } else {
    dueCountEl.textContent = '';
  }
}

// ============================================
// Statistics Dashboard
// ============================================

async function updateStatsDisplay() {
  const result = await browserAPI.storage.local.get('studyStats');
  const stats = result.studyStats || {
    totalReviews: 0,
    totalCorrect: 0,
    dailyStats: {},
    streak: 0,
    lastStudyDate: null,
    wordsLearned: 0
  };
  
  const today = new Date().toISOString().split('T')[0];
  const todayStats = stats.dailyStats[today] || { reviews: 0, correct: 0 };
  
  // Update summary cards
  document.getElementById('stat-total-words').textContent = savedWords.length;
  document.getElementById('stat-words-learned').textContent = stats.wordsLearned || savedWords.filter(w => w.interval > 0).length;
  document.getElementById('stat-streak').textContent = stats.streak || 0;
  document.getElementById('stat-accuracy').textContent = stats.totalReviews > 0 
    ? Math.round((stats.totalCorrect / stats.totalReviews) * 100) + '%'
    : '0%';
  document.getElementById('stat-today-reviews').textContent = todayStats.reviews;
  document.getElementById('stat-today-correct').textContent = todayStats.correct;
  
  // Update chart
  updateStatsChart(stats.dailyStats || {});
}

function updateStatsChart(dailyStats) {
  const chartContainer = document.getElementById('stats-chart');
  chartContainer.innerHTML = '';
  
  // Get last 7 days
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(date.toISOString().split('T')[0]);
  }
  
  // Find max value for scaling
  let maxValue = 0;
  days.forEach(day => {
    const dayData = dailyStats[day];
    if (dayData) {
      maxValue = Math.max(maxValue, dayData.reviews);
    }
  });
  maxValue = Math.max(maxValue, 1); // Prevent division by zero
  
  // Create bar chart
  const chart = document.createElement('div');
  chart.className = 'stats-chart';
  chart.style.display = 'flex';
  chart.style.alignItems = 'flex-end';
  chart.style.gap = '8px';
  chart.style.height = '120px';
  chart.style.padding = '10px 0';
  
  days.forEach(day => {
    const dayData = dailyStats[day];
    const reviews = dayData ? dayData.reviews : 0;
    const correct = dayData ? dayData.correct : 0;
    
    const barContainer = document.createElement('div');
    barContainer.style.display = 'flex';
    barContainer.style.flexDirection = 'column';
    barContainer.style.alignItems = 'center';
    barContainer.style.flex = '1';
    
    const bar = document.createElement('div');
    bar.style.width = '100%';
    bar.style.height = `${(reviews / maxValue) * 100}%`;
    bar.style.minHeight = reviews > 0 ? '4px' : '0';
    bar.style.backgroundColor = reviews > 0 ? '#5cb85c' : '#eee';
    bar.style.borderRadius = '4px 4px 0 0';
    bar.style.transition = 'height 0.3s ease';
    bar.title = `${day}: ${reviews} reviews, ${correct} correct`;
    
    const label = document.createElement('div');
    label.style.fontSize = '0.7em';
    label.style.color = '#888';
    label.style.marginTop = '4px';
    const dateObj = new Date(day);
    label.textContent = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    
    barContainer.appendChild(bar);
    barContainer.appendChild(label);
    chart.appendChild(barContainer);
  });
  
  chartContainer.appendChild(chart);
}

// ============================================
// Word List Rendering
// ============================================

function renderWordList() {
  const container = document.getElementById("messages-container");
  container.innerHTML = '';
  
  // Filter words by search term
  const filteredWords = searchTerm 
    ? savedWords.filter(w => 
        w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.context && w.context.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (w.meaning && w.meaning.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : savedWords;
  
  if (filteredWords.length === 0) {
    container.innerHTML = searchTerm 
      ? "<p>No words match your search.</p>" 
      : "<p>No messages found.</p>";
    return;
  }

  // Display word count
  const wordCount = document.createElement("p");
  wordCount.textContent = searchTerm 
    ? `Showing ${filteredWords.length} of ${savedWords.length} words`
    : `Total Words: ${savedWords.length}`;
  wordCount.style.fontWeight = "bold";
  container.appendChild(wordCount);

  const list = document.createElement("ul");
  filteredWords.forEach(({ word, pageUrl, context, timestamp, interval, nextReviewDate, meaning }) => {
    const deleteButton = document.createElement('button');
    deleteButton.textContent = '❌';
    deleteButton.style.marginLeft = '5px';
    deleteButton.style.marginRight = '10px';
    deleteButton.onclick = async () => {
      const result = await browserAPI.storage.local.get("savedWords");
      const currentWords = result.savedWords || [];
      const updatedWords = currentWords.filter(w =>
        w.word !== word ||
        w.pageUrl !== pageUrl ||
        w.timestamp !== timestamp
      );
      await browserAPI.storage.local.set({ savedWords: updatedWords });
      savedWords = updatedWords;
      
      li.remove();
      wordCount.textContent = `Total Words: ${updatedWords.length}`;

      if (updatedWords.length === 0) {
        container.innerHTML = "<p>No messages found.</p>";
      }
      updateDueCount();
    };

    const li = document.createElement("li");
    li.style.opacity = 0;
    setTimeout(() => (li.style.opacity = 1), 100);

    li.appendChild(deleteButton);

    const wordSpan = document.createElement('span');
    wordSpan.style.fontWeight = 'bold';
    wordSpan.textContent = word;
    
    const contextSpan = document.createElement('span');
    const regex = new RegExp(`(${word})`, 'gi');
    const highlightedContext = context ? context.replace(regex, '<mark>$1</mark>') : '';
    contextSpan.innerHTML = highlightedContext + ' ';
    
    const metaSpan = document.createElement('span');
    metaSpan.style.fontSize = '0.85em';
    metaSpan.style.color = '#666';
    let metaText = ` (${new Date(timestamp).toLocaleDateString()})`;
    if (interval !== undefined) {
      metaText += ` [interval: ${formatInterval(interval)}]`;
    }
    if (nextReviewDate) {
      const isDue = new Date(nextReviewDate) <= new Date();
      if (isDue) {
        metaText += ' due now';
      }
    }
    metaSpan.textContent = metaText;

    const link = document.createElement('a');
    link.href = pageUrl;
    link.textContent = '🔗';
    link.style.textDecoration = 'none';
    link.title = pageUrl;
    link.target = 'blank';

    li.appendChild(wordSpan);
    
    if (meaning) {
      const meaningSpan = document.createElement('span');
      meaningSpan.style.fontSize = '0.9em';
      meaningSpan.style.color = '#2c5282';
      meaningSpan.style.display = 'block';
      meaningSpan.style.margin = '5px 0';
      meaningSpan.textContent = meaning;
      li.appendChild(meaningSpan);
    }
    
    li.appendChild(document.createTextNode(' - '));
    li.appendChild(contextSpan);
    li.appendChild(link);
    li.appendChild(metaSpan);

    list.appendChild(li);
  });
  container.appendChild(list);
}

// ============================================
// Main Initialization
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  // Load and initialize words with SM-2 data
  const result = await browserAPI.storage.local.get("savedWords");
  savedWords = (result.savedWords || []).map(initializeSM2);
  
  // Save initialized data back
  if (savedWords.length > 0) {
    await browserAPI.storage.local.set({ savedWords });
  }
  
  renderWordList();
  updateDueCount();
  updateStatsDisplay();
  
  // Study mode button
  document.getElementById('study-mode-button').addEventListener('click', () => {
    isStudyMode = true;
    initStudyMode();
  });
  
  // Show answer button
  document.getElementById('show-answer-btn').addEventListener('click', showAnswer);
  
  // Rating buttons
  document.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rating = parseInt(e.currentTarget.dataset.rating);
      rateCard(rating);
    });
  });
  
  // Exit study buttons
  document.getElementById('exit-study-btn').addEventListener('click', exitStudyMode);
  document.getElementById('study-complete-exit').addEventListener('click', exitStudyMode);
  
  // Flashcard click to flip
  document.getElementById('flashcard').addEventListener('click', () => {
    if (document.getElementById('flashcard-back').style.display === 'none') {
      showAnswer();
    }
  });

  // Search functionality
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderWordList();
  });
  
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchTerm = '';
    renderWordList();
  });

  // Keyboard shortcuts for study mode
  document.addEventListener('keydown', (e) => {
    if (!isStudyMode) return;
    
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (document.getElementById('flashcard-back').style.display === 'none') {
        showAnswer();
      }
    } else if (e.key === '1' && document.getElementById('rating-buttons').style.display !== 'none') {
      rateCard(1);
    } else if (e.key === '2' && document.getElementById('rating-buttons').style.display !== 'none') {
      rateCard(2);
    } else if (e.key === '3' && document.getElementById('rating-buttons').style.display !== 'none') {
      rateCard(3);
    } else if (e.key === '4' && document.getElementById('rating-buttons').style.display !== 'none') {
      rateCard(4);
    } else if (e.key === 'Escape') {
      exitStudyMode();
    }
  });
});

document.getElementById('story-button').addEventListener('click', function () {
  chrome.storage.local.get("savedWords", function (result) {
    const words = result.savedWords || [];
    const prompt = `Write a story attractive to memorize these words:
     ${words.map(item => `${item.word} (${new Date(item.timestamp).toLocaleDateString()})`).join(', ')}, 
     and make a new, unique URL path specifically representing the story with boilerplate https://www.context-dictionary.com/[unique-path-based-on-story]. Date is when the word was saved,
      you can create story based on user memory line, 
      Language of the story could be based on the words .
      Output should be clean, URL embedded in the story, 
      and no sign of memorization of words,just a natural pure story.`;
    document.getElementById('story_prompt').textContent = prompt;
  });
});