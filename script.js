// =============================================
//  Homepage – Dynamic Grids + User Setup
// =============================================
(function () {
    const MAX_ITEMS = 9;
    const STORAGE_KEY = 'homepage-grid-data';
    const USER_KEY = 'homepage-user-name';
    const WALLPAPER_KEY = 'homepage-custom-wallpaper';
    const SETTINGS_KEY = 'homepage-settings';

    const DEFAULT_SETTINGS = {
        wallpaperDim: 20,
        wallpaperBlur: 0,
        tileShape: 'circle',
        timeFormat: '24h',
        showSeconds: true,
        dateFormat: 'dd/mm/yy',
        defaultEngine: 'google',
        showLabels: true
    };

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

    const backupBtn = document.getElementById('backup-btn');
    const backupModal = document.getElementById('backup-modal');
    const backupModalClose = document.getElementById('backup-modal-close');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const importJsonBtn = document.getElementById('import-json-btn');
    const copyJsonBtn = document.getElementById('copy-json-btn');
    const backupFileInput = document.getElementById('backup-file-input');
    const backupPreview = document.getElementById('backup-preview');
    const previewFilename = document.getElementById('preview-filename');
    const previewStats = document.getElementById('preview-stats');
    const previewRemoveBtn = document.getElementById('preview-remove-btn');
    const importModeContainer = document.getElementById('import-mode-container');
    const importConfirmBtn = document.getElementById('import-confirm-btn');

    const wallpaperThumb = document.getElementById('wallpaper-thumb');
    const wallpaperFileInput = document.getElementById('wallpaper-file-input');
    const wallpaperUploadBtn = document.getElementById('wallpaper-upload-btn');
    const wallpaperResetBtn = document.getElementById('wallpaper-reset-btn');

    // Settings Controls
    const settingBgDim = document.getElementById('setting-bg-dim');
    const bgDimLabel = document.getElementById('bg-dim-label');
    const settingBgBlur = document.getElementById('setting-bg-blur');
    const bgBlurLabel = document.getElementById('bg-blur-label');
    const tileShapeGroup = document.getElementById('tile-shape-group');
    const settingShowLabels = document.getElementById('setting-show-labels');
    const settingUserName = document.getElementById('setting-user-name');
    const settingNameSaveBtn = document.getElementById('setting-name-save-btn');
    const timeFormatGroup = document.getElementById('time-format-group');
    const settingShowSeconds = document.getElementById('setting-show-seconds');
    const settingDateFormat = document.getElementById('setting-date-format');
    const settingDefaultEngine = document.getElementById('setting-default-engine');

    const factoryResetBtn = document.getElementById('factory-reset-btn');

    const toastEl = document.getElementById('toast-notification');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');

    const gridsTopContainer = document.getElementById('grids-top');
    const gridsBottomContainer = document.getElementById('grids-bottom');
    const editGridBtn = document.getElementById('edit-grid-btn');

    // Dashboard Edit Mode & Slot Placement
    let isDashboardEditing = false;
    let targetGridSlotForAdd = -1;

    // Track which panel & slot we're adding/editing
    let addTarget = { panelIndex: -1, editIndex: -1 };
    let pendingImportData = null;
    let toastTimeout = null;

    // ── Data Layer ──────────────────────────────
    function loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try { return JSON.parse(stored); } catch (e) { }
        }
        return null;
    }

    function saveData(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        // Sync with extension storage for background context menus
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ [STORAGE_KEY]: data }, function () {
                if (chrome.runtime && chrome.runtime.sendMessage) {
                    try {
                        chrome.runtime.sendMessage({ type: 'UPDATE_CONTEXT_MENUS' }, function () {
                            if (chrome.runtime.lastError) { /* ignore */ }
                        });
                    } catch (e) { }
                }
            });
        }
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

    // ── Smart Slot Assignment ───────────────────
    function assignDefaultSlots(data) {
        if (!Array.isArray(data)) return;
        var usedSlots = new Set();
        data.forEach(function (p) {
            if (typeof p.slot === 'number' && p.slot >= 0 && p.slot < 10 && !usedSlots.has(p.slot)) {
                usedSlots.add(p.slot);
            } else {
                delete p.slot;
            }
        });

        var count = data.length;
        var defaultPresets = {
            1: [2],
            2: [1, 3],
            3: [1, 2, 3],
            4: [0, 1, 2, 3],
            5: [0, 1, 2, 3, 4],
            6: [0, 1, 2, 3, 4, 7],
            7: [0, 1, 2, 3, 4, 6, 8],
            8: [0, 1, 2, 3, 4, 6, 7, 8],
            9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
            10: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        };

        var allHaveSlots = data.every(function (p) { return typeof p.slot === 'number'; });
        if (!allHaveSlots) {
            var presets = defaultPresets[count] || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            data.forEach(function (p, idx) {
                if (typeof p.slot !== 'number') {
                    var pref = presets[idx];
                    if (typeof pref === 'number' && !usedSlots.has(pref)) {
                        p.slot = pref;
                        usedSlots.add(pref);
                    } else {
                        for (var s = 0; s < 10; s++) {
                            if (!usedSlots.has(s)) {
                                p.slot = s;
                                usedSlots.add(s);
                                break;
                            }
                        }
                    }
                }
            });
        }
    }

    // ── Grid Rendering ──────────────────────────
    function createPanelElement(panelData, panelIndex, totalPanels, slotIndex) {
        var section = document.createElement('section');
        section.className = 'shortcut-panel';
        section.dataset.panelIndex = panelIndex;
        section.dataset.slotIndex = slotIndex;

        // In Dashboard Edit Mode, make whole panel draggable between slots
        if (isDashboardEditing) {
            section.setAttribute('draggable', 'true');

            section.addEventListener('dragstart', function (e) {
                e.stopPropagation();
                e.dataTransfer.setData('application/grid-slot', slotIndex.toString());
                e.dataTransfer.effectAllowed = 'move';
                section.classList.add('dragging-grid');
            });

            section.addEventListener('dragend', function (e) {
                e.stopPropagation();
                section.classList.remove('dragging-grid');
                document.querySelectorAll('.slot-drag-over').forEach(function (el) {
                    el.classList.remove('slot-drag-over');
                });
            });
        }

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

        // Render items (master edit mode controls editing state across all panels)
        renderPanel(section, panelIndex, panelData.items, isDashboardEditing);

        // Delete grid button on top of grid (prominent in Dashboard Edit Mode)
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
            var idx = data.findIndex(function (p) { return p.slot === slotIndex; });
            if (idx >= 0) {
                data.splice(idx, 1);
                saveData(data);
                renderAllGrids();
                showToast('Grid deleted', 'info');
            }
        });
        section.appendChild(deleteBtn);

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

            // Single-click opens in current tab, double-click opens in new tab
            (function (linkUrl) {
                var clickTimer = null;
                a.addEventListener('click', function (e) {
                    if (editing) {
                        e.preventDefault();
                        return;
                    }
                    e.preventDefault();
                    if (clickTimer === null) {
                        clickTimer = setTimeout(function () {
                            clickTimer = null;
                            window.location.href = linkUrl;
                        }, 240);
                    }
                });

                a.addEventListener('dblclick', function (e) {
                    if (editing) return;
                    e.preventDefault();
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    window.open(linkUrl, '_blank');
                });
            })(item.url);

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
                        e.stopPropagation(); // Don't drag parent grid
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', String(si));
                        e.dataTransfer.setData('application/panel-index', String(pi));
                        var self = this;
                        setTimeout(function () { self.classList.add('dragging'); }, 0);
                    });

                    div.addEventListener('dragend', function (e) {
                        e.stopPropagation();
                        this.classList.remove('dragging');
                        document.querySelectorAll('.site-item.drag-over, .add-slot.drag-over').forEach(function (el) {
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
                        e.stopPropagation();
                        this.classList.remove('drag-over');

                        var fromPanel = parseInt(e.dataTransfer.getData('application/panel-index'), 10);
                        var fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        var toIndex = si;

                        if (isNaN(fromPanel) || isNaN(fromIndex)) return;

                        var data = loadData();
                        if (!data || !data[fromPanel] || !data[pi]) return;

                        if (fromPanel === pi) {
                            // Reorder inside SAME grid
                            if (fromIndex === toIndex) return;
                            var arr = data[pi].items;
                            var moved = arr.splice(fromIndex, 1)[0];
                            arr.splice(toIndex, 0, moved);
                            saveData(data);
                            renderPanel(panel, pi, arr, true);
                        } else {
                            // Move or Swap ACROSS DIFFERENT grids
                            var sourceArr = data[fromPanel].items;
                            var targetArr = data[pi].items;
                            var movedItem = sourceArr.splice(fromIndex, 1)[0];

                            if (targetArr.length >= MAX_ITEMS) {
                                // Target grid is full -> swap positions
                                var swappedItem = targetArr.splice(toIndex, 1, movedItem)[0];
                                sourceArr.splice(fromIndex, 0, swappedItem);
                                showToast('Swapped shortcuts between grids', 'info');
                            } else {
                                // Target grid has space -> insert at toIndex
                                targetArr.splice(toIndex, 0, movedItem);
                                showToast('Moved shortcut to ' + (data[pi].name || 'grid'), 'success');
                            }

                            saveData(data);
                            renderAllGrids();
                        }
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

                    // Allow dropping a shortcut onto an empty Add slot from ANY grid
                    addDiv.addEventListener('dragover', function (e) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                    });
                    addDiv.addEventListener('dragenter', function (e) {
                        e.preventDefault();
                        addDiv.classList.add('drag-over');
                    });
                    addDiv.addEventListener('dragleave', function () {
                        addDiv.classList.remove('drag-over');
                    });
                    addDiv.addEventListener('drop', function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        addDiv.classList.remove('drag-over');

                        var fromPanel = parseInt(e.dataTransfer.getData('application/panel-index'), 10);
                        var fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (isNaN(fromPanel) || isNaN(fromIndex)) return;

                        var data = loadData();
                        if (!data || !data[fromPanel] || !data[panelIndex]) return;

                        if (data[panelIndex].items.length >= MAX_ITEMS) {
                            showToast('Target grid is full', 'error');
                            return;
                        }

                        var movedItem = data[fromPanel].items.splice(fromIndex, 1)[0];
                        data[panelIndex].items.push(movedItem);
                        saveData(data);
                        renderAllGrids();
                        showToast('Moved shortcut to ' + (data[panelIndex].name || 'grid'), 'success');
                    });

                    grid.appendChild(addDiv);
                })(s);
            }
        }
    }

    function renderAllGrids() {
        var data = loadData();
        if (!data) return;

        assignDefaultSlots(data);
        saveData(data);

        gridsTopContainer.innerHTML = '';
        gridsBottomContainer.innerHTML = '';

        var totalPanels = data.length;
        var hasBottomGrids = data.some(function (p) { return p.slot >= 5 && p.slot <= 9; });

        function createSlotElement(slotNumber) {
            var slotDiv = document.createElement('div');
            slotDiv.className = 'grid-slot-placeholder';
            slotDiv.dataset.slot = slotNumber;

            var panelData = data.find(function (p) { return p.slot === slotNumber; });

            if (panelData) {
                var panelIdx = data.indexOf(panelData);
                var panelEl = createPanelElement(panelData, panelIdx, totalPanels, slotNumber);
                slotDiv.appendChild(panelEl);
            } else {
                slotDiv.classList.add('empty-slot');
                slotDiv.innerHTML = '<div class="slot-hint"><i class="fas fa-plus"></i><span>Slot ' + (slotNumber + 1) + '</span></div>';

                if (isDashboardEditing) {
                    slotDiv.addEventListener('click', function () {
                        targetGridSlotForAdd = slotNumber;
                        openAddGridModal();
                    });
                }
            }

            // Drag and Drop listeners on all slots (empty or occupied)
            slotDiv.addEventListener('dragover', function (e) {
                if (!isDashboardEditing) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            slotDiv.addEventListener('dragenter', function (e) {
                if (!isDashboardEditing) return;
                e.preventDefault();
                slotDiv.classList.add('slot-drag-over');
            });

            slotDiv.addEventListener('dragleave', function () {
                if (!isDashboardEditing) return;
                slotDiv.classList.remove('slot-drag-over');
            });

            slotDiv.addEventListener('drop', function (e) {
                if (!isDashboardEditing) return;
                e.preventDefault();
                slotDiv.classList.remove('slot-drag-over');

                var fromSlotStr = e.dataTransfer.getData('application/grid-slot');
                if (!fromSlotStr && fromSlotStr !== '0') return;
                var fromSlot = parseInt(fromSlotStr, 10);
                var targetSlot = slotNumber;
                if (fromSlot === targetSlot) return;

                var currData = loadData();
                if (!currData) return;

                var sourceP = currData.find(function (p) { return p.slot === fromSlot; });
                var targetP = currData.find(function (p) { return p.slot === targetSlot; });

                if (sourceP) {
                    sourceP.slot = targetSlot;
                    if (targetP) {
                        targetP.slot = fromSlot;
                    }
                    saveData(currData);
                    renderAllGrids();
                }
            });

            return slotDiv;
        }

        // Render Top Row (Slots 0..4)
        for (var sTop = 0; sTop < 5; sTop++) {
            gridsTopContainer.appendChild(createSlotElement(sTop));
        }

        // Render Bottom Row (Slots 5..9)
        for (var sBot = 5; sBot < 10; sBot++) {
            gridsBottomContainer.appendChild(createSlotElement(sBot));
        }

        if (hasBottomGrids || isDashboardEditing) {
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
            renderPanel(panels[0], panelIndex, data[panelIndex].items, isDashboardEditing);
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
        modalName.value = item.name || '';
        modalIcon.value = item.icon || '';
        if (modalTitle) modalTitle.textContent = 'Edit Shortcut';
        if (modalConfirm) modalConfirm.textContent = 'Save';
        if (modalNameField) modalNameField.style.display = '';
        if (modalIconField) modalIconField.style.display = '';
        if (modalSourceField) modalSourceField.style.display = '';
        if (modalIconSource) modalIconSource.value = 'direct';
        modal.classList.add('open');
        setTimeout(function () { modalName.focus(); modalName.select(); }, 100);
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
                renderPanel(panels[0], pi, panelData.items, isDashboardEditing);
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

        if (data.length >= 10) {
            closeAddGridModal();
            showToast('Maximum 10 grids reached', 'error');
            return;
        }

        assignDefaultSlots(data);

        var slotToAssign = -1;
        var usedSlots = new Set(data.map(function (p) { return p.slot; }));

        if (targetGridSlotForAdd >= 0 && !usedSlots.has(targetGridSlotForAdd)) {
            slotToAssign = targetGridSlotForAdd;
        } else {
            for (var s = 0; s < 10; s++) {
                if (!usedSlots.has(s)) {
                    slotToAssign = s;
                    break;
                }
            }
        }
        targetGridSlotForAdd = -1;

        if (slotToAssign >= 0) {
            data.push({ name: name, items: [], slot: slotToAssign });
            saveData(data);
            closeAddGridModal();
            renderAllGrids();
            showToast('Grid added to Slot ' + (slotToAssign + 1), 'success');
        }
    }

    // ── Dashboard Edit Mode Toggle ───────────────
    function toggleDashboardEdit() {
        isDashboardEditing = !isDashboardEditing;
        document.body.classList.toggle('dashboard-editing', isDashboardEditing);
        if (editGridBtn) {
            editGridBtn.classList.toggle('active', isDashboardEditing);
            editGridBtn.innerHTML = isDashboardEditing
                ? '<i class="fas fa-check"></i>'
                : '<i class="fas fa-pen"></i>';
            editGridBtn.title = isDashboardEditing ? 'Done Editing Layout' : 'Edit Grid Layout';
        }
        renderAllGrids();
        if (isDashboardEditing) {
            showToast('✏️ Edit Mode: Drag grids into any slot, or click 🗑️ to delete', 'info');
        } else {
            showToast('Grid layout saved!', 'success');
        }
    }

    if (editGridBtn) editGridBtn.addEventListener('click', toggleDashboardEdit);
    if (addGridBtn) addGridBtn.addEventListener('click', function () {
        targetGridSlotForAdd = -1;
        openAddGridModal();
    });
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

    // ── Toast Helper ─────────────────────────────
    function showToast(message, type) {
        if (!toastEl || !toastMessage) return;
        type = type || 'success';
        clearTimeout(toastTimeout);
        toastMessage.textContent = message;
        toastEl.className = 'toast-notification show ' + type;
        if (toastIcon) {
            if (type === 'success') toastIcon.className = 'toast-icon fas fa-check-circle';
            else if (type === 'error') toastIcon.className = 'toast-icon fas fa-exclamation-circle';
            else toastIcon.className = 'toast-icon fas fa-info-circle';
        }
        toastTimeout = setTimeout(function () {
            toastEl.classList.remove('show');
        }, 3200);
    }

    // ── Wallpaper Management ──────────────────────
    function loadWallpaper() {
        return localStorage.getItem(WALLPAPER_KEY) || 'bg.jpg';
    }

    function applyWallpaper(url) {
        if (!url) url = 'bg.jpg';
        document.body.style.backgroundImage = 'url("' + url + '")';
        if (wallpaperThumb) {
            wallpaperThumb.src = url;
        }
    }

    function saveWallpaper(url) {
        localStorage.setItem(WALLPAPER_KEY, url);
        applyWallpaper(url);
    }

    function resetWallpaper() {
        localStorage.removeItem(WALLPAPER_KEY);
        applyWallpaper('bg.jpg');
        showToast('Wallpaper reset to default', 'info');
    }

    function processWallpaperImage(file) {
        if (!file) return;
        if (!file.type || file.type.indexOf('image/') !== 0) {
            showToast('Please select an image file (JPG, PNG, WebP)', 'error');
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                try {
                    var maxDimension = 2560;
                    var width = img.naturalWidth;
                    var height = img.naturalHeight;

                    if (width > maxDimension || height > maxDimension) {
                        if (width > height) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        } else {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }

                    var canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    saveWallpaper(dataUrl);
                    showToast('Wallpaper updated successfully!', 'success');
                } catch (err) {
                    saveWallpaper(e.target.result);
                    showToast('Wallpaper updated!', 'success');
                }
            };
            img.onerror = function () {
                showToast('Failed to load image file', 'error');
            };
            img.src = e.target.result;
        };
        reader.onerror = function () {
            showToast('Error reading image file', 'error');
        };
        reader.readAsDataURL(file);
    }

    // ── Settings Management ──────────────────────
    function loadSettings() {
        try {
            var stored = localStorage.getItem(SETTINGS_KEY);
            return stored ? Object.assign({}, DEFAULT_SETTINGS, JSON.parse(stored)) : Object.assign({}, DEFAULT_SETTINGS);
        } catch (e) {
            return Object.assign({}, DEFAULT_SETTINGS);
        }
    }

    function saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        applyAllSettings(settings);
    }

    function applyAllSettings(settings) {
        if (!settings) settings = loadSettings();

        // 1. Background Dim & Blur
        var dimRatio = (settings.wallpaperDim / 100).toFixed(2);
        document.documentElement.style.setProperty('--bg-dim', dimRatio);
        document.documentElement.style.setProperty('--bg-blur', settings.wallpaperBlur + 'px');

        // 2. Tile Shape
        var radius = '50%';
        if (settings.tileShape === 'squircle') radius = '14px';
        else if (settings.tileShape === 'square') radius = '4px';
        document.documentElement.style.setProperty('--tile-radius', radius);

        // 3. Shortcut Labels
        if (settings.showLabels === false) {
            document.body.classList.add('hide-shortcut-labels');
        } else {
            document.body.classList.remove('hide-shortcut-labels');
        }

        // 4. Default Search Engine
        if (window.setSearchEngine && settings.defaultEngine) {
            window.setSearchEngine(settings.defaultEngine);
        }
    }

    function syncSettingsUI(settings) {
        if (!settings) settings = loadSettings();

        if (settingBgDim) {
            settingBgDim.value = settings.wallpaperDim;
            if (bgDimLabel) bgDimLabel.textContent = settings.wallpaperDim + '%';
        }
        if (settingBgBlur) {
            settingBgBlur.value = settings.wallpaperBlur;
            if (bgBlurLabel) bgBlurLabel.textContent = settings.wallpaperBlur + 'px';
        }

        if (tileShapeGroup) {
            var shapeBtns = tileShapeGroup.querySelectorAll('.segment-btn');
            shapeBtns.forEach(function (btn) {
                if (btn.dataset.shape === settings.tileShape) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        if (settingShowLabels) settingShowLabels.checked = (settings.showLabels !== false);
        if (settingUserName) settingUserName.value = getUserName();

        if (timeFormatGroup) {
            var timeBtns = timeFormatGroup.querySelectorAll('.segment-btn');
            timeBtns.forEach(function (btn) {
                if (btn.dataset.time === settings.timeFormat) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        if (settingShowSeconds) settingShowSeconds.checked = (settings.showSeconds !== false);
        if (settingDateFormat) settingDateFormat.value = settings.dateFormat || 'dd/mm/yy';
        if (settingDefaultEngine) settingDefaultEngine.value = settings.defaultEngine || 'google';
    }

    function handleFactoryReset() {
        if (!confirm('⚠️ Are you sure you want to reset HomeDesk to factory defaults?\n\nThis will clear all shortcuts, custom grids, wallpapers, and personalized settings.')) {
            return;
        }
        localStorage.clear();
        showToast('Dashboard reset to factory defaults', 'info');
        setTimeout(function () {
            window.location.reload();
        }, 400);
    }

    // ── Backup & Restore ─────────────────────────
    function openBackupModal() {
        clearPendingImport();
        var currentSettings = loadSettings();
        syncSettingsUI(currentSettings);
        if (wallpaperThumb) {
            wallpaperThumb.src = loadWallpaper();
        }
        if (backupModal) backupModal.classList.add('open');
    }

    function closeBackupModal() {
        if (backupModal) backupModal.classList.remove('open');
        clearPendingImport();
    }

    function generateBackupPayload() {
        var grids = loadData() || [];
        var userName = getUserName();
        var customWallpaper = localStorage.getItem(WALLPAPER_KEY) || null;
        var settings = loadSettings();
        return {
            version: 1,
            app: 'HomeDesk',
            exportedAt: new Date().toISOString(),
            userName: userName,
            wallpaper: customWallpaper,
            settings: settings,
            grids: grids
        };
    }

    function exportBackupFile() {
        var payload = generateBackupPayload();
        var jsonStr = JSON.stringify(payload, null, 2);
        var blob = new Blob([jsonStr], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var now = new Date();
        var dateStr = now.toISOString().slice(0, 10);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'homedesk-backup-' + dateStr + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Backup file downloaded!', 'success');
    }

    function copyBackupToClipboard() {
        var payload = generateBackupPayload();
        var jsonStr = JSON.stringify(payload, null, 2);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(jsonStr).then(function () {
                showToast('Backup JSON copied to clipboard!', 'success');
            }).catch(function () {
                fallbackCopyText(jsonStr);
            });
        } else {
            fallbackCopyText(jsonStr);
        }
    }

    function fallbackCopyText(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            document.execCommand('copy');
            showToast('Backup JSON copied to clipboard!', 'success');
        } catch (err) {
            showToast('Failed to copy to clipboard', 'error');
        }
        document.body.removeChild(ta);
    }

    function validateAndParseBackup(jsonText) {
        var parsed;
        try {
            parsed = JSON.parse(jsonText);
        } catch (e) {
            throw new Error('Invalid JSON file format');
        }

        var grids = [];
        var userName = '';
        var wallpaper = null;
        var settings = null;

        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.grids)) {
            grids = parsed.grids;
            userName = typeof parsed.userName === 'string' ? parsed.userName : '';
            wallpaper = typeof parsed.wallpaper === 'string' ? parsed.wallpaper : null;
            settings = (parsed.settings && typeof parsed.settings === 'object') ? parsed.settings : null;
        } else if (Array.isArray(parsed)) {
            grids = parsed;
        } else {
            throw new Error('Unrecognized backup format. Expected grids array or HomeDesk backup.');
        }

        var sanitizedGrids = [];
        var totalShortcuts = 0;

        grids.forEach(function (g, idx) {
            if (!g || typeof g !== 'object') return;
            var gridName = typeof g.name === 'string' && g.name.trim() ? g.name.trim() : ('Grid ' + (idx + 1));
            var items = [];
            if (Array.isArray(g.items)) {
                g.items.forEach(function (it) {
                    if (!it || typeof it !== 'object' || !it.url) return;
                    items.push({
                        url: String(it.url),
                        name: it.name ? String(it.name) : 'Shortcut',
                        icon: it.icon ? String(it.icon) : null,
                        favicon: it.favicon ? String(it.favicon) : null
                    });
                    totalShortcuts++;
                });
            }
            sanitizedGrids.push({
                name: gridName,
                items: items
            });
        });

        if (sanitizedGrids.length === 0) {
            throw new Error('Backup contains no valid grids.');
        }

        return {
            userName: userName,
            wallpaper: wallpaper,
            settings: settings,
            grids: sanitizedGrids,
            totalGrids: sanitizedGrids.length,
            totalShortcuts: totalShortcuts
        };
    }

    function handleFileSelection(file) {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json' && file.type !== '') {
            showToast('Please select a valid .json file', 'error');
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var result = validateAndParseBackup(e.target.result);
                pendingImportData = result;

                if (previewFilename) previewFilename.textContent = file.name;
                if (previewStats) {
                    var statsText = result.totalGrids + ' Grid' + (result.totalGrids === 1 ? '' : 's') + ' • ' + result.totalShortcuts + ' Shortcut' + (result.totalShortcuts === 1 ? '' : 's');
                    if (result.userName) {
                        statsText += ' • User: ' + result.userName;
                    }
                    previewStats.textContent = statsText;
                }

                if (backupPreview) backupPreview.style.display = 'flex';
                if (importModeContainer) importModeContainer.style.display = 'block';
                if (importConfirmBtn) importConfirmBtn.disabled = false;
            } catch (err) {
                showToast(err.message || 'Failed to read backup file', 'error');
                clearPendingImport();
            }
        };
        reader.onerror = function () {
            showToast('Error reading backup file', 'error');
            clearPendingImport();
        };
        reader.readAsText(file);
    }

    function clearPendingImport() {
        pendingImportData = null;
        if (backupFileInput) backupFileInput.value = '';
        if (backupPreview) backupPreview.style.display = 'none';
        if (importModeContainer) importModeContainer.style.display = 'none';
        if (importConfirmBtn) importConfirmBtn.disabled = false;
    }

    function applyImport() {
        if (!pendingImportData) return;

        var modeInput = document.querySelector('input[name="import-mode"]:checked');
        var mode = modeInput ? modeInput.value : 'replace';

        if (mode === 'replace') {
            saveData(pendingImportData.grids);
            if (pendingImportData.userName) {
                setUserName(pendingImportData.userName);
                applyUserName(pendingImportData.userName);
            }
            if (pendingImportData.wallpaper) {
                saveWallpaper(pendingImportData.wallpaper);
            }
            if (pendingImportData.settings) {
                saveSettings(pendingImportData.settings);
            }
        } else {
            var currentData = loadData() || [];
            var merged = currentData.concat(pendingImportData.grids);
            saveData(merged);
            if (!getUserName() && pendingImportData.userName) {
                setUserName(pendingImportData.userName);
                applyUserName(pendingImportData.userName);
            }
            if (!localStorage.getItem(WALLPAPER_KEY) && pendingImportData.wallpaper) {
                saveWallpaper(pendingImportData.wallpaper);
            }
        }

        renderAllGrids();
        cacheAllFavicons();
        closeBackupModal();
        showToast('Restored ' + pendingImportData.totalGrids + ' grid(s) and ' + pendingImportData.totalShortcuts + ' shortcut(s)!', 'success');
    }

    // ── Wallpaper Events ─────────────────────────
    if (wallpaperUploadBtn && wallpaperFileInput) {
        wallpaperUploadBtn.addEventListener('click', function () {
            wallpaperFileInput.click();
        });

        wallpaperFileInput.addEventListener('change', function () {
            if (wallpaperFileInput.files && wallpaperFileInput.files[0]) {
                processWallpaperImage(wallpaperFileInput.files[0]);
                wallpaperFileInput.value = '';
            }
        });
    }

    if (wallpaperResetBtn) {
        wallpaperResetBtn.addEventListener('click', resetWallpaper);
    }

    // ── Settings Events ──────────────────────────
    // Dim slider
    if (settingBgDim) {
        settingBgDim.addEventListener('input', function () {
            var val = parseInt(settingBgDim.value, 10);
            if (bgDimLabel) bgDimLabel.textContent = val + '%';
            var s = loadSettings();
            s.wallpaperDim = val;
            saveSettings(s);
        });
    }

    // Blur slider
    if (settingBgBlur) {
        settingBgBlur.addEventListener('input', function () {
            var val = parseInt(settingBgBlur.value, 10);
            if (bgBlurLabel) bgBlurLabel.textContent = val + 'px';
            var s = loadSettings();
            s.wallpaperBlur = val;
            saveSettings(s);
        });
    }

    // Tile shape segment group
    if (tileShapeGroup) {
        var shapeBtns = tileShapeGroup.querySelectorAll('.segment-btn');
        shapeBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var shape = btn.dataset.shape;
                var s = loadSettings();
                s.tileShape = shape;
                saveSettings(s);
                shapeBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
            });
        });
    }

    // Show labels toggle
    if (settingShowLabels) {
        settingShowLabels.addEventListener('change', function () {
            var s = loadSettings();
            s.showLabels = settingShowLabels.checked;
            saveSettings(s);
        });
    }

    // Display name save
    function saveNameFromSettings() {
        if (!settingUserName) return;
        var newName = settingUserName.value.trim();
        if (newName) {
            setUserName(newName);
            applyUserName(newName);
            showToast('Display name updated!', 'success');
        } else {
            showToast('Please enter a valid name', 'error');
        }
    }

    if (settingNameSaveBtn) {
        settingNameSaveBtn.addEventListener('click', saveNameFromSettings);
    }
    if (settingUserName) {
        settingUserName.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') saveNameFromSettings();
        });
    }

    // Time format segment group
    if (timeFormatGroup) {
        var timeBtns = timeFormatGroup.querySelectorAll('.segment-btn');
        timeBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tf = btn.dataset.time;
                var s = loadSettings();
                s.timeFormat = tf;
                saveSettings(s);
                timeBtns.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
            });
        });
    }

    // Show seconds toggle
    if (settingShowSeconds) {
        settingShowSeconds.addEventListener('change', function () {
            var s = loadSettings();
            s.showSeconds = settingShowSeconds.checked;
            saveSettings(s);
        });
    }

    // Date format select
    if (settingDateFormat) {
        settingDateFormat.addEventListener('change', function () {
            var s = loadSettings();
            s.dateFormat = settingDateFormat.value;
            saveSettings(s);
        });
    }

    // Default engine select
    if (settingDefaultEngine) {
        settingDefaultEngine.addEventListener('change', function () {
            var s = loadSettings();
            s.defaultEngine = settingDefaultEngine.value;
            saveSettings(s);
            if (window.setSearchEngine) {
                window.setSearchEngine(s.defaultEngine);
            }
        });
    }





    // Factory reset button
    if (factoryResetBtn) {
        factoryResetBtn.addEventListener('click', handleFactoryReset);
    }

    // ── Backup & Restore Events ───────────────────
    if (backupBtn) backupBtn.addEventListener('click', openBackupModal);
    if (backupModalClose) backupModalClose.addEventListener('click', closeBackupModal);
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportBackupFile);
    if (copyJsonBtn) copyJsonBtn.addEventListener('click', copyBackupToClipboard);
    if (importConfirmBtn) importConfirmBtn.addEventListener('click', applyImport);
    if (previewRemoveBtn) previewRemoveBtn.addEventListener('click', clearPendingImport);

    if (importJsonBtn && backupFileInput) {
        importJsonBtn.addEventListener('click', function () {
            backupFileInput.click();
        });
    }

    if (backupFileInput) {
        backupFileInput.addEventListener('change', function () {
            if (backupFileInput.files && backupFileInput.files[0]) {
                handleFileSelection(backupFileInput.files[0]);
            }
        });
    }

    if (backupModal) {
        backupModal.addEventListener('click', function (e) {
            if (e.target === backupModal) closeBackupModal();
        });

        backupModal.addEventListener('dragover', function (e) {
            e.preventDefault();
        });

        backupModal.addEventListener('drop', function (e) {
            e.preventDefault();
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelection(e.dataTransfer.files[0]);
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && backupModal && backupModal.classList.contains('open')) {
            closeBackupModal();
        }
    });

    // ── Clock ────────────────────────────────────
    function initClock() {
        var timeEl = document.getElementById('clock-time');
        var dateEl = document.getElementById('clock-date');
        if (!timeEl || !dateEl) return;

        function updateClock() {
            var settings = loadSettings();
            var now = new Date();

            var hours = now.getHours();
            var minutes = String(now.getMinutes()).padStart(2, '0');
            var seconds = String(now.getSeconds()).padStart(2, '0');
            var ampm = '';

            if (settings.timeFormat === '12h') {
                ampm = hours >= 12 ? ' PM' : ' AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // 0 becomes 12
            }
            var hoursStr = String(hours).padStart(2, '0');

            var timeStr = hoursStr + ':' + minutes;
            if (settings.showSeconds !== false) {
                timeStr += ':' + seconds;
            }
            timeStr += ampm;
            timeEl.textContent = timeStr;

            var day = String(now.getDate()).padStart(2, '0');
            var month = String(now.getMonth() + 1).padStart(2, '0');
            var year = String(now.getFullYear()).slice(-2);

            var dateStr = '';
            if (settings.dateFormat === 'mm/dd/yy') {
                dateStr = month + '/' + day + '/' + year;
            } else if (settings.dateFormat === 'text') {
                var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                dateStr = days[now.getDay()] + ', ' + day + ' ' + months[now.getMonth()];
            } else {
                // dd/mm/yy default
                dateStr = day + '/' + month + '/' + year;
            }
            dateEl.textContent = dateStr;
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
        // Load and apply all user settings
        var settings = loadSettings();
        applyAllSettings(settings);

        // Load custom wallpaper if set
        applyWallpaper(loadWallpaper());

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

        // Listen for storage changes from Background Service Worker (e.g. added via right-click)
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener(function (changes, areaName) {
                if (areaName === 'local' && changes[STORAGE_KEY]) {
                    var newData = changes[STORAGE_KEY].newValue;
                    if (newData && Array.isArray(newData)) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
                        renderAllGrids();
                    }
                }
            });
        }

        // Initial sync from chrome.storage.local if available
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get([STORAGE_KEY], function (res) {
                var extData = res[STORAGE_KEY];
                var localData = loadData();
                if (extData && Array.isArray(extData) && extData.length > 0) {
                    if (!localData || JSON.stringify(localData) !== JSON.stringify(extData)) {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(extData));
                        renderAllGrids();
                    }
                } else if (localData && localData.length > 0) {
                    chrome.storage.local.set({ [STORAGE_KEY]: localData });
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
