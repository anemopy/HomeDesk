// =============================================
//  HomeDesk – Background Service Worker
//  Context Menu: "Add to HomeDesk" -> [Grid List]
// =============================================

function updateContextMenus() {
    if (!chrome.contextMenus) return;

    chrome.contextMenus.removeAll(function () {
        if (chrome.runtime.lastError) { /* ignore */ }

        chrome.storage.local.get(['homepage-grid-data'], function (res) {
            var grids = res['homepage-grid-data'];

            if (!grids || !Array.isArray(grids) || grids.length === 0) {
                grids = [{ name: 'My Shortcuts', items: [], slot: 0 }];
            }

            // Create root parent context menu item
            chrome.contextMenus.create({
                id: 'homedesk_add_root',
                title: '📌 Add to HomeDesk',
                contexts: ['page', 'link']
            }, function () {
                if (chrome.runtime.lastError) { /* ignore */ }

                // Create submenu items for each grid inside parent callback
                grids.forEach(function (grid, idx) {
                    var count = grid.items ? grid.items.length : 0;
                    var isFull = count >= 9;
                    var gridTitle = (grid.name || 'Grid ' + (idx + 1)) + (isFull ? ' (Full 9/9)' : ' (' + count + '/9)');

                    chrome.contextMenus.create({
                        id: 'homedesk_grid_' + idx,
                        parentId: 'homedesk_add_root',
                        title: (isFull ? '⚠️ ' : '📁 ') + gridTitle,
                        contexts: ['page', 'link'],
                        enabled: !isFull
                    }, function () {
                        if (chrome.runtime.lastError) { /* ignore */ }
                    });
                });
            });
        });
    });
}

// Show a sleek, non-intrusive floating toast on the webpage
function showInPageToast(tabId, message, isError) {
    if (!tabId || !chrome.scripting) return;

    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: function (msg, isErr) {
            try {
                var existingToast = document.getElementById('homedesk-inpage-toast');
                if (existingToast) existingToast.remove();

                var toast = document.createElement('div');
                toast.id = 'homedesk-inpage-toast';
                toast.textContent = msg;
                Object.assign(toast.style, {
                    position: 'fixed',
                    bottom: '28px',
                    right: '28px',
                    backgroundColor: isErr ? 'rgba(234, 67, 53, 0.95)' : 'rgba(25, 25, 25, 0.95)',
                    color: '#ffffff',
                    padding: '12px 22px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
                    fontSize: '14px',
                    fontWeight: '600',
                    zIndex: '2147483647',
                    pointerEvents: 'none',
                    opacity: '0',
                    transform: 'translateY(16px)',
                    transition: 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s ease',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid ' + (isErr ? 'rgba(234, 67, 53, 0.4)' : 'rgba(66, 133, 244, 0.4)'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                });

                document.body.appendChild(toast);

                requestAnimationFrame(function () {
                    toast.style.opacity = '1';
                    toast.style.transform = 'translateY(0)';
                });

                setTimeout(function () {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(16px)';
                    setTimeout(function () {
                        if (toast.parentNode) toast.parentNode.removeChild(toast);
                    }, 300);
                }, 2600);
            } catch (e) { }
        },
        args: [message, !!isError]
    }).catch(function () { /* ignore restricted pages like chrome:// */ });
}

// Initial setup on install, startup, and script load
chrome.runtime.onInstalled.addListener(function () {
    updateContextMenus();
});

chrome.runtime.onStartup.addListener(function () {
    updateContextMenus();
});

// Run on service worker activation
updateContextMenus();

// Update menus if storage changes
chrome.storage.onChanged.addListener(function (changes, areaName) {
    if (areaName === 'local' && changes['homepage-grid-data']) {
        updateContextMenus();
    }
});

// Listen for messages from index.html (e.g. grid renamed, added, deleted)
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg && msg.type === 'UPDATE_CONTEXT_MENUS') {
        updateContextMenus();
        if (sendResponse) sendResponse({ success: true });
    }
});

// Handle Context Menu Click
chrome.contextMenus.onClicked.addListener(function (info, tab) {
    if (!info.menuItemId || typeof info.menuItemId !== 'string') return;
    if (!info.menuItemId.startsWith('homedesk_grid_')) return;

    var gridIdx = parseInt(info.menuItemId.replace('homedesk_grid_', ''), 10);
    if (isNaN(gridIdx)) return;

    // Target URL: if right-clicked a link, use link URL; otherwise use page URL
    var targetUrl = info.linkUrl || (tab ? tab.url : '') || info.pageUrl;
    if (!targetUrl || /^chrome(-extension)?:\/\//i.test(targetUrl)) return;

    // Derive clean site name
    var siteName = '';
    if (info.selectionText && info.selectionText.trim()) {
        siteName = info.selectionText.trim();
    } else if (info.linkUrl) {
        try {
            var domain = new URL(info.linkUrl).hostname.replace(/^www\./, '').split('.')[0];
            siteName = domain.charAt(0).toUpperCase() + domain.slice(1);
        } catch (e) {
            siteName = 'Link';
        }
    } else if (tab && tab.title) {
        siteName = tab.title.split(' - ')[0].split(' | ')[0].trim() || tab.title.trim();
    }

    if (!siteName) {
        try {
            var domain = new URL(targetUrl).hostname.replace(/^www\./, '').split('.')[0];
            siteName = domain.charAt(0).toUpperCase() + domain.slice(1);
        } catch (e) {
            siteName = 'New Shortcut';
        }
    }

    // Derive high-resolution favicon URL
    var faviconUrl = null;
    try {
        faviconUrl = 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=' + encodeURIComponent(targetUrl) + '&size=128';
    } catch (e) { }

    chrome.storage.local.get(['homepage-grid-data'], function (res) {
        var grids = res['homepage-grid-data'] || [{ name: 'My Shortcuts', items: [], slot: 0 }];
        if (!grids[gridIdx]) return;

        var grid = grids[gridIdx];
        if (!grid.items) grid.items = [];

        if (grid.items.length >= 9) {
            if (tab && tab.id) {
                showInPageToast(tab.id, '⚠️ "' + (grid.name || 'Grid') + '" is full (max 9 shortcuts)', true);
            }
            return;
        }

        var newShortcut = {
            name: siteName,
            url: targetUrl,
            favicon: faviconUrl,
            icon: null
        };

        grid.items.push(newShortcut);

        chrome.storage.local.set({ 'homepage-grid-data': grids }, function () {
            updateContextMenus();

            // Show toast on the webpage where user clicked
            if (tab && tab.id) {
                showInPageToast(tab.id, '✨ Added "' + siteName + '" to ' + (grid.name || 'Grid ' + (gridIdx + 1)), false);
            }
        });
    });
});
