/**
 * ChapterClarity — Core Engine & UI Controller
 * High-performance, client-side readability diagnostics for authors.
 */

// ==========================================
// 1. Sample Chapters Data
// ==========================================
const SAMPLES = {
  frankenstein: `It was on a dreary night of November that I beheld the accomplishment of my toils. With an anxiety that almost amounted to agony, I collected the instruments of life around me, that I might infuse a spark of being into the lifeless thing that lay at my feet. It was already one in the morning; the rain pattered dismally against the panes, and my candle was nearly burnt out, when, by the glimmer of the half-extinguished light, I saw the dull yellow eye of the creature open; it breathed hard, and a convulsive motion agitated its limbs.

How can I describe my emotions at this catastrophe, or how delineate the wretch whom with such infinite pains and care I had endeavoured to form? His limbs were in proportion, and I had selected his features as beautiful. Beautiful! Great God! His yellow skin scarcely covered the work of muscles and arteries beneath; his hair was of a lustrous black, and flowing; his teeth of a pearly whiteness; but these luxuriances only formed a more horrid contrast with his watery eyes, that seemed almost of the same colour as the dun-white sockets in which they were set, his shrivelled complexion and straight black lips.

The different accidents of life are not so changeable as the feelings of human nature. I had worked hard for nearly two years, for the sole purpose of infusing life into an inanimate body. For this I had deprived myself of rest and health. I had desired it with an ardour that far exceeded moderation; but now that I had finished, the beauty of the dream vanished, and breathless horror and disgust filled my heart.`,

  mobydick: `Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can.

This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.

There now is your insular city of the Manhattoes, belted round by wharves as Indian isles by coral reefs—commerce surrounds it with her surf. Right and left, the streets take you waterward. Its extreme downtown is the battery, where that noble mole is washed by waves, and cooled by breezes, which a few hours previous were out of sight of land. Look at the crowds of water-gazers there.`,

  thriller: `The rain hammered against the reinforced glass of the safehouse. Miller checked his watch. 03:14. The extraction team was four minutes late.

He racked the slide of his sidearm. A single brass casing gleamed under the halogen lamp. Outside, footsteps splashed across the gravel driveway—heavy, deliberate, and moving in tactical pairs.

Miller cut the circuit breaker. Darkness swallowed the room. He didn’t reach for night-vision goggles; his eyes had already adjusted to the ambient glow of the perimeter floodlights leaking through the blinds. He took three silent steps toward the kitchen door, knife in his left fist and pistol leveled at chest height. If they breached the front entrance, they were already dead.

A sudden flash blinded the hallway. A percussion grenade exploded with an ear-shattering concussive punch that cracked the plaster. Wood splinters flew like shrapnel. Miller exhaled smoothly, squeezed the trigger twice, and slipped through the smoke before the first body hit the hardwood.`,

  scifi: `The relativistic transit drive shuddered through the titanium superstructure of the Archimedes, converting antimatter propellant into concentrated gamma-ray thrust with an efficiency that defied classical thermodynamic intuition. Commander Vasquez monitored the gravitational telemetry screens as the dreadnought slipped into the gravitational well of the binary pulsar, where violent synchrotron radiation threatened to overwhelm the ship's magnetic shielding within eighteen orbital cycles.

"Helm, lock vector along the accretion disk boundary," Vasquez ordered, her voice flat against the omnipresent hum of the coolant manifolds.

Ensign Chen manipulated the holographic quantum controls, adjusting the field coils to counteract the severe time-dilation gradient that warped their telemetry relative to fleet headquarters on Ceres. Every microsecond spent within this extreme curvature meant hours elapsed outside. If their inertial dampeners suffered even a fractional phase variance during the transit maneuver, the resultant tidal forces would instantly shear the hull along its crystalline molecular lattice.`,

  yafiction: `Maya slammed her locker shut so hard the metal rattled down the entire senior corridor. Everyone stopped whispering. For three seconds, nobody breathed.

"You can't just avoid him forever," Chloe said, clutching her biology textbook like a shield.

"Watch me," Maya muttered, pulling her faded denim jacket tighter around her shoulders. She wasn't going to cry. Not here, and definitely not where Tyler and his varsity friends could see her crumbling.

The morning bell chimed, saving her from having to explain the five unread text messages sitting on her cracked phone screen. She hurried toward room 204, counting her steps in rhythm with the loud thumping in her chest. Everything had changed overnight, and the worst part was that she was the only one in this crowded hallway who knew what happened at the bonfire.`
};

// ==========================================
// 2. Syllable Counter & Text Heuristics
// ==========================================

/**
 * Counts syllables in an English word with accurate heuristic handling
 * of silent 'e', diphthongs, suffixes, and special endings.
 */
function countWordSyllables(rawWord) {
  let word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;

  // Specific common short prefixes & suffixes
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
  word = word.replace(/^y/, '');

  const vowelMatches = word.match(/[aeiouy]{1,2}/g);
  if (!vowelMatches) return 1;

  let count = vowelMatches.length;

  // Handle words ending in -le preceded by a consonant (e.g., table, middle, little)
  if (rawWord.toLowerCase().match(/[^aeiouy]le$/)) {
    count++;
  }

  return Math.max(1, count);
}

// Common abbreviations and honorifics that end in a period but do NOT end a sentence
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'gen', 'col', 'capt',
  'lt', 'st', 'vs', 'etc', 'i.e', 'e.g', 'dept', 'univ', 'vol', 'jan',
  'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
]);

/**
 * Robust sentence segmenter that preserves punctuation, dialogue quotes,
 * numbers, and abbreviations.
 */
function splitIntoSentences(text) {
  if (!text || !text.trim()) return [];

  // Clean carriage returns
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Regex matches punctuation marks followed by space/quote/newline or end of text
  const regex = /([^.!?\n]+(?:[.!?]+["'”’]?|\n+|$))/g;
  const rawSegments = cleaned.match(regex) || [];

  const sentences = [];
  let buffer = '';

  for (let i = 0; i < rawSegments.length; i++) {
    const segment = rawSegments[i];
    buffer += segment;

    // Check if the current buffer ends with an abbreviation
    const trimmed = buffer.trim();
    if (!trimmed) continue;

    // Check last word before punctuation
    const lastWordMatch = trimmed.match(/(\b[a-zA-Z.]+)[.!?]["'”’]?$/);
    if (lastWordMatch) {
      const token = lastWordMatch[1].toLowerCase().replace(/\./g, '');
      if (ABBREVIATIONS.has(token) && i < rawSegments.length - 1) {
        // It's an abbreviation, don't break sentence yet
        continue;
      }
    }

    if (trimmed.length > 0) {
      sentences.push(trimmed);
      buffer = '';
    }
  }

  if (buffer.trim()) {
    sentences.push(buffer.trim());
  }

  return sentences.filter(s => s.length > 0);
}

/**
 * Extract clean words from a sentence or text
 */
function extractWords(text) {
  return (text.match(/[a-zA-Z0-9'’-]+/g) || []).filter(w => /[a-zA-Z]/.test(w));
}

// ==========================================
// 3. Readability & Sentence Difficulty Calculations
// ==========================================

function analyzeChapter(text) {
  if (!text || !text.trim()) {
    return null;
  }

  const rawSentences = splitIntoSentences(text);
  const allWords = extractWords(text);

  if (allWords.length === 0 || rawSentences.length === 0) {
    return null;
  }

  let totalSyllables = 0;
  let complexWordCount = 0; // 3+ syllables
  let totalCharactersNoSpaces = 0;

  for (const word of allWords) {
    const syl = countWordSyllables(word);
    totalSyllables += syl;
    if (syl >= 3) complexWordCount++;
    totalCharactersNoSpaces += word.replace(/[^a-zA-Z0-9]/g, '').length;
  }

  const wordCount = allWords.length;
  const sentenceCount = rawSentences.length;

  const asl = wordCount / sentenceCount; // Average Sentence Length
  const asw = totalSyllables / wordCount; // Average Syllables per Word

  // 1. Flesch Reading Ease
  // Formula: 206.835 - (1.015 * ASL) - (84.6 * ASW)
  let fleschReadingEase = 206.835 - (1.015 * asl) - (84.6 * asw);
  fleschReadingEase = Math.max(0, Math.min(100, fleschReadingEase));

  // 2. Flesch-Kincaid Grade Level
  // Formula: (0.39 * ASL) + (11.8 * ASW) - 15.59
  let fkGradeLevel = (0.39 * asl) + (11.8 * asw) - 15.59;
  fkGradeLevel = Math.max(1, fkGradeLevel);

  // 3. Gunning Fog Index
  // Formula: 0.4 * (ASL + 100 * (ComplexWords / Words))
  const complexRatio = complexWordCount / wordCount;
  let gunningFog = 0.4 * (asl + (100 * complexRatio));
  gunningFog = Math.max(1, gunningFog);

  // Dialogue ratio estimation (text inside quotes)
  const dialogueMatches = text.match(/["“][^"”]+["”]/g) || [];
  let dialogueWordCount = 0;
  dialogueMatches.forEach(q => {
    dialogueWordCount += (extractWords(q) || []).length;
  });
  const dialoguePercent = Math.min(100, Math.round((dialogueWordCount / wordCount) * 100));

  // Reading time (average adult reader ~225 wpm)
  const readMinutes = Math.max(1, Math.round(wordCount / 225));

  // 4. Per-Sentence Difficulty Scoring
  const scoredSentences = rawSentences.map((sentenceStr, index) => {
    const words = extractWords(sentenceStr);
    const count = words.length;

    if (count === 0) {
      return {
        index,
        text: sentenceStr,
        wordCount: 0,
        syllables: 0,
        complexWords: 0,
        difficultyScore: 0,
        isolatedGrade: 0,
        reasons: [],
        suggestions: []
      };
    }

    let sylCount = 0;
    let compWords = 0;
    words.forEach(w => {
      const s = countWordSyllables(w);
      sylCount += s;
      if (s >= 3) compWords++;
    });

    const sentAsl = count;
    const sentAsw = sylCount / count;
    const isolatedGrade = Math.max(1, (0.39 * sentAsl) + (11.8 * sentAsw) - 15.59);

    // Structural weight: semicolons, em dashes, long subordinate clauses
    const semicolons = (sentenceStr.match(/;/g) || []).length;
    const emDashes = (sentenceStr.match(/[—–]/g) || []).length;
    const commas = (sentenceStr.match(/,/g) || []).length;

    // Composite Difficulty Score
    // Balances raw length, syllable density, and syntactic entanglement
    const difficultyScore = (
      (0.45 * isolatedGrade) +
      (0.35 * count) +
      (15 * (compWords / count)) +
      (semicolons * 2.5) +
      (emDashes * 1.5) +
      (commas >= 4 ? 2.0 : 0)
    );

    // Diagnostics & suggestions
    const reasons = [];
    const suggestions = [];

    if (count >= 35) {
      reasons.push(`${count} words (long breath requirement)`);
      suggestions.push("Consider splitting at the primary conjunction or semicolon to avoid reader fatigue.");
    } else if (count >= 24) {
      reasons.push(`${count} words`);
    }

    if (compWords >= 4 || (compWords / count) > 0.22) {
      reasons.push(`${compWords} polysyllabic words (${Math.round((compWords / count) * 100)}%)`);
      suggestions.push("Multiple 3+ syllable words stacked together; replace latinates with punchier verbs.");
    }

    if (semicolons > 0 || emDashes >= 2) {
      reasons.push(`Complex punctuation (${semicolons ? semicolons + ' semicolon' : ''}${emDashes ? ' dashes' : ''})`);
      suggestions.push("Swap punctuation hinges with a definitive period to sharpen narrative cadence.");
    }

    if (suggestions.length === 0) {
      suggestions.push("High syntactic density; trim non-essential prepositional phrases.");
    }

    return {
      index,
      text: sentenceStr,
      wordCount: count,
      syllables: sylCount,
      complexWords: compWords,
      isolatedGrade: Math.round(isolatedGrade * 10) / 10,
      difficultyScore: Math.round(difficultyScore * 10) / 10,
      reasons,
      suggestions
    };
  });

  // Filter out ultra-short phrases (< 4 words) from "Hardest" consideration unless all are short
  const eligibleSentences = scoredSentences.filter(s => s.wordCount >= 4);
  const pool = eligibleSentences.length >= 5 ? eligibleSentences : scoredSentences;

  // Rank by difficulty score descending
  const sortedByDifficulty = [...pool].sort((a, b) => b.difficultyScore - a.difficultyScore);
  const top5Hardest = sortedByDifficulty.slice(0, 5);

  // Map rank back to indices for fast lookup
  const hardestIndexMap = new Map();
  top5Hardest.forEach((item, rankIdx) => {
    hardestIndexMap.set(item.index, rankIdx + 1); // 1-indexed rank
  });

  return {
    wordCount,
    sentenceCount,
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    fkGradeLevel: Math.round(fkGradeLevel * 10) / 10,
    gunningFog: Math.round(gunningFog * 10) / 10,
    complexWordPercent: Math.round(complexRatio * 1000) / 10,
    dialoguePercent,
    readMinutes,
    avgSentenceLength: Math.round(asl * 10) / 10,
    allSentences: scoredSentences,
    top5Hardest,
    hardestIndexMap
  };
}

// ==========================================
// 4. UI Rendering & Interactions
// ==========================================

const DOM = {
  chapterInput: document.getElementById('chapterInput'),
  highlightedChapterText: document.getElementById('highlightedChapterText'),
  pacingWaveform: document.getElementById('pacingWaveform'),
  hardestSentencesList: document.getElementById('hardestSentencesList'),
  readingEaseScore: document.getElementById('readingEaseScore'),
  readingEaseFill: document.getElementById('readingEaseFill'),
  readabilityBadge: document.getElementById('readabilityBadge'),
  readingEaseExplanation: document.getElementById('readingEaseExplanation'),
  gradeLevelScore: document.getElementById('gradeLevelScore'),
  gradeComparisonText: document.getElementById('gradeComparisonText'),
  fogIndexScore: document.getElementById('fogIndexScore'),
  complexWordPercent: document.getElementById('complexWordPercent'),
  totalWordCount: document.getElementById('totalWordCount'),
  totalSentenceCount: document.getElementById('totalSentenceCount'),
  estimatedReadTime: document.getElementById('estimatedReadTime'),
  avgSentenceLength: document.getElementById('avgSentenceLength'),
  charCountLabel: document.getElementById('charCountLabel'),
  dialoguePercentLabel: document.getElementById('dialoguePercentLabel'),
  hardCountBadge: document.getElementById('hardCountBadge'),
  viewInputTab: document.getElementById('viewInputTab'),
  viewHighlightedTab: document.getElementById('viewHighlightedTab'),
  editorInputPane: document.getElementById('editorInputPane'),
  editorHighlightPane: document.getElementById('editorHighlightPane'),
  clearBtn: document.getElementById('clearBtn'),
  copyReportBtn: document.getElementById('copyReportBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  toggleFormulasBtn: document.getElementById('toggleFormulasBtn'),
  formulasContent: document.getElementById('formulasContent'),
  toastMessage: document.getElementById('toastMessage')
};

let currentAnalysis = null;
let debounceTimer = null;

function showToast(message) {
  if (!DOM.toastMessage) return;
  DOM.toastMessage.textContent = message;
  DOM.toastMessage.classList.add('show');
  setTimeout(() => {
    DOM.toastMessage.classList.remove('show');
  }, 2600);
}

function getEaseStatus(score) {
  if (score >= 80) return { label: 'Easy Reading', cls: 'pill-easy', desc: 'Effortless to read. Suitable for general commercial & young-adult fiction.' };
  if (score >= 60) return { label: 'Standard Fiction', cls: 'pill-moderate', desc: 'Standard commercial prose (Stephen King, Gillian Flynn). Accessible and smooth.' };
  if (score >= 45) return { label: 'Dense & Literary', cls: 'pill-dense', desc: 'Fairly complex prose with layered sentences. Demands reader attention.' };
  return { label: 'Heavy Academic', cls: 'pill-very-dense', desc: 'Dense syntactic structure. Heavy cognitive load; frequent reader re-reading.' };
}

function getGradeComparison(grade) {
  if (grade <= 6) return 'Readable for 6th grade; breezy page-turner.';
  if (grade <= 8) return 'On par with Suzanne Collins (Hunger Games) and mainstream bestsellers.';
  if (grade <= 10) return 'Standard commercial novel grade; comparable to Stephen King.';
  if (grade <= 12) return 'Literary fiction level; comparable to Donna Tartt or Cormac McCarthy.';
  return 'Advanced college level; dense 19th-century or academic cadence.';
}

function updateUI(analysis) {
  currentAnalysis = analysis;

  if (!analysis) {
    // Reset to empty state
    DOM.readingEaseScore.textContent = '—';
    DOM.readingEaseFill.style.width = '0%';
    DOM.readabilityBadge.textContent = 'Awaiting Text';
    DOM.readabilityBadge.className = 'status-pill pill-moderate';
    DOM.readingEaseExplanation.textContent = 'Paste a chapter to calculate Flesch reading ease.';
    DOM.gradeLevelScore.textContent = '—';
    DOM.gradeComparisonText.textContent = 'Waiting for input.';
    DOM.fogIndexScore.textContent = '—';
    DOM.complexWordPercent.textContent = '0%';
    DOM.totalWordCount.textContent = '0';
    DOM.totalSentenceCount.textContent = '0';
    DOM.estimatedReadTime.textContent = '0 min';
    DOM.avgSentenceLength.textContent = '0 wds';
    DOM.charCountLabel.textContent = '0 characters';
    DOM.dialoguePercentLabel.textContent = '0% dialogue';
    DOM.hardCountBadge.textContent = '0';
    DOM.pacingWaveform.innerHTML = '';
    DOM.highlightedChapterText.innerHTML = '<p class="empty-text">No text to display.</p>';
    DOM.hardestSentencesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✍️</div>
        <h3>No text analyzed yet</h3>
        <p>Paste a chapter or choose one of the sample chapters above to inspect the hardest sentences.</p>
      </div>`;
    return;
  }

  // Update Overview Metrics
  const easeInfo = getEaseStatus(analysis.fleschReadingEase);
  DOM.readingEaseScore.textContent = analysis.fleschReadingEase;
  DOM.readingEaseFill.style.width = `${Math.min(100, Math.max(5, analysis.fleschReadingEase))}%`;
  DOM.readabilityBadge.textContent = easeInfo.label;
  DOM.readabilityBadge.className = `status-pill ${easeInfo.cls}`;
  DOM.readingEaseExplanation.textContent = easeInfo.desc;

  DOM.gradeLevelScore.textContent = analysis.fkGradeLevel;
  DOM.gradeComparisonText.textContent = getGradeComparison(analysis.fkGradeLevel);

  DOM.fogIndexScore.textContent = analysis.gunningFog;
  DOM.complexWordPercent.textContent = `${analysis.complexWordPercent}%`;

  DOM.totalWordCount.textContent = analysis.wordCount.toLocaleString();
  DOM.totalSentenceCount.textContent = analysis.sentenceCount.toLocaleString();
  DOM.estimatedReadTime.textContent = `${analysis.readMinutes} min`;
  DOM.avgSentenceLength.textContent = `${analysis.avgSentenceLength} wds`;

  DOM.charCountLabel.textContent = `${DOM.chapterInput.value.length.toLocaleString()} characters`;
  DOM.dialoguePercentLabel.textContent = `${analysis.dialoguePercent}% dialogue`;
  DOM.hardCountBadge.textContent = analysis.top5Hardest.length;

  // Render Pacing Waveform
  renderPacingWaveform(analysis);

  // Render Heatmap View
  renderHeatmap(analysis);

  // Render Top 5 Hardest Inspector Cards
  renderHardestCards(analysis);
}

function renderPacingWaveform(analysis) {
  const container = DOM.pacingWaveform;
  container.innerHTML = '';

  const maxWords = Math.max(...analysis.allSentences.map(s => s.wordCount), 30);

  analysis.allSentences.forEach((sentence, idx) => {
    const bar = document.createElement('div');
    bar.className = 'waveform-bar';

    // Calculate proportional height (min 8px, max 66px)
    const heightPercent = Math.min(100, Math.max(12, (sentence.wordCount / maxWords) * 100));
    bar.style.height = `${heightPercent}%`;

    const isHardest = analysis.hardestIndexMap.has(sentence.index);
    if (isHardest) {
      const rank = analysis.hardestIndexMap.get(sentence.index);
      bar.classList.add('bar-hardest');
      bar.title = `Sentence #${idx + 1} (${sentence.wordCount} words) — TOP #${rank} HARDEST`;
    } else if (sentence.wordCount < 14) {
      bar.classList.add('bar-breeze');
      bar.title = `Sentence #${idx + 1} (${sentence.wordCount} words) — Breezy`;
    } else if (sentence.wordCount <= 25) {
      bar.classList.add('bar-med');
      bar.title = `Sentence #${idx + 1} (${sentence.wordCount} words) — Moderate`;
    } else {
      bar.classList.add('bar-dense');
      bar.title = `Sentence #${idx + 1} (${sentence.wordCount} words) — Dense`;
    }

    bar.addEventListener('click', () => {
      selectSentence(sentence.index, isHardest);
    });

    container.appendChild(bar);
  });
}

function renderHeatmap(analysis) {
  const container = DOM.highlightedChapterText;
  const rawText = DOM.chapterInput.value;

  // Build rendered HTML with highlighted spans for hardest sentences
  let html = '';
  const sentences = analysis.allSentences;

  sentences.forEach(s => {
    const isHardest = analysis.hardestIndexMap.has(s.index);
    const escaped = escapeHtml(s.text);

    if (isHardest) {
      const rank = analysis.hardestIndexMap.get(s.index);
      html += `<mark class="hard-sentence-highlight rank-${rank}" data-sent-index="${s.index}" data-rank="${rank}">` +
              `<span class="inline-rank-badge badge-${rank}">#${rank}</span>${escaped}</mark> `;
    } else {
      html += `<span class="regular-sentence" data-sent-index="${s.index}">${escaped}</span> `;
    }
  });

  // Preserve paragraphs
  html = html.replace(/\n\n+/g, '<br><br>');

  container.innerHTML = html;

  // Add click listeners to highlighted marks
  container.querySelectorAll('.hard-sentence-highlight').forEach(el => {
    el.addEventListener('click', () => {
      const sentIndex = parseInt(el.getAttribute('data-sent-index'), 10);
      selectSentence(sentIndex, true);
    });
  });
}

function renderHardestCards(analysis) {
  const container = DOM.hardestSentencesList;

  if (analysis.top5Hardest.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎉</div>
        <h3>No difficult sentences found!</h3>
        <p>Your chapter is exceptionally concise and flowing.</p>
      </div>`;
    return;
  }

  container.innerHTML = '';

  analysis.top5Hardest.forEach((item, i) => {
    const rank = i + 1;
    const card = document.createElement('div');
    card.className = `hard-sentence-card`;
    card.id = `hard-card-${item.index}`;
    card.setAttribute('data-sent-index', item.index);

    const reasonsHtml = item.reasons.map(r => `<span class="metric-chip">⚠️ ${r}</span>`).join(' ');
    const suggestionText = item.suggestions.join(' ');

    card.innerHTML = `
      <div class="card-top-row">
        <span class="card-rank-badge rank-${rank}-bg">
          <span>#${rank} Hardest</span>
          <span>(Score: ${item.difficultyScore})</span>
        </span>
        <button class="card-action-btn jump-btn" title="View in chapter text">
          🔍 Locate in text
        </button>
      </div>

      <div class="sentence-snippet-box">
        "${escapeHtml(item.text)}"
      </div>

      <div class="metrics-chips-row">
        <span class="metric-chip">Length: <strong>${item.wordCount} words</strong></span>
        <span class="metric-chip">Syllables: <strong>${item.syllables}</strong></span>
        <span class="metric-chip">Grade: <strong>${item.isolatedGrade}</strong></span>
        ${reasonsHtml}
      </div>

      <div class="rewrite-advice-box">
        <div class="rewrite-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          Author Flow Suggestion
        </div>
        <p>${suggestionText}</p>
      </div>
    `;

    // Locate in text button
    const jumpBtn = card.querySelector('.jump-btn');
    jumpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectSentence(item.index, true);
    });

    card.addEventListener('click', () => {
      selectSentence(item.index, true);
    });

    container.appendChild(card);
  });
}

function selectSentence(sentIndex, isHardest) {
  // Switch to heatmap view if not active
  switchTab('highlighted');

  // Highlight mark in text
  const textMark = DOM.highlightedChapterText.querySelector(`[data-sent-index="${sentIndex}"]`);
  document.querySelectorAll('.hard-sentence-highlight.active-selected').forEach(el => el.classList.remove('active-selected'));
  if (textMark) {
    textMark.classList.add('active-selected');
    textMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Highlight card on the right
  document.querySelectorAll('.hard-sentence-card.selected-card').forEach(el => el.classList.remove('selected-card'));
  const card = document.getElementById(`hard-card-${sentIndex}`);
  if (card) {
    card.classList.add('selected-card');
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function switchTab(tabName) {
  if (tabName === 'input') {
    DOM.viewInputTab.classList.add('active');
    DOM.viewHighlightedTab.classList.remove('active');
    DOM.editorInputPane.classList.add('active');
    DOM.editorHighlightPane.classList.remove('active');
  } else {
    DOM.viewHighlightedTab.classList.add('active');
    DOM.viewInputTab.classList.remove('active');
    DOM.editorHighlightPane.classList.add('active');
    DOM.editorInputPane.classList.remove('active');
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ==========================================
// 5. Event Listeners & Bootstrapping
// ==========================================

function handleInputChange() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const text = DOM.chapterInput.value;
    const analysis = analyzeChapter(text);
    updateUI(analysis);
  }, 120);
}

DOM.chapterInput.addEventListener('input', handleInputChange);

// Sample Chips Clicking
document.querySelectorAll('.sample-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const sampleKey = chip.getAttribute('data-sample');
    if (SAMPLES[sampleKey]) {
      DOM.chapterInput.value = SAMPLES[sampleKey];
      handleInputChange();
      showToast(`Loaded sample: ${chip.textContent.trim()}`);
    }
  });
});

// Tab switching
DOM.viewInputTab.addEventListener('click', () => switchTab('input'));
DOM.viewHighlightedTab.addEventListener('click', () => switchTab('highlighted'));

// Clear button
DOM.clearBtn.addEventListener('click', () => {
  DOM.chapterInput.value = '';
  handleInputChange();
  switchTab('input');
  showToast('Text cleared');
});

// Copy Report Button
DOM.copyReportBtn.addEventListener('click', () => {
  if (!currentAnalysis) {
    showToast('Paste a chapter first!');
    return;
  }

  const a = currentAnalysis;
  let report = `📊 ChapterClarity Diagnostic Report\n`;
  report += `====================================\n\n`;
  report += `• Words: ${a.wordCount} | Sentences: ${a.sentenceCount} | Est. Read Time: ${a.readMinutes} min\n`;
  report += `• Flesch Reading Ease: ${a.fleschReadingEase}/100 (${getEaseStatus(a.fleschReadingEase).label})\n`;
  report += `• Flesch-Kincaid Grade: ${a.fkGradeLevel} Grade\n`;
  report += `• Gunning Fog Index: ${a.gunningFog}\n`;
  report += `• Complex Words: ${a.complexWordPercent}%\n\n`;
  report += `🔥 Top 5 Hardest Sentences:\n`;
  report += `------------------------------------\n`;

  a.top5Hardest.forEach((s, idx) => {
    report += `#${idx + 1} (Score: ${s.difficultyScore} | ${s.wordCount} wds | ${s.syllables} syl):\n`;
    report += `"${s.text}"\n`;
    report += `Suggestion: ${s.suggestions.join(' ')}\n\n`;
  });

  report += `Generated with ChapterClarity — 100% Client-Side Private Readability Diagnostic`;

  navigator.clipboard.writeText(report).then(() => {
    showToast('Full report copied to clipboard!');
  }).catch(() => {
    showToast('Failed to copy. Please try again.');
  });
});

// Theme Toggle
DOM.themeToggleBtn.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('theme-light');
  document.body.classList.toggle('theme-dark', !isLight);
  showToast(`Switched to ${isLight ? 'warm parchment' : 'dark obsidian'} theme`);
});

// Formulas Toggle
DOM.toggleFormulasBtn.addEventListener('click', () => {
  const isExpanded = DOM.toggleFormulasBtn.getAttribute('aria-expanded') === 'true';
  DOM.toggleFormulasBtn.setAttribute('aria-expanded', !isExpanded);
  DOM.formulasContent.classList.toggle('open', !isExpanded);
});

// On Load: Initialize with Shelley's Frankenstein sample so the user immediately sees a working demo
window.addEventListener('DOMContentLoaded', () => {
  DOM.chapterInput.value = SAMPLES.frankenstein;
  handleInputChange();
});
