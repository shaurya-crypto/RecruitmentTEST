// script.js

// --- State Management ---
const state = {
    candidate: { name: '', email: '' },
    permissions: { camera: false, mic: false, fullscreen: false },
    violations: 0,
    maxViolations: 3,
    timeLeft: 45 * 60, // 45 minutes
    timerInterval: null,
    currentQuestionIndex: 0,
    answers: {}, // questionId -> answer
    reviewState: {}, // questionId -> boolean
    isExamActive: false,
    isResuming: false, // true if reloaded
};

// --- Question Data (Exactly 30 Questions, Easier) ---
const questions = [
    // HTML (10)
    { id: 'h1', type: 'mcq', section: 'HTML', q: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Text Markup Language', 'Home Tool Markup Language', 'None of these'] },
    { id: 'h2', type: 'mcq', section: 'HTML', q: 'Which tag creates a line break?', options: ['<br>', '<lb>', '<break>', '<newline>'] },
    { id: 'h3', type: 'mcq', section: 'HTML', q: 'Which tag is for a paragraph?', options: ['<p>', '<para>', '<pg>', '<text>'] },
    { id: 'h4', type: 'mcq', section: 'HTML', q: 'Which tag makes text bold?', options: ['<b>', '<bold>', '<bb>', '<strong>'] },
    { id: 'h5', type: 'mcq', section: 'HTML', q: 'Which tag creates a hyperlink?', options: ['<a>', '<link>', '<url>', '<href>'] },
    { id: 'h6', type: 'mcq', section: 'HTML', q: 'What is the correct HTML for an image?', options: ['<img>', '<image>', '<pic>', '<picture>'] },
    { id: 'h7', type: 'mcq', section: 'HTML', q: 'Which tag makes a list with bullets?', options: ['<ul>', '<ol>', '<list>', '<bullet>'] },
    { id: 'h8', type: 'mcq', section: 'HTML', q: 'Which tag creates a table row?', options: ['<tr>', '<td>', '<table>', '<th>'] },
    { id: 'h9', type: 'mcq', section: 'HTML', q: 'Which tag is used for the largest heading?', options: ['<h1>', '<h6>', '<head>', '<header>'] },
    { id: 'h10', type: 'mcq', section: 'HTML', q: 'Which attribute provides alternate text for an image?', options: ['alt', 'title', 'src', 'text'] },
    // CSS (10)
    { id: 'c1', type: 'mcq', section: 'CSS', q: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Creative Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets'] },
    { id: 'c2', type: 'mcq', section: 'CSS', q: 'How do you change the background color?', options: ['background-color', 'color', 'bg-color', 'background'] },
    { id: 'c3', type: 'mcq', section: 'CSS', q: 'Which property changes the text color?', options: ['color', 'text-color', 'font-color', 'style-color'] },
    { id: 'c4', type: 'mcq', section: 'CSS', q: 'How do you select an element with id "demo"?', options: ['#demo', '.demo', 'demo', '*demo'] },
    { id: 'c5', type: 'mcq', section: 'CSS', q: 'How do you select an element with class "test"?', options: ['.test', '#test', 'test', '*test'] },
    { id: 'c6', type: 'mcq', section: 'CSS', q: 'Which property changes text size?', options: ['font-size', 'text-size', 'text-style', 'font-style'] },
    { id: 'c7', type: 'mcq', section: 'CSS', q: 'How to make text bold in CSS?', options: ['font-weight: bold;', 'text-style: bold;', 'font: bold;', 'style: bold;'] },
    { id: 'c8', type: 'mcq', section: 'CSS', q: 'Which property aligns text?', options: ['text-align', 'align', 'text-position', 'position'] },
    { id: 'c9', type: 'mcq', section: 'CSS', q: 'Which property creates space outside the element border?', options: ['margin', 'padding', 'spacing', 'outer-space'] },
    { id: 'c10', type: 'mcq', section: 'CSS', q: 'How do you hide an element?', options: ['display: none;', 'visibility: hidden;', 'hide: true;', 'display: hidden;'] },
    // JS (5)
    { id: 'j1', type: 'mcq', section: 'JavaScript', q: 'Inside which HTML element do we put JavaScript?', options: ['<script>', '<javascript>', '<js>', '<code>'] },
    { id: 'j2', type: 'mcq', section: 'JavaScript', q: 'How do you create a variable?', options: ['let x = 5;', 'variable x = 5;', 'v = 5;', 'create x = 5;'] },
    { id: 'j3', type: 'mcq', section: 'JavaScript', q: 'How to write a comment?', options: ['// comment', '<!-- comment -->', '# comment', '/* comment'] },
    { id: 'j4', type: 'mcq', section: 'JavaScript', q: 'How to show a popup alert?', options: ['alert("Hello");', 'msgBox("Hello");', 'msg("Hello");', 'prompt("Hello");'] },
    { id: 'j5', type: 'mcq', section: 'JavaScript', q: 'What is the result of 5 + 5?', options: ['10', '55', '"10"', 'Error'] },
    // Short Answers (2)
    { id: 's1', type: 'short', section: 'Short Answer', q: 'What is semantic HTML?', max: 300 },
    { id: 's2', type: 'short', section: 'Short Answer', q: 'Difference between margin and padding?', max: 300 },
    // Coding (3)
    { id: 'cod1', type: 'code', section: 'Coding Round', q: 'Build a Login Form (Email, Password, Remember Me, Login Button)', initialCode: '<!-- Write HTML/CSS here -->\n<div class="login-box">\n\n</div>' },
    { id: 'cod2', type: 'code', section: 'Coding Round', q: 'Build a Product Card (Image, Title, Price, Buy Button)', initialCode: '<!-- Write HTML/CSS here -->\n<div class="card">\n\n</div>' },
    { id: 'cod3', type: 'code', section: 'Coding Round', q: 'Build a Navigation Bar (Logo, Links, Login Button)', initialCode: '<!-- Write HTML/CSS here -->\n<nav class="navbar">\n\n</nav>' },
];

// Shuffle questions (except coding round to keep them at the end)
const mcqAndShort = questions.filter(q => q.type !== 'code');
for (let i = mcqAndShort.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mcqAndShort[i], mcqAndShort[j]] = [mcqAndShort[j], mcqAndShort[i]];
}
const codingQuestions = questions.filter(q => q.type === 'code');
let activeQuestions = [...mcqAndShort, ...codingQuestions]; // Should be exactly 30


// --- DOM Elements ---
const screens = {
    landing: document.getElementById('landing-page'),
    permissions: document.getElementById('permissions-page'),
    rules: document.getElementById('rules-page'),
    exam: document.getElementById('exam-page'),
    review: document.getElementById('review-page'),
    final: document.getElementById('final-page'),
    blocked: document.getElementById('blocked-page'),
};

const showScreen = (screenName) => {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
};

// --- IndexedDB Video Storage ---
const DB_NAME = 'ExamVideoDB';
const STORE_NAME = 'videos';

function saveVideoToDB(blob) {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
        }
    };
    request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(blob, 'finalVideo');
    };
}

function loadVideoFromDB(callback) {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
        }
    };
    request.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            callback(null);
            return;
        }
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get('finalVideo');
        getReq.onsuccess = () => {
            callback(getReq.result);
        };
        getReq.onerror = () => callback(null);
    };
    request.onerror = () => callback(null);
}

// --- Reload Protection ---
window.addEventListener('load', () => {
    if (localStorage.getItem('examSubmitted') === 'true') {
        showScreen('blocked');
        loadVideoFromDB((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                document.getElementById('blocked-video-preview').src = url;
                document.getElementById('btn-blocked-download').href = url;
                document.getElementById('blocked-recording-section').classList.remove('hidden');
            }
        });
        return;
    }
    const saved = localStorage.getItem('examState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.isExamActive) {
                // Restore state
                Object.assign(state, parsed);
                // Adjust questions array order based on saved answers order if we want, 
                // but random seed is lost. For simplicity, we just use the newly shuffled one.
                // In a perfect system, question order would also be saved in state.
                if(parsed.questionOrder) {
                    activeQuestions = parsed.questionOrder.map(id => questions.find(q => q.id === id));
                } else {
                    state.questionOrder = activeQuestions.map(q => q.id);
                }
                
                state.isResuming = true;
                showScreen('permissions');
                document.getElementById('perm-error').innerHTML = "<p><strong>Exam Session Restored</strong></p><p>We detected an active session. Please re-allow camera, mic, and fullscreen to continue where you left off.</p>";
                document.getElementById('perm-error').classList.remove('hidden');
            } else {
                state.questionOrder = activeQuestions.map(q => q.id);
            }
        } catch (e) {
            console.error(e);
        }
    } else {
        state.questionOrder = activeQuestions.map(q => q.id);
    }
});

// --- Landing ---
document.getElementById('landing-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.candidate.name = document.getElementById('candidate-name').value;
    state.candidate.email = document.getElementById('candidate-email').value;
    showScreen('permissions');
    requestPermissions();
});

// --- Media Recording Setup ---
let mediaRecorder;
let recordedChunks = [];
let videoStream;

// --- Permissions ---
async function requestPermissions() {
    const errorBox = document.getElementById('perm-error');
    if(!state.isResuming) errorBox.classList.add('hidden');
    
    let camOk = false;
    let micOk = false;
    
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        camOk = true;
        micOk = true;
        document.getElementById('hidden-video').srcObject = videoStream;
        
        // Setup recorder
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(videoStream);
        mediaRecorder.ondataavailable = function(e) {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };
        
        document.getElementById('perm-camera').querySelector('.status').textContent = 'Granted';
        document.getElementById('perm-camera').querySelector('.status').className = 'status granted';
        document.getElementById('perm-mic').querySelector('.status').textContent = 'Granted';
        document.getElementById('perm-mic').querySelector('.status').className = 'status granted';
    } catch (err) {
        console.error(err);
        document.getElementById('perm-camera').querySelector('.status').textContent = 'Denied';
        document.getElementById('perm-camera').querySelector('.status').className = 'status denied';
        document.getElementById('perm-mic').querySelector('.status').textContent = 'Denied';
        document.getElementById('perm-mic').querySelector('.status').className = 'status denied';
    }
    
    const root = document.documentElement;
    let fullOk = false;
    try {
        if (root.requestFullscreen) {
            await root.requestFullscreen();
            fullOk = true;
        }
    } catch(err) {
        console.error("Fullscreen err", err);
    }
    
    if (fullOk || document.fullscreenElement) {
        document.getElementById('perm-fullscreen').querySelector('.status').textContent = 'Granted';
        document.getElementById('perm-fullscreen').querySelector('.status').className = 'status granted';
    } else {
        document.getElementById('perm-fullscreen').querySelector('.status').textContent = 'Denied';
        document.getElementById('perm-fullscreen').querySelector('.status').className = 'status denied';
    }

    state.permissions = { camera: camOk, mic: micOk, fullscreen: fullOk || !!document.fullscreenElement };
    
    if (camOk && micOk && (fullOk || document.fullscreenElement)) {
        document.getElementById('btn-request-perms').classList.add('hidden');
        document.getElementById('btn-continue-rules').classList.remove('hidden');
        errorBox.classList.add('hidden');
    } else {
        errorBox.classList.remove('hidden');
        document.getElementById('btn-request-perms').classList.add('hidden');
        document.getElementById('btn-retry-perms').classList.remove('hidden');
    }
}

document.getElementById('btn-request-perms').addEventListener('click', requestPermissions);
document.getElementById('btn-retry-perms').addEventListener('click', requestPermissions);
document.getElementById('btn-continue-rules').addEventListener('click', () => {
    if (state.isResuming) {
        startExam();
    } else {
        showScreen('rules');
    }
});

// --- Rules ---
document.getElementById('agree-rules').addEventListener('change', (e) => {
    document.getElementById('btn-start-exam').disabled = !e.target.checked;
});
document.getElementById('btn-start-exam').addEventListener('click', startExam);

// --- Exam Initialization ---
function startExam() {
    state.isExamActive = true;
    showScreen('exam');
    
    document.getElementById('violation-count').textContent = state.violations;
    
    initPalette();
    renderQuestion(state.currentQuestionIndex);
    startTimer();
    setupAntiCheat();
    saveState();
    
    // Start Recording
    if(mediaRecorder && mediaRecorder.state === 'inactive') {
        mediaRecorder.start();
    }
}

// --- LocalStorage ---
function saveState() {
    localStorage.setItem('examState', JSON.stringify({
        isExamActive: state.isExamActive,
        answers: state.answers,
        reviewState: state.reviewState,
        timeLeft: state.timeLeft,
        violations: state.violations,
        currentQuestionIndex: state.currentQuestionIndex,
        candidate: state.candidate,
        questionOrder: state.questionOrder
    }));
}

setInterval(() => {
    if(state.isExamActive) saveState();
}, 2000); // auto save every 2s

// --- Timer ---
function startTimer() {
    if(state.timerInterval) clearInterval(state.timerInterval);
    updateTimerDisplay();
    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();
        if (state.timeLeft <= 0) {
            clearInterval(state.timerInterval);
            forceSubmit("Time's up!");
        }
    }, 1000);
}
function updateTimerDisplay() {
    const m = Math.floor(state.timeLeft / 60).toString().padStart(2, '0');
    const s = (state.timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').textContent = `${m}:${s}`;
}

// --- Question Rendering ---
function initPalette() {
    const palette = document.getElementById('question-palette');
    palette.innerHTML = '';
    activeQuestions.forEach((q, i) => {
        const btn = document.createElement('button');
        btn.className = 'palette-btn';
        btn.textContent = i + 1;
        btn.id = `pal-${i}`;
        btn.onclick = () => renderQuestion(i);
        palette.appendChild(btn);
    });
}

function updatePaletteUI() {
    activeQuestions.forEach((q, i) => {
        const btn = document.getElementById(`pal-${i}`);
        if(btn) {
            btn.className = 'palette-btn';
            if (i === state.currentQuestionIndex) btn.classList.add('current');
            if (state.reviewState[q.id]) btn.classList.add('review');
            else if (state.answers[q.id] && state.answers[q.id].trim() !== '') btn.classList.add('answered');
        }
    });
}

function renderQuestion(index) {
    if (state.currentQuestionIndex !== index && state.isExamActive) {
        saveCurrentAnswer(); // save before switching
    }
    state.currentQuestionIndex = index;
    const q = activeQuestions[index];
    
    document.getElementById('progress-text').textContent = `Question ${index + 1} / ${activeQuestions.length}`;
    document.getElementById('progress-bar').style.width = `${((index + 1) / activeQuestions.length) * 100}%`;
    
    const container = document.getElementById('question-content');
    container.innerHTML = `<div class="text-sm mb-2 text-gradient">${q.section}</div><h2 class="question-title">${q.q}</h2>`;
    
    if (q.type === 'mcq') {
        q.options.forEach(opt => {
            const label = document.createElement('label');
            label.className = 'mcq-option';
            if (state.answers[q.id] === opt) label.classList.add('selected');
            
            const inp = document.createElement('input');
            inp.type = 'radio';
            inp.name = `q-${q.id}`;
            inp.value = opt;
            if (state.answers[q.id] === opt) inp.checked = true;
            
            inp.addEventListener('change', () => {
                document.querySelectorAll(`input[name="q-${q.id}"]`).forEach(el => {
                    el.parentElement.classList.remove('selected');
                });
                label.classList.add('selected');
                state.answers[q.id] = opt;
                updatePaletteUI();
                saveState(); // fast save on answer
            });
            
            label.appendChild(inp);
            label.appendChild(document.createTextNode(opt));
            container.appendChild(label);
        });
    } else if (q.type === 'short') {
        const wrapper = document.createElement('div');
        wrapper.className = 'short-answer-container';
        
        const ta = document.createElement('textarea');
        ta.maxLength = q.max;
        ta.placeholder = "Type your answer here...";
        ta.value = state.answers[q.id] || '';
        ta.id = `ta-${q.id}`;
        
        const count = document.createElement('div');
        count.className = 'char-count';
        count.textContent = `${ta.value.length} / ${q.max}`;
        
        ta.addEventListener('input', () => {
            state.answers[q.id] = ta.value;
            count.textContent = `${ta.value.length} / ${q.max}`;
            updatePaletteUI();
        });
        
        wrapper.appendChild(ta);
        wrapper.appendChild(count);
        container.appendChild(wrapper);
    } else if (q.type === 'code') {
        const wrapper = document.createElement('div');
        wrapper.className = 'coding-container';
        
        const editPane = document.createElement('div');
        editPane.className = 'editor-pane';
        editPane.innerHTML = `<div class="pane-header"><span>Code Editor (HTML/CSS)</span></div>`;
        const ta = document.createElement('textarea');
        ta.className = 'editor-textarea';
        ta.id = `code-${q.id}`;
        ta.spellcheck = false;
        ta.value = state.answers[q.id] || q.initialCode;
        editPane.appendChild(ta);
        
        const prevPane = document.createElement('div');
        prevPane.className = 'preview-pane';
        prevPane.innerHTML = `<div class="pane-header"><span>Live Preview</span></div>`;
        const iframe = document.createElement('iframe');
        iframe.className = 'preview-iframe';
        prevPane.appendChild(iframe);
        
        wrapper.appendChild(editPane);
        wrapper.appendChild(prevPane);
        container.appendChild(wrapper);
        
        const updateIframe = () => {
            state.answers[q.id] = ta.value;
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(ta.value);
            doc.close();
            updatePaletteUI();
        };
        ta.addEventListener('input', updateIframe);
        setTimeout(updateIframe, 50); // initial render
    }
    
    // Checkbox state
    document.getElementById('mark-review').checked = !!state.reviewState[q.id];
    
    // Buttons state
    document.getElementById('btn-prev').disabled = index === 0;
    document.getElementById('btn-next').disabled = index === activeQuestions.length - 1;
    
    updatePaletteUI();
}

function saveCurrentAnswer() {
    const q = activeQuestions[state.currentQuestionIndex];
    if (q.type === 'mcq') {
        const selected = document.querySelector(`input[name="q-${q.id}"]:checked`);
        if (selected) state.answers[q.id] = selected.value;
    } else if (q.type === 'short') {
        const ta = document.getElementById(`ta-${q.id}`);
        if (ta) state.answers[q.id] = ta.value;
    } else if (q.type === 'code') {
        const ta = document.getElementById(`code-${q.id}`);
        if (ta) state.answers[q.id] = ta.value;
    }
}

document.getElementById('btn-prev').addEventListener('click', () => {
    if (state.currentQuestionIndex > 0) renderQuestion(state.currentQuestionIndex - 1);
});
document.getElementById('btn-next').addEventListener('click', () => {
    saveCurrentAnswer();
    saveState();
    if (state.currentQuestionIndex < activeQuestions.length - 1) renderQuestion(state.currentQuestionIndex + 1);
});
document.getElementById('btn-save').addEventListener('click', () => {
    saveCurrentAnswer();
    saveState();
    if (state.currentQuestionIndex < activeQuestions.length - 1) renderQuestion(state.currentQuestionIndex + 1);
});
document.getElementById('mark-review').addEventListener('change', (e) => {
    const q = activeQuestions[state.currentQuestionIndex];
    if(e.target.checked) state.reviewState[q.id] = true;
    else delete state.reviewState[q.id];
    updatePaletteUI();
    saveState();
});

// --- Submission & Review ---
document.getElementById('btn-finish-early').addEventListener('click', showReviewPage);

function showReviewPage() {
    saveCurrentAnswer();
    saveState();
    showScreen('review');
    const grid = document.getElementById('review-grid');
    grid.innerHTML = '';
    
    activeQuestions.forEach((q, i) => {
        const div = document.createElement('div');
        div.className = 'review-item';
        div.textContent = `Q${i + 1}`;
        
        if (state.reviewState[q.id]) {
            div.classList.add('rev');
            div.innerHTML += '<br><small>Review</small>';
        } else if (state.answers[q.id] && state.answers[q.id].trim() !== '') {
            div.classList.add('ans');
            div.innerHTML += '<br><small>Ans</small>';
        } else {
            div.classList.add('unans');
            div.innerHTML += '<br><small>Unans</small>';
        }
        
        div.onclick = () => {
            showScreen('exam');
            renderQuestion(i);
        };
        grid.appendChild(div);
    });
}

document.getElementById('btn-back-to-exam').addEventListener('click', () => {
    showScreen('exam');
});
document.getElementById('btn-final-submit').addEventListener('click', () => {
    if(confirm("Are you sure you want to submit your assessment?")) {
        submitExam();
    }
});

function forceSubmit(reason) {
    alert(reason + "\nAssessment auto-submitted.");
    submitExam();
}

function submitExam() {
    state.isExamActive = false;
    clearInterval(state.timerInterval);
    
    // Stop recording and show video
    if(mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            saveVideoToDB(blob);
            
            const url = URL.createObjectURL(blob);
            
            // Set download button
            const downloadBtn = document.getElementById('btn-download-recording');
            downloadBtn.href = url;
            
            // Set video player for preview
            const previewVid = document.getElementById('final-video-preview');
            previewVid.src = url;
            
            document.getElementById('recording-section').classList.remove('hidden');
        };
        mediaRecorder.stop();
    }
    
    // Stop streams
    if(videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    
    if(document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log(err));
    }
    
    // Clear exam state to prevent resuming after submit
    localStorage.removeItem('examState');
    localStorage.setItem('examSubmitted', 'true');
    showScreen('final');
}

// --- Anti-Cheating System ---
function setupAntiCheat() {
    const handleViolation = (msg) => {
        if(!state.isExamActive) return;
        state.violations++;
        document.getElementById('violation-count').textContent = state.violations;
        saveState();
        
        if (state.violations >= state.maxViolations) {
            forceSubmit("You have reached the maximum number of rule violations (3/3).");
        } else {
            showWarning(`Violation ${state.violations}/3: ${msg}`);
        }
    };

    // 1. Tab Switch / Minimize
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.isExamActive) handleViolation('Tab switching is not allowed.');
    });

    // 2. Window Blur (clicking outside)
    window.addEventListener('blur', () => {
        if (state.isExamActive) handleViolation('You must keep the exam window in focus.');
    });



    // 5. Fullscreen exit
    document.addEventListener('fullscreenchange', () => {
        if(state.isExamActive && !document.fullscreenElement) {
            handleViolation('Exiting fullscreen is not allowed.');
        }
    });
}

// ==========================================
// GLOBAL ANTI-TAMPERING (Runs Immediately)
// ==========================================

function showWarning(text) {
    document.getElementById('warning-text').textContent = text;
    document.getElementById('warning-modal').classList.remove('hidden');
}
document.getElementById('btn-dismiss-warning').addEventListener('click', () => {
    document.getElementById('warning-modal').classList.add('hidden');
    // Request fullscreen back if exited
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
    }
});

// 1. Prevent Context Menu (Right Click) Globally
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if(state.isExamActive) {
        state.violations++;
        document.getElementById('violation-count').textContent = state.violations;
        saveState();
        if (state.violations >= state.maxViolations) {
            forceSubmit("You have reached the maximum number of rule violations (3/3).");
        } else {
            showWarning(`Violation ${state.violations}/3: Right-click is disabled.`);
        }
    }
});

// 2. Prevent Keyboard Shortcuts Globally
document.addEventListener('keydown', (e) => {
    // Prevent F12, Ctrl+Shift+I/J/C (DevTools), Ctrl+U (View Source), Ctrl+S (Save)
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ['U','S'].includes(e.key.toUpperCase()))) {
        
        e.preventDefault();
        if(state.isExamActive) {
            state.violations++;
            document.getElementById('violation-count').textContent = state.violations;
            saveState();
            if (state.violations >= state.maxViolations) {
                forceSubmit("You have reached the maximum number of rule violations (3/3).");
            } else {
                showWarning(`Violation ${state.violations}/3: Developer tools and view source are disabled.`);
            }
        }
    }
});
