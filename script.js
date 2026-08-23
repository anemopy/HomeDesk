// =============================================
//  Homepage – Dynamic Grids + User Setup
// =============================================
(function () {
    const MAX_ITEMS = 9;
    const STORAGE_KEY = 'homepage-grid-data';
    const USER_KEY = 'homepage-user-name';

    // ── DOM References ───────────────────────────
    const modal = document.getElementById('add-site-modal');
    const modalUrl = document.getElementById('modal-url');
    const modalName = document.getElementById('modal-name');
    const modalIcon = document.getElementById('modal-icon');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');
    const modalTitle = document.querySelector('#add-site-modal .modal-title');
    const modalNameField = document.getElementById('modal-name-field');
    const modalIconField = document.getElementById('modal-icon-field');
    const modalIconSource = document.getElementById('modal-icon-source');
    const modalSourceField = document.getElementById('modal-source-field');

    const welcomeModal = document.getElementById('welcome-modal');
    const welcomeNameInput = document.getElementById('welcome-name');
    const welcomeConfirm = document.getElementById('welcome-confirm');

    const addGridBtn = document.getElementById('add-grid-btn');
    const addGridModal = document.getElementById('add-grid-modal');
    const gridNameInput = document.getElementById('grid-name-input');
    const gridModalConfirm = document.getElementById('grid-modal-confirm');
    const gridModalCancel = document.getElementById('grid-modal-cancel');

    const gridsTopContainer = document.getElementById('grids-top');
    const gridsBottomContainer = document.getElementById('grids-bottom');

    // Track which panel & slot we're adding/editing
    let addTarget = { panelIndex: -1, editIndex: -1 };

    // ── Data Layer ──────────────────────────────
    function loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
        return null;
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function getUserName() {
        return localStorage.getItem(USER_KEY) || '';
    }

    function setUserName(name) {
        localStorage.setItem(USER_KEY, name);
    }

    // ── Welcome Flow ────────────────────────────
    function showWelcome() {
        welcomeModal.classList.add('open');
        setTimeout(function () { welcomeNameInput.focus(); }, 200);
    }

    function handleWelcome() {
        var name = welcomeNameInput.value.trim();
        if (!name) { welcomeNameInput.focus(); return; }
        setUserName(name);
        welcomeModal.classList.remove('open');
        applyUserName(name);

        // Create initial empty grid
        var data = [{ name: 'My Shortcuts', items: [] }];
        saveData(data);
        renderAllGrids();
    }

    if (welcomeConfirm) {
        welcomeConfirm.addEventListener('click', handleWelcome);
    }
    if (welcomeNameInput) {
        welcomeNameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') handleWelcome();
        });
    }

    function applyUserName(name) {
        // Update page title
        document.title = 'Welcome ' + name + '!!!';

        // Update the search-name area
        var searchName = document.getElementById('search-name');
        if (searchName) {
            searchName.textContent = name + ' ❤️';
        }
    }

    // ── Grid Rendering ──────────────────────────
    function createPanelElement(panelData, panelIndex, totalPanels) {
        var section = document.createElement('section');
        section.className = 'shortcut-panel';
        section.dataset.panelIndex = panelIndex;

        // Header with editable name
        var h3 = document.createElement('h3');
        h3.textContent = panelData.name || 'Grid ' + (panelIndex + 1);
        h3.style.cursor = 'default';
        section.appendChild(h3);

        // Double-click to rename
        h3.addEventListener('dblclick', function (e) {
            e.preventDefault();
            if (h3.querySelector('input')) return;

            var currentText = h3.textContent;
            var input = document.createElement('input');
            input.type = 'text';
            input.value = currentText;
            input.className = 'grid-name-input';

            h3.textContent = '';
            h3.appendChild(input);
            input.focus();
            input.select();

            function save() {
                var newName = input.value.trim() || currentText;
                h3.textContent = newName;
                var data = loadData();
                if (data && data[panelIndex]) {
                    data[panelIndex].name = newName;
                    saveData(data);
                }
            }

            input.addEventListener('blur', save);
            input.addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
                else if (ev.key === 'Escape') { input.value = currentText; input.blur(); }
            });
        });

        // Icon grid
        var grid = document.createElement('div');
        grid.className = 'icon-grid';
        section.appendChild(grid);

        // Render items
        renderPanel(section, panelIndex, panelData.items, false);

        // Edit button
        var editBtn = document.createElement('button');
        editBtn.className = 'edit-toggle';
        editBtn.type = 'button';
        editBtn.title = 'Edit shortcuts';
        editBtn.innerHTML = '<i class="fas fa-pen"></i>';

        editBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            var isEditing = section.classList.toggle('editing');
            editBtn.classList.toggle('active', isEditing);
            editBtn.innerHTML = isEditing
                ? '<i class="fas fa-check"></i>'
                : '<i class="fas fa-pen"></i>';

            var data = loadData();
            if (data && data[panelIndex]) {
                renderPanel(section, panelIndex, data[panelIndex].items, isEditing);
            }
        });
        section.appendChild(editBtn);

        // Delete grid button (only if more than 1 grid)
        if (totalPanels > 1) {
            var deleteBtn = document.createElement('button');
            deleteBtn.className = 'grid-delete-btn';
            deleteBtn.type = 'button';
            deleteBtn.title = 'Delete this grid';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';

            deleteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!confirm('Delete "' + (panelData.name || 'this grid') + '" and all its shortcuts?')) return;
                var data = loadData();
                if (!data) return;
                data.splice(panelIndex, 1);
                saveData(data);
                renderAllGrids();
            });
            section.appendChild(deleteBtn);
        }

        return section;
    }

    function renderPanel(panel, panelIndex, items, editing) {
        var grid = panel.querySelector('.icon-grid');
        if (!grid) return;

        grid.innerHTML = '';

        if (items.length === 0 && !editing) {
            // Show empty state
            var emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-grid-state';
            emptyDiv.innerHTML =
                '<i class="fas fa-layer-group"></i>' +
                '<span>No shortcuts yet</span>' +
                '<span class="empty-hint">Click the <i class="fas fa-pen"></i> to add</span>';
            grid.appendChild(emptyDiv);
            return;
        }

        items.forEach(function (item, slotIndex) {
            var div = document.createElement('div');
            div.className = 'site-item';

            // Link + icon
            var a = document.createElement('a');
            a.href = item.url;

            if (item.icon && !item.favicon) {
                var icon = document.createElement('i');
                icon.className = item.icon;
                a.appendChild(icon);
            } else if (item.favicon) {
                a.classList.add('has-favicon');
                var img = document.createElement('img');
                img.src = item.favicon;
                img.alt = item.name;
                img.className = 'favicon-img';

                var itemDomain = getDomain(item.url);
                var fallbacks = [
                    'https://icons.duckduckgo.com/ip3/' + itemDomain + '.ico',
                    'https://icon.horse/icon/' + itemDomain,
                ];
                var fallbackIdx = 0;

                img.onerror = function () {
                    if (fallbackIdx < fallbacks.length) {
                        img.src = fallbacks[fallbackIdx++];
                    } else {
                        a.classList.remove('has-favicon');
                        a.innerHTML = '';
                        var fallbackIcon = document.createElement('i');
                        fallbackIcon.className = 'fas fa-globe';
                        a.appendChild(fallbackIcon);
                    }
                };
                a.appendChild(img);
            } else {
                var globe = document.createElement('i');
                globe.className = 'fas fa-globe';
                a.appendChild(globe);
            }

            div.appendChild(a);

            // Right-click to edit
            (function (pi, si) {
                div.addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                    openEditModal(pi, si);
                });
            })(panelIndex, slotIndex);

            // Name label
            var span = document.createElement('span');
            span.className = 'site-name';
            span.textContent = item.name;
            div.appendChild(span);

            // Delete button (visible in edit mode via CSS)
            if (editing) {
                var del = document.createElement('button');
                del.className = 'item-delete';
                del.type = 'button';
                del.innerHTML = '<i class="fas fa-times"></i>';
                del.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteItem(panelIndex, slotIndex);
                });
                div.appendChild(del);

                // Drag-and-drop reordering
                div.draggable = true;
                div.dataset.index = slotIndex;
                a.draggable = false;
                a.addEventListener('dragstart', function (ev) { ev.preventDefault(); });

                (function (pi, si) {
                    div.addEventListener('dragstart', function (e) {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(si));
                        e.dataTransfer.setData('application/panel-index', String(pi));
                        var self = this;
                        setTimeout(function () { self.classList.add('dragging'); }, 0);
                    });

                    div.addEventListener('dragend', function () {
                        this.classList.remove('dragging');
                        grid.querySelectorAll('.drag-over').forEach(function (el) {
                            el.classList.remove('drag-over');
                        });
                    });

                    div.addEventListener('dragover', function (e) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                    });

                    div.addEventListener('dragenter', function (e) {
                        e.preventDefault();
                        if (!this.classList.contains('dragging')) {
                            this.classList.add('drag-over');
                        }
                    });

                    div.addEventListener('dragleave', function () {
                        this.classList.remove('drag-over');
                    });

                    div.addEventListener('drop', function (e) {
                        e.preventDefault();
                        this.classList.remove('drag-over');
                        var fromPanel = parseInt(e.dataTransfer.getData('application/panel-index'));
                        var fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        var toIndex = si;
                        if (fromPanel !== pi || fromIndex === toIndex) return;

                        var data = loadData();
                        if (!data || !data[pi]) return;
                        var arr = data[pi].items;
                        var moved = arr.splice(fromIndex, 1)[0];
                        arr.splice(toIndex, 0, moved);
                        saveData(data);
                        renderPanel(panel, pi, arr, true);
                    });
                })(panelIndex, slotIndex);
            }

            grid.appendChild(div);
        });

        // Fill remaining slots with add buttons when editing
        if (editing) {
            for (var s = items.length; s < MAX_ITEMS; s++) {
                (function (slotIdx) {
                    var addDiv = document.createElement('div');
                    addDiv.className = 'add-slot';
                    addDiv.innerHTML =
                        '<div class="add-circle"><i class="fas fa-plus"></i></div>' +
                        '<span class="add-label">Add</span>';
                    addDiv.addEventListener('click', function () {
                        openAddModal(panelIndex);
                    });
                    grid.appendChild(addDiv);
                })(s);
            }
        }
    }

    function renderAllGrids() {
        var data = loadData();
        if (!data) return;

        gridsTopContainer.innerHTML = '';
        gridsBottomContainer.innerHTML = '';

        var totalPanels = data.length;

        data.forEach(function (panelData, i) {
            var el = createPanelElement(panelData, i, totalPanels);

            // First half goes top, second half goes bottom
            // With dynamic grids, we split evenly
            var half = Math.ceil(totalPanels / 2);
            if (totalPanels <= 5) {
                // If 5 or fewer, all go on top row
                gridsTopContainer.appendChild(el);
            } else {
                if (i < half) {
                    gridsTopContainer.appendChild(el);
                } else {
                    gridsBottomContainer.appendChild(el);
                }
            }
        });

        // Update grid layout columns based on panel count
        updateGridLayout(totalPanels);
    }

    function updateGridLayout(totalPanels) {
        var topCount = totalPanels <= 5 ? totalPanels : Math.ceil(totalPanels / 2);
        var bottomCount = totalPanels <= 5 ? 0 : totalPanels - topCount;

        var maxCols = Math.max(topCount, bottomCount, 1);

        // Update CSS variable for panel sizing
        document.documentElement.style.setProperty('--grid-cols', maxCols);

        // Update the grids-area grid template
        gridsTopContainer.style.gridTemplateColumns = 'repeat(' + topCount + ', 1fr)';
        if (bottomCount > 0) {
            gridsBottomContainer.style.gridTemplateColumns = 'repeat(' + bottomCount + ', 1fr)';
            gridsBottomContainer.style.display = 'grid';
        } else {
            gridsBottomContainer.style.display = 'none';
        }
    }

    // ── Delete ───────────────────────────────────
    function deleteItem(panelIndex, slotIndex) {
        var data = loadData();
        if (!data || !data[panelIndex]) return;
        data[panelIndex].items.splice(slotIndex, 1);
        saveData(data);
        // Re-render just this panel
        var panels = document.querySelectorAll('.shortcut-panel[data-panel-index="' + panelIndex + '"]');
        if (panels.length > 0) {
            renderPanel(panels[0], panelIndex, data[panelIndex].items, true);
        }
    }

    // ── Add / Edit Modal ─────────────────────────
    function openAddModal(panelIndex) {
        addTarget.panelIndex = panelIndex;
        addTarget.editIndex = -1;
        modalUrl.value = '';
        modalName.value = '';
        modalIcon.value = '';
        if (modalIconSource) modalIconSource.value = 'direct';
        if (modalTitle) modalTitle.textContent = 'Add Shortcut';
        if (modalConfirm) modalConfirm.textContent = 'Add';
        if (modalNameField) modalNameField.style.display = '';
        if (modalIconField) modalIconField.style.display = '';
        if (modalSourceField) modalSourceField.style.display = '';
        modal.classList.add('open');
        setTimeout(function () { modalUrl.focus(); }, 100);
    }

    function openEditModal(panelIndex, slotIndex) {
        var data = loadData();
        if (!data || !data[panelIndex] || !data[panelIndex].items[slotIndex]) return;
        var item = data[panelIndex].items[slotIndex];

        addTarget.panelIndex = panelIndex;
        addTarget.editIndex = slotIndex;
        modalUrl.value = item.url || '';
        modalName.value = '';
        modalIcon.value = '';
        if (modalTitle) modalTitle.textContent = 'Edit Shortcut';
        if (modalConfirm) modalConfirm.textContent = 'Save';
        if (modalNameField) modalNameField.style.display = 'none';
        if (modalIconField) modalIconField.style.display = 'none';
        if (modalSourceField) modalSourceField.style.display = '';
        if (modalIconSource) modalIconSource.value = 'direct';
        modal.classList.add('open');
        setTimeout(function () { modalUrl.focus(); }, 100);
    }

    function closeModal() {
        modal.classList.remove('open');
        addTarget.panelIndex = -1;
        addTarget.editIndex = -1;
    }

    function getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return '';
        }
    }

    // Convert an image URL to a base64 data URL for offline storage
    function imageToBase64(imgUrl, callback) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            try {
                var c = document.createElement('canvas');
                var size = Math.min(Math.max(img.naturalWidth, 64), 128);
                c.width = size;
                c.height = size;
                c.getContext('2d').drawImage(img, 0, 0, size, size);
                callback(c.toDataURL('image/png'));
            } catch (e) {
                callback(imgUrl);
            }
        };
        img.onerror = function () { callback(imgUrl); };
        img.src = imgUrl;
    }

    function confirmAdd() {
        var url = modalUrl.value.trim();
        var name = modalName.value.trim();
        var icon = modalIcon.value.trim();

        if (!url) { modalUrl.focus(); return; }

        // Auto-prefix https if missing
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        // Auto-generate name from domain if empty
        if (!name) {
            var domain = getDomain(url);
            name = domain.replace(/^www\./, '').split('.')[0];
            name = name.charAt(0).toUpperCase() + name.slice(1);
        }

        var isIconUrl = icon && /^https?:\/\//i.test(icon);

        var newItem = {
            url: url,
            name: name,
            icon: isIconUrl ? null : (icon || null),
            favicon: null
        };

        // Save item to data and re-render
        function finishSave() {
            var data = loadData();
            if (!data || addTarget.panelIndex < 0) return;

            var panelData = data[addTarget.panelIndex];
            var pi = addTarget.panelIndex;

            if (addTarget.editIndex >= 0) {
                panelData.items[addTarget.editIndex] = newItem;
            } else {
                if (panelData.items.length >= MAX_ITEMS) return;
                panelData.items.push(newItem);
            }

            saveData(data);

            // Re-render the specific panel
            var panels = document.querySelectorAll('.shortcut-panel[data-panel-index="' + pi + '"]');
            if (panels.length > 0) {
                var isEditing = panels[0].classList.contains('editing');
                renderPanel(panels[0], pi, panelData.items, isEditing);
            }
            closeModal();
        }

        // Custom image URL → convert to base64 for offline use
        if (isIconUrl) {
            imageToBase64(icon, function (dataUrl) {
                newItem.favicon = dataUrl;
                finishSave();
            });
            return;
        }

        // If no custom icon, use selected favicon source
        if (!icon) {
            var source = modalIconSource ? modalIconSource.value : 'google';
            var domain = getDomain(url);
            switch (source) {
                case 'direct':
                    newItem.favicon = 'https://' + domain + '/favicon.ico';
                    break;
                case 'duckduckgo':
                    newItem.favicon = 'https://icons.duckduckgo.com/ip3/' + domain + '.ico';
                    break;
                case 'iconhorse':
                    newItem.favicon = 'https://icon.horse/icon/' + domain;
                    break;
                case 'clearbit':
                    newItem.favicon = 'https://logo.clearbit.com/' + domain;
                    break;
                case 'faviconkit':
                    newItem.favicon = 'https://api.faviconkit.com/' + domain + '/128';
                    break;
                case 'yandex':
                    newItem.favicon = 'https://favicon.yandex.net/favicon/v2/' + domain + '?size=120';
                    break;
                case 'globe':
                    newItem.favicon = null;
                    newItem.icon = 'fas fa-globe';
                    break;
                case 'google':
                default:
                    newItem.favicon = 'https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=' + encodeURIComponent(url) + '&size=128';
                    break;
            }
        }

        // Convert favicon URL to base64 for offline use, then save
        if (newItem.favicon && /^https?:\/\//i.test(newItem.favicon)) {
            imageToBase64(newItem.favicon, function (dataUrl) {
                newItem.favicon = dataUrl;
                finishSave();
            });
            return;
        }

        finishSave();
    }

    // Modal events
    if (modalConfirm) modalConfirm.addEventListener('click', confirmAdd);
    if (modalCancel) modalCancel.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });
        [modalUrl, modalName, modalIcon].forEach(function (input) {
            if (input) {
                input.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') confirmAdd();
                    if (e.key === 'Escape') closeModal();
                });
            }
        });
    }

    // ── Add Grid ─────────────────────────────────
    function openAddGridModal() {
        gridNameInput.value = '';
        addGridModal.classList.add('open');
        setTimeout(function () { gridNameInput.focus(); }, 100);
    }

    function closeAddGridModal() {
        addGridModal.classList.remove('open');
    }

    function confirmAddGrid() {
        var name = gridNameInput.value.trim() || 'New Grid';
        var data = loadData() || [];
        data.push({ name: name, items: [] });
        saveData(data);
        closeAddGridModal();
        renderAllGrids();
    }

    if (addGridBtn) addGridBtn.addEventListener('click', openAddGridModal);
    if (gridModalConfirm) gridModalConfirm.addEventListener('click', confirmAddGrid);
    if (gridModalCancel) gridModalCancel.addEventListener('click', closeAddGridModal);
    if (addGridModal) {
        addGridModal.addEventListener('click', function (e) {
            if (e.target === addGridModal) closeAddGridModal();
        });
    }
    if (gridNameInput) {
        gridNameInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') confirmAddGrid();
            if (e.key === 'Escape') closeAddGridModal();
        });
    }

    // ── Clock ────────────────────────────────────
    function initClock() {
        var timeEl = document.getElementById('clock-time');
        var dateEl = document.getElementById('clock-date');
        if (!timeEl || !dateEl) return;

        function updateClock() {
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, '0');
            var minutes = String(now.getMinutes()).padStart(2, '0');
            var seconds = String(now.getSeconds()).padStart(2, '0');
            timeEl.textContent = hours + ':' + minutes + ':' + seconds;

            var day = String(now.getDate()).padStart(2, '0');
            var month = String(now.getMonth() + 1).padStart(2, '0');
            var year = String(now.getFullYear()).slice(-2);
            dateEl.textContent = day + '/' + month + '/' + year;
        }

        updateClock();
        setInterval(updateClock, 1000);
    }

    // ── Cache all favicons as base64 for offline use ──
    function cacheAllFavicons() {
        var data = loadData();
        if (!data) return;

        var queue = [];
        data.forEach(function (panel, pi) {
            panel.items.forEach(function (item, si) {
                if (item.favicon && /^https?:\/\//i.test(item.favicon)) {
                    queue.push({ pi: pi, si: si, url: item.favicon });
                }
            });
        });

        if (queue.length === 0) return;

        var processed = 0;
        var changed = false;

        function processNext() {
            if (processed >= queue.length) {
                if (changed) {
                    saveData(data);
                    renderAllGrids();
                }
                return;
            }

            var entry = queue[processed++];
            imageToBase64(entry.url, function (dataUrl) {
                if (dataUrl && dataUrl.indexOf('data:') === 0) {
                    data[entry.pi].items[entry.si].favicon = dataUrl;
                    changed = true;
                }
                setTimeout(processNext, 50);
            });
        }

        setTimeout(processNext, 1000);
    }

    // ── Init ─────────────────────────────────────
    function init() {
        var userName = getUserName();

        // First visit: show welcome modal
        if (!userName) {
            showWelcome();
            initClock();
            return;
        }

        // Returning user
        applyUserName(userName);

        // If no grid data, create a default empty grid
        if (!loadData()) {
            saveData([{ name: 'My Shortcuts', items: [] }]);
        }

        renderAllGrids();
        initClock();
        cacheAllFavicons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
