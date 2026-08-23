// Multi-engine Google Search with dropdown
(function () {
    const engines = {
        google:     { name: 'Google',      url: 'https://www.google.com/search?q=' },
        bing:       { name: 'Bing',        url: 'https://www.bing.com/search?q=' },
        duckduckgo: { name: 'DuckDuckGo',  url: 'https://duckduckgo.com/?q=' },
        youtube:    { name: 'YouTube',      url: 'https://www.youtube.com/results?search_query=' },
        brave:      { name: 'Brave Search', url: 'https://search.brave.com/search?q=' },
        startpage:  { name: 'Startpage',   url: 'https://www.startpage.com/do/dsearch?query=' },
    };

    let currentEngine = 'google';

    const searchInput  = document.getElementById('search-bar');
    const toggle       = document.getElementById('engine-toggle');
    const dropdown     = document.getElementById('engine-dropdown');
    const engineIcon   = document.getElementById('engine-icon');
    const options      = document.querySelectorAll('.engine-option');

    if (!searchInput || !toggle || !dropdown) return;

    // Toggle dropdown open / close
    toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle('open');
        toggle.classList.toggle('open', isOpen);
    });

    // Select an engine
    options.forEach(function (opt) {
        opt.addEventListener('click', function (e) {
            e.stopPropagation();
            currentEngine = opt.dataset.engine;

            // Update icon
            engineIcon.className = opt.dataset.icon;
            engineIcon.id = 'engine-icon';

            // Update selected state
            options.forEach(function (o) { o.classList.remove('selected'); });
            opt.classList.add('selected');

            // Update placeholder
            searchInput.placeholder = 'Search ' + engines[currentEngine].name + '...';

            // Close dropdown
            dropdown.classList.remove('open');
            toggle.classList.remove('open');

            // Focus the search bar
            searchInput.focus();
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function () {
        dropdown.classList.remove('open');
        toggle.classList.remove('open');
    });

    // Search on Enter
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = engines[currentEngine].url + encodeURIComponent(query);
            }
        }
    });

    // Type-to-search: focus input when typing anywhere
    document.addEventListener('keydown', function (e) {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
        if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
        searchInput.focus();
    });
})();
