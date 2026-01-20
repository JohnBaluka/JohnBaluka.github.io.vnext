import Reveal from './libs/revealjs/5.0.5/reveal.esm.js';
import RevealZoom from './libs/revealjs/5.0.5/plugin/zoom/zoom.esm.js';
import RevealNotes from './libs/revealjs/5.0.5/plugin/notes/notes.esm.js';
import RevealSearch from './libs/revealjs/5.0.5/plugin/search/search.esm.js';
import RevealHighlight from './libs/revealjs/5.0.5/plugin/highlight/highlight.esm.js';

// Store all reveal instances
const revealInstances = [];

// Track sidebar states
let siteNavExpanded = true;
let articleNavExpanded = true;

// Track sidebar widths
let siteNavWidth = 260;
let articleNavWidth = 320;

// Track current view
let currentView = 'article';

// Track current slide across all views
let currentSlideIndex = 1;

// Track current timestamp (in seconds) for audio/video sync
let currentTimestamp = 0;

// Track total duration (in seconds) - calculated from last note line
let totalDuration = 0;

// Slide data for generating views
const slideData = [];

// Mobile detection and logging
function logMobileStatus() {
    const width = window.innerWidth;
    const isMobileSite = width <= 768;
    const isMobileArticle = width <= 900;
    console.log('=== Mobile Detection ===');
    console.log('Screen width:', width + 'px');
    console.log('Mobile (≤768px):', isMobileSite);
    console.log('Mobile Article Nav (≤900px):', isMobileArticle);
    console.log('User Agent:', navigator.userAgent);
    console.log('Touch capable:', 'ontouchstart' in window || navigator.maxTouchPoints > 0);
    console.log('======================');
}

// Log initial mobile status
logMobileStatus();

// Track previous mobile state for resize detection
let wasMobile = window.innerWidth <= 768;

// Function to force all slides to Large size in Article View
function forceArticleViewToLargeSize() {
    console.log('Forcing all slides to Large size for mobile...');
    
    // For each slide, click the Large button for both slide size and notes size
    for (let i = 1; i <= 6; i++) {
        // Force slide size to Large
        const sizeLargeBtn = document.querySelector(`.slide-${i}-size-btn[data-size="large"]`);
        if (sizeLargeBtn && sizeLargeBtn.style.color !== 'rgb(255, 255, 255)') {
            sizeLargeBtn.click();
            console.log(`Slide ${i}: Set slide size to Large`);
        }
        
        // Force notes size to Large
        const notesSizeLargeBtn = document.querySelector(`.slide-${i}-notes-size-btn[data-notes-size="large"]`);
        if (notesSizeLargeBtn && notesSizeLargeBtn.style.color !== 'rgb(255, 255, 255)') {
            notesSizeLargeBtn.click();
            console.log(`Slide ${i}: Set notes size to Large`);
        }
    }
}

// Log on resize and handle mobile transitions
window.addEventListener('resize', () => {
    logMobileStatus();
    
    const isMobile = window.innerWidth <= 768;
    
    // If we just crossed into mobile territory, force Large sizes
    if (isMobile && !wasMobile) {
        console.log('Crossed into mobile view - forcing Large sizes...');
        forceArticleViewToLargeSize();
    }
    
    wasMobile = isMobile;
});

// Format timestamp as h:mm:ss or m:ss
function formatTimestamp(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
        return `${minutes}:${String(secs).padStart(2, '0')}`;
    }
}

// Update timestamp display in bottom toolbar
function updateBottomToolbarTimestamp(currentTime) {
    if (!window.bottomToolbarTimestamp) return;
    
    const current = formatTimestamp(currentTime);
    const total = formatTimestamp(totalDuration);
    window.bottomToolbarTimestamp.textContent = `${current} / ${total}`;
    
    // Update progress bar
    if (window.bottomToolbarProgressFill && totalDuration > 0) {
        const progress = (currentTime / totalDuration) * 100;
        window.bottomToolbarProgressFill.style.width = `${progress}%`;
        
        // Update progress handle position
        if (window.bottomToolbarProgressHandle) {
            window.bottomToolbarProgressHandle.style.left = `${progress}%`;
        }
    }
}

// Update play/pause button icon in bottom toolbar
function updateBottomToolbarPlayPauseIcon() {
    if (!window.bottomToolbarPlayPauseBtn) return;

    if (currentView === 'article') {
        const audioPlayer = document.getElementById(`audio-player-${currentSlideIndex}`);
        window.bottomToolbarPlayPauseBtn.innerHTML = (audioPlayer && !audioPlayer.paused) ? '<i class="fa fa-pause"></i>' : '<i class="fa fa-play"></i>';
    } else if (currentView === 'presentation') {
        const audioPlayer = document.getElementById('pres-audio-player');
        window.bottomToolbarPlayPauseBtn.innerHTML = (audioPlayer && !audioPlayer.paused) ? '<i class="fa fa-pause"></i>' : '<i class="fa fa-play"></i>';
    } else if (currentView === 'video') {
        if (window.youtubePlayer && window.youtubePlayerReady) {
            const state = window.youtubePlayer.getPlayerState();
            window.bottomToolbarPlayPauseBtn.innerHTML = (state === 1) ? '<i class="fa fa-pause"></i>' : '<i class="fa fa-play"></i>';
        } else {
            window.bottomToolbarPlayPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
        }
    }
}

// Get all sidebar note lines in order
function getAllSidebarNotes() {
    const notes = [];
    document.querySelectorAll('.sidebar-note-line').forEach(note => {
        notes.push(note);
    });
    return notes;
}

// Navigate to the next sidebar note
function navigateToNextNote() {
    const allNotes = getAllSidebarNotes();
    if (allNotes.length === 0) return;
    
    const currentNote = document.querySelector('.sidebar-note-line.currentLine');
    
    if (!currentNote) {
        // No current note, click the first one
        allNotes[0].click();
    } else {
        const currentIndex = allNotes.indexOf(currentNote);
        if (currentIndex >= 0 && currentIndex < allNotes.length - 1) {
            allNotes[currentIndex + 1].click();
        }
    }
}

// Navigate to the previous sidebar note
function navigateToPreviousNote() {
    const allNotes = getAllSidebarNotes();
    if (allNotes.length === 0) return;
    
    const currentNote = document.querySelector('.sidebar-note-line.currentLine');
    
    if (!currentNote) {
        // No current note, click the first one
        allNotes[0].click();
    } else {
        const currentIndex = allNotes.indexOf(currentNote);
        if (currentIndex > 0) {
            allNotes[currentIndex - 1].click();
        }
    }
}

// Collect slide data from the DOM
function collectSlideData() {
    for (let i = 1; i <= 6; i++) {
        const revealEl = document.getElementById(`reveal${i}`);
        const notesEl = document.getElementById(`slide${i}Notes`);
        
        if (revealEl) {
            const section = revealEl.querySelector('section');
            const menuTitle = section?.getAttribute('data-menu-title') || `Slide ${i}`;
            const svg = section?.querySelector('svg');
            const svgSrc = svg?.getAttribute('data-src') || `images/Slide${i}.svg`;
            
            const notes = [];
            if (notesEl) {
                const spans = notesEl.querySelectorAll('span[data-type="narration"]');
                spans.forEach(span => {
                    notes.push({
                        id: span.id,
                        text: span.textContent,
                        section: span.getAttribute('data-section'),
                        fragmentIndex: span.getAttribute('data-fragment-index'),
                        start: span.getAttribute('data-start'),
                        end: span.getAttribute('data-end'),
                        startVideo: span.getAttribute('data-start-video'),
                        endVideo: span.getAttribute('data-end-video')
                    });
                });
            }
            
            slideData.push({
                index: i,
                menuTitle,
                svgSrc,
                notes
            });
        }
    }
}

// Create the top toolbar
function createTopToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'top-toolbar';
    toolbar.style.cssText = `
        position: fixed;
        top: 0;
        left: ${siteNavWidth}px;
        right: ${articleNavWidth}px;
        height: 50px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        z-index: 1100;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        box-sizing: border-box;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
        transition: left 0.3s ease, right 0.3s ease;
    `;

    // Left section - Navigation toggles
    const leftSection = document.createElement('div');
    leftSection.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const siteNavToggle = document.createElement('button');
    siteNavToggle.id = 'site-nav-toggle';
    siteNavToggle.innerHTML = '<i class="fa fa-bars"></i>';
    siteNavToggle.title = 'Toggle Site Navigation';
    siteNavToggle.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s ease;
    `;
    siteNavToggle.addEventListener('mouseover', () => { siteNavToggle.style.background = 'rgba(255,255,255,0.2)'; });
    siteNavToggle.addEventListener('mouseleave', () => { siteNavToggle.style.background = 'rgba(255,255,255,0.1)'; });
    siteNavToggle.addEventListener('click', () => {
        siteNavExpanded = !siteNavExpanded;
        updateSidebarPositions();
    });

    leftSection.appendChild(siteNavToggle);
    toolbar.appendChild(leftSection);

    // Center section - Pill Toggle Switch
    const centerSection = document.createElement('div');
    centerSection.style.cssText = `
        position: relative;
        display: flex;
        align-items: center;
        background: rgba(135, 206, 235, 0.3);
        padding: 4px;
        border-radius: 20px;
        border: 1px solid rgba(135, 206, 235, 0.5);
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
    `;

    const viewButtons = [
        { id: 'article', icon: 'fa-file-lines', text: 'Article', title: 'Article View - Individual slides with notes' },
        { id: 'presentation', icon: 'fa-images', text: 'Presentation', title: 'Presentation View - Full slideshow' },
        { id: 'video', icon: 'fa-youtube', text: 'Video', title: 'Video View - YouTube player' }
    ];

    // Create sliding background
    const slider = document.createElement('div');
    slider.id = 'view-toggle-slider';
    slider.style.cssText = `
        position: absolute;
        top: 4px;
        left: 4px;
        height: calc(100% - 8px);
        background: linear-gradient(135deg, #0969da 0%, #0550ae 100%);
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 8px rgba(9, 105, 218, 0.4);
        z-index: 1;
    `;
    centerSection.appendChild(slider);

    viewButtons.forEach((btn, index) => {
        const button = document.createElement('button');
        button.id = `view-btn-${btn.id}`;
        button.className = 'view-toggle-btn';
        button.setAttribute('data-view', btn.id);
        button.innerHTML = `<i class="fa${btn.id === 'video' ? '-brands' : ''} ${btn.icon}"></i><span class="btn-text">${btn.text}</span>`;
        button.title = btn.title;
        button.style.cssText = `
            position: relative;
            z-index: 2;
            background: transparent;
            border: none;
            color: ${btn.id === 'article' ? '#ffffff' : 'rgba(255,255,255,0.6)'};
            padding: 8px 16px;
            cursor: pointer;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 500;
            transition: color 0.3s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
        `;
        
        button.addEventListener('mouseover', () => {
            if (button.getAttribute('data-view') !== currentView) {
                button.style.color = 'rgba(255,255,255,0.85)';
            }
        });
        button.addEventListener('mouseleave', () => {
            if (button.getAttribute('data-view') !== currentView) {
                button.style.color = 'rgba(255,255,255,0.6)';
            }
        });
        button.addEventListener('click', () => {
            switchView(btn.id);
            updatePillToggle(btn.id);
        });
        centerSection.appendChild(button);
    });

    // Function to update pill toggle slider position
    window.updatePillToggle = (viewId) => {
        const activeButton = document.querySelector(`.view-toggle-btn[data-view="${viewId}"]`);
        if (activeButton && slider) {
            slider.style.width = `${activeButton.offsetWidth}px`;
            slider.style.left = `${activeButton.offsetLeft}px`;
        }
        
        // Update button text colors
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            const isActive = btn.getAttribute('data-view') === viewId;
            btn.style.color = isActive ? '#ffffff' : 'rgba(255,255,255,0.6)';
            btn.style.fontWeight = isActive ? '600' : '500';
        });
    };

    // Set initial slider position
    setTimeout(() => {
        const activeButton = document.querySelector('.view-toggle-btn[data-view="article"]');
        if (activeButton && slider) {
            slider.style.width = `${activeButton.offsetWidth}px`;
        }
    }, 0);

    toolbar.appendChild(centerSection);

    // Right section - Article nav toggle
    const rightSection = document.createElement('div');
    rightSection.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const articleNavToggle = document.createElement('button');
    articleNavToggle.id = 'article-nav-toggle';
    articleNavToggle.innerHTML = '<i class="fa fa-list"></i>';
    articleNavToggle.title = 'Toggle Article Navigation';
    articleNavToggle.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s ease;
    `;
    articleNavToggle.addEventListener('mouseover', () => { articleNavToggle.style.background = 'rgba(255,255,255,0.2)'; });
    articleNavToggle.addEventListener('mouseleave', () => { articleNavToggle.style.background = 'rgba(255,255,255,0.1)'; });
    articleNavToggle.addEventListener('click', () => {
        articleNavExpanded = !articleNavExpanded;
        updateSidebarPositions();
    });

    rightSection.appendChild(articleNavToggle);
    toolbar.appendChild(rightSection);

    document.body.insertBefore(toolbar, document.body.firstChild);
}

// Create the bottom toolbar
function createBottomToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'bottom-toolbar';
    toolbar.style.cssText = `
        position: fixed;
        bottom: 0;
        left: ${siteNavWidth}px;
        right: ${articleNavWidth}px;
        height: 50px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        z-index: 1100;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        padding: 0 16px;
        box-sizing: border-box;
        box-shadow: 0 -2px 8px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
        transition: left 0.3s ease, right 0.3s ease;
    `;

    // Left section - Timestamp display
    const leftSection = document.createElement('div');
    leftSection.style.cssText = 'display: flex; align-items: center; gap: 8px; justify-self: start;';

    // Timestamp display
    const timestampDisplay = document.createElement('div');
    timestampDisplay.id = 'bottom-toolbar-timestamp';
    timestampDisplay.style.cssText = `
        color: rgba(255,255,255,0.9);
        font-size: 14px;
        font-weight: 500;
        min-width: 120px;
        text-align: left;
        font-family: 'Courier New', monospace;
    `;
    timestampDisplay.textContent = '0:00 / 0:00';

    leftSection.appendChild(timestampDisplay);
    toolbar.appendChild(leftSection);

    // Center section - Playback controls (perfectly centered)
    const centerSection = document.createElement('div');
    centerSection.style.cssText = 'display: flex; align-items: center; gap: 12px; justify-self: center;';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.id = 'bottom-toolbar-prev';
    prevBtn.innerHTML = '<i class="fa fa-step-backward"></i>';
    prevBtn.title = 'Previous';
    prevBtn.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        width: 40px;
        height: 40px;
        cursor: pointer;
        border-radius: 6px;
        font-size: 16px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    prevBtn.addEventListener('mouseover', () => { 
        prevBtn.style.background = 'rgba(255,255,255,0.2)'; 
    });
    prevBtn.addEventListener('mouseleave', () => { 
        prevBtn.style.background = 'rgba(255,255,255,0.1)'; 
    });
    prevBtn.addEventListener('click', () => {
        navigateToPreviousNote();
    });

    // Play/Pause button
    const playPauseBtn = document.createElement('button');
    playPauseBtn.id = 'bottom-toolbar-playpause';
    playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
    playPauseBtn.title = 'Play/Pause';
    playPauseBtn.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        width: 40px;
        height: 40px;
        cursor: pointer;
        border-radius: 6px;
        font-size: 16px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    playPauseBtn.addEventListener('mouseover', () => { 
        playPauseBtn.style.background = 'rgba(255,255,255,0.2)'; 
    });
    playPauseBtn.addEventListener('mouseleave', () => { 
        playPauseBtn.style.background = 'rgba(255,255,255,0.1)'; 
    });
    playPauseBtn.addEventListener('click', () => {
        if (currentView === 'article') {
            // Control current slide's audio
            const audioPlayer = document.getElementById(`audio-player-${currentSlideIndex}`);
            if (audioPlayer) {
                if (audioPlayer.paused) {
                    audioPlayer.play();
                    playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
                } else {
                    audioPlayer.pause();
                    playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
                }
            }
        } else if (currentView === 'presentation') {
            const audioPlayer = document.getElementById('pres-audio-player');
            if (audioPlayer) {
                if (audioPlayer.paused) {
                    audioPlayer.play();
                    playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
                } else {
                    audioPlayer.pause();
                    playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
                }
            }
        } else if (currentView === 'video') {
            if (window.youtubePlayer && window.youtubePlayerReady) {
                const state = window.youtubePlayer.getPlayerState();
                if (state === 1) { // Playing
                    window.youtubePlayer.pauseVideo();
                    playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
                } else {
                    window.youtubePlayer.playVideo();
                    playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
                }
            }
        }
    });

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.id = 'bottom-toolbar-next';
    nextBtn.innerHTML = '<i class="fa fa-step-forward"></i>';
    nextBtn.title = 'Next';
    nextBtn.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        width: 40px;
        height: 40px;
        cursor: pointer;
        border-radius: 6px;
        font-size: 16px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    nextBtn.addEventListener('mouseover', () => { 
        nextBtn.style.background = 'rgba(255,255,255,0.2)'; 
    });
    nextBtn.addEventListener('mouseleave', () => { 
        nextBtn.style.background = 'rgba(255,255,255,0.1)'; 
    });
    nextBtn.addEventListener('click', () => {
        navigateToNextNote();
    });

    centerSection.appendChild(prevBtn);
    centerSection.appendChild(playPauseBtn);
    centerSection.appendChild(nextBtn);
    toolbar.appendChild(centerSection);

    // Store button and timestamp globally for updates
    window.bottomToolbarPlayPauseBtn = playPauseBtn;
    window.bottomToolbarTimestamp = timestampDisplay;

    // Right section - Page navigation buttons
    const rightSection = document.createElement('div');
    rightSection.style.cssText = 'display: flex; align-items: center; gap: 8px; justify-self: end;';

    const movingToBlazorLink = document.createElement('a');
    movingToBlazorLink.href = 'MovingToBlazor/index.htm';
    movingToBlazorLink.target = '_blank';
    movingToBlazorLink.innerHTML = '<i class="fa fa-chevron-left"></i>';
    movingToBlazorLink.title = 'Visit MovingToBlazor.com';
    movingToBlazorLink.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    movingToBlazorLink.addEventListener('mouseover', () => { 
        movingToBlazorLink.style.background = 'rgba(255,255,255,0.2)'; 
    });
    movingToBlazorLink.addEventListener('mouseleave', () => { 
        movingToBlazorLink.style.background = 'rgba(255,255,255,0.1)'; 
    });

    const multimodalSlidesLink = document.createElement('a');
    multimodalSlidesLink.href = 'MultimodalSlides/index.htm';
    multimodalSlidesLink.target = '_blank';
    multimodalSlidesLink.innerHTML = '<i class="fa fa-chevron-right"></i>';
    multimodalSlidesLink.title = 'Visit MultimodalSlides.com';
    multimodalSlidesLink.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    multimodalSlidesLink.addEventListener('mouseover', () => { 
        multimodalSlidesLink.style.background = 'rgba(255,255,255,0.2)'; 
    });
    multimodalSlidesLink.addEventListener('mouseleave', () => { 
        multimodalSlidesLink.style.background = 'rgba(255,255,255,0.1)'; 
    });

    rightSection.appendChild(movingToBlazorLink);
    rightSection.appendChild(multimodalSlidesLink);
    toolbar.appendChild(rightSection);

    // Progress bar - spans the top edge of the toolbar
    const progressBarContainer = document.createElement('div');
    progressBarContainer.id = 'bottom-toolbar-progress-container';
    progressBarContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: rgba(255,255,255,0.2);
        cursor: pointer;
        z-index: 1;
    `;
    
    const progressBarFill = document.createElement('div');
    progressBarFill.id = 'bottom-toolbar-progress-fill';
    progressBarFill.style.cssText = `
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #0969da 0%, #58a6ff 100%);
        transition: width 0.1s linear;
        pointer-events: none;
    `;
    
    // Progress handle (draggable dot)
    const progressHandle = document.createElement('div');
    progressHandle.id = 'bottom-toolbar-progress-handle';
    progressHandle.style.cssText = `
        position: absolute;
        top: 50%;
        left: 0%;
        width: 12px;
        height: 12px;
        background: #ffffff;
        border: 2px solid #0969da;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        cursor: grab;
        z-index: 3;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: left 0.1s linear;
    `;
    
    // Hover tooltip
    const hoverTooltip = document.createElement('div');
    hoverTooltip.id = 'bottom-toolbar-progress-tooltip';
    hoverTooltip.style.cssText = `
        position: absolute;
        top: 8px;
        left: 50%;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        font-family: 'Courier New', monospace;
        pointer-events: none;
        opacity: 0;
        transform: translateX(-50%);
        white-space: nowrap;
        z-index: 6;
        transition: opacity 0.2s ease;
    `;
    
    // Thumbnail preview container
    const thumbnailPreview = document.createElement('div');
    thumbnailPreview.id = 'bottom-toolbar-thumbnail-preview';
    thumbnailPreview.style.cssText = `
        position: absolute;
        bottom: 12px;
        left: 0;
        width: 240px;
        height: 135px;
        background: #000;
        border: 3px solid #0969da;
        border-radius: 8px;
        overflow: visible;
        pointer-events: none;
        opacity: 0;
        transform: translateX(-50%);
        z-index: 5;
        transition: opacity 0.2s ease;
        box-shadow: 0 6px 16px rgba(0,0,0,0.6);
    `;
    
    const thumbnailImage = document.createElement('img');
    thumbnailImage.id = 'bottom-toolbar-thumbnail-image';
    thumbnailImage.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        border-radius: 5px;
    `;
    
    thumbnailPreview.appendChild(thumbnailImage);
    thumbnailPreview.appendChild(hoverTooltip);
    
    progressBarContainer.appendChild(progressBarFill);
    progressBarContainer.appendChild(progressHandle);
    progressBarContainer.appendChild(thumbnailPreview);
    toolbar.appendChild(progressBarContainer);
    
    // Store globally
    window.bottomToolbarProgressFill = progressBarFill;
    window.bottomToolbarProgressHandle = progressHandle;
    window.bottomToolbarProgressTooltip = hoverTooltip;
    window.bottomToolbarThumbnailPreview = thumbnailPreview;
    window.bottomToolbarThumbnailImage = thumbnailImage;
    
    // Progress bar interaction handlers
    let isDragging = false;
    let isDraggingHandle = false;
    
    function seekToPosition(e) {
        const rect = progressBarContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        const seekTime = percentage * totalDuration;
        
        // Update handle position immediately for visual feedback
        progressHandle.style.left = `${percentage * 100}%`;
        progressBarFill.style.width = `${percentage * 100}%`;
        
        // Find which slide contains this timestamp
        let targetSlideIndex = 1;
        let targetAudioTime = seekTime;
        
        const allLines = document.querySelectorAll('[data-start-video]');
        for (let i = allLines.length - 1; i >= 0; i--) {
            const line = allLines[i];
            const startVideo = parseFloat(line.getAttribute('data-start-video'));
            const slideIndex = parseInt(line.getAttribute('data-section')?.replace('slide', '') || '1');
            
            if (seekTime >= startVideo && slideIndex) {
                targetSlideIndex = slideIndex;
                targetAudioTime = seekTime - startVideo;
                break;
            }
        }
        
        // Seek based on current view
        if (currentView === 'article') {
            // Navigate to target slide if different
            if (targetSlideIndex !== currentSlideIndex) {
                navigateToSlide(targetSlideIndex);
                setTimeout(() => {
                    const audioPlayer = document.getElementById(`audio-player-${targetSlideIndex}`);
                    if (audioPlayer) {
                        audioPlayer.currentTime = targetAudioTime;
                        audioPlayer.play();
                    }
                }, 300);
            } else {
                const audioPlayer = document.getElementById(`audio-player-${targetSlideIndex}`);
                if (audioPlayer) {
                    audioPlayer.currentTime = targetAudioTime;
                    if (audioPlayer.paused) audioPlayer.play();
                }
            }
        } else if (currentView === 'presentation') {
            // Navigate to target slide
            if (window.presentationReveal) {
                window.presentationReveal.slide(targetSlideIndex - 1);
                setTimeout(() => {
                    const audioPlayer = document.getElementById('pres-audio-player');
                    if (audioPlayer) {
                        audioPlayer.currentTime = targetAudioTime;
                        if (audioPlayer.paused) audioPlayer.play();
                    }
                }, 100);
            }
        } else if (currentView === 'video') {
            if (window.youtubePlayer && window.youtubePlayerReady) {
                window.youtubePlayer.seekTo(seekTime, true);
                if (window.youtubePlayer.getPlayerState() !== 1) {
                    window.youtubePlayer.playVideo();
                }
            }
        }
    }
    
    progressBarContainer.addEventListener('mousedown', (e) => {
        if (e.target === progressHandle) {
            isDraggingHandle = true;
            progressHandle.style.cursor = 'grabbing';
        } else {
            isDragging = true;
        }
        seekToPosition(e);
        e.preventDefault();
    });
    
    progressHandle.addEventListener('mousedown', (e) => {
        isDraggingHandle = true;
        isDragging = false;
        progressHandle.style.cursor = 'grabbing';
        e.stopPropagation();
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging || isDraggingHandle) {
            seekToPosition(e);
        }
        
        // Update tooltip and thumbnail on hover
        if (e.target === progressBarContainer || e.target === progressHandle || e.target.closest('#bottom-toolbar-progress-container')) {
            const rect = progressBarContainer.getBoundingClientRect();
            const hoverX = e.clientX - rect.left;
            const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
            const hoverTime = percentage * totalDuration;
            
            // Find which slide this timestamp belongs to
            let thumbnailSlideIndex = 1;
            const allLines = document.querySelectorAll('[data-start-video]');
            for (let i = allLines.length - 1; i >= 0; i--) {
                const line = allLines[i];
                const startVideo = parseFloat(line.getAttribute('data-start-video'));
                const slideIndex = parseInt(line.getAttribute('data-section')?.replace('slide', '') || '1');
                
                if (hoverTime >= startVideo && slideIndex) {
                    thumbnailSlideIndex = slideIndex;
                    break;
                }
            }
            
            // Update thumbnail image
            thumbnailImage.src = `images/Slide${thumbnailSlideIndex}.png`;
            
            // Update tooltip text
            hoverTooltip.textContent = formatTimestamp(hoverTime);
            
            // Position thumbnail and tooltip
            const thumbnailWidth = 240;
            let xPosition = hoverX;
            
            // Keep thumbnail within bounds
            if (xPosition < thumbnailWidth / 2) {
                xPosition = thumbnailWidth / 2;
            } else if (xPosition > rect.width - thumbnailWidth / 2) {
                xPosition = rect.width - thumbnailWidth / 2;
            }
            
            thumbnailPreview.style.left = `${xPosition}px`;
            
            // Show thumbnail and tooltip
            thumbnailPreview.style.opacity = '1';
            hoverTooltip.style.opacity = '1';
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
        if (isDraggingHandle) {
            isDraggingHandle = false;
            progressHandle.style.cursor = 'grab';
        }
    });
    
    // Hover effect for progress bar
    progressBarContainer.addEventListener('mouseenter', () => {
        progressBarContainer.style.height = '6px';
    });
    
    progressBarContainer.addEventListener('mouseleave', () => {
        if (!isDragging && !isDraggingHandle) {
            progressBarContainer.style.height = '4px';
        }
        hoverTooltip.style.opacity = '0';
        thumbnailPreview.style.opacity = '0';
    });
    
    // Show/hide tooltip and thumbnail on handle hover
    progressHandle.addEventListener('mouseenter', (e) => {
        if (!isDraggingHandle) {
            const rect = progressBarContainer.getBoundingClientRect();
            const handleRect = progressHandle.getBoundingClientRect();
            const handleX = handleRect.left + handleRect.width / 2 - rect.left;
            const percentage = parseFloat(progressHandle.style.left) / 100;
            const handleTime = percentage * totalDuration;
            
            // Find which slide the current position belongs to
            let thumbnailSlideIndex = 1;
            const allLines = document.querySelectorAll('[data-start-video]');
            for (let i = allLines.length - 1; i >= 0; i--) {
                const line = allLines[i];
                const startVideo = parseFloat(line.getAttribute('data-start-video'));
                const slideIndex = parseInt(line.getAttribute('data-section')?.replace('slide', '') || '1');
                
                if (handleTime >= startVideo && slideIndex) {
                    thumbnailSlideIndex = slideIndex;
                    break;
                }
            }
            
            // Update thumbnail image
            thumbnailImage.src = `images/Slide${thumbnailSlideIndex}.png`;
            
            hoverTooltip.textContent = formatTimestamp(handleTime);
            hoverTooltip.style.opacity = '1';
            
            thumbnailPreview.style.left = `${handleX}px`;
            thumbnailPreview.style.opacity = '1';
        }
    });
    
    progressHandle.addEventListener('mouseleave', () => {
        if (!isDraggingHandle) {
            hoverTooltip.style.opacity = '0';
            thumbnailPreview.style.opacity = '0';
        }
    });

    document.body.appendChild(toolbar);
}

// Switch between views
function switchView(viewId) {
    if (currentView === viewId) return;
    
    // Capture the highlighted line BEFORE stopping media
    const highlightedLine = document.querySelector('.sidebar-note-line.currentLine');
    let preservedSlideIndex = currentSlideIndex;
    let preservedAudioTimestamp = 0;
    let preservedVideoTimestamp = 0;
    
    if (highlightedLine) {
        preservedAudioTimestamp = parseFloat(highlightedLine.getAttribute('data-start')) || 0;
        preservedVideoTimestamp = parseFloat(highlightedLine.getAttribute('data-start-video')) || 0;
        const slideIndex = parseInt(highlightedLine.getAttribute('data-slide-index'));
        if (slideIndex) {
            preservedSlideIndex = slideIndex;
            currentSlideIndex = slideIndex;
        }
        console.log('[Switch View] Preserved from', currentView, 'to', viewId, '- Slide:', preservedSlideIndex, 'Audio:', preservedAudioTimestamp, 'Video:', preservedVideoTimestamp);
    }
    
    // Stop any playing media
    stopAllMedia();
    
    const previousView = currentView;
    currentView = viewId;
    
    // Update pill toggle slider
    if (window.updatePillToggle) {
        window.updatePillToggle(viewId);
    }
    
    // Update bottom toolbar play/pause icon
    updateBottomToolbarPlayPauseIcon();
    
    // Show/hide views
    const articleView = document.getElementById('article-view');
    const presentationView = document.getElementById('presentation-view');
    const videoView = document.getElementById('video-view');
    
    if (articleView) articleView.style.display = viewId === 'article' ? 'flex' : 'none';
    if (presentationView) presentationView.style.display = viewId === 'presentation' ? 'flex' : 'none';
    if (videoView) videoView.style.display = viewId === 'video' ? 'flex' : 'none';
    
    // Update sidebar visibility based on view
    updateSidebarVisibility();
    
    // Initialize presentation view if switching to it
    if (viewId === 'presentation' && !window.presentationRevealInitialized) {
        initializePresentationView().then(() => {
            // Wait for initialization to complete, then sync
            syncViewToCurrentSlideWithData(viewId, preservedSlideIndex, preservedAudioTimestamp, preservedVideoTimestamp);
        });
    } else if (viewId === 'video' && !window.videoViewInitialized) {
        // Initialize video view if switching to it
        initializeVideoView();
        setTimeout(() => {
            syncViewToCurrentSlideWithData(viewId, preservedSlideIndex, preservedAudioTimestamp, preservedVideoTimestamp);
        }, 100);
    } else {
        // Synchronize player positions after view initialization
        setTimeout(() => {
            syncViewToCurrentSlideWithData(viewId, preservedSlideIndex, preservedAudioTimestamp, preservedVideoTimestamp);
        }, 100);
    }
}

// Synchronize view to current slide index and timestamp using preserved data
function syncViewToCurrentSlideWithData(viewId, slideIndex, audioTimestamp, videoTimestamp) {
    currentSlideIndex = slideIndex;
    
    console.log('[Sync View] Syncing to', viewId, 'slide:', slideIndex, 'audio:', audioTimestamp, 'video:', videoTimestamp);
    
    if (viewId === 'article') {
        const targetElement = document.getElementById(`reveal${slideIndex}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Seek to timestamp and play
        setTimeout(() => {
            const audioPlayer = document.getElementById(`audio-player-${slideIndex}`);
            if (audioPlayer && audioTimestamp > 0) {
                audioPlayer.currentTime = audioTimestamp;
                audioPlayer.play();
            }
        }, 300);
    } else if (viewId === 'presentation') {
        if (window.presentationReveal && window.presentationRevealInitialized) {
            console.log('[Sync View] Navigating to slide', slideIndex - 1);
            window.presentationReveal.slide(slideIndex - 1);
            // Wait for slide change and audio to load, then seek and play
            setTimeout(() => {
                const audioPlayer = document.getElementById('pres-audio-player');
                console.log('[Sync View] Audio player found:', !!audioPlayer, 'timestamp:', audioTimestamp);
                if (audioPlayer && audioTimestamp > 0) {
                    // Wait for audio to be ready before seeking
                    const trySeek = () => {
                        if (audioPlayer.readyState >= 2) { // HAVE_CURRENT_DATA or better
                            console.log('[Sync View] Seeking to', audioTimestamp);
                            audioPlayer.currentTime = audioTimestamp;
                            audioPlayer.play();
                        } else {
                            // Try again in a bit
                            setTimeout(trySeek, 50);
                        }
                    };
                    trySeek();
                }
            }, 400);
        }
    } else if (viewId === 'video') {
        console.log('[Sync View] Video - Player ready:', window.youtubePlayerReady, 'videoTimestamp:', videoTimestamp, 'slideIndex:', slideIndex);
        
        if (videoTimestamp > 0) {
            // Use the video timestamp from data-start-video
            const trySeekVideo = () => {
                if (window.youtubePlayer && window.youtubePlayerReady) {
                    console.log('[Sync View] Seeking video to', videoTimestamp);
                    window.youtubePlayer.seekTo(videoTimestamp, true);
                    window.youtubePlayer.playVideo();
                    
                    // Wait for seek to complete, then force highlight update
                    setTimeout(() => {
                        const actualTime = window.youtubePlayer.getCurrentTime();
                        console.log('[Sync View] Video seeked, actual time:', actualTime, 'expected:', videoTimestamp);
                        updateVideoViewHighlights(actualTime);
                    }, 300);
                } else {
                    // YouTube player not ready yet, wait and try again
                    setTimeout(trySeekVideo, 100);
                }
            };
            trySeekVideo();
        } else {
            // Fallback to first note of slide if no timestamp
            console.log('[Sync View] No video timestamp, using fallback for slide', slideIndex);
            const slide = slideData.find(s => s.index === slideIndex);
            if (slide && slide.notes.length > 0) {
                const trySeekFallback = () => {
                    if (window.youtubePlayer && window.youtubePlayerReady) {
                        const startTime = parseFloat(slide.notes[0].startVideo);
                        console.log('[Sync View] Seeking video to fallback time', startTime);
                        window.youtubePlayer.seekTo(startTime, true);
                        window.youtubePlayer.playVideo();
                        
                        // Wait for seek to complete, then force highlight update  
                        setTimeout(() => {
                            updateVideoViewHighlights(startTime);
                        }, 300);
                    } else {
                        setTimeout(trySeekFallback, 100);
                    }
                };
                trySeekFallback();
            }
        }
    }
}

// Stop all media (audio and video)
function stopAllMedia() {
    // Stop all audio players
    document.querySelectorAll('audio').forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    
    // Stop YouTube if playing
    if (window.youtubePlayer && window.youtubePlayerReady) {
        try {
            window.youtubePlayer.pauseVideo();
        } catch (e) {}
    }
    
    // Clear Article View highlights only (preserve sidebar highlights for view sync)
    for (let i = 1; i <= 6; i++) {
        const articleNotesEl = document.getElementById(`slide${i}Notes`);
        if (articleNotesEl) {
            articleNotesEl.querySelectorAll('.line').forEach(line => {
                line.classList.remove('currentLine');
            });
        }
    }
    
    // Update bottom toolbar play/pause icon
    updateBottomToolbarPlayPauseIcon();
}

// Update sidebar visibility based on current view
function updateSidebarVisibility() {
    const siteSidebar = document.getElementById('site-nav-sidebar');
    const articleSidebar = document.getElementById('slide-nav-sidebar');
    const toolbar = document.getElementById('top-toolbar');
    
    // All views now show the toolbar and sidebars
    if (siteSidebar) siteSidebar.style.display = 'block';
    if (articleSidebar) articleSidebar.style.display = 'block';
    if (toolbar) toolbar.style.display = 'flex';
    updateSidebarPositions();
}

// Create the site navigation sidebar (left side)
function createSiteNavigationSidebar() {
    const sidebar = document.createElement('nav');
    sidebar.id = 'site-nav-sidebar';
    sidebar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: ${siteNavWidth}px;
        height: 100vh;
        background: #f6f8fa;
        z-index: 1050;
        overflow-y: auto;
        border-right: 1px solid #d0d7de;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
        transition: transform 0.3s ease;
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 16px;
        border-bottom: 1px solid #d0d7de;
        background: #fff;
        position: sticky;
        top: 0;
        z-index: 1;
    `;
    header.innerHTML = '<h3 style="margin: 0; color: #1f2328; font-size: 14px; font-weight: 600;"><i class="fa fa-bars" style="margin-right: 8px; color: #656d76;"></i>Site Navigation</h3>';
    sidebar.appendChild(header);

    // Create site navigation section
    const navSection = document.createElement('div');
    navSection.style.cssText = `padding: 16px;`;

    // Site navigation items
    const siteLinks = [
        { href: 'index.htm', icon: 'fa-home', text: 'JohnBaluka.com', description: 'How can I help?', title: 'I help software development teams move forward within the Microsoft Tech Stack.' },
        { href: 'MovingToBlazor/', icon: 'fa-arrow-right', text: 'Moving To Blazor', description: 'Blazor Rocks!', title: 'Is moving to Blazor the right choice?' },
        { href: 'GitHubCopilotStep1/', icon: 'fa-regular fa-face-surprise', text: 'GitHub Copilot - OMG!', description: 'It really is amazing!', title: 'See how GitHub Copilot has changed the way I work!' },
        { href: 'Cohorts/', icon: 'fa-people-group', text: 'Cohorts', description: 'Results Focused.', title: 'Cohorts done right!' },
    ];

    const menuList = document.createElement('ul');
    menuList.style.cssText = `
        list-style: none;
        padding: 0;
        margin: 0;
    `;

    siteLinks.forEach(link => {
        const menuItem = document.createElement('li');
        menuItem.style.cssText = 'margin-bottom: 4px;';

        const menuLink = document.createElement('a');
        menuLink.href = link.href;
        menuLink.className = 'site-nav-link';
        menuLink.title = link.title;
        
        const currentPath = window.location.pathname;
        const isActive = currentPath.endsWith(link.href) || 
                        (link.href === 'index.htm' && (currentPath.endsWith('/') || currentPath.endsWith('/index.htm')));
        
        menuLink.style.cssText = `
            display: block;
            color: ${isActive ? '#0969da' : '#1f2328'};
            text-decoration: none;
            font-size: 14px;
            padding: 8px 12px;
            border-radius: 6px;
            transition: background 0.15s ease;
            background: ${isActive ? '#ddf4ff' : 'transparent'};
            border-left: 3px solid ${isActive ? '#0969da' : 'transparent'};
            font-weight: ${isActive ? '600' : 'normal'};
        `;

        const linkContent = document.createElement('div');
        linkContent.innerHTML = `
            <div style="display: flex; align-items: center;">
                <i class="fa ${link.icon}" style="margin-right: 10px; width: 16px; color: ${isActive ? '#0969da' : '#656d76'};"></i>
                <span>${link.text}</span>
            </div>
            <div style="font-size: 12px; color: #656d76; margin-left: 26px; margin-top: 2px;">${link.description}</div>
        `;
        menuLink.appendChild(linkContent);

        menuLink.addEventListener('mouseover', () => {
            if (!isActive) menuLink.style.background = '#eaeef2';
        });
        menuLink.addEventListener('mouseleave', () => {
            if (!isActive) menuLink.style.background = 'transparent';
        });

        menuItem.appendChild(menuLink);
        menuList.appendChild(menuItem);
    });

    navSection.appendChild(menuList);
    sidebar.appendChild(navSection);

    // Add resources section
    const resourcesSection = document.createElement('div');
    resourcesSection.style.cssText = `
        padding: 16px;
        border-top: 1px solid #d0d7de;
        margin-top: 16px;
    `;

    const resourcesTitle = document.createElement('div');
    resourcesTitle.style.cssText = `
        font-size: 12px;
        font-weight: 600;
        color: #656d76;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
    `;
    resourcesTitle.textContent = 'Connect';
    resourcesSection.appendChild(resourcesTitle);

    const resourceLinks = [
        { href: 'mailto:John@JohnBaluka.com', icon: 'fa-envelope', text: 'John@JohnBaluka.com', title: 'Send me an Email' },
        { href: 'https://www.youtube.com/@JohnBaluka', icon: 'fa-play', text: 'YouTube', title: 'My YouTube Channel' },
        { href: 'https://www.linkedin.com/in/johnbaluka/', icon: 'fa-handshake', text: 'LinkedIn', title: 'My LinkedIn Profile' },
        { href: 'https://github.com/JohnBaluka', icon: 'fa-code-branch', text: 'GitHub', title: 'My GitHub Profile' },
        { href: 'https://sessionize.com/john-baluka', icon: 'fa-bullhorn', text: 'Sessionize', title: 'My Sessionize Profile' },
        { href: 'https://DoMoreWithSlides.com/', icon: 'fa-regular fa-face-smile', text: 'Do More with Slides', title: 'My Vision - DoMoreWithSlides.com' },
    ];

    resourceLinks.forEach(link => {
        const linkEl = document.createElement('a');
        linkEl.href = link.href;
        linkEl.target = '_blank';
        linkEl.title = link.title;
        linkEl.style.cssText = `
            display: flex;
            align-items: center;
            color: #0969da;
            text-decoration: none;
            font-size: 14px;
            padding: 6px 0;
            transition: color 0.15s;
        `;
        linkEl.innerHTML = `<i class="fa ${link.icon}" style="margin-right: 10px; width: 16px;"></i>${link.text}<i class="fa fa-up-right-from-square" style="margin-left: 5px; width: 16px;"></i>`;
        linkEl.addEventListener('mouseover', () => { linkEl.style.textDecoration = 'underline'; });
        linkEl.addEventListener('mouseleave', () => { linkEl.style.textDecoration = 'none'; });
        resourcesSection.appendChild(linkEl);
    });

    sidebar.appendChild(resourcesSection);
    document.body.appendChild(sidebar);
    
    // Create resizable splitter
    const splitter = document.createElement('div');
    splitter.id = 'site-nav-splitter';
    splitter.style.cssText = `
        position: fixed;
        top: 0;
        left: ${siteNavWidth}px;
        width: 5px;
        height: 100vh;
        background: transparent;
        cursor: ew-resize;
        z-index: 1060;
        transition: left 0.3s ease;
    `;
    splitter.addEventListener('mousedown', initSiteNavResize);
    document.body.appendChild(splitter);
}

// Create the article navigation sidebar (right side)
function createArticleNavigationSidebar() {
    const sidebar = document.createElement('nav');
    sidebar.id = 'slide-nav-sidebar';
    sidebar.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: ${articleNavWidth}px;
        height: 100vh;
        background: #f6f8fa;
        z-index: 1050;
        overflow-y: auto;
        border-left: 1px solid #d0d7de;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
        transition: transform 0.3s ease;
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 16px;
        border-bottom: 1px solid #d0d7de;
        background: #fff;
        position: sticky;
        top: 0;
        z-index: 1;
    `;
    header.innerHTML = '<h3 style="margin: 0; color: #1f2328; font-size: 14px; font-weight: 600;"><i class="fa fa-list" style="margin-right: 8px; color: #656d76;"></i>Page Navigation</h3>';
    sidebar.appendChild(header);

    // Create menu list with thumbnails
    const menuList = document.createElement('div');
    menuList.id = 'slide-nav-list';
    menuList.style.cssText = `padding: 12px;`;

    slideData.forEach((slide, idx) => {
        const slideBlock = document.createElement('div');
        slideBlock.className = 'slide-nav-block';
        slideBlock.setAttribute('data-slide-index', slide.index);
        slideBlock.style.cssText = `
            margin-bottom: 8px;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            background: #fff;
            overflow: hidden;
        `;

        const menuItem = document.createElement('a');
        menuItem.href = `#reveal${slide.index}`;
        menuItem.className = 'slide-nav-link';
        menuItem.setAttribute('data-slide-index', slide.index);
        menuItem.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            color: #1f2328;
            text-decoration: none;
            font-size: 13px;
            padding: 8px;
            transition: all 0.15s ease;
            cursor: pointer;
        `;

        const thumbnail = document.createElement('img');
        thumbnail.src = `images/Slide${slide.index}.png`;
        thumbnail.alt = slide.menuTitle;
        thumbnail.style.cssText = `
            width: 80px;
            height: 50px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #d0d7de;
            flex-shrink: 0;
        `;

        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = 'flex: 1; min-width: 0; display: flex; align-items: center; justify-content: space-between;';
        titleContainer.innerHTML = `
            <div style="font-weight: 500; color: #1f2328; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <span style="color: #656d76; margin-right: 4px;">${slide.index}.</span>${slide.menuTitle}
            </div>
            <i class="fa fa-chevron-down" style="color: #656d76; font-size: 12px; transition: transform 0.2s;"></i>
        `;

        menuItem.appendChild(thumbnail);
        menuItem.appendChild(titleContainer);

        menuItem.addEventListener('mouseover', () => {
            menuItem.style.background = '#f6f8fa';
        });
        menuItem.addEventListener('mouseleave', () => {
            if (!menuItem.classList.contains('active')) {
                menuItem.style.background = 'transparent';
            }
        });
        menuItem.addEventListener('click', (e) => {
            e.preventDefault();
            const notesContent = slideBlock.querySelector('.slide-notes-content');
            const chevron = menuItem.querySelector('.fa-chevron-down');
            if (notesContent.style.display === 'none') {
                notesContent.style.display = 'block';
                chevron.style.transform = 'rotate(180deg)';
            } else {
                notesContent.style.display = 'none';
                chevron.style.transform = 'rotate(0deg)';
            }
            navigateToSlide(slide.index);
        });

        slideBlock.appendChild(menuItem);

        // Add notes content
        const notesContent = document.createElement('div');
        notesContent.className = 'slide-notes-content';
        notesContent.style.cssText = `
            display: none;
            padding: 12px;
            border-top: 1px solid #d0d7de;
            background: #f6f8fa;
            font-size: 12px;
            line-height: 1.6;
        `;

        slide.notes.forEach(note => {
            const span = document.createElement('span');
            span.className = 'line sidebar-note-line';
            span.setAttribute('data-section', note.section);
            span.setAttribute('data-type', 'narration');
            span.setAttribute('data-slide-index', slide.index);
            span.setAttribute('data-start-video', note.startVideo);
            span.setAttribute('data-end-video', note.endVideo);
            span.setAttribute('data-start', note.start);
            span.setAttribute('data-end', note.end);
            span.textContent = note.text;
            span.style.cssText = 'display: inline; cursor: pointer; transition: background 0.2s;';
            
            span.addEventListener('click', () => {
                if (currentView === 'presentation') {
                    if (window.presentationReveal) {
                        window.presentationReveal.slide(slide.index - 1);
                        document.getElementById('presentation-reveal').scrollIntoView({ behavior: 'smooth' });
                        
                        // Play audio at the correct timestamp
                        const audioPlayer = document.getElementById('pres-audio-player');
                        if (audioPlayer) {
                            const audioTime = parseFloat(note.start);
                            audioPlayer.currentTime = audioTime;
                            audioPlayer.play();
                        }
                    }
                } else if (currentView === 'video') {
                    if (window.youtubePlayer && window.youtubePlayerReady) {
                        const startTime = parseFloat(note.startVideo);
                        if (!isNaN(startTime)) {
                            console.log('[Sidebar Click] Video - Seeking to', startTime, 'for slide', slide.index);
                            window.youtubePlayer.seekTo(startTime, true);
                            window.youtubePlayer.playVideo();
                            
                            // Wait for seek to complete, then force highlight update
                            setTimeout(() => {
                                const actualTime = window.youtubePlayer.getCurrentTime();
                                console.log('[Sidebar Click] Video seeked, actual time:', actualTime, 'expected:', startTime);
                                updateVideoViewHighlights(actualTime);
                            }, 300);
                        } else {
                            console.error('[Sidebar Click] Invalid video timestamp:', note.startVideo);
                        }
                    }
                } else {
                    // Article view - scroll to slide and play audio at timestamp
                    const targetElement = document.getElementById(`reveal${slide.index}`);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    
                    // Play audio at the correct timestamp
                    const audioPlayer = document.getElementById(`audio-player-${slide.index}`);
                    if (audioPlayer) {
                        const audioTime = parseFloat(note.start);
                        audioPlayer.currentTime = audioTime;
                        audioPlayer.play();
                    }
                }
            });
            
            span.addEventListener('mouseover', () => {
                if (!span.classList.contains('currentLine')) {
                    span.classList.add('mouseOverLine');
                }
            });
            span.addEventListener('mouseleave', () => {
                span.classList.remove('mouseOverLine');
            });
            
            notesContent.appendChild(span);
            notesContent.appendChild(document.createElement('br'));
        });

        slideBlock.appendChild(notesContent);
        menuList.appendChild(slideBlock);
    });

    sidebar.appendChild(menuList);
    document.body.appendChild(sidebar);
    
    // Create resizable splitter
    const splitter = document.createElement('div');
    splitter.id = 'article-nav-splitter';
    splitter.style.cssText = `
        position: fixed;
        top: 0;
        right: ${articleNavWidth}px;
        width: 5px;
        height: 100vh;
        background: transparent;
        cursor: ew-resize;
        z-index: 1060;
        transition: right 0.3s ease;
    `;
    splitter.addEventListener('mousedown', initArticleNavResize);
    document.body.appendChild(splitter);
}

// Navigate to a specific slide based on current view
function navigateToSlide(slideIndex) {
    // Update global current slide
    currentSlideIndex = slideIndex;
    
    // Update active state in nav
    document.querySelectorAll('.slide-nav-link').forEach(link => {
        link.classList.remove('active');
        link.style.background = '#fff';
        link.style.borderColor = 'transparent';
    });
    const activeLink = document.querySelector(`.slide-nav-link[data-slide-index="${slideIndex}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        activeLink.style.background = '#ddf4ff';
        activeLink.style.borderColor = '#0969da';
    }

    if (currentView === 'article') {
        const targetElement = document.getElementById(`reveal${slideIndex}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else if (currentView === 'presentation') {
        if (window.presentationReveal) {
            window.presentationReveal.slide(slideIndex - 1);
        }
    } else if (currentView === 'video') {
        // Seek to the start time of this slide in the video
        const slide = slideData.find(s => s.index === slideIndex);
        if (slide && slide.notes.length > 0 && window.youtubePlayer && window.youtubePlayerReady) {
            const startTime = parseFloat(slide.notes[0].startVideo);
            window.youtubePlayer.seekTo(startTime, true);
        }
    }
}

// Update sidebar positions and body margins
function updateSidebarPositions() {
    const siteSidebar = document.getElementById('site-nav-sidebar');
    const articleSidebar = document.getElementById('slide-nav-sidebar');
    const siteToggle = document.getElementById('site-nav-toggle');
    const articleToggle = document.getElementById('article-nav-toggle');
    const topToolbar = document.getElementById('top-toolbar');
    const bottomToolbar = document.getElementById('bottom-toolbar');
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    const isMobileArticleNav = window.innerWidth <= 900;
    console.log(`updateSidebarPositions - Mobile: ${isMobile}, Mobile Article Nav: ${isMobileArticleNav}, Width: ${window.innerWidth}px`);
    
    // Get or create backdrop
    let backdrop = document.getElementById('sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebar-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1999;
            display: none;
            transition: opacity 0.3s ease;
        `;
        backdrop.addEventListener('click', () => {
            // Close all sidebars when backdrop is clicked
            siteNavExpanded = false;
            articleNavExpanded = false;
            updateSidebarPositions();
        });
        document.body.appendChild(backdrop);
    }
    
    // On mobile, use overlay mode with backdrop
    if (isMobile || isMobileArticleNav) {
        if (siteSidebar) {
            if (isMobile) {
                if (siteNavExpanded) {
                    siteSidebar.classList.add('mobile-open');
                } else {
                    siteSidebar.classList.remove('mobile-open');
                }
            }
        }
        
        if (articleSidebar) {
            if (isMobileArticleNav) {
                if (articleNavExpanded) {
                    articleSidebar.classList.add('mobile-open');
                } else {
                    articleSidebar.classList.remove('mobile-open');
                }
            }
        }
        
        // Show backdrop if any sidebar is open on mobile
        if ((isMobile && siteNavExpanded) || (isMobileArticleNav && articleNavExpanded)) {
            backdrop.style.display = 'block';
            setTimeout(() => backdrop.style.opacity = '1', 10);
        } else {
            backdrop.style.opacity = '0';
            setTimeout(() => backdrop.style.display = 'none', 300);
        }
        
        // Update toggle icons
        if (siteToggle) {
            siteToggle.innerHTML = siteNavExpanded ? '<i class="fa fa-times"></i>' : '<i class="fa fa-bars"></i>';
        }
        if (articleToggle) {
            articleToggle.innerHTML = articleNavExpanded ? '<i class="fa fa-times"></i>' : '<i class="fa fa-list"></i>';
        }
        
        // Don't adjust body margins or toolbar positions on mobile
        document.body.style.marginLeft = '0';
        document.body.style.marginRight = '0';
        if (topToolbar) {
            topToolbar.style.left = '0';
            topToolbar.style.right = '0';
        }
        if (bottomToolbar) {
            bottomToolbar.style.left = '0';
            bottomToolbar.style.right = '0';
        }
    } else {
        // Desktop mode - traditional sidebar behavior
        backdrop.style.opacity = '0';
        backdrop.style.display = 'none';
        
        if (siteSidebar) {
            siteSidebar.classList.remove('mobile-open');
            siteSidebar.style.transform = siteNavExpanded ? 'translateX(0)' : 'translateX(-100%)';
            if (siteToggle) {
                siteToggle.innerHTML = siteNavExpanded ? '<i class="fa fa-chevron-left"> </i> <i class="fa fa-bars"></i>' : '<i class="fa fa-chevron-right"> </i> <i class="fa fa-bars"></i>';
            }
        }

        if (articleSidebar) {
            articleSidebar.classList.remove('mobile-open');
            articleSidebar.style.transform = articleNavExpanded ? 'translateX(0)' : 'translateX(100%)';
            if (articleToggle) {
                articleToggle.innerHTML = articleNavExpanded ? '<i class="fa fa-list"> </i> <i class="fa fa-chevron-right"></i>' : '<i class="fa fa-list"> </i> <i class="fa fa-chevron-left"></i>';
            }
        }

        // Update top toolbar position
        if (topToolbar) {
            topToolbar.style.left = siteNavExpanded ? `${siteNavWidth}px` : '0';
            topToolbar.style.right = articleNavExpanded ? `${articleNavWidth}px` : '0';
        }

        // Update bottom toolbar position
        if (bottomToolbar) {
            bottomToolbar.style.left = siteNavExpanded ? `${siteNavWidth}px` : '0';
            bottomToolbar.style.right = articleNavExpanded ? `${articleNavWidth}px` : '0';
        }

        // Update body margins
        document.body.style.marginLeft = siteNavExpanded ? `${siteNavWidth}px` : '0';
        document.body.style.marginRight = articleNavExpanded ? `${articleNavWidth}px` : '0';
    }
    
    document.body.style.transition = 'margin 0.3s ease';
    
    // Update splitter positions
    const siteSplitter = document.getElementById('site-nav-splitter');
    const articleSplitter = document.getElementById('article-nav-splitter');
    if (siteSplitter) {
        siteSplitter.style.left = siteNavExpanded ? `${siteNavWidth}px` : '0';
    }
    if (articleSplitter) {
        articleSplitter.style.right = articleNavExpanded ? `${articleNavWidth}px` : '0';
    }
    
    // Trigger layout update for reveal.js after transition
    setTimeout(() => {
        // Update presentation view reveal
        if (window.presentationReveal && window.presentationRevealInitialized) {
            window.presentationReveal.layout();
        }
        // Update all article view reveal instances
        revealInstances.forEach(({ instance }) => {
            if (instance) {
                instance.layout();
            }
        });
        // Resize YouTube player if it exists
        if (window.youtubePlayer && window.youtubePlayerReady) {
            try {
                // Trigger iframe resize by dispatching resize event
                window.dispatchEvent(new Event('resize'));
            } catch (e) {}
        }
        // Also trigger window resize for any other responsive elements
        window.dispatchEvent(new Event('resize'));
    }, 350);
}

// Resize functionality for site navigation sidebar
function initSiteNavResize(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = siteNavWidth;
    
    function doResize(e) {
        const newWidth = Math.max(200, Math.min(500, startWidth + (e.clientX - startX)));
        siteNavWidth = newWidth;
        
        const sidebar = document.getElementById('site-nav-sidebar');
        const splitter = document.getElementById('site-nav-splitter');
        const toolbar = document.getElementById('top-toolbar');
        const bottomToolbar = document.getElementById('bottom-toolbar');
        
        if (sidebar) sidebar.style.width = `${newWidth}px`;
        if (splitter) splitter.style.left = `${newWidth}px`;
        if (toolbar && siteNavExpanded) toolbar.style.left = `${newWidth}px`;
        if (bottomToolbar && siteNavExpanded) bottomToolbar.style.left = `${newWidth}px`;
        if (siteNavExpanded) document.body.style.marginLeft = `${newWidth}px`;
    }
    
    function stopResize() {
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
        // Trigger layout update after resize
        setTimeout(() => {
            if (window.presentationReveal && window.presentationRevealInitialized) {
                window.presentationReveal.layout();
            }
            revealInstances.forEach(({ instance }) => {
                if (instance) instance.layout();
            });
            window.dispatchEvent(new Event('resize'));
        }, 50);
    }
    
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
}

// Resize functionality for article navigation sidebar
function initArticleNavResize(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = articleNavWidth;
    
    function doResize(e) {
        const newWidth = Math.max(200, Math.min(500, startWidth - (e.clientX - startX)));
        articleNavWidth = newWidth;
        
        const sidebar = document.getElementById('slide-nav-sidebar');
        const splitter = document.getElementById('article-nav-splitter');
        const toolbar = document.getElementById('top-toolbar');
        const bottomToolbar = document.getElementById('bottom-toolbar');
        
        if (sidebar) sidebar.style.width = `${newWidth}px`;
        if (splitter) splitter.style.right = `${newWidth}px`;
        if (toolbar && articleNavExpanded) toolbar.style.right = `${newWidth}px`;
        if (bottomToolbar && articleNavExpanded) bottomToolbar.style.right = `${newWidth}px`;
        if (articleNavExpanded) document.body.style.marginRight = `${newWidth}px`;
    }
    
    function stopResize() {
        document.removeEventListener('mousemove', doResize);
        document.removeEventListener('mouseup', stopResize);
        // Trigger layout update after resize
        setTimeout(() => {
            if (window.presentationReveal && window.presentationRevealInitialized) {
                window.presentationReveal.layout();
            }
            revealInstances.forEach(({ instance }) => {
                if (instance) instance.layout();
            });
            window.dispatchEvent(new Event('resize'));
        }, 50);
    }
    
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
}

// Setup scroll spy for navigation highlighting
function setupScrollSpy() {
    const observerOptions = {
        root: null,
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        if (currentView !== 'article') return;
        
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const slideId = entry.target.id;
                const index = parseInt(slideId.replace('reveal', ''));
                
                // Update global current slide
                currentSlideIndex = index;
                
                document.querySelectorAll('.slide-nav-link').forEach(link => {
                    link.classList.remove('active');
                    link.style.background = '#fff';
                    link.style.borderColor = 'transparent';
                });

                const activeLink = document.querySelector(`.slide-nav-link[data-slide-index="${index}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                    activeLink.style.background = '#ddf4ff';
                    activeLink.style.borderColor = '#0969da';
                }
            }
        });
    }, observerOptions);

    // Observe all reveal elements
    for (let i = 1; i <= 6; i++) {
        const element = document.getElementById(`reveal${i}`);
        if (element) {
            observer.observe(element);
        }
    }
}

// Create the Article View container
function createArticleView() {
    const articleView = document.createElement('div');
    articleView.id = 'article-view';
    articleView.style.cssText = 'display: flex;';
    
    // Create scrollable wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'article-view-wrapper';
    
    // Create header with page metadata
    const header = document.createElement('div');
    header.id = 'article-view-header';
    
    // Get page title, description, and updated date from meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || 'JohnBaluka.com';
    const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const ogUpdated = document.querySelector('meta[property="og:updated"]')?.getAttribute('content') || '1/18/2026';
    const ogIcon = document.querySelector('meta[property="og:icon"]')?.getAttribute('content') || 'fa-file-powerpoint';
    const ogVersion = document.querySelector('meta[property="og:version"]')?.getAttribute('content') || '';
    
    // Calculate total time from last note line with data-end-video attribute
    let totalTimeMinutes = 6; // Default fallback
    const allNoteLines = document.querySelectorAll('[data-end-video]');
    if (allNoteLines.length > 0) {
        // Get the last note line by finding the one with the highest data-end-video value
        let maxEndTime = 0;
        allNoteLines.forEach(line => {
            const endTime = parseFloat(line.getAttribute('data-end-video'));
            if (endTime > maxEndTime) {
                maxEndTime = endTime;
            }
        });
        totalTimeMinutes = Math.round(maxEndTime / 60);
    }
    
    header.innerHTML = `
        <div class="article-header-left">
            <h1 class="article-title"><i class="fa ${ogIcon}" style="margin-right: 12px; color: #0969da;"></i>${ogTitle}</h1>
            <p class="article-description">${ogDescription}</p>
        </div>
        <div class="article-header-right">
            <div class="article-date" title="${ogVersion ? 'Version ' + ogVersion : ''}">Updated: ${ogUpdated}</div>
            <div class="article-time">${totalTimeMinutes} minutes</div>
        </div>
    `;
    
    wrapper.appendChild(header);
    
    // Move existing content into wrapper
    const existingContent = [];
    for (let i = 1; i <= 6; i++) {
        const revealEl = document.getElementById(`reveal${i}`);
        const notesEl = document.getElementById(`slide${i}Notes`);
        if (revealEl) existingContent.push(revealEl);
        if (notesEl) {
            existingContent.push(notesEl);
            // Add HR after notes
            const hr = document.createElement('hr');
            hr.style.cssText = 'margin: 0px 0; border: none; border-top: 1px solid #d0d7de;';
            existingContent.push(hr);
        }
    }
    
    existingContent.forEach(el => {
        wrapper.appendChild(el);
    });
    
    articleView.appendChild(wrapper);
    
    // Insert after toolbar
    const toolbar = document.getElementById('top-toolbar');
    if (toolbar && toolbar.nextSibling) {
        document.body.insertBefore(articleView, toolbar.nextSibling);
    } else {
        document.body.appendChild(articleView);
    }
}

// Create the Presentation View container
function createPresentationView() {
    const presentationView = document.createElement('div');
    presentationView.id = 'presentation-view';
    presentationView.style.cssText = 'display: none;';
    
    // Create scrollable wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'presentation-view-wrapper';
    
    // Create the reveal player container (similar to video player container)
    const playerContainer = document.createElement('div');
    playerContainer.id = 'presentation-player-container';
    playerContainer.style.cssText = `
        width: 100%;
        margin: 0 0 30px 0;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    // Create the main reveal container - matching slides.htm structure
    const revealContainer = document.createElement('div');
    revealContainer.className = 'reveal';
    revealContainer.id = 'presentation-reveal';
    revealContainer.style.cssText = 'width: 100%; aspect-ratio: 1280 / 800;';
    
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'slides';
    
    // Create all slides with speaker notes inside (like slides.htm)
    // Slides must be in order for audio plugin: slide index 0-5 = audio files 0.0.mp3 - 5.0.mp3
    slideData.sort((a, b) => a.index - b.index).forEach((slide, slideIndex) => {
        const section = document.createElement('section');
        section.id = `slide${slide.index}`; // Use same ID pattern as slides.htm
        section.setAttribute('data-transition', 'fade');
        section.setAttribute('data-menu-title', slide.menuTitle);
        section.setAttribute('data-audio-src', `audio/${slideIndex}.0.mp3`); // Explicit audio file mapping
        
        // Create SVG element
        const svg = document.createElement('svg');
        svg.className = 'r-stretch';
        svg.setAttribute('data-src', slide.svgSrc);
        svg.setAttribute('data-cache', 'disabled');
        svg.setAttribute('data-js', 'enabled');
        svg.setAttribute('data-unique-ids', 'enabled');
        section.appendChild(svg);
        
        slidesContainer.appendChild(section);
    });
    
    revealContainer.appendChild(slidesContainer);
    playerContainer.appendChild(revealContainer);
    
    wrapper.appendChild(playerContainer);
    presentationView.appendChild(wrapper);
    document.body.appendChild(presentationView);
}

// Helper function to make SVG IDs unique to avoid conflicts
function makeUniqueIds(svgElement, prefix) {
    const idMap = new Map();
    
    // Find all elements with id attributes and create unique IDs
    svgElement.querySelectorAll('[id]').forEach(el => {
        const oldId = el.getAttribute('id');
        const newId = `${prefix}-${oldId}`;
        idMap.set(oldId, newId);
        el.setAttribute('id', newId);
    });
    
    // Update all references to the old IDs
    if (idMap.size > 0) {
        console.log(`[makeUniqueIds] Updated ${idMap.size} IDs with prefix ${prefix}`);
        
        // Update url() references in styles and attributes
        svgElement.querySelectorAll('*').forEach(el => {
            // Check style attribute
            const style = el.getAttribute('style');
            if (style) {
                let newStyle = style;
                idMap.forEach((newId, oldId) => {
                    const urlPattern = new RegExp(`url\\(#${oldId}\\)`, 'g');
                    newStyle = newStyle.replace(urlPattern, `url(#${newId})`);
                });
                if (newStyle !== style) {
                    el.setAttribute('style', newStyle);
                }
            }
            
            // Check other attributes that might contain url() references
            ['fill', 'stroke', 'clip-path', 'mask', 'marker-start', 'marker-mid', 'marker-end', 'filter'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value && value.includes('url(')) {
                    let newValue = value;
                    idMap.forEach((newId, oldId) => {
                        const urlPattern = new RegExp(`url\\(#${oldId}\\)`, 'g');
                        newValue = newValue.replace(urlPattern, `url(#${newId})`);
                    });
                    if (newValue !== value) {
                        el.setAttribute(attr, newValue);
                    }
                }
            });
            
            // Check href and xlink:href attributes
            ['href', 'xlink:href'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value && value.startsWith('#')) {
                    const oldId = value.substring(1);
                    if (idMap.has(oldId)) {
                        el.setAttribute(attr, `#${idMap.get(oldId)}`);
                    }
                }
            });
        });
    }
}

// Initialize the presentation view reveal instance
function initializePresentationView() {
    return new Promise((resolve, reject) => {
        const element = document.getElementById('presentation-reveal');
        if (!element) {
            reject('Presentation reveal element not found');
            return;
        }
    
    // Clone SVGs from Article View instead of loading from files
    const svgElements = element.querySelectorAll('svg[data-src]');
    console.log('[Presentation View] Found SVG placeholders:', svgElements.length);
    
    svgElements.forEach((svgPlaceholder, index) => {
        const slideIndex = index + 1;
        const slidePrefix = `pres-slide${slideIndex}`;
        
        // Find the corresponding article view SVG that's already loaded
        const articleReveal = document.getElementById(`reveal${slideIndex}`);
        if (!articleReveal) {
            console.error('[Presentation View] Article view slide not found:', slideIndex);
            return;
        }
        
        const articleSvg = articleReveal.querySelector('svg');
        if (!articleSvg) {
            console.error('[Presentation View] Article view SVG not found for slide:', slideIndex);
            return;
        }
        
        console.log('[Presentation View] Cloning SVG from article view for slide:', slideIndex);
        
        // Clone the SVG from article view
        const svgElement = articleSvg.cloneNode(true);
        
        // Remove custom viewBox attribute to use default
        svgElement.removeAttribute('viewBox');
        
        // Make IDs unique to avoid conflicts with Article View SVGs
        makeUniqueIds(svgElement, slidePrefix);
        
        console.log('[Presentation View] Cloned SVG has', svgElement.children.length, 'child elements');
        
        // Replace placeholder with cloned SVG
        svgPlaceholder.parentNode.replaceChild(svgElement, svgPlaceholder);
    });
    
    // Load plugins and initialize Reveal
    loadRevealPlugins().then(() => {
        const plugins = [
            RevealZoom,
            RevealNotes,
            RevealSearch,
            RevealHighlight
        ];
        
        window.presentationReveal = new Reveal(element, {
            width: 1280,
            height: 800,
            controls: false,  // Disable built-in controls - using custom toolbar
            progress: true,
            hash: false,
            showNotes: false,
            slideNumber: false,  // Disabled - using custom toolbar
            mouseWheel: true,
            keyboard: true,
            
            plugins: plugins
        });
        
        window.presentationReveal.initialize().then(() => {
            console.log('[Presentation View] Reveal initialized');
            window.presentationRevealInitialized = true;
            
            // Create custom toolbar
            console.log('[Presentation View] Creating toolbar');
            createPresentationToolbar();
            
            // SVG files already have fragment-off classes by default, no need to disable
            console.log('[Presentation View] Fragments start disabled (fragment-off in SVG files)');
            
            // Don't highlight first slide here - let syncViewToCurrentSlide handle it
            // This preserves the sidebar highlight from the previous view
            
            // Update nav and notes on slide change
            window.presentationReveal.on('slidechanged', (event) => {
                const slideIndex = event.indexh + 1;
                
                // Update global current slide
                currentSlideIndex = slideIndex;
                
                // Highlight current slide notes
                highlightPresentationNotes(slideIndex);
                
                // Update nav
                document.querySelectorAll('.slide-nav-link').forEach(link => {
                    const idx = parseInt(link.getAttribute('data-slide-index'));
                    if (idx === slideIndex) {
                        link.classList.add('active');
                        link.style.background = '#ddf4ff';
                        link.style.borderColor = '#0969da';
                    } else {
                        link.classList.remove('active');
                        link.style.background = '#fff';
                        link.style.borderColor = 'transparent';
                    }
                });
            });
            
            // Resolve the promise when initialization is complete
            resolve();
        });
    });
    });
}

// Create custom toolbar for Presentation View
function createPresentationToolbar() {
    const playerContainer = document.getElementById('presentation-player-container');
    if (!playerContainer) return;
    
    const toolbar = document.createElement('div');
    toolbar.id = 'presentation-toolbar';
    toolbar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7));
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        z-index: 100;
        box-sizing: border-box;
        transition: opacity 0.3s ease;
    `;
    
    // Left section - Audio player only
    const leftSection = document.createElement('div');
    leftSection.style.cssText = 'display: flex; align-items: center; gap: 12px; flex: 1; max-width: 400px;';
    
    const audioElement = document.createElement('audio');
    audioElement.id = 'pres-audio-player';
    audioElement.style.cssText = 'flex: 1; height: 30px;';
    audioElement.controls = true;
    audioElement.preload = 'metadata';
    
    // Update audio source when slide changes
    const updateAudioSource = (slideIndex) => {
        audioElement.src = `audio/${slideIndex}.0.mp3`;
        audioElement.load();
    };
    
    // Initialize with first slide audio
    updateAudioSource(0);
    
    // Listen for audio events
    audioElement.addEventListener('play', () => {
        // Enable fragments when playing
        enableFragmentsPresentation();
        // Update bottom toolbar icon
        updateBottomToolbarPlayPauseIcon();
    });
    
    audioElement.addEventListener('pause', () => {
        // Update bottom toolbar icon
        updateBottomToolbarPlayPauseIcon();
    });
    
    // Update highlights when manually seeking/scrubbing audio
    audioElement.addEventListener('seeked', () => {
        const currentSlide = window.presentationReveal.getState().indexh + 1;
        const now = audioElement.currentTime;
        
        // Enable fragments when seeking
        enableFragmentsPresentation();
        
        // Find and highlight the correct sidebar line, and navigate to fragment
        const sidebarLines = document.querySelectorAll(`.sidebar-note-line[data-slide-index="${currentSlide}"]`);
        let foundLine = null;
        let foundFragmentIndex = -1;
        
        sidebarLines.forEach((line, idx) => {
            const start = parseFloat(line.getAttribute('data-start'));
            const end = parseFloat(line.getAttribute('data-end'));
            
            if (now >= start && now <= end) {
                foundLine = line;
                foundFragmentIndex = idx;
            }
        });
        
        // Clear all sidebar highlights
        document.querySelectorAll('.sidebar-note-line').forEach(sl => sl.classList.remove('currentLine'));
        
        // Highlight the found line
        if (foundLine) {
            foundLine.classList.add('currentLine');
        }
        
        // Expand and scroll to current slide in sidebar
        const slideBlock = document.querySelector(`.slide-nav-block[data-slide-index="${currentSlide}"]`);
        if (slideBlock) {
            const notesContent = slideBlock.querySelector('.slide-notes-content');
            const chevron = slideBlock.querySelector('.fa-chevron-down');
            if (notesContent && notesContent.style.display === 'none') {
                notesContent.style.display = 'block';
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }
            slideBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Navigate to the correct fragment
        if (foundFragmentIndex >= 0 && window.presentationReveal) {
            if (foundFragmentIndex === 0) {
                window.presentationReveal.navigateFragment(-1);
            } else {
                window.presentationReveal.navigateFragment(foundFragmentIndex - 1);
            }
        }
    });
    
    // Sync audio with sidebar navigation highlights
    audioElement.addEventListener('timeupdate', () => {
        const currentSlide = window.presentationReveal.getState().indexh + 1;
        const now = audioElement.currentTime;
        
        // Update bottom toolbar timestamp if in presentation view
        if (currentView === 'presentation') {
            const firstSidebarLine = document.querySelector(`.sidebar-note-line[data-slide-index="${currentSlide}"]`);
            if (firstSidebarLine) {
                const slideStartVideo = parseFloat(firstSidebarLine.getAttribute('data-start-video')) || 0;
                const absoluteTime = slideStartVideo + now;
                updateBottomToolbarTimestamp(absoluteTime);
            }
        }
        
        // Find and highlight the correct sidebar line, and navigate to fragment
        const sidebarLines = document.querySelectorAll(`.sidebar-note-line[data-slide-index="${currentSlide}"]`);
        let foundLine = null;
        let foundFragmentIndex = -1;
        
        sidebarLines.forEach((line, idx) => {
            const start = parseFloat(line.getAttribute('data-start'));
            const end = parseFloat(line.getAttribute('data-end'));
            
            if (now >= start && now <= end) {
                foundLine = line;
                foundFragmentIndex = idx;
            }
        });
        
        // Clear all sidebar highlights
        document.querySelectorAll('.sidebar-note-line').forEach(sl => sl.classList.remove('currentLine'));
        
        // Highlight the found line
        if (foundLine) {
            foundLine.classList.add('currentLine');
        }
        
        // Expand and scroll to current slide in sidebar
        const slideBlock = document.querySelector(`.slide-nav-block[data-slide-index="${currentSlide}"]`);
        if (slideBlock) {
            const notesContent = slideBlock.querySelector('.slide-notes-content');
            const chevron = slideBlock.querySelector('.fa-chevron-down');
            if (notesContent && notesContent.style.display === 'none') {
                notesContent.style.display = 'block';
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }
            slideBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Navigate to the correct fragment
        if (foundFragmentIndex >= 0 && window.presentationReveal) {
            if (foundFragmentIndex === 0) {
                window.presentationReveal.navigateFragment(-1);
            } else {
                window.presentationReveal.navigateFragment(foundFragmentIndex - 1);
            }
        }
    });
    
    // Auto-advance to next slide when audio ends
    audioElement.addEventListener('ended', () => {
        if (currentView === 'presentation') {
            const currentSlide = window.presentationReveal.getState().indexh;
            if (currentSlide < 5) { // 0-indexed, so 5 means slide 6 is the last
                window.presentationReveal.next();
                // Audio source will be updated by slidechanged event, then play
                setTimeout(() => {
                    audioElement.play();
                }, 300);
            }
        }
    });
    
    leftSection.appendChild(audioElement);
    
    // Right section - Controls (all right-justified)
    const rightSection = document.createElement('div');
    rightSection.style.cssText = 'display: flex; align-items: center; gap: 12px;';
    
    // Fragment controls
    const prevFragmentBtn = createToolbarButton('fa-step-backward', 'Previous Fragment', () => {
        window.presentationReveal.navigateFragment(-1);
    });
    
    const fragmentNumberDisplay = document.createElement('div');
    fragmentNumberDisplay.id = 'pres-fragment-number';
    fragmentNumberDisplay.style.cssText = `
        color: white;
        font-size: 14px;
        font-weight: 500;
        padding: 8px 12px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 6px;
        min-width: 60px;
        text-align: center;
    `;
    fragmentNumberDisplay.textContent = '0 / 0';
    
    const nextFragmentBtn = createToolbarButton('fa-step-forward', 'Next Fragment', () => {
        window.presentationReveal.navigateFragment(1);
    });
    
    let fragmentToggleIcon = null;
    
    const fragmentToggleBtn = createToolbarButton('fa-toggle-on', 'Toggle Animations', () => {
        if (!fragmentToggleIcon) {
            console.error('[Fragment Toggle Button] Icon element not found');
            return;
        }
        console.log('[Fragment Toggle Button] Clicked');
        toggleFragmentsPresentation();
        const fragmentsOff = document.querySelectorAll('#presentation-reveal .fragment-off');
        console.log('[Fragment Toggle Button] After toggle, fragments-off count:', fragmentsOff.length);
        if (fragmentsOff.length > 0) {
            console.log('[Fragment Toggle Button] Setting icon to toggle-on (blue)');
            fragmentToggleIcon.className = 'fa fa-toggle-on';
            fragmentToggleBtn.style.backgroundColor = '#007bff'; // Blue when fragments OFF
        } else {
            console.log('[Fragment Toggle Button] Setting icon to toggle-off (light blue)');
            fragmentToggleIcon.className = 'fa fa-toggle-off';
            fragmentToggleBtn.style.backgroundColor = '#87ceeb'; // Light blue when fragments ON
        }
    });
    fragmentToggleBtn.id = 'pres-fragment-toggle-btn';
    fragmentToggleBtn.style.backgroundColor = '#007bff'; // Initial state: fragments OFF (blue)
    fragmentToggleIcon = fragmentToggleBtn.querySelector('i');
    
    // Slide controls
    const prevSlideBtn = createToolbarButton('fa-chevron-left', 'Previous Slide', () => {
        window.presentationReveal.prev();
    });
    
    const slideNumberDisplay = document.createElement('div');
    slideNumberDisplay.id = 'pres-slide-number';
    slideNumberDisplay.style.cssText = `
        color: white;
        font-size: 14px;
        font-weight: 500;
        padding: 8px 12px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 6px;
        min-width: 60px;
        text-align: center;
    `;
    slideNumberDisplay.textContent = '1 / 6';
    
    const nextSlideBtn = createToolbarButton('fa-chevron-right', 'Next Slide', () => {
        window.presentationReveal.next();
    });
    
    // Add controls in order: prev fragment, fragment number, next fragment, fragment toggle, prev slide, slide number, next slide
    rightSection.appendChild(prevFragmentBtn);
    rightSection.appendChild(fragmentNumberDisplay);
    rightSection.appendChild(nextFragmentBtn);
    rightSection.appendChild(fragmentToggleBtn);
    rightSection.appendChild(prevSlideBtn);
    rightSection.appendChild(slideNumberDisplay);
    rightSection.appendChild(nextSlideBtn);
    
    toolbar.appendChild(leftSection);
    toolbar.appendChild(rightSection);
    
    playerContainer.style.position = 'relative';
    playerContainer.appendChild(toolbar);
    
    // Function to update fragment number display
    const updateFragmentNumber = () => {
        const state = window.presentationReveal.getState();
        const currentFragment = state.indexf >= 0 ? state.indexf + 1 : 1;
        
        // Get the current slide element
        const currentSlide = window.presentationReveal.getCurrentSlide();
        
        // Count unique fragment index values in the current slide
        let totalFragments = 0;
        if (currentSlide) {
            const fragmentElements = currentSlide.querySelectorAll('[data-fragment-index]');
            const uniqueIndexes = new Set();
            fragmentElements.forEach(el => {
                const index = el.getAttribute('data-fragment-index');
                if (index !== null) {
                    uniqueIndexes.add(index);
                }
            });
            totalFragments = uniqueIndexes.size;
        }
        
        fragmentNumberDisplay.textContent = `${currentFragment} / ${totalFragments}`;
    };
    
    // Update audio source and fragment count on slide change
    window.presentationReveal.on('slidechanged', (event) => {
        updateAudioSource(event.indexh);
        const slideNumber = event.indexh + 1;
        const totalSlides = window.presentationReveal.getTotalSlides();
        slideNumberDisplay.textContent = `${slideNumber} / ${totalSlides}`;
        updateFragmentNumber();
    });
    
    // Update fragment number on fragment change
    window.presentationReveal.on('fragmentshown', updateFragmentNumber);
    window.presentationReveal.on('fragmenthidden', updateFragmentNumber);
    
    // Initialize fragment number
    updateFragmentNumber();
    
    // Auto-hide toolbar on mouse leave with less dimming
    let hideTimeout;
    playerContainer.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
        toolbar.style.opacity = '1';
    });
    
    playerContainer.addEventListener('mouseleave', () => {
        hideTimeout = setTimeout(() => {
            toolbar.style.opacity = '0.6';
        }, 2000);
    });
}

// Helper function to create toolbar buttons
function createToolbarButton(iconClass, title, onClick) {
    const button = document.createElement('button');
    button.title = title;
    button.style.cssText = `
        background: rgba(135, 206, 235, 0.3);
        border: 1px solid rgba(135, 206, 235, 0.5);
        border-radius: 50%;
        color: #0969da;
        width: 36px;
        height: 36px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        font-size: 16px;
        padding: 0;
    `;
    
    const icon = document.createElement('i');
    icon.className = `fa ${iconClass}`;
    button.appendChild(icon);
    
    button.addEventListener('mouseover', () => {
        button.style.transform = 'scale(1.1)';
        button.style.background = 'rgba(135, 206, 235, 0.5)';
        button.style.color = '#0550ae';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.background = 'rgba(135, 206, 235, 0.3)';
        button.style.color = '#0969da';
    });
    
    button.addEventListener('click', onClick);
    
    return button;
}

// Highlight the current slide's notes in presentation view
function highlightPresentationNotes(slideIndex) {
    // Update global current slide
    currentSlideIndex = slideIndex;
    
    // Clear all line highlights in Article View only (sidebar is controlled by audio timeupdate)
    for (let i = 1; i <= 6; i++) {
        const articleNotesEl = document.getElementById(`slide${i}Notes`);
        if (articleNotesEl) {
            articleNotesEl.querySelectorAll('.line').forEach(line => {
                line.classList.remove('currentLine');
            });
        }
    }
    
    // Highlight first note of current slide in Article View only
    const articleNotesEl = document.getElementById(`slide${slideIndex}Notes`);
    if (articleNotesEl) {
        const articleLines = articleNotesEl.querySelectorAll('.line[data-type="narration"]');
        if (articleLines.length > 0) {
            articleLines[0].classList.add('currentLine');
        }
    }
    
    // Note: Sidebar line highlights are NOT updated here - they are controlled by audio timeupdate events
    
    // Expand and scroll to current slide in sidebar
    const slideBlock = document.querySelector(`.slide-nav-block[data-slide-index="${slideIndex}"]`);
    if (slideBlock) {
        const notesContent = slideBlock.querySelector('.slide-notes-content');
        const chevron = slideBlock.querySelector('.fa-chevron-down');
        if (notesContent && notesContent.style.display === 'none') {
            notesContent.style.display = 'block';
            if (chevron) chevron.style.transform = 'rotate(180deg)';
        }
        slideBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Create the Video View container
function createVideoView() {
    const videoView = document.createElement('div');
    videoView.id = 'video-view';
    videoView.style.cssText = 'display: none;';
    
    // Create scrollable wrapper
    const wrapper = document.createElement('div');
    wrapper.id = 'video-view-wrapper';
    
    // YouTube player container
    const playerContainer = document.createElement('div');
    playerContainer.id = 'video-player-container';
    playerContainer.style.cssText = `
        width: 100%;
        margin: 0 0 30px 0;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    const playerDiv = document.createElement('div');
    playerDiv.id = 'video-view-player';
    playerDiv.style.cssText = 'position: relative; width: 100%; aspect-ratio: 16/9;';
    playerContainer.appendChild(playerDiv);
    
    wrapper.appendChild(playerContainer);
    videoView.appendChild(wrapper);
    document.body.appendChild(videoView);
}

// Initialize video view YouTube player
function initializeVideoView() {
    console.log('[Video View] Initializing video view');
    if (window.videoViewInitialized) {
        console.log('[Video View] Already initialized');
        return;
    }
    
    const playerContainer = document.getElementById('video-view-player');
    if (!playerContainer) {
        console.error('[Video View] Player container not found - video view may not have been created');
        return;
    }
    
    if (!window.YT) {
        console.error('[Video View] YouTube API not loaded yet');
        return;
    }
    
    console.log('[Video View] Creating YouTube player');
    // Create player div
    const playerDiv = document.createElement('div');
    playerDiv.id = 'video-yt-player';
    playerContainer.innerHTML = '';
    playerContainer.appendChild(playerDiv);
    
    try {
        window.youtubePlayer = new YT.Player('video-yt-player', {
            videoId: '7JdOMlejfno',
            width: '100%',
            height: '100%',
            playerVars: {
                'playsinline': 1,
                'enablejsapi': 1,
                'origin': window.location.origin
            },
            events: {
                'onReady': (event) => {
                    console.log('[Video View] YouTube player ready');
                    window.youtubePlayerReady = true;
                    window.videoViewInitialized = true;
                    startVideoTimeTracking();
                    updateBottomToolbarPlayPauseIcon();
                },
                'onStateChange': (event) => {
                    if (event.data === YT.PlayerState.PLAYING) {
                        startVideoTimeTracking();
                    }
                    updateBottomToolbarPlayPauseIcon();
                },
                'onError': (event) => {
                    console.error('[Video View] YouTube player error:', event.data);
                }
            }
        });
    } catch (error) {
        console.error('[Video View] Error creating YouTube player:', error);
    }
}

// Load YouTube IFrame API
function loadYouTubeAPI() {
    if (document.getElementById('youtube-api-script')) return;
    
    const tag = document.createElement('script');
    tag.id = 'youtube-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Load RevealJS plugins for Presentation View
function loadRevealPlugins() {
    if (document.getElementById('reveal-plugins-loaded')) return Promise.resolve();
    
    const pluginScripts = [
        { id: 'reveal-audio-script', src: 'libs/revealjs/plugins/audio-slideshow/plugin.js' }
    ];
    
    const loadPromises = pluginScripts.map(plugin => {
        return new Promise((resolve, reject) => {
            if (document.getElementById(plugin.id)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.id = plugin.id;
            script.src = plugin.src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${plugin.src}`));
            document.head.appendChild(script);
        });
    });
    
    return Promise.all(loadPromises).then(() => {
        const marker = document.createElement('div');
        marker.id = 'reveal-plugins-loaded';
        marker.style.display = 'none';
        document.body.appendChild(marker);
    });
}

// Fragment toggle functions for Presentation View
function toggleFragmentsPresentation() {
    console.log('[Fragment Toggle] Starting toggle');
    const fragmentsOff = document.querySelectorAll('#presentation-reveal .fragment-off');
    console.log('[Fragment Toggle] Found fragments-off:', fragmentsOff.length);
    
    if (fragmentsOff.length > 0) {
        console.log('[Fragment Toggle] Enabling fragments');
        enableFragmentsPresentation();
    } else {
        console.log('[Fragment Toggle] Disabling fragments');
        disableFragmentsPresentation();
    }
}

function disableFragmentsPresentation() {
    console.log('[Disable Fragments] Starting');
    const fragments = document.querySelectorAll('#presentation-reveal .fragment');
    console.log('[Disable Fragments] Found fragments:', fragments.length);
    fragments.forEach(fragment => {
        fragment.classList.remove('fragment');
        fragment.classList.add('fragment-off');
    });
    console.log('[Disable Fragments] Complete');
}

function enableFragmentsPresentation() {
    console.log('[Enable Fragments] Starting');
    const fragments = document.querySelectorAll('#presentation-reveal .fragment-off');
    console.log('[Enable Fragments] Found fragments-off:', fragments.length);
    fragments.forEach(fragment => {
        fragment.classList.remove('fragment-off');
        fragment.classList.add('fragment');
    });
    console.log('[Enable Fragments] Complete');
}

// Make functions globally available for Presentation View
window.toggleFragmentsPresentation = toggleFragmentsPresentation;

window.onYouTubeIframeAPIReady = function() {
    console.log('[YouTube API] YouTube IFrame API loaded');
    // Initialize video player when API is ready
    if (currentView === 'video') {
        console.log('[YouTube API] Current view is video, initializing player');
        initializeVideoView();
    } else {
        console.log('[YouTube API] Current view is', currentView, '- not initializing player yet');
    }
};

let videoTimeTracker = null;

function startVideoTimeTracking() {
    if (videoTimeTracker) {
        clearInterval(videoTimeTracker);
    }
    
    videoTimeTracker = setInterval(() => {
        if (!window.youtubePlayer || !window.youtubePlayerReady) return;
        if (currentView !== 'video') return;
        
        try {
            const currentTime = window.youtubePlayer.getCurrentTime();
            updateVideoViewHighlights(currentTime);
        } catch (e) {}
    }, 100);
}

function updateVideoViewHighlights(currentTime) {
    // Update bottom toolbar timestamp
    updateBottomToolbarTimestamp(currentTime);
    
    const sidebarLines = document.querySelectorAll('.sidebar-note-line');
    let foundSlideIndex = null;
    let foundNoteId = null;
    let matchedLines = [];
    
    // Find current line in sidebar
    sidebarLines.forEach(line => {
        const startVideo = parseFloat(line.getAttribute('data-start-video'));
        const endVideo = parseFloat(line.getAttribute('data-end-video'));
        const slideIndex = parseInt(line.getAttribute('data-slide-index'));
        
        if (currentTime >= startVideo && currentTime <= endVideo) {
            matchedLines.push({
                slideIndex: slideIndex,
                startVideo: startVideo,
                endVideo: endVideo,
                text: line.textContent.substring(0, 30),
                element: line
            });
        }
    });
    
    // If multiple lines match (due to timestamp errors in HTML), pick the one with highest slide index
    // This assumes video progresses forward through slides
    if (matchedLines.length > 1) {
        console.warn('[Video Highlights] Multiple lines matched at time', currentTime, ':', matchedLines.map(m => `Slide ${m.slideIndex}`).join(', '));
        // Sort by slide index descending and take the highest
        matchedLines.sort((a, b) => b.slideIndex - a.slideIndex);
    }
    
    if (matchedLines.length > 0) {
        const bestMatch = matchedLines[0];
        foundSlideIndex = bestMatch.slideIndex;
        const section = bestMatch.element.getAttribute('data-section');
        foundNoteId = `slide${foundSlideIndex}Note${section}`;
        
        // Clear all highlights
        sidebarLines.forEach(line => line.classList.remove('currentLine'));
        
        // Highlight the best match
        bestMatch.element.classList.add('currentLine');
        
        console.log('[Video Highlights] currentTime:', currentTime, 'matched slide:', foundSlideIndex);
    } else {
        // Clear all highlights if no match
        sidebarLines.forEach(line => line.classList.remove('currentLine'));
    }
    
    // Also highlight in Article View
    if (foundSlideIndex !== null && foundNoteId !== null) {
        // Clear all article view line highlights
        for (let i = 1; i <= 6; i++) {
            const notesEl = document.getElementById(`slide${i}Notes`);
            if (notesEl) {
                notesEl.querySelectorAll('.line').forEach(line => {
                    line.classList.remove('currentLine');
                });
            }
        }
        
        // Highlight current line in Article View
        const articleLine = document.getElementById(foundNoteId);
        if (articleLine) {
            articleLine.classList.add('currentLine');
        }
    }
    
    if (foundSlideIndex !== null) {
        // Update global current slide
        currentSlideIndex = foundSlideIndex;
        
        // Update nav sidebar to show current slide
        document.querySelectorAll('.slide-nav-link').forEach(link => {
            const idx = parseInt(link.getAttribute('data-slide-index'));
            if (idx === foundSlideIndex) {
                link.classList.add('active');
                link.style.background = '#ddf4ff';
                link.style.borderColor = '#0969da';
            } else {
                link.classList.remove('active');
                link.style.background = '#fff';
                link.style.borderColor = 'transparent';
            }
        });
        
        // Expand current slide notes in sidebar
        const slideBlock = document.querySelector(`.slide-nav-block[data-slide-index="${foundSlideIndex}"]`);
        if (slideBlock) {
            const notesContent = slideBlock.querySelector('.slide-notes-content');
            const chevron = slideBlock.querySelector('.fa-chevron-down');
            if (notesContent && notesContent.style.display === 'none') {
                notesContent.style.display = 'block';
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }
            slideBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}

// Add responsive styles
function addResponsiveStyles() {
    const style = document.createElement('style');
    style.textContent = `
        *, *::before, *::after {
            box-sizing: border-box;
        }
        
        html {
            height: 100%;
            margin: 0;
            padding: 0;
        }
        
        body {
            height: 100%;
            margin: 0;
            padding: 0;
            transition: margin 0.3s ease;
            overflow: hidden;
        }
        
        /* Splitter bars */
        #site-nav-splitter:hover,
        #article-nav-splitter:hover {
            background: rgba(9, 105, 218, 0.6);
            box-shadow: 0 0 8px rgba(9, 105, 218, 0.8);
        }
        
        #site-nav-splitter:active,
        #article-nav-splitter:active {
            background: rgba(9, 105, 218, 0.8);
            box-shadow: 0 0 12px rgba(9, 105, 218, 1);
        }
        
        /* Top toolbar fixed at very top */
        #top-toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 50px;
            z-index: 1100;
        }
        
        /* Article view layout */
        #article-view {
            display: none;
            position: relative;
            height: calc(100vh - 100px);
            margin-top: 50px;
            overflow: hidden;
            flex-direction: column;
            z-index: 1;
            box-sizing: border-box;
        }
        
        #article-view-wrapper {
            height: 100%;
            overflow-y: auto;
            padding: 30px 20px 20px 20px;
            box-sizing: border-box;
        }
        
        /* Article view notes styling */
        #article-view-wrapper p {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 18px;
            line-height: 1.8;
            color: #1f2328;
            background: transparent;
        }
        
        #article-view-wrapper p .line {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 16px;
            line-height: 1.8;
            background: transparent;
        }
        
        #article-view-wrapper p .line.currentLine {
            background: #fff3cd;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        #article-view-wrapper p .line.mouseOverLine {
            background: #e8f4fd;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        /* Presentation view layout */
        #presentation-view {
            display: none;
            position: relative;
            height: calc(100vh - 100px);
            margin-top: 50px;
            overflow: hidden;
            flex-direction: column;
            box-sizing: border-box;
        }
        
        #presentation-player-container {
            position: sticky;
            top: 0;
            z-index: 10;
            background: #000;
            flex-shrink: 0;
            margin-bottom: 30px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        #presentation-view-wrapper {
            height: 100%;
            overflow-y: auto;
            padding: 20px;
            box-sizing: border-box;
        }
        
        /* Video view layout */
        #video-view {
            display: none;
            position: relative;
            height: calc(100vh - 100px);
            margin-top: 50px;
            overflow: hidden;
            flex-direction: column;
            box-sizing: border-box;
        }
        
        #video-player-container {
            position: sticky;
            top: 0;
            z-index: 10;
            background: #000;
            flex-shrink: 0;
            margin-bottom: 30px;
        }
        
        #video-view-wrapper {
            height: 100%;
            overflow-y: auto;
            padding: 20px;
            box-sizing: border-box;
        }
        
        .reveal {
            width: 100%;
            max-width: 100%;
            height: auto !important;
            aspect-ratio: 1280 / 800;
        }
        
        /* Article view header */
        #article-view-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 0 0 24px 0;
            border-bottom: 1px solid #d0d7de;
        }
        
        .article-header-left {
            flex: 1;
            padding-right: 24px;
        }
        
        .article-title {
            margin: 0 0 8px 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 28px;
            font-weight: 600;
            line-height: 1.3;
            color: #1f2328;
        }
        
        .article-description {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: #656d76;
        }
        
        .article-header-right {
            text-align: right;
            flex-shrink: 0;
        }
        
        .article-date {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            color: #656d76;
            margin-bottom: 4px;
        }
        
        .article-time {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 14px;
            color: #656d76;
        }
        
        /* Article view reveal slides should fill width by default */
        #article-view .reveal {
            width: 100%;
            max-width: 100%;
            margin-top: 0 !important;
            border: 2px solid transparent;
            transition: all 0.3s ease;
        }
        
        #article-view .reveal:hover {
            border-color: #0969da;
            transform: translateY(-2px);
        }
        
        #article-view .reveal .slides {
            margin: 0 auto !important;
        }
        
        #article-view .reveal .slides section {
            margin-top: 0 !important;
            top: 0 !important;
        }
        
        /* Presentation view styles - similar to video view */
        #presentation-view .reveal {
            height: auto !important;
            aspect-ratio: 1280 / 800;
        }
        
        #presentation-reveal {
            border-radius: 8px;
        }
        
        /* YouTube player responsive */
        #video-view-player {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
        }
        
        #video-view-player iframe,
        #video-yt-player {
            position: absolute;
            top: 0;
            left: 0;
            width: 100% !important;
            height: 100% !important;
        }
        
        .presentation-note-block,
        .video-note-block {
            transition: all 0.2s ease;
        }
        
        .slide-notes {
            padding: 15px;
            font-size: 16px;
            line-height: 1.8;
            font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;
        }
        
        .slide-audio-container {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            transform: none !important;
            width: 100% !important;
            margin-top: 10px;
            padding: 0 10px;
            box-sizing: border-box;
        }
        
        .slide-wrapper {
            display: flex;
            flex-direction: column;
            margin-bottom: 30px;
            padding: 10px;
        }
        
        #slide1Notes, #slide2Notes, #slide3Notes, #slide4Notes, #slide5Notes, #slide6Notes {
            padding: 15px;
            background: rgba(0,0,0,0.05);
            border-radius: 4px;
            margin-top: 10px;
            font-size: clamp(12px, 1.5vw, 16px);
            line-height: 1.8;
        }
        
        .currentLine {
            background: #fff3cd;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        .mouseOverLine {
            background: #e8f4fd;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        /* SVG hyperlink hover effect */
        svg a:hover > *,
        svg a:hover {
            outline: 3px solid orange;
            outline-offset: 2px;
            cursor: pointer;
        }
        
        svg a > * {
            transition: outline 0.2s ease;
        }
        
        /* View toggle button text hide on small screens */
        @media (max-width: 900px) {
            .view-toggle-btn .btn-text {
                display: none;
            }
            .view-toggle-btn {
                padding: 8px 12px !important;
            }
        }
        
        @media (max-width: 1400px) {
            #slide-nav-sidebar {
                width: 280px !important;
            }
        }
        
        @media (max-width: 1100px) {
            #site-nav-sidebar {
                width: 220px !important;
            }
            #slide-nav-sidebar {
                width: 240px !important;
            }
        }
        
        @media (max-width: 900px) {
            /* Mobile: Sidebars overlay content instead of pushing it */
            #slide-nav-sidebar {
                position: fixed !important;
                z-index: 2000 !important;
                transform: translateX(100%) !important;
                box-shadow: -4px 0 12px rgba(0,0,0,0.3) !important;
            }
            
            #slide-nav-sidebar.mobile-open {
                transform: translateX(0) !important;
            }
            
            body {
                margin-right: 0 !important;
            }
            
            /* Mobile: Top/Bottom toolbar always full width */
            #top-toolbar,
            #bottom-toolbar {
                left: 0 !important;
                right: 0 !important;
            }
        }
        
        @media (max-width: 768px) {
            /* Mobile: Sidebars overlay content instead of pushing it */
            #site-nav-sidebar {
                position: fixed !important;
                z-index: 2000 !important;
                transform: translateX(-100%) !important;
                box-shadow: 4px 0 12px rgba(0,0,0,0.3) !important;
            }
            
            #site-nav-sidebar.mobile-open {
                transform: translateX(0) !important;
            }
            
            #slide-nav-sidebar {
                position: fixed !important;
                z-index: 2000 !important;
                transform: translateX(100%) !important;
                box-shadow: -4px 0 12px rgba(0,0,0,0.3) !important;
            }
            
            #slide-nav-sidebar.mobile-open {
                transform: translateX(0) !important;
            }
            
            body {
                margin-left: 0 !important;
                margin-right: 0 !important;
            }
            
            /* Mobile: Top toolbar adjustments */
            #top-toolbar {
                height: auto;
                min-height: 50px;
                padding: 8px !important;
                left: 0 !important;
                right: 0 !important;
            }
            
            /* Mobile: Bottom toolbar always full width */
            #bottom-toolbar {
                left: 0 !important;
                right: 0 !important;
            }
            
            #top-toolbar .toolbar-left,
            #top-toolbar .toolbar-center,
            #top-toolbar .toolbar-right {
                flex-wrap: wrap;
                gap: 8px !important;
            }
            
            /* Mobile: Hide page links on toolbar to save space */
            #toolbar-prev-page,
            #toolbar-next-page {
                display: none !important;
            }
            
            /* Mobile: Adjust article view */
            #article-view {
                margin-top: 50px;
                height: calc(100vh - 100px);
            }
            
            #article-view-wrapper {
                padding: 15px 10px;
            }
            
            /* Mobile: Article header responsive */
            #article-view-header {
                flex-direction: column;
                padding: 0 0 16px 0;
            }
            
            .article-header-left {
                padding-right: 0;
                margin-bottom: 12px;
            }
            
            .article-title {
                font-size: 22px !important;
            }
            
            .article-description {
                font-size: 14px !important;
            }
            
            .article-header-right {
                width: 100%;
            }
            
            /* Mobile: Slide sizing */
            .reveal {
                width: 100% !important;
                max-width: 100% !important;
            }
            
            .slide-title-bar {
                font-size: 14px !important;
                padding: 10px 8px !important;
            }
            
            .slide-title-bar span {
                font-size: 16px !important;
            }
            
            /* Mobile: Notes text */
            #article-view-wrapper p {
                font-size: 16px !important;
                line-height: 1.6 !important;
            }
            
            #article-view-wrapper p .line {
                font-size: 15px !important;
                line-height: 1.6 !important;
            }
            
            /* Mobile: Bottom toolbar */
            #bottom-toolbar {
                height: auto;
                min-height: 50px;
                padding: 8px !important;
            }
            
            #bottom-toolbar .toolbar-left,
            #bottom-toolbar .toolbar-center,
            #bottom-toolbar .toolbar-right {
                flex-wrap: wrap;
            }
            
            /* Mobile: Timestamp display */
            #timestamp-display {
                font-size: 13px !important;
            }
            
            /* Mobile: Progress bar - make it taller for easier touch */
            #progress-bar-container {
                height: 8px !important;
            }
            
            #progress-bar-container:hover {
                height: 12px !important;
            }
            
            #progress-handle {
                width: 16px !important;
                height: 16px !important;
            }
            
            /* Mobile: Thumbnail preview smaller */
            #thumbnail-preview {
                width: 160px !important;
                height: 90px !important;
            }
            
            /* Mobile: Touch-friendly buttons */
            button, .toolbar-button, .view-toggle-btn {
                min-height: 44px !important;
                min-width: 44px !important;
                padding: 10px 14px !important;
                font-size: 14px !important;
            }
            
            /* Mobile: Article slide toolbar */
            .article-slide-toolbar {
                height: 50px !important;
                padding: 0 8px !important;
            }
            
            /* Mobile: Fragment controls - make touch friendly */
            .article-slide-toolbar button {
                min-width: 40px !important;
                min-height: 40px !important;
                padding: 8px !important;
            }
            
            /* Mobile: Audio player controls */
            .slide-audio-container {
                padding: 0 5px !important;
            }
            
            /* Mobile: Hide splitter bars */
            #site-nav-splitter,
            #article-nav-splitter {
                display: none !important;
            }
            
            /* Mobile: View toggles remain visible but smaller */
            .view-toggle-btn i {
                font-size: 16px !important;
            }
        }
        
        /* Extra small phones */
        @media (max-width: 480px) {
            #top-toolbar,
            #bottom-toolbar {
                font-size: 12px;
            }
            
            .article-title {
                font-size: 18px !important;
            }
            
            #article-view-wrapper p {
                font-size: 14px !important;
            }
            
            #article-view-wrapper p .line {
                font-size: 14px !important;
            }
            
            /* Extra small: Even smaller buttons */
            button, .toolbar-button {
                padding: 8px 10px !important;
                font-size: 12px !important;
            }
            
            /* Extra small: Hide timestamp in bottom toolbar center */
            #timestamp-display {
                display: none !important;
            }
        }
        
        /* Touch device optimizations */
        @media (hover: none) and (pointer: coarse) {
            /* All interactive elements should be at least 44x44px */
            button, a, .toolbar-button, .view-toggle-btn,
            .article-slide-toolbar button, 
            input[type="range"] {
                min-height: 44px;
                min-width: 44px;
            }
            
            /* Remove hover effects on touch devices */
            .reveal:hover,
            button:hover,
            .toolbar-button:hover {
                transform: none !important;
            }
            
            /* Make progress bar always visible and larger on touch */
            #progress-bar-container {
                height: 10px !important;
            }
            
            #progress-handle {
                width: 20px !important;
                height: 20px !important;
                opacity: 1 !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Create title bar above each slide
function createSlideTitleBar(slideIndex, element) {
    const section = element.querySelector('section');
    const menuTitle = section?.getAttribute('data-menu-title') || `Slide ${slideIndex}`;
    
    // Read initial settings from section data attributes (case-insensitive, with defaults)
    const dataSize = (section?.getAttribute('data-slide-size') || 'large').toLowerCase();
    const dataPosition = (section?.getAttribute('data-slide-position') || 'center').toLowerCase();
    const dataTextSize = (section?.getAttribute('data-text-size') || 'medium').toLowerCase();
    
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    console.log(`Slide ${slideIndex} - Mobile: ${isMobile} (width: ${window.innerWidth}px, forcing slide size to 'large', notes size to 'large')`);
    
    // Validate and set defaults
    const validSizes = ['hide', 'show', 'small', 'medium', 'large'];
    const validPositions = ['left', 'center', 'right'];
    const validTextSizes = ['hide', 'show', 'small', 'medium', 'large'];
    
    // On mobile, force both slide size and notes size to 'large'
    const initialSize = isMobile ? 'large' : (validSizes.includes(dataSize) ? dataSize : 'large');
    const initialPosition = validPositions.includes(dataPosition) ? dataPosition : 'center';
    const initialNotesSize = isMobile ? 'large' : (validTextSizes.includes(dataTextSize) ? dataTextSize : 'medium');

    // Create a wrapper for this slide (title bar + reveal element)
    const slideWrapper = document.createElement('div');
    slideWrapper.className = `slide-wrapper slide-${slideIndex}-wrapper`;
    slideWrapper.style.cssText = `
        width: 100%;
        margin: 0 auto 0px auto;
        transition: width 0.3s ease;
    `;

    // Find the notes element for this slide
    const notesElement = document.getElementById(`slide${slideIndex}Notes`);

    // Insert wrapper before element
    element.parentNode.insertBefore(slideWrapper, element);
    
    const titleBar = document.createElement('div');
    titleBar.className = `slide-title-bar slide-${slideIndex}-title`;
    titleBar.style.cssText = `
        background: white;
        color: black;
        padding: 12px 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        font-size: 16px;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-radius: 8px 8px 0 0;
        margin-top: 0px;
        margin-bottom: 0;
    `;

    const titleText = document.createElement('span');
    titleText.style.cssText = 'font-weight: 600; font-size: 20px; color: #0969da;';
    //titleText.innerHTML = `<i class="fa fa-image" style="margin-right: 10px; opacity: 0.7;"></i>${slideIndex}. ${menuTitle}`;
    titleText.innerHTML = `${menuTitle}`;

    // Create a container for both toggle pills
    const togglesContainer = document.createElement('div');
    togglesContainer.style.cssText = 'display: none; align-items: center; gap: 12px;';

    // Create position toggle pill (only Left, Center, Right - hidden by default)
    const positionPill = document.createElement('div');
    positionPill.className = `slide-position-toggle-pill slide-${slideIndex}-position-pill`;
    positionPill.title = 'Change Slide Position';
    positionPill.style.cssText = `
        position: relative;
        display: none;
        background: rgba(135, 206, 235, 0.3);
        padding: 4px;
        border-radius: 20px;
        border: 1px solid rgba(135, 206, 235, 0.5);
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
    `;

    const positionOptions = [
        { id: 'left', text: 'Left' },
        { id: 'center', text: 'Center' },
        { id: 'right', text: 'Right' }
    ];

    // Create sliding background for position
    const positionSlider = document.createElement('div');
    positionSlider.className = `position-toggle-slider slide-${slideIndex}-position-slider`;
    positionSlider.style.cssText = `
        position: absolute;
        top: 4px;
        height: calc(100% - 8px);
        background: linear-gradient(135deg, #0969da 0%, #0550ae 100%);
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 8px rgba(9, 105, 218, 0.4);
        z-index: 1;
    `;
    positionPill.appendChild(positionSlider);

    // Function to update notes position based on size and position
    const updateNotesPosition = () => {
        if (!notesElement) return;
        
        // Get current size from size pill
        const activeSizeBtn = sizePill.querySelector('.size-toggle-btn[style*="color: rgb(255, 255, 255)"]') ||
                             sizePill.querySelector('.size-toggle-btn[style*="color:#ffffff"]') ||
                             sizePill.querySelector('.size-toggle-btn[style*="color: white"]');
        const currentSize = activeSizeBtn ? activeSizeBtn.getAttribute('data-size') : 'large';
        
        // Get current position from position pill (only if visible)
        let currentPosition = 'center';
        if (positionPill.style.display === 'inline-flex') {
            const activePositionBtn = positionPill.querySelector('.position-toggle-btn[style*="color: rgb(255, 255, 255)"]') ||
                                      positionPill.querySelector('.position-toggle-btn[style*="color:#ffffff"]') ||
                                      positionPill.querySelector('.position-toggle-btn[style*="color: white"]');
            currentPosition = activePositionBtn ? activePositionBtn.getAttribute('data-position') : 'center';
        }
        
        const contentContainer = slideWrapper.querySelector('.slide-content-container');
        if (!contentContainer) return;
        
        // Get the current width from element
        const currentWidth = element.style.width || '100%';
        
        // Determine layout
        // Hide/Show/Large → Notes below
        // Small/Medium + Left → Notes right
        // Small/Medium + Right → Notes left
        // Small/Medium + Center → Notes below
        
        if (currentSize === 'hide' || currentSize === 'show' || currentSize === 'large') {
            // Notes below - single column layout
            contentContainer.style.gridTemplateColumns = '100%';
            contentContainer.style.gridTemplateRows = 'auto auto';
            element.style.gridColumn = '1';
            element.style.gridRow = '1';
            element.style.width = currentWidth;
            element.style.position = 'relative';
            notesElement.style.gridColumn = '1';
            notesElement.style.gridRow = '2';
            notesElement.style.width = '100%';
            notesElement.style.maxWidth = '100%';
            notesElement.style.position = 'relative';
        } else if (currentSize === 'small' || currentSize === 'medium') {
            if (currentPosition === 'left') {
                // Notes to the right - two column layout: element | notes
                contentContainer.style.gridTemplateColumns = `${currentWidth} 1fr`;
                contentContainer.style.gridTemplateRows = 'auto';
                element.style.gridColumn = '1';
                element.style.gridRow = '1';
                element.style.width = '100%';
                element.style.position = 'relative';
                notesElement.style.gridColumn = '2';
                notesElement.style.gridRow = '1';
                notesElement.style.width = '100%';
                notesElement.style.maxWidth = 'none';
                notesElement.style.position = 'relative';
            } else if (currentPosition === 'right') {
                // Notes to the left - two column layout: notes | element
                contentContainer.style.gridTemplateColumns = `1fr ${currentWidth}`;
                contentContainer.style.gridTemplateRows = 'auto';
                element.style.gridColumn = '2';
                element.style.gridRow = '1';
                element.style.width = '100%';
                element.style.position = 'relative';
                notesElement.style.gridColumn = '1';
                notesElement.style.gridRow = '1';
                notesElement.style.width = '100%';
                notesElement.style.maxWidth = 'none';
                notesElement.style.position = 'relative';
            } else if (currentPosition === 'center') {
                // Notes below - single column layout
                contentContainer.style.gridTemplateColumns = '100%';
                contentContainer.style.gridTemplateRows = 'auto auto';
                element.style.gridColumn = '1';
                element.style.gridRow = '1';
                element.style.width = currentWidth;
                element.style.position = 'relative';
                notesElement.style.gridColumn = '1';
                notesElement.style.gridRow = '2';
                notesElement.style.width = '100%';
                notesElement.style.maxWidth = '100%';
                notesElement.style.position = 'relative';
            }
        }
    };
    
    // Function to update slide position (for Left/Center/Right from position pill)
    const updateSlidePosition = (position) => {
        element.style.display = 'block';
        
        // Get current size to maintain width
        const activeSizeBtn = sizePill.querySelector('.size-toggle-btn[style*="color: rgb(255, 255, 255)"]') ||
                             sizePill.querySelector('.size-toggle-btn[style*="color:#ffffff"]') ||
                             sizePill.querySelector('.size-toggle-btn[style*="color: white"]');
        const currentSize = activeSizeBtn ? activeSizeBtn.getAttribute('data-size') : 'large';
        const sizeData = sizeOptions.find(s => s.id === currentSize);
        
        // Set width based on current size
        if (sizeData && sizeData.width) {
            element.style.width = sizeData.width;
        }
        
        if (position === 'center') {
            element.style.marginLeft = 'auto';
            element.style.marginRight = 'auto';
        } else if (position === 'left') {
            element.style.marginLeft = '0';
            element.style.marginRight = 'auto';
        } else if (position === 'right') {
            element.style.marginLeft = 'auto';
            element.style.marginRight = '0';
        }
        
        // Update notes position
        updateNotesPosition();
        
        // Trigger Reveal.js layout update
        setTimeout(() => {
            const revealInstance = revealInstances.find(r => r.index === slideIndex)?.instance;
            if (revealInstance) {
                revealInstance.layout();
            }
        }, 350);
    };

    positionOptions.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = `position-toggle-btn slide-${slideIndex}-position-btn`;
        button.setAttribute('data-position', option.id);
        button.innerHTML = `<i class="fa fa-image" style="margin-right: 4px;"></i>${option.text}`;
        
        button.style.cssText = `
            position: relative;
            z-index: 2;
            background: transparent;
            border: none;
            color: ${option.id === initialPosition ? '#ffffff' : '#000000'};
            padding: 6px 14px;
            cursor: pointer;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
            transition: color 0.3s ease;
            white-space: nowrap;
            display: inline-block;
        `;

        button.addEventListener('click', () => {
            // Store the selected position
            previousPosition = option.id;
            
            // Update button styles
            positionPill.querySelectorAll('.position-toggle-btn').forEach(btn => {
                btn.style.color = '#000000';
            });
            button.style.color = '#ffffff';

            // Calculate slider position
            const buttonWidth = button.offsetWidth;
            const buttonLeft = button.offsetLeft;
            positionSlider.style.width = `${buttonWidth}px`;
            positionSlider.style.left = `${buttonLeft}px`;

            // Update slide position
            updateSlidePosition(option.id);
        });

        positionPill.appendChild(button);

        // Initialize slider position for initial position (default when position pill is shown)
        if (option.id === initialPosition) {
            setTimeout(() => {
                // Only position if the position pill is visible
                if (positionPill.style.display === 'inline-flex') {
                    const buttonWidth = button.offsetWidth;
                    const buttonLeft = button.offsetLeft;
                    positionSlider.style.width = `${buttonWidth}px`;
                    positionSlider.style.left = `${buttonLeft}px`;
                }
            }, 100);
        }
    });

    // Create size toggle pill
    const sizePill = document.createElement('div');
    sizePill.className = `slide-size-toggle-pill slide-${slideIndex}-size-pill`;
    sizePill.title = 'Change Slide Size';
    sizePill.style.cssText = `
        position: relative;
        display: inline-flex;
        background: rgba(135, 206, 235, 0.3);
        padding: 4px;
        border-radius: 20px;
        border: 1px solid rgba(135, 206, 235, 0.5);
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
    `;

    // Store previous state before hiding (initialized from data attributes)
    let previousSize = initialSize;
    let previousPosition = initialPosition;

    const sizeOptions = [
        { id: 'hide', text: 'Hide', width: '0%' },
        { id: 'show', text: 'Show', width: '100%' },
        { id: 'small', text: 'Small', width: '50%' },
        { id: 'medium', text: 'Medium', width: '75%' },
        { id: 'large', text: 'Large', width: '100%' }
    ];

    // Create sliding background
    const slider = document.createElement('div');
    slider.className = `size-toggle-slider slide-${slideIndex}-slider`;
    slider.style.cssText = `
        position: absolute;
        top: 4px;
        height: calc(100% - 8px);
        background: linear-gradient(135deg, #0969da 0%, #0550ae 100%);
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 8px rgba(9, 105, 218, 0.4);
        z-index: 1;
    `;
    sizePill.appendChild(slider);

    // Function to update slide width (only resize the reveal element)
    const updateSlideWidth = (width) => {
        element.style.width = width;
        
        // Get current position from position toggle if visible
        if (positionPill.style.display === 'inline-flex') {
            const activePositionBtn = positionPill.querySelector('.position-toggle-btn[style*="color: rgb(255, 255, 255)"]') ||
                                       positionPill.querySelector('.position-toggle-btn[style*="color:#ffffff"]') ||
                                       positionPill.querySelector('.position-toggle-btn[style*="color: white"]');
            const currentPosition = activePositionBtn ? activePositionBtn.getAttribute('data-position') : 'center';
            
            // Apply positioning based on current position toggle state
            if (currentPosition === 'left') {
                element.style.marginLeft = '0';
                element.style.marginRight = 'auto';
            } else if (currentPosition === 'center') {
                element.style.marginLeft = 'auto';
                element.style.marginRight = 'auto';
            } else if (currentPosition === 'right') {
                element.style.marginLeft = 'auto';
                element.style.marginRight = '0';
            }
        }
        
        element.style.transition = 'width 0.3s ease';
        
        // Update notes position
        updateNotesPosition();
        
        // Trigger Reveal.js layout update
        setTimeout(() => {
            const revealInstance = revealInstances.find(r => r.index === slideIndex)?.instance;
            if (revealInstance) {
                revealInstance.layout();
            }
        }, 350);
    };

    sizeOptions.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = `size-toggle-btn slide-${slideIndex}-size-btn`;
        button.setAttribute('data-size', option.id);
        button.innerHTML = `<i class="fa fa-image" style="margin-right: 4px;"></i>${option.text}`;
        
        // Initial visibility: Large is default, so Hide/Small/Medium/Large visible, Show hidden
        let initialDisplay = 'inline-block';
        if (option.id === 'show') {
            initialDisplay = 'none';
        }
        
        button.style.cssText = `
            position: relative;
            z-index: 2;
            background: transparent;
            border: none;
            color: ${option.id === initialSize ? '#ffffff' : '#000000'};
            padding: 6px 14px;
            cursor: pointer;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
            transition: color 0.3s ease;
            white-space: nowrap;
            display: ${initialDisplay};
        `;

        button.addEventListener('click', () => {
            // Update button styles
            sizePill.querySelectorAll('.size-toggle-btn').forEach(btn => {
                btn.style.color = '#000000';
            });
            button.style.color = '#ffffff';

            // Calculate slider position
            const buttonWidth = button.offsetWidth;
            const buttonLeft = button.offsetLeft;
            slider.style.width = `${buttonWidth}px`;
            slider.style.left = `${buttonLeft}px`;

            const hideBtn = sizePill.querySelector('[data-size="hide"]');
            const showBtn = sizePill.querySelector('[data-size="show"]');
            const smallBtn = sizePill.querySelector('[data-size="small"]');
            const mediumBtn = sizePill.querySelector('[data-size="medium"]');
            const largeBtn = sizePill.querySelector('[data-size="large"]');
            
            if (option.id === 'hide') {
                // Store current state before hiding
                const activeSizeBtn = sizePill.querySelector('.size-toggle-btn[style*="color: rgb(255, 255, 255)"]');
                if (activeSizeBtn && activeSizeBtn.getAttribute('data-size') !== 'hide') {
                    previousSize = activeSizeBtn.getAttribute('data-size');
                }
                
                const activePositionBtn = positionPill.querySelector('.position-toggle-btn[style*="color: rgb(255, 255, 255)"]');
                if (activePositionBtn) {
                    previousPosition = activePositionBtn.getAttribute('data-position');
                }
                
                // Hide selected: hide element, hide position pill, show only Hide/Show
                element.style.display = 'none';
                positionPill.style.display = 'none';
                if (showBtn) showBtn.style.display = 'inline-block';
                if (smallBtn) smallBtn.style.display = 'none';
                if (mediumBtn) mediumBtn.style.display = 'none';
                if (largeBtn) largeBtn.style.display = 'none';
                updateNotesPosition();
            } else if (option.id === 'show') {
                // Show selected: restore previous size and position
                // Hide Show button, show all size options
                if (showBtn) showBtn.style.display = 'none';
                if (hideBtn) hideBtn.style.display = 'inline-block';
                if (smallBtn) smallBtn.style.display = 'inline-block';
                if (mediumBtn) mediumBtn.style.display = 'inline-block';
                if (largeBtn) largeBtn.style.display = 'inline-block';
                
                // Restore previous size
                const previousSizeBtn = sizePill.querySelector(`[data-size="${previousSize}"]`);
                if (previousSizeBtn) {
                    // Reset all size button colors
                    sizePill.querySelectorAll('.size-toggle-btn').forEach(btn => {
                        btn.style.color = '#000000';
                    });
                    previousSizeBtn.style.color = '#ffffff';
                    
                    // Position size slider
                    setTimeout(() => {
                        const btnWidth = previousSizeBtn.offsetWidth;
                        const btnLeft = previousSizeBtn.offsetLeft;
                        slider.style.width = `${btnWidth}px`;
                        slider.style.left = `${btnLeft}px`;
                    }, 10);
                    
                    // Get the width for the previous size
                    const sizeData = sizeOptions.find(s => s.id === previousSize);
                    if (sizeData) {
                        element.style.display = 'block';
                        element.style.width = sizeData.width;
                        
                        // If previous size was Small/Medium, show position pill and restore position
                        if (previousSize === 'small' || previousSize === 'medium') {
                            positionPill.style.display = 'inline-flex';
                            
                            // Restore previous position
                            const previousPositionBtn = positionPill.querySelector(`[data-position="${previousPosition}"]`);
                            if (previousPositionBtn) {
                                positionPill.querySelectorAll('.position-toggle-btn').forEach(btn => {
                                    btn.style.color = '#000000';
                                });
                                previousPositionBtn.style.color = '#ffffff';
                                updateSlidePosition(previousPosition);
                                
                                setTimeout(() => {
                                    const btnWidth = previousPositionBtn.offsetWidth;
                                    const btnLeft = previousPositionBtn.offsetLeft;
                                    positionSlider.style.width = `${btnWidth}px`;
                                    positionSlider.style.left = `${btnLeft}px`;
                                }, 50);
                            }
                        } else {
                            // Large size: hide position pill, center element
                            positionPill.style.display = 'none';
                            element.style.marginLeft = 'auto';
                            element.style.marginRight = 'auto';
                        }
                        
                        updateSlideWidth(sizeData.width);
                    }
                }
            } else if (option.id === 'small' || option.id === 'medium') {
                // Store current state
                previousSize = option.id;
                
                // Small/Medium selected: show element, show position pill, hide Show, show all sizes
                element.style.display = 'block';
                positionPill.style.display = 'inline-flex';
                if (showBtn) showBtn.style.display = 'none';
                if (hideBtn) hideBtn.style.display = 'inline-block';
                if (smallBtn) smallBtn.style.display = 'inline-block';
                if (mediumBtn) mediumBtn.style.display = 'inline-block';
                if (largeBtn) largeBtn.style.display = 'inline-block';
                updateSlideWidth(option.width);
                
                // Ensure Center is active and slider is positioned
                const centerBtn = positionPill.querySelector('[data-position="center"]');
                const leftBtn = positionPill.querySelector('[data-position="left"]');
                const rightBtn = positionPill.querySelector('[data-position="right"]');
                
                // Check if we need to default to Center (no active position or coming from hidden state)
                const activeBtn = positionPill.querySelector('.position-toggle-btn[style*="color: rgb(255, 255, 255)"]') ||
                                  positionPill.querySelector('.position-toggle-btn[style*="color:#ffffff"]') ||
                                  positionPill.querySelector('.position-toggle-btn[style*="color: white"]');
                
                if (!activeBtn || activeBtn === centerBtn) {
                    // Reset all position button colors first
                    if (leftBtn) leftBtn.style.color = '#000000';
                    if (centerBtn) centerBtn.style.color = '#000000';
                    if (rightBtn) rightBtn.style.color = '#000000';
                    
                    // Activate Center
                    if (centerBtn) {
                        centerBtn.style.color = '#ffffff';
                        previousPosition = 'center';
                        updateSlidePosition('center');
                    }
                    
                    // Wait for position pill to be fully rendered before positioning slider
                    setTimeout(() => {
                        if (centerBtn) {
                            const btnWidth = centerBtn.offsetWidth;
                            const btnLeft = centerBtn.offsetLeft;
                            positionSlider.style.width = `${btnWidth}px`;
                            positionSlider.style.left = `${btnLeft}px`;
                        }
                    }, 50);
                } else {
                    // Position slider on the currently active button and store position
                    if (activeBtn) {
                        previousPosition = activeBtn.getAttribute('data-position');
                    }
                    setTimeout(() => {
                        const btnWidth = activeBtn.offsetWidth;
                        const btnLeft = activeBtn.offsetLeft;
                        positionSlider.style.width = `${btnWidth}px`;
                        positionSlider.style.left = `${btnLeft}px`;
                    }, 50);
                }
            } else if (option.id === 'large') {
                // Store current state
                previousSize = 'large';
                
                // Large selected: show element at 100%, hide position pill, hide Show, show all sizes
                element.style.display = 'block';
                element.style.width = '100%';
                element.style.marginLeft = 'auto';
                element.style.marginRight = 'auto';
                positionPill.style.display = 'none';
                if (showBtn) showBtn.style.display = 'none';
                if (hideBtn) hideBtn.style.display = 'inline-block';
                if (smallBtn) smallBtn.style.display = 'inline-block';
                if (mediumBtn) mediumBtn.style.display = 'inline-block';
                updateSlideWidth(option.width);
            }
        });

        sizePill.appendChild(button);

        // Initialize slider position for initial size (default)
        if (option.id === initialSize) {
            setTimeout(() => {
                const buttonWidth = button.offsetWidth;
                const buttonLeft = button.offsetLeft;
                slider.style.width = `${buttonWidth}px`;
                slider.style.left = `${buttonLeft}px`;
            }, 10);
        }
    });

    // Create notes size toggle pill
    const notesSizePill = document.createElement('div');
    notesSizePill.className = `notes-size-toggle-pill slide-${slideIndex}-notes-size-pill`;
    notesSizePill.title = 'Change Notes Size';
    notesSizePill.style.cssText = `
        position: relative;
        display: inline-flex;
        background: rgba(135, 206, 235, 0.3);
        padding: 4px;
        border-radius: 20px;
        border: 1px solid rgba(135, 206, 235, 0.5);
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
    `;

    const notesSizeOptions = [
        { id: 'hide', text: 'Hide', fontSize: '0px' },
        { id: 'show', text: 'Show', fontSize: '18px' },
        { id: 'small', text: 'Small', fontSize: '14px' },
        { id: 'medium', text: 'Medium', fontSize: '18px' },
        { id: 'large', text: 'Large', fontSize: '22px' }
    ];

    // Create sliding background for notes size
    const notesSizeSlider = document.createElement('div');
    notesSizeSlider.className = `notes-size-toggle-slider slide-${slideIndex}-notes-size-slider`;
    notesSizeSlider.style.cssText = `
        position: absolute;
        top: 4px;
        height: calc(100% - 8px);
        background: linear-gradient(135deg, #0969da 0%, #0550ae 100%);
        border-radius: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 8px rgba(9, 105, 218, 0.4);
        z-index: 1;
    `;
    notesSizePill.appendChild(notesSizeSlider);

    // Previous state tracking (initialNotesSize already defined from data attributes)
    let previousNotesSize = initialNotesSize;

    notesSizeOptions.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = `notes-size-toggle-btn slide-${slideIndex}-notes-size-btn`;
        button.setAttribute('data-notes-size', option.id);
        button.innerHTML = `<i class=\"fa fa-paragraph\" style=\"margin-right: 4px;\"></i>${option.text}`;
        
        // Initial visibility: If initial is Hide, show Hide/Show; otherwise show Hide/Small/Medium/Large
        let initialDisplay = 'inline-block';
        if (option.id === 'show') {
            // Show button only visible when initialNotesSize is 'hide'
            initialDisplay = (initialNotesSize === 'hide') ? 'inline-block' : 'none';
        } else if (option.id === 'small' || option.id === 'medium' || option.id === 'large') {
            // Size buttons hidden when initialNotesSize is 'hide'
            initialDisplay = (initialNotesSize === 'hide') ? 'none' : 'inline-block';
        }
        
        button.style.cssText = `
            position: relative;
            z-index: 2;
            background: transparent;
            border: none;
            color: ${option.id === initialNotesSize ? '#ffffff' : '#000000'};
            padding: 6px 14px;
            cursor: pointer;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
            transition: color 0.3s ease;
            white-space: nowrap;
            display: ${initialDisplay};
        `;

        button.addEventListener('click', () => {
            // Update button styles
            notesSizePill.querySelectorAll('.notes-size-toggle-btn').forEach(btn => {
                btn.style.color = '#000000';
            });
            button.style.color = '#ffffff';

            // Calculate slider position
            const buttonWidth = button.offsetWidth;
            const buttonLeft = button.offsetLeft;
            notesSizeSlider.style.width = `${buttonWidth}px`;
            notesSizeSlider.style.left = `${buttonLeft}px`;

            const hideBtn = notesSizePill.querySelector('[data-notes-size="hide"]');
            const showBtn = notesSizePill.querySelector('[data-notes-size="show"]');
            const smallBtn = notesSizePill.querySelector('[data-notes-size="small"]');
            const mediumBtn = notesSizePill.querySelector('[data-notes-size="medium"]');
            const largeBtn = notesSizePill.querySelector('[data-notes-size="large"]');
            
            if (option.id === 'hide') {
                // Store current state before hiding
                const activeNotesSizeBtn = notesSizePill.querySelector('.notes-size-toggle-btn[style*="color: rgb(255, 255, 255)"]');
                if (activeNotesSizeBtn && activeNotesSizeBtn.getAttribute('data-notes-size') !== 'hide') {
                    previousNotesSize = activeNotesSizeBtn.getAttribute('data-notes-size');
                }
                
                // Hide selected: hide notes, show only Hide/Show buttons
                if (notesElement) notesElement.style.display = 'none';
                if (showBtn) showBtn.style.display = 'inline-block';
                if (smallBtn) smallBtn.style.display = 'none';
                if (mediumBtn) mediumBtn.style.display = 'none';
                if (largeBtn) largeBtn.style.display = 'none';
            } else if (option.id === 'show') {
                // Show selected: restore previous size
                // Hide Show button, show all size options
                if (showBtn) showBtn.style.display = 'none';
                if (hideBtn) hideBtn.style.display = 'inline-block';
                if (smallBtn) smallBtn.style.display = 'inline-block';
                if (mediumBtn) mediumBtn.style.display = 'inline-block';
                if (largeBtn) largeBtn.style.display = 'inline-block';
                
                // Restore previous size
                const previousNotesSizeBtn = notesSizePill.querySelector(`[data-notes-size="${previousNotesSize}"]`);
                if (previousNotesSizeBtn) {
                    // Reset all notes size button colors
                    notesSizePill.querySelectorAll('.notes-size-toggle-btn').forEach(btn => {
                        btn.style.color = '#000000';
                    });
                    previousNotesSizeBtn.style.color = '#ffffff';
                    
                    // Position notes size slider
                    setTimeout(() => {
                        const btnWidth = previousNotesSizeBtn.offsetWidth;
                        const btnLeft = previousNotesSizeBtn.offsetLeft;
                        notesSizeSlider.style.width = `${btnWidth}px`;
                        notesSizeSlider.style.left = `${btnLeft}px`;
                    }, 10);
                    
                    // Get the font size for the previous size
                    const notesSizeData = notesSizeOptions.find(s => s.id === previousNotesSize);
                    if (notesSizeData && notesElement) {
                        notesElement.style.display = 'block';
                        notesElement.style.fontSize = notesSizeData.fontSize;
                    }
                }
            } else {
                // Small/Medium/Large selected: store state and apply font size
                previousNotesSize = option.id;
                if (notesElement) {
                    notesElement.style.display = 'block';
                    notesElement.style.fontSize = option.fontSize;
                }
                // Hide Show button, show all size options
                if (showBtn) showBtn.style.display = 'none';
                if (hideBtn) hideBtn.style.display = 'inline-block';
                if (smallBtn) smallBtn.style.display = 'inline-block';
                if (mediumBtn) mediumBtn.style.display = 'inline-block';
                if (largeBtn) largeBtn.style.display = 'inline-block';
            }
        });

        notesSizePill.appendChild(button);

        // Initialize slider position for initial notes size
        if (option.id === initialNotesSize) {
            setTimeout(() => {
                const buttonWidth = button.offsetWidth;
                const buttonLeft = button.offsetLeft;
                notesSizeSlider.style.width = `${buttonWidth}px`;
                notesSizeSlider.style.left = `${buttonLeft}px`;
            }, 10);
        }
    });

    // Add all pills to the toggles container (notes size, position, size)
    togglesContainer.appendChild(notesSizePill);
    togglesContainer.appendChild(positionPill);
    togglesContainer.appendChild(sizePill);

    // Track if this is the first time showing the controls
    let isFirstShow = true;

    // Create settings toggle button
    const settingsToggleBtn = document.createElement('button');
    settingsToggleBtn.className = `slide-settings-toggle slide-${slideIndex}-settings-toggle`;
    settingsToggleBtn.title = 'Slide Settings';
    settingsToggleBtn.innerHTML = '<i class="fa fa-chevron-left"> </i> <i class="fa fa-cog"></i>';
    settingsToggleBtn.style.cssText = `
        background: rgba(135, 206, 235, 0.3);
        border: 1px solid rgba(135, 206, 235, 0.5);
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #0969da;
        font-size: 16px;
        padding: 0;
        margin-left: 12px;
    `;
    
    // Toggle visibility of controls
    settingsToggleBtn.addEventListener('click', () => {
        if (togglesContainer.style.display === 'none') {
            togglesContainer.style.display = 'flex';
            settingsToggleBtn.innerHTML = '<i class="fa fa-chevron-right"> </i> <i class="fa fa-cog"></i>';
            settingsToggleBtn.style.background = 'rgba(135, 206, 235, 0.5)';
            settingsToggleBtn.style.color = '#0550ae';
            
            // Initialize slider positions on first show based on initial data attributes
            if (isFirstShow) {
                isFirstShow = false;
                setTimeout(() => {
                    // Position notes size slider
                    const activeNotesSizeBtn = notesSizePill.querySelector(`[data-notes-size="${initialNotesSize}"]`);
                    if (activeNotesSizeBtn) {
                        const buttonWidth = activeNotesSizeBtn.offsetWidth;
                        const buttonLeft = activeNotesSizeBtn.offsetLeft;
                        notesSizeSlider.style.width = `${buttonWidth}px`;
                        notesSizeSlider.style.left = `${buttonLeft}px`;
                    }
                    
                    // Position size slider based on initialSize
                    const activeSizeBtn = sizePill.querySelector(`[data-size="${initialSize}"]`);
                    if (activeSizeBtn) {
                        const buttonWidth = activeSizeBtn.offsetWidth;
                        const buttonLeft = activeSizeBtn.offsetLeft;
                        slider.style.width = `${buttonWidth}px`;
                        slider.style.left = `${buttonLeft}px`;
                    }
                    
                    // Position position slider if position pill is visible
                    if (positionPill.style.display === 'inline-flex') {
                        const activePositionBtn = positionPill.querySelector(`[data-position="${initialPosition}"]`);
                        if (activePositionBtn) {
                            const buttonWidth = activePositionBtn.offsetWidth;
                            const buttonLeft = activePositionBtn.offsetLeft;
                            positionSlider.style.width = `${buttonWidth}px`;
                            positionSlider.style.left = `${buttonLeft}px`;
                        }
                    }
                }, 50);
            }
        } else {
            togglesContainer.style.display = 'none';
            settingsToggleBtn.innerHTML = '<i class="fa fa-chevron-left"> </i> <i class="fa fa-cog"></i>';
            settingsToggleBtn.style.background = 'rgba(135, 206, 235, 0.3)';
            settingsToggleBtn.style.color = '#0969da';
        }
    });
    
    // Add hover effect
    settingsToggleBtn.addEventListener('mouseenter', () => {
        settingsToggleBtn.style.background = 'rgba(135, 206, 235, 0.5)';
        settingsToggleBtn.style.transform = 'scale(1.1)';
    });
    settingsToggleBtn.addEventListener('mouseleave', () => {
        if (togglesContainer.style.display === 'none') {
            settingsToggleBtn.style.background = 'rgba(135, 206, 235, 0.3)';
        }
        settingsToggleBtn.style.transform = 'scale(1)';
    });

    // Create a container for both toggles and settings button
    const controlsWrapper = document.createElement('div');
    controlsWrapper.style.cssText = 'display: flex; align-items: center; margin-left: auto;';
    controlsWrapper.appendChild(togglesContainer);
    controlsWrapper.appendChild(settingsToggleBtn);

    titleBar.appendChild(titleText);
    titleBar.appendChild(controlsWrapper);
    
    // Create a content container to hold both reveal element and notes as siblings
    const contentContainer = document.createElement('div');
    contentContainer.className = `slide-content-container slide-${slideIndex}-content`;
    contentContainer.style.cssText = `
        display: grid;
        grid-template-columns: 100%;
        width: 100%;
        gap: 10px;
        position: relative;
        overflow: visible;
    `;
    
    contentContainer.appendChild(element);
    element.style.gridColumn = '1';
    element.style.gridRow = '1';
    element.style.position = 'relative';
    element.style.minWidth = '0';
    element.style.minHeight = '0';
    
    // Add notes to content container if they exist
    if (notesElement) {
        contentContainer.appendChild(notesElement);
        notesElement.style.gridColumn = '1';
        notesElement.style.gridRow = '2';
        notesElement.style.display = 'block';
        notesElement.style.boxSizing = 'border-box';
        notesElement.style.width = '100%';
        notesElement.style.maxWidth = '100%';
        notesElement.style.margin = '0';
        notesElement.style.padding = '10px';
        notesElement.style.position = 'relative';
        notesElement.style.minWidth = '0';
        // On mobile, set notes to large (22px), otherwise medium (18px) by default
        notesElement.style.fontSize = isMobile ? '22px' : '18px';
    }
    
    // Assemble the wrapper
    slideWrapper.appendChild(titleBar);
    slideWrapper.appendChild(contentContainer);
    
    // Apply initial settings based on data attributes (after DOM is assembled)
    setTimeout(() => {
        const sizeData = sizeOptions.find(s => s.id === initialSize);
        
        if (initialSize === 'small' || initialSize === 'medium') {
            // Show position pill for small/medium sizes
            positionPill.style.display = 'inline-flex';
            // Set width and apply position
            if (sizeData) {
                element.style.width = sizeData.width;
            }
            // Apply margin based on position
            if (initialPosition === 'center') {
                element.style.marginLeft = 'auto';
                element.style.marginRight = 'auto';
            } else if (initialPosition === 'left') {
                element.style.marginLeft = '0';
                element.style.marginRight = 'auto';
            } else if (initialPosition === 'right') {
                element.style.marginLeft = 'auto';
                element.style.marginRight = '0';
            }
            
            // Update notes position for small/medium sizes
            updateNotesPosition();
            
            // Re-position the position slider now that the pill is visible
            setTimeout(() => {
                const activePositionBtn = positionPill.querySelector(`[data-position="${initialPosition}"]`);
                if (activePositionBtn) {
                    const buttonWidth = activePositionBtn.offsetWidth;
                    const buttonLeft = activePositionBtn.offsetLeft;
                    positionSlider.style.width = `${buttonWidth}px`;
                    positionSlider.style.left = `${buttonLeft}px`;
                }
            }, 10);
        } else if (initialSize === 'large') {
            // Hide position pill and center at 100%
            positionPill.style.display = 'none';
            element.style.width = '100%';
            element.style.marginLeft = 'auto';
            element.style.marginRight = 'auto';
            
            // Update notes position for large size
            updateNotesPosition();
        } else if (initialSize === 'hide') {
            // Hide element and position pill
            element.style.display = 'none';
            positionPill.style.display = 'none';
        }
        
        // Re-position the size slider to ensure it's correct
        setTimeout(() => {
            const activeSizeBtn = sizePill.querySelector(`[data-size="${initialSize}"]`);
            if (activeSizeBtn) {
                const buttonWidth = activeSizeBtn.offsetWidth;
                const buttonLeft = activeSizeBtn.offsetLeft;
                slider.style.width = `${buttonWidth}px`;
                slider.style.left = `${buttonLeft}px`;
            }
        }, 10);
        
        // Apply initial notes size
        const notesSizeData = notesSizeOptions.find(s => s.id === initialNotesSize);
        if (notesSizeData && notesElement) {
            if (initialNotesSize === 'hide') {
                notesElement.style.display = 'none';
            } else if (initialNotesSize !== 'show') {
                notesElement.style.fontSize = notesSizeData.fontSize;
            }
        }
        
        // Re-position the notes size slider
        setTimeout(() => {
            const activeNotesSizeBtn = notesSizePill.querySelector(`[data-notes-size="${initialNotesSize}"]`);
            if (activeNotesSizeBtn) {
                const buttonWidth = activeNotesSizeBtn.offsetWidth;
                const buttonLeft = activeNotesSizeBtn.offsetLeft;
                notesSizeSlider.style.width = `${buttonWidth}px`;
                notesSizeSlider.style.left = `${buttonLeft}px`;
            }
        }, 10);
    }, 50);
}

// Create custom controls for fragment toggle
function createCustomControls(slideIndex, element, revealInstance) {
    const toolbar = document.createElement('div');
    toolbar.className = `article-slide-toolbar slide-${slideIndex}-toolbar`;
    toolbar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 25px 5px 5px 5px;
        z-index: 1100;
        box-sizing: border-box;
        transition: opacity 0.3s ease;
    `;
    
    // Left section - Audio player (will be added by createAudioPlayer)
    const leftSection = document.createElement('div');
    leftSection.id = `slide-${slideIndex}-audio-section`;
    leftSection.style.cssText = 'display: flex; align-items: center; gap: 12px; flex: 1; max-width: 400px;';
    
    // Right section - Fragment controls only
    const rightSection = document.createElement('div');
    rightSection.style.cssText = 'display: flex; align-items: center; justify-content: flex-end; gap: 12px; position: relative; margin-right: 20px;';
    
    // Fragment controls pill container
    const fragmentControlsPill = document.createElement('div');
    fragmentControlsPill.id = `slide-${slideIndex}-fragment-controls-pill`;
    fragmentControlsPill.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(135, 206, 235, 0.3);
        border: 1px solid rgba(135, 206, 235, 0.5);
        padding: 4px;
        border-radius: 20px;
        overflow: hidden;
    `;
    
    // Fragment controls inner container (slides in/out)
    const fragmentControlsInner = document.createElement('div');
    fragmentControlsInner.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        transition: all 0.3s ease;
        pointer-events: none;
    `;
    
    // Fragment controls toggle button (combined with animation toggle)
    let fragmentsEnabled = false;
    const fragmentControlsToggle = createToolbarButton('fa-person-walking', 'Show Slide Animation Controls', () => {
        const section = element.querySelector('section');
        
        if (fragmentsEnabled) {
            // Hide controls and disable fragments
            fragmentControlsInner.style.maxWidth = '0';
            fragmentControlsInner.style.opacity = '0';
            fragmentControlsInner.style.pointerEvents = 'none';
            fragmentControlsToggle.title = 'Show Slide Animation Controls';
            fragmentControlsToggle.innerHTML = '<i class="fa fa-chevron-left"> </i> <i class="fa fa-person-walking"></i>';
            
            // Disable fragments - show all by navigating to end
            const fragments = section.querySelectorAll('.fragment');
            fragments.forEach(f => {
                f.classList.remove('fragment');
                f.classList.add('fragment-off');
                f.classList.add('visible');
            });
            
            fragmentsEnabled = false;
        } else {
            // Show controls and enable fragments
            fragmentControlsInner.style.maxWidth = '500px';
            fragmentControlsInner.style.opacity = '1';
            fragmentControlsInner.style.pointerEvents = 'auto';
            fragmentControlsToggle.title = 'Hide Slide Animation Controls';
            fragmentControlsToggle.innerHTML = '<i class="fa fa-chevron-right"> </i> <i class="fa fa-person-walking"></i>';
            
            // Enable fragments - restore fragment classes and reset to beginning
            const fragmentsOff = section.querySelectorAll('.fragment-off');
            fragmentsOff.forEach(f => {
                f.classList.remove('fragment-off');
                f.classList.remove('visible');
                f.classList.add('fragment');
            });
            
            // Reset to first fragment state using Reveal API
            setTimeout(() => {
                const state = revealInstance.getState();
                revealInstance.slide(state.indexh, state.indexv, -1);
            }, 50);
            
            fragmentsEnabled = true;
        }
    });
    // Set initial icon with chevron
    fragmentControlsToggle.innerHTML = '<i class="fa fa-chevron-left"> </i> <i class="fa fa-person-walking"></i>';
    fragmentControlsToggle.style.cssText += `
        flex-shrink: 0;
    `;
    
    // Previous Fragment button
    const prevFragmentBtn = createToolbarButton('fa-step-backward', 'Previous Fragment', () => {
        revealInstance.prevFragment();
    });
    
    // Fragment number display
    const fragmentNumberDisplay = document.createElement('div');
    fragmentNumberDisplay.id = `slide-${slideIndex}-fragment-number`;
    fragmentNumberDisplay.style.cssText = `
        color: #0969da;
        font-size: 14px;
        font-weight: 500;
        padding: 8px 12px;
        background: rgba(135, 206, 235, 0.2);
        border: 1px solid rgba(135, 206, 235, 0.4);
        border-radius: 16px;
        min-width: 60px;
        text-align: center;
        flex-shrink: 0;
    `;
    fragmentNumberDisplay.textContent = '0 / 0';
    
    // Update fragment number function
    const updateFragmentNumber = () => {
        const state = revealInstance.getState();
        const currentFragment = state.indexf >= 0 ? state.indexf + 1 : 1;
        
        const currentSlide = revealInstance.getCurrentSlide();
        let totalFragments = 0;
        if (currentSlide) {
            const fragmentElements = currentSlide.querySelectorAll('[data-fragment-index]');
            const uniqueIndexes = new Set();
            fragmentElements.forEach(el => {
                const index = el.getAttribute('data-fragment-index');
                if (index !== null) {
                    uniqueIndexes.add(index);
                }
            });
            totalFragments = uniqueIndexes.size;
        }
        
        fragmentNumberDisplay.textContent = `${currentFragment} / ${totalFragments}`;
    };
    
    // Initialize fragment number
    setTimeout(updateFragmentNumber, 100);
    
    // Update fragment number on events
    revealInstance.on('fragmentshown', updateFragmentNumber);
    revealInstance.on('fragmenthidden', updateFragmentNumber);
    
    // Next Fragment button
    const nextFragmentBtn = createToolbarButton('fa-step-forward', 'Next Fragment', () => {
        revealInstance.nextFragment();
    });
    
    // Add controls to inner container
    fragmentControlsInner.appendChild(prevFragmentBtn);
    fragmentControlsInner.appendChild(fragmentNumberDisplay);
    fragmentControlsInner.appendChild(nextFragmentBtn);
    
    // Add inner container first, then toggle to pill (toggle on right side, controls slide from left)
    fragmentControlsPill.appendChild(fragmentControlsInner);
    fragmentControlsPill.appendChild(fragmentControlsToggle);
    
    // Add pill to right section
    rightSection.appendChild(fragmentControlsPill);
    
    // Add sections to toolbar
    toolbar.appendChild(leftSection);
    toolbar.appendChild(rightSection);
    
    element.appendChild(toolbar);
    
    // Dim toolbar on mouse leave
    element.addEventListener('mouseenter', () => {
        toolbar.style.opacity = '1';
    });
    element.addEventListener('mouseleave', () => {
        toolbar.style.opacity = '0.6';
    });
}

// Create audio player for article view
function createAudioPlayer(slideIndex, element, revealInstance) {
    // Find the toolbar's left section
    const audioSection = document.getElementById(`slide-${slideIndex}-audio-section`);
    if (!audioSection) {
        console.error(`[Article Audio] Audio section not found for slide ${slideIndex}`);
        return null;
    }

    const audio = document.createElement('audio');
    audio.className = `slide-audio-player`;
    audio.id = `audio-player-${slideIndex}`;
    audio.controls = true;
    audio.style.cssText = `
        flex: 1;
        height: 30px;
        accent-color: #0969da;
        filter: hue-rotate(0deg) saturate(1.2);
    `;
    
    const audioSource = document.createElement('source');
    audioSource.src = `audio/${slideIndex - 1}.0.mp3`;
    audioSource.type = 'audio/mp3';
    audio.appendChild(audioSource);

    // Sync audio with narration highlights
    audio.addEventListener('timeupdate', () => {
        const notesElement = document.getElementById(`slide${slideIndex}Notes`);
        if (!notesElement) return;

        const now = audio.currentTime;
        
        // Update bottom toolbar timestamp if this is the current view
        if (currentView === 'article' && currentSlideIndex === slideIndex) {
            const linesForTimestamp = notesElement.querySelectorAll(`span[data-section="slide${slideIndex}"][data-type="narration"]`);
            if (linesForTimestamp.length > 0) {
                const firstLine = linesForTimestamp[0];
                const slideStartVideo = parseFloat(firstLine.getAttribute('data-start-video')) || 0;
                const absoluteTime = slideStartVideo + now;
                updateBottomToolbarTimestamp(absoluteTime);
            }
        }
        
        const lines = notesElement.querySelectorAll(`span[data-section="slide${slideIndex}"][data-type="narration"]`);

        // Clear ALL highlights across all slides in Article View first
        document.querySelectorAll('#article-view-wrapper .line').forEach(l => l.classList.remove('currentLine'));
        
        // Clear ALL sidebar highlights first (across all slides)
        document.querySelectorAll('.sidebar-note-line').forEach(clearLine => clearLine.classList.remove('currentLine'));

        lines.forEach((line, idx) => {
            const start = parseFloat(line.getAttribute('data-start'));
            const end = parseFloat(line.getAttribute('data-end'));

            if (now >= start && now <= end) {
                // Highlight in Article View
                line.classList.add('currentLine');
                
                // Find and highlight the matching sidebar line
                const sidebarLines = document.querySelectorAll(`.sidebar-note-line[data-slide-index="${slideIndex}"]`);
                sidebarLines.forEach(sl => {
                    const slStart = parseFloat(sl.getAttribute('data-start'));
                    const slEnd = parseFloat(sl.getAttribute('data-end'));
                    if (Math.abs(slStart - start) < 0.001 && Math.abs(slEnd - end) < 0.001) {
                        sl.classList.add('currentLine');
                    }
                });
                
                // Expand and scroll to current slide in sidebar
                const slideBlock = document.querySelector(`.slide-nav-block[data-slide-index="${slideIndex}"]`);
                if (slideBlock) {
                    const notesContent = slideBlock.querySelector('.slide-notes-content');
                    const chevron = slideBlock.querySelector('.fa-chevron-down');
                    if (notesContent && notesContent.style.display === 'none') {
                        notesContent.style.display = 'block';
                        if (chevron) chevron.style.transform = 'rotate(180deg)';
                    }
                    slideBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                
                if (idx === 0) {
                    revealInstance.navigateFragment(-1);
                } else {
                    revealInstance.navigateFragment(idx - 1);
                }
            }
        });
    });

    audio.addEventListener('play', () => {
        // Stop all other article view audio players
        document.querySelectorAll('.slide-audio-player').forEach(otherAudio => {
            if (otherAudio !== audio && !otherAudio.paused) {
                otherAudio.pause();
            }
        });
        
        const section = element.querySelector('section');
        const fragments = section.querySelectorAll('.fragment-off');
        fragments.forEach(f => {
            f.classList.remove('fragment-off');
            f.classList.add('fragment');
        });
        
        // Update bottom toolbar icon
        updateBottomToolbarPlayPauseIcon();
    });
    
    audio.addEventListener('pause', () => {
        // Update bottom toolbar icon
        updateBottomToolbarPlayPauseIcon();
    });

    // Auto-advance to next slide when audio ends
    audio.addEventListener('ended', () => {
        if (currentView === 'article' && slideIndex < 6) {
            const nextSlideIndex = slideIndex + 1;
            const nextSlideElement = document.getElementById(`reveal${nextSlideIndex}`);
            if (nextSlideElement) {
                nextSlideElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Wait for scroll, then play next audio
                setTimeout(() => {
                    const nextAudio = document.getElementById(`audio-player-${nextSlideIndex}`);
                    if (nextAudio) {
                        nextAudio.play();
                    }
                }, 500);
            }
        }
    });

    audioSection.appendChild(audio);

    // Make notes clickable to seek audio
    const notesElement = document.getElementById(`slide${slideIndex}Notes`);
    if (notesElement) {
        const lines = notesElement.querySelectorAll(`span[data-section="slide${slideIndex}"][data-type="narration"]`);
        lines.forEach((line) => {
            line.style.cursor = 'pointer';
            line.addEventListener('click', () => {
                const start = parseFloat(line.getAttribute('data-start'));
                audio.currentTime = start;
                audio.play();
            });
            line.addEventListener('mouseover', () => {
                if (!line.classList.contains('currentLine')) {
                    line.classList.add('mouseOverLine');
                }
            });
            line.addEventListener('mouseleave', () => {
                line.classList.remove('mouseOverLine');
            });
        });
    }

    return audio;
}

// =====================
// BANNER
// =====================

function createBanner() {
    // Check if banner was already dismissed
    if (localStorage.getItem('prototypeBannerDismissed') === 'true') {
        return;
    }

    const banner = document.createElement('div');
    banner.id = 'prototype-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        width: 100%;
        background: linear-gradient(90deg, #e3f2fd 0%, #f3e5f5 100%);
        color: #1e1e1e;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
    `;

    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
    `;

    const message = document.createElement('div');
    message.innerHTML = `This website is a prototype using <a href="https://MultimodalSlides.com" target="_blank" style="color: #0066cc; text-decoration: none; font-weight: 500;">MultimodalSlides.com</a>. Email me feedback at <a href="mailto:John@JohnBaluka.com" style="color: #0066cc; text-decoration: none; font-weight: 500;">John@JohnBaluka.com</a>.`;

    messageContainer.appendChild(message);

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '<i class="fa fa-times"></i>';
    closeButton.style.cssText = `
        background: transparent;
        border: none;
        color: #424242;
        cursor: pointer;
        padding: 4px 8px;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;
    `;
    closeButton.setAttribute('aria-label', 'Dismiss banner');
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.backgroundColor = 'transparent';
    });
    closeButton.addEventListener('click', () => {
        // Change message to "Thank You!"
        message.innerHTML = 'Thank You!';
        banner.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
            banner.style.opacity = '0';
            setTimeout(() => {
                banner.remove();
                // Adjust body padding
                document.body.style.paddingTop = '0';
                // Adjust toolbars
                const topToolbar = document.getElementById('top-toolbar');
                if (topToolbar) topToolbar.style.top = '0';
                const siteNavSidebar = document.getElementById('site-nav-sidebar');
                if (siteNavSidebar) siteNavSidebar.style.top = '0';
                const slideNavSidebar = document.getElementById('slide-nav-sidebar');
                if (slideNavSidebar) slideNavSidebar.style.top = '0';
                
                // Reset view containers to default (account for top + bottom toolbar = 100px)
                const articleView = document.getElementById('article-view');
                if (articleView) {
                    articleView.style.height = 'calc(100vh - 100px)';
                }
                const presentationView = document.getElementById('presentation-view');
                if (presentationView) {
                    presentationView.style.height = 'calc(100vh - 100px)';
                }
                const videoView = document.getElementById('video-view');
                if (videoView) {
                    videoView.style.height = 'calc(100vh - 100px)';
                }
            }, 300);
        }, 50);
        localStorage.setItem('prototypeBannerDismissed', 'true');
    });

    banner.appendChild(messageContainer);
    banner.appendChild(closeButton);
    document.body.insertBefore(banner, document.body.firstChild);

    // Adjust body padding to account for banner
    const bannerHeight = banner.offsetHeight;
    document.body.style.paddingTop = `${bannerHeight}px`;

    // Adjust toolbars and sidebars to start below the banner
    setTimeout(() => {
        const topToolbar = document.getElementById('top-toolbar');
        if (topToolbar) topToolbar.style.top = `${bannerHeight}px`;
        const siteNavSidebar = document.getElementById('site-nav-sidebar');
        if (siteNavSidebar) siteNavSidebar.style.top = `${bannerHeight}px`;
        const slideNavSidebar = document.getElementById('slide-nav-sidebar');
        if (slideNavSidebar) slideNavSidebar.style.top = `${bannerHeight}px`;
        
        // Adjust view containers height to account for banner (don't adjust margin-top, CSS handles that)
        // Views need to account for: top toolbar (50px) + banner + bottom toolbar (50px)
        const totalVerticalSpace = bannerHeight + 100; // banner + top toolbar + bottom toolbar
        const articleView = document.getElementById('article-view');
        if (articleView) {
            articleView.style.height = `calc(100vh - ${totalVerticalSpace}px)`;
        }
        const presentationView = document.getElementById('presentation-view');
        if (presentationView) {
            presentationView.style.height = `calc(100vh - ${totalVerticalSpace}px)`;
        }
        const videoView = document.getElementById('video-view');
        if (videoView) {
            videoView.style.height = `calc(100vh - ${totalVerticalSpace}px)`;
        }
    }, 10);
}

// =====================
// INITIALIZATION
// =====================

// Collect slide data first
collectSlideData();

// Calculate total duration from last note line
const allNoteLines = document.querySelectorAll('[data-end-video]');
if (allNoteLines.length > 0) {
    let maxEndTime = 0;
    allNoteLines.forEach(line => {
        const endTime = parseFloat(line.getAttribute('data-end-video'));
        if (endTime > maxEndTime) {
            maxEndTime = endTime;
        }
    });
    totalDuration = maxEndTime;
}

// Load YouTube API
loadYouTubeAPI();

// Create banner
createBanner();

// Create top toolbar
createTopToolbar();

// Create bottom toolbar
createBottomToolbar();

// Initialize timestamp display with total duration
if (window.bottomToolbarTimestamp && totalDuration > 0) {
    window.bottomToolbarTimestamp.textContent = `0:00 / ${formatTimestamp(totalDuration)}`;
}

// Create sidebars
createSiteNavigationSidebar();
createArticleNavigationSidebar();

// Add responsive styles
addResponsiveStyles();

// Create all view containers
createArticleView();
createPresentationView();
createVideoView();

// Setup scroll spy for article view
setupScrollSpy();

// Initialize sidebar positions
updateSidebarPositions();

// Initialize article view reveal instances
for (let i = 1; i <= 6; i++) {
    const element = document.querySelector(`.reveal${i}`);
    if (element) {
        element.style.position = 'relative';
        element.style.width = '100%';
        element.style.marginTop = '0';
        element.style.zIndex = '1100';
        //element.style.paddingBottom = '60px';
        element.style.overflow = 'hidden';

        // Get custom width/height from section data attributes
        const section = element.querySelector('section');
        const customWidth = section?.getAttribute('data-width');
        const customHeight = section?.getAttribute('data-height');
        
        const revealInstance = new Reveal(element, {
            embedded: true,
            width: customWidth ? parseInt(customWidth) : 1280,
            height: customHeight ? parseInt(customHeight) : 800,
            margin: 0,
            minScale: 0.1,
            maxScale: 2.0,
            keyboardCondition: 'focused',
            controls: false,
            progress: false,
            hash: false,
            showNotes: false,
            slideNumber: false,
            mouseWheel: false,
            keyboard: true,
            plugins: [
                RevealZoom,
                RevealNotes,
                RevealSearch,
                RevealHighlight,
            ]
        });
        
        createSlideTitleBar(i, element);

        revealInstance.initialize().then(() => {
            // Apply viewBox from data-viewBox attribute if it exists
            const section = element.querySelector('section');
            const svg = section?.querySelector('svg');
            if (section && svg) {
                const viewBoxValue = section.getAttribute('data-viewBox');
                if (viewBoxValue) {
                    // Set oniconload to apply viewBox after SVG loads
                    svg.setAttribute('oniconload', `this.setAttribute('viewBox', '${viewBoxValue}');`);
                }
            }
            
            createCustomControls(i, element, revealInstance);
            createAudioPlayer(i, element, revealInstance);
        });

        revealInstances.push({ index: i, instance: revealInstance, element });
    }
}
