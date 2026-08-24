// Multi-engine Search with Dropdown
(function () {
    const engines = {
        google:     { name: 'Google',      url: 'https://www.google.com/search?q=', icon: 'fab fa-google' },
        bing:       { name: 'Bing',        url: 'https://www.bing.com/search?q=', icon: 'fab fa-microsoft' },
        duckduckgo: { name: 'DuckDuckGo',  url: 'https://duckduckgo.com/?q=', icon: 'fas fa-shield-halved' },
        youtube:    { name: 'YouTube',      url: 'https://www.youtube.com/results?search_query=', icon: 'fab fa-youtube' },
        brave:      { name: 'Brave Search', url: 'https://search.brave.com/search?q=', icon: 'fas fa-compass' },
        startpage:  { name: 'Startpage',   url: 'https://www.startpage.com/do/dsearch?query=', icon: 'fas fa-lock' },
    };

    let currentEngine = 'google';

    const searchInput  = document.getElementById('search-bar');
    const toggle       = document.getElementById('engine-toggle');
    const dropdown     = document.getElementById('engine-dropdown');
    const engineIcon   = document.getElementById('engine-icon');
    const options      = document.querySelectorAll('.engine-option');

    if (!searchInput || !toggle || !dropdown) return;

    function getSettings() {
        try {
            return JSON.parse(localStorage.getItem('homepage-settings') || '{}');
        } catch (e) {
            return {};
        }
    }

    function selectEngine(engineKey) {
        if (!engines[engineKey]) engineKey = 'google';
        currentEngine = engineKey;

        if (engineIcon) {
            engineIcon.className = engines[currentEngine].icon;
            engineIcon.id = 'engine-icon';
        }

        options.forEach(function (o) {
            if (o.dataset.engine === currentEngine) {
                o.classList.add('selected');
            } else {
                o.classList.remove('selected');
            }
        });

        searchInput.placeholder = 'Search ' + engines[currentEngine].name + '...';
        dropdown.classList.remove('open');
        toggle.classList.remove('open');

        // Persist as default engine in settings
        try {
            var settings = JSON.parse(localStorage.getItem('homepage-settings') || '{}');
            settings.defaultEngine = engineKey;
            localStorage.setItem('homepage-settings', JSON.stringify(settings));
            // Sync settings modal dropdown if it exists
            var settingSelect = document.getElementById('setting-default-engine');
            if (settingSelect) settingSelect.value = engineKey;
        } catch (e) { /* ignore */ }
    }

    window.setSearchEngine = selectEngine;

    // Toggle dropdown open / close
    toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
    });

    // Select an engine from dropdown
    options.forEach(function (opt) {
        opt.addEventListener('click', function (e) {
            e.stopPropagation();
            selectEngine(opt.dataset.engine);
            searchInput.focus();
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function () {
        dropdown.classList.remove('open');
        toggle.classList.remove('open');
    });

    // Search on Enter
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            var query = searchInput.value.trim();
            if (query) {
                window.location.href = engines[currentEngine].url + encodeURIComponent(query);
            }
        }
    });

    // Type-to-search: focus input when typing anywhere
    document.addEventListener('keydown', function (e) {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT') return;
        if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
        searchInput.focus();
    });

    // Init initial engine from settings
    const initialSettings = getSettings();
    if (initialSettings.defaultEngine) {
        selectEngine(initialSettings.defaultEngine);
    }
})();
