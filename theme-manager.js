// theme-manager.js - Shared across all pages

// Initialize theme on page load
function initializeTheme() {
    const savedTheme = localStorage.getItem('preferred-theme') || 'system';
    applyTheme(savedTheme);
}

// Apply the selected theme
function applyTheme(theme) {
    let effectiveTheme = theme;
    
    if (theme === 'system') {
        // Check if user prefers dark mode
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            effectiveTheme = 'dark';
        } else {
            effectiveTheme = 'light';
        }
    }
    
    // Set data attribute on body
    document.body.setAttribute('data-theme', effectiveTheme);
    
    // Update meta theme color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', effectiveTheme === 'dark' ? '#1e1e1e' : '#ffffff');
    }
    
    // Save to localStorage
    localStorage.setItem('preferred-theme', theme);
}

// Listen for system theme changes
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        const savedTheme = localStorage.getItem('preferred-theme') || 'system';
        if (savedTheme === 'system') {
            applyTheme('system');
        }
    });
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme);