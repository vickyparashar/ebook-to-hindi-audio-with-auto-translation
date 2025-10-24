// Hindi Audiobook Library App
let currentBook = null;
let currentPage = 0;
let totalPages = 0;
let audioElement = null;
let progressUpdateInterval = null;

// DOM Elements
const librarySection = document.getElementById('library-section');
const playerSection = document.getElementById('player-section');
const uploadModal = document.getElementById('upload-modal');
const bookGrid = document.getElementById('book-grid');
const emptyLibrary = document.getElementById('empty-library');

// Modal elements
const addBookBtn = document.getElementById('add-book-btn');
const closeModalBtn = document.getElementById('close-modal');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');

// Player elements
const backToLibraryBtn = document.getElementById('back-to-library');
const bookTitle = document.getElementById('book-title');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');
const progressPercentSpan = document.getElementById('progress-percent');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const volumeSlider = document.getElementById('volume-slider');
const currentTimeSpan = document.getElementById('current-time');
const totalTimeSpan = document.getElementById('total-time');
const translatedText = document.getElementById('translated-text');
const textToggle = document.getElementById('text-toggle');
const progressRing = document.getElementById('progress-ring');
const processingStatus = document.getElementById('processing-status');
const processingMessage = document.getElementById('processing-message');
const errorDisplay = document.getElementById('error-display');

// Stats elements
const totalBooksSpan = document.getElementById('total-books');
const inProgressBooksSpan = document.getElementById('in-progress-books');
const completedBooksSpan = document.getElementById('completed-books');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    audioElement = document.getElementById('audio-element');
    setupEventListeners();
    loadLibrary();
    console.log('📚 Hindi Audiobook Library initialized');
});

// Setup Event Listeners
function setupEventListeners() {
    // Modal controls
    addBookBtn.addEventListener('click', openUploadModal);
    closeModalBtn.addEventListener('click', closeUploadModal);
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) closeUploadModal();
    });

    // File upload
    fileInput.addEventListener('change', handleFileSelect);
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // Player controls
    if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);
    if (prevBtn) prevBtn.addEventListener('click', previousPage);
    if (nextBtn) nextBtn.addEventListener('click', nextPage);
    if (backToLibraryBtn) backToLibraryBtn.addEventListener('click', showLibrary);
    if (textToggle) textToggle.addEventListener('click', toggleTextPanel);
    
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            audioElement.volume = e.target.value / 100;
        });
    }
    
    // Audio events
    if (audioElement) {
        audioElement.addEventListener('timeupdate', updateAudioProgress);
        audioElement.addEventListener('ended', handleAudioEnded);
        audioElement.addEventListener('loadedmetadata', () => {
            if (totalTimeSpan) totalTimeSpan.textContent = formatTime(audioElement.duration);
        });
    }
}

// Library Management
async function loadLibrary() {
    try {
        const response = await fetch('/library');
        const data = await response.json();
        
        if (response.ok) {
            displayLibrary(data.books);
            updateStats(data.stats);
        } else {
            showError('Failed to load library');
        }
    } catch (error) {
        console.error('Error loading library:', error);
        showError('Failed to load library');
    }
}

function displayLibrary(books) {
    bookGrid.innerHTML = '';
    
    if (books.length === 0) {
        emptyLibrary.classList.remove('hidden');
        return;
    }
    
    emptyLibrary.classList.add('hidden');
    
    books.forEach(book => {
        const bookCard = createBookCard(book);
        bookGrid.appendChild(bookCard);
    });
}

function createBookCard(book) {
    const card = document.createElement('div');
    card.className = `book-card ${book.completed ? 'completed' : ''}`;
    
    const progressPercent = Math.round(book.progress_percent || 0);
    const lastRead = book.last_read ? new Date(book.last_read).toLocaleDateString() : 'Never';
    
    card.innerHTML = `
        <div class="book-cover" style="background: linear-gradient(135deg, ${getBookColor(book.filename)})">
            📖
        </div>
        <div class="book-title">${book.filename.replace(/\.(pdf|epub)$/i, '')}</div>
        <div class="book-progress">${progressPercent}% complete</div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="book-meta">
            <span class="book-date">${lastRead}</span>
            <button class="delete-btn" onclick="deleteBook('${book.id}')" title="Delete book">🗑</button>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('delete-btn')) {
            openBook(book.id);
        }
    });
    
    return card;
}

function getBookColor(filename) {
    const colors = [
        '#FF6B6B, #4ECDC4',
        '#45B7D1, #96CEB4', 
        '#FECA57, #FF9FF3',
        '#54A0FF, #5F27CD',
        '#FF9F43, #10AC84',
        '#EE5A52, #0ABDE3'
    ];
    const hash = filename.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
}

function updateStats(stats) {
    if (totalBooksSpan) totalBooksSpan.textContent = stats.total_books;
    if (inProgressBooksSpan) inProgressBooksSpan.textContent = stats.in_progress;
    if (completedBooksSpan) completedBooksSpan.textContent = stats.completed_books;
}

// Modal Management
function openUploadModal() {
    uploadModal.classList.remove('hidden');
    uploadStatus.classList.add('hidden');
    fileInput.value = '';
}

function closeUploadModal() {
    uploadModal.classList.add('hidden');
}

// File Upload
function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

async function handleFile(file) {
    // Validate file type
    const validExtensions = ['.pdf', '.epub'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
        showUploadError('Invalid file type. Please upload PDF or EPUB files only.');
        return;
    }
    
    showUploadStatus('Uploading...', 'uploading');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showUploadStatus(`✓ Added to library: ${data.filename}`, 'success');
            setTimeout(() => {
                closeUploadModal();
                loadLibrary(); // Refresh library
            }, 1500);
        } else {
            showUploadError(data.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showUploadError('Upload failed. Please try again.');
    }
}

function showUploadStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = `upload-status ${type}`;
    uploadStatus.classList.remove('hidden');
}

function showUploadError(message) {
    showUploadStatus(message, 'error');
            uploadStatus.classList.add('success');
            
            // Load first page
            setTimeout(() => {
                uploadSection.classList.add('hidden');
                playerSection.classList.remove('hidden');
                bookTitle.textContent = data.filename;
                totalPagesSpan.textContent = totalPages;
                loadPage(0);
            }, 1000);
            
        } else {
            showError(data.error || 'Upload failed');
        }
        
    } catch (error) {
        showError('Upload failed: ' + error.message);
    }
}

// Load Page
async function loadPage(pageNum) {
    if (pageNum < 0 || pageNum >= totalPages) {
        console.log('Page out of range');
        return;
    }
    
    currentPage = pageNum;
    currentPageSpan.textContent = pageNum + 1;
    
    // Show processing status
    processingStatus.classList.remove('hidden');
    processingMessage.textContent = `Processing page ${pageNum + 1}...`;
    
    try {
        const response = await fetch(`/process/${pageNum}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Update translated text
            translatedText.textContent = data.translated_text;
            
            // Load audio
            audioElement.src = data.audio_url;
            audioElement.load();
            
            // Auto-play
            playAudio();
            
            processingStatus.classList.add('hidden');
            
        } else {
            showError(data.error || 'Failed to process page');
            processingStatus.classList.add('hidden');
        }
        
    } catch (error) {
        showError('Error loading page: ' + error.message);
        processingStatus.classList.add('hidden');
    }
}

// Play Audio
function playAudio() {
    audioElement.play()
        .then(() => {
            playPauseBtn.textContent = '⏸️';
            playPauseBtn.title = 'Pause';
        })
        .catch(err => {
            console.error('Play error:', err);
            showError('Failed to play audio');
        });
}

// Pause Audio
function pauseAudio() {
    audioElement.pause();
    playPauseBtn.textContent = '▶️';
    playPauseBtn.title = 'Play';
}

// Toggle Play/Pause
function togglePlayPause() {
    if (audioElement.paused) {
        playAudio();
    } else {
        pauseAudio();
    }
}

// Previous Page
function previousPage() {
    if (currentPage > 0) {
        loadPage(currentPage - 1);
    }
}

// Next Page
function nextPage() {
    if (currentPage < totalPages - 1) {
        loadPage(currentPage + 1);
    }
}

// Handle Audio Ended
function handleAudioEnded() {
    playPauseBtn.textContent = '▶️';
    playPauseBtn.title = 'Play';
    
    // Auto-advance to next page
    if (currentPage < totalPages - 1) {
        setTimeout(() => {
            nextPage();
        }, 500);
    }
}

// Update Progress
function updateProgress() {
    if (audioElement.duration) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        progressFill.style.width = progress + '%';
        currentTimeSpan.textContent = formatTime(audioElement.currentTime);
    }
}

// Format Time
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Show Error
function showError(message) {
    errorDisplay.textContent = '❌ ' + message;
    errorDisplay.classList.remove('hidden');
    uploadStatus.textContent = message;
    uploadStatus.className = 'upload-status error';
    
    setTimeout(() => {
        errorDisplay.classList.add('hidden');
    }, 5000);
}

// Log for debugging
console.log('App.js loaded');
