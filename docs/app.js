// Global state
let allSpeeches = [];
let filteredSpeeches = [];
let currentPage = 1;
const SPEECHES_PER_PAGE = 12;

// Fetch and parse CSV file
function fetchCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                resolve(results.data);
            },
            error: function(error) {
                console.error(`Error parsing ${url}:`, error);
                resolve([]); // Resolve empty on error to ensure Promise.all finishes
            }
        });
    });
}

// Initialize app
async function init() {
    try {
        // Fetch stats first
        const statsResponse = await fetch('stats.json');
        const statsData = await statsResponse.json();
        
        // Update basic stats UI immediately
        document.getElementById('total-count').textContent = statsData.totalSpeeches || '-';
        document.getElementById('hindi-count').textContent = statsData.hindiSpeeches || '-';
        document.getElementById('english-count').textContent = statsData.englishSpeeches || '-';
        document.getElementById('last-updated').textContent = statsData.lastUpdated || 'N/A';

        // Fetch CSVs in parallel
        const [hindiData, englishData] = await Promise.all([
            fetchCSV('data_hi.csv'),
            fetchCSV('data_en.csv')
        ]);
        
        // Process and combine data
        const hindiSpeeches = hindiData.map(s => ({ ...s, language: 'hi' }));
        const englishSpeeches = englishData.map(s => ({ ...s, language: 'en' }));
        
        allSpeeches = [...hindiSpeeches, ...englishSpeeches];
        
        // Sort initial (newest first)
         allSpeeches.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });

        // Set up event listeners
        document.getElementById('search').addEventListener('input', debounce(filterSpeeches, 300));
        document.getElementById('language').addEventListener('change', filterSpeeches);
        document.getElementById('sort').addEventListener('change', filterSpeeches);
        
        // Initial display
        filterSpeeches();
        
    } catch (error) {
        console.error('Error loading speeches:', error);
        document.getElementById('speeches-container').innerHTML = 
            '<div class="no-results">Error loading speeches. Please try again later.</div>';
    }
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filter and sort speeches
function filterSpeeches() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const languageFilter = document.getElementById('language').value;
    const sortOption = document.getElementById('sort').value;
    
    // Filter
    filteredSpeeches = allSpeeches.filter(speech => {
        const matchesSearch = !searchTerm || 
            speech.title.toLowerCase().includes(searchTerm) ||
            speech.speechText.toLowerCase().includes(searchTerm);
        
        const matchesLanguage = languageFilter === 'all' || speech.language === languageFilter;
        
        return matchesSearch && matchesLanguage;
    });
    
    // Sort
    filteredSpeeches.sort((a, b) => {
        switch(sortOption) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
    
    // Reset to first page
    currentPage = 1;
    
    // Update display
    displaySpeeches();
    updatePagination();
    updateResultsInfo();
}

// Display speeches for current page
function displaySpeeches() {
    const container = document.getElementById('speeches-container');
    
    if (filteredSpeeches.length === 0) {
        container.innerHTML = '<div class="no-results">No speeches found matching your criteria.</div>';
        return;
    }
    
    const startIndex = (currentPage - 1) * SPEECHES_PER_PAGE;
    const endIndex = startIndex + SPEECHES_PER_PAGE;
    const pageSpeeches = filteredSpeeches.slice(startIndex, endIndex);
    
    container.innerHTML = '<div class="speeches-grid">' + 
        pageSpeeches.map(speech => createSpeechCard(speech)).join('') + 
        '</div>';
}

// Create HTML for a speech card
function createSpeechCard(speech) {
    const excerpt = speech.speechText.substring(0, 200) + '...';
    const langLabel = speech.language === 'hi' ? 'Hindi' : 'English';
    const langEmoji = speech.language === 'hi' ? '🇮🇳' : '🇬🇧';
    
    return `
        <div class="speech-card">
            <div class="speech-content">
                <span class="speech-lang">${langEmoji} ${langLabel}</span>
                <h2 class="speech-title">${escapeHtml(speech.title)}</h2>
                <p class="speech-date">📅 ${escapeHtml(speech.date)}</p>
                <p class="speech-excerpt">${escapeHtml(excerpt)}</p>
                <div class="speech-links">
                    <button onclick="openSpeechModal('${escapeHtml(speech.href)}')" class="read-more-btn">Read Full Text</button>
                    ${speech.youtubeURL ? `<a href="${escapeHtml(speech.youtubeURL)}" target="_blank" rel="noopener">Watch Video</a>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredSpeeches.length / SPEECHES_PER_PAGE);
    const paginationContainer = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `<button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Previous</button>`;
    
    // Page numbers (show max 7 pages)
    const maxPagesToShow = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += `<button onclick="goToPage(1)">1</button>`;
        if (startPage > 2) paginationHTML += `<button disabled>...</button>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button onclick="goToPage(${i})" ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) paginationHTML += `<button disabled>...</button>`;
        paginationHTML += `<button onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `<button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Navigate to specific page
function goToPage(page) {
    const totalPages = Math.ceil(filteredSpeeches.length / SPEECHES_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displaySpeeches();
    updatePagination();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Update results info
function updateResultsInfo() {
    const resultsInfo = document.getElementById('results-info');
    if (filteredSpeeches.length === allSpeeches.length) {
        resultsInfo.textContent = `Showing all ${allSpeeches.length} speeches`;
    } else {
        resultsInfo.textContent = `Found ${filteredSpeeches.length} of ${allSpeeches.length} speeches`;
    }
}

// Escape HTML to prevent XSS
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

// Open Speech Modal
window.openSpeechModal = function(href) {
    const speech = allSpeeches.find(s => s.href === href);
    if (!speech) return;

    const modal = document.getElementById('speechModal');
    document.getElementById('modalTitle').textContent = speech.title;
    document.getElementById('modalDate').textContent = `📅 ${speech.date}`;
    document.getElementById('modalText').innerHTML = speech.speechText.replace(/\n/g, '<br><br>');
    document.getElementById('modalSourceLink').href = speech.href;
    
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Prevent background scrolling
}

// Close Modal Logic
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('speechModal');
    const span = document.getElementsByClassName("close")[0];
    
    span.onclick = function() {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
