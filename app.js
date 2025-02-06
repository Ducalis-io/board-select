// Generate 120 sample boards
const boards = Array.from({ length: 120 }, (_, i) => ({
    id: i + 1,
    name: `Board ${String(i + 1).padStart(3, '0')} - ${[
        'Product', 'Marketing', 'Development', 'Sales', 'Support',
        'HR', 'Finance', 'Operations', 'Research', 'Design'
    ][i % 10]} Team ${Math.floor(i / 10) + 1}`
}));

// Notification structure
const notificationGroups = [
    {
        title: "Prioritization Notifications",
        notifications: [
            {
                id: "evaluation-reminder",
                icon: "bell",
                title: "Evaluation Reminder",
                description: "Daily new tasks requiring evaluation when sprint has <30 days left."
            },
            {
                id: "team-sprint-reports",
                icon: "users",
                title: "Team Sprint Reports",
                description: "Weekly status of evaluation tasks per team member"
            },
            {
                id: "personal-ping",
                icon: "comment",
                title: "Personal Ping",
                description: "Teammates ask to finish the evaluation"
            },
            {
                id: "manual-score-reset",
                icon: "rotate",
                title: "Manual Score Reset",
                description: "Priority scores are reset (requiring re-evaluation)"
            }
        ]
    },
    {
        title: "Voting Boards Notifications",
        notifications: [
            {
                id: "voting-ideas",
                icon: "lightbulb",
                title: "Voting Ideas",
                description: "New ideas created in the voting board"
            },
            {
                id: "voting-comments",
                icon: "comments",
                title: "Comments",
                description: "New comments for any idea"
            },
            {
                id: "daily-digest",
                icon: "newspaper",
                title: "Daily Digest",
                description: "New ideas, subscribers, comments, and upvotes from the previous day"
            }
        ]
    },
    {
        title: "Account Updates",
        notifications: [
            {
                id: "onboarding-help",
                icon: "circle-question",
                title: "Onboarding Help",
                description: "Tips and guides for new users"
            }
        ]
    }
];

// State management
const notificationStates = new Map(); // Store state for each notification
let searchTerm = '';

// Initialize notification states
function initNotificationStates() {
    notificationGroups.forEach(group => {
        group.notifications.forEach(notification => {
            notificationStates.set(notification.id, {
                selectedBoards: new Set(),
                allBoardsEnabled: true,
                channels: {
                    email: true,
                    mattermost: true
                },
                searchTerm: ''
            });
        });
    });
}

// DOM Elements
const allBoardsToggle = document.querySelector('.all-boards-toggle');
const boardSelection = document.querySelector('.board-selection');
const searchInput = document.querySelector('input[type="text"]');
const boardList = document.querySelector('.board-list');
const selectedBoardsContainer = document.querySelector('.selected-boards');

// Render Functions
function renderNotifications() {
    const container = document.getElementById('notification-groups');
    
    container.innerHTML = notificationGroups.map(group => `
        <section class="mb-12">
            <h2 class="text-xl font-semibold mb-6">${group.title}</h2>
            <div class="space-y-4">
                ${group.notifications.map(notification => {
                    const template = document.getElementById('notification-template').innerHTML;
                    return template
                        .replace('{icon}', notification.icon)
                        .replace('{title}', notification.title)
                        .replace('{description}', notification.description)
                        .replace(/\{id\}/g, notification.id);
                }).join('')}
            </div>
        </section>
    `).join('');

    // Setup event listeners for each notification
    notificationGroups.forEach(group => {
        group.notifications.forEach(notification => {
            const notificationElement = document.getElementById(notification.id);
            if (notificationElement) {
                // All Boards Toggle
                const allBoardsToggle = notificationElement.querySelector('.all-boards-toggle');
                allBoardsToggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    const toggleInput = notificationElement.querySelector('.toggle-switch input');
                    toggleInput.checked = !toggleInput.checked;
                    toggleAllBoards(notification.id);
                });

                // Channel Toggles
                notificationElement.querySelectorAll('.notification-channel').forEach(button => {
                    button.addEventListener('click', () => {
                        toggleChannel(notification.id, button.dataset.channel);
                    });
                });

                // Setup board selection handlers (включая поиск и дропдаун)
                setupBoardSelectionHandlers(notificationElement, notification.id);

                // Initial render
                renderBoardList(notification.id);
            }
        });
    });
}

// Update template HTML to include notification ID
function updateTemplateHTML() {
    const template = document.getElementById('notification-template');
    template.innerHTML = template.innerHTML.replace(
        '<div class="bg-gray-800',
        '<div id="{id}" class="bg-gray-800'
    );
}

// Initialize
function init() {
    initNotificationStates();
    updateTemplateHTML();
    renderNotifications();
}

// Event handlers
function toggleAllBoards(notificationId) {
    const state = notificationStates.get(notificationId);
    const notificationElement = document.getElementById(notificationId);
    const boardSelection = notificationElement.querySelector('.board-selection');
    const toggleInput = notificationElement.querySelector('.toggle-switch input');
    const searchInput = notificationElement.querySelector('.board-search');
    
    state.allBoardsEnabled = !state.allBoardsEnabled;
    toggleInput.checked = state.allBoardsEnabled;
    boardSelection.classList.toggle('hidden', state.allBoardsEnabled);
    
    // Автофокус на поиск при отключении "All boards"
    if (!state.allBoardsEnabled) {
        setTimeout(() => {
            searchInput.focus();
        }, 0);
    }
    
    renderSelectedBoards(notificationId);
}

function toggleBoard(notificationId, boardId, boardName) {
    const state = notificationStates.get(notificationId);
    if (state.selectedBoards.has(boardId)) {
        state.selectedBoards.delete(boardId);
    } else {
        state.selectedBoards.add(boardId);
    }
    renderSelectedBoards(notificationId);
    renderBoardList(notificationId);
}

function toggleChannel(notificationId, channel) {
    const state = notificationStates.get(notificationId);
    state.channels[channel] = !state.channels[channel];
    const button = document.querySelector(`#${notificationId} [data-channel="${channel}"] i`);
    button.classList.toggle('text-yellow-600');
    button.classList.toggle('text-gray-600');
}

// Добавим функцию highlightMatch в глобальную область видимости
function highlightMatch(text) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="bg-yellow-600/20 text-yellow-200">$1</span>');
}

// Обновим setupBoardSelectionHandlers
function setupBoardSelectionHandlers(notificationElement, notificationId) {
    const searchInput = notificationElement.querySelector('.board-search');
    const searchClearBtn = notificationElement.querySelector('.search-clear-btn');
    const boardDropdown = notificationElement.querySelector('.board-dropdown');
    const state = notificationStates.get(notificationId);
    
    if (!state.searchTerm) state.searchTerm = '';

    // Показываем дропдаун при фокусе на поиск
    searchInput.addEventListener('focus', () => {
        updateSearchControls(notificationId);
        renderBoardList(notificationId);
        boardDropdown.classList.remove('hidden');
    });

    // Обработка клика вне дропдауна
    document.addEventListener('click', (e) => {
        const isClickInside = notificationElement.contains(e.target);
        if (!isClickInside) {
            boardDropdown.classList.add('hidden');
        }
    });

    // Обработка Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (state.searchTerm) {
                clearSearch(notificationId);
                searchInput.value = ''; // Явно очищаем значение инпута
            } else {
                boardDropdown.classList.add('hidden');
                searchInput.blur();
            }
        }
    });

    // Обработка поиска
    searchInput.addEventListener('input', (e) => {
        state.searchTerm = e.target.value;
        updateSearchControls(notificationId);
        renderBoardList(notificationId);
    });

    // Обработка кнопки очистки/закрытия
    searchClearBtn.addEventListener('click', () => {
        if (state.searchTerm) {
            clearSearch(notificationId);
        } else {
            boardDropdown.classList.add('hidden');
            searchInput.blur();
        }
    });
}

// Обновим updateSearchControls
function updateSearchControls(notificationId) {
    const state = notificationStates.get(notificationId);
    const notificationElement = document.getElementById(notificationId);
    const searchInput = notificationElement.querySelector('.board-search');
    const searchClearBtn = notificationElement.querySelector('.search-clear-btn');

    if (document.activeElement === searchInput) {
        searchClearBtn.classList.remove('hidden');
        if (state.searchTerm) {
            searchClearBtn.innerHTML = `
                <span>Clear [esc]</span>
                <i class="ph ph-backspace"></i>
            `;
            searchClearBtn.setAttribute('data-tooltip', 'Clear search query and show all boards');
        } else {
            searchClearBtn.innerHTML = `
                <span>Close [esc]</span>
                <i class="ph ph-arrows-in-line-vertical"></i>
            `;
            searchClearBtn.setAttribute('data-tooltip', 'Close board selection dropdown');
        }
    } else {
        searchClearBtn.classList.add('hidden');
    }

    // Обновляем плейсхолдер и тултип для поиска
    searchInput.placeholder = "Search, add or remove boards...";
    searchInput.setAttribute('data-tooltip', 
        'Search boards by name\n' +
        'Add filtered boards with "+ Add"\n' +
        'Remove filtered boards with "- Remove"\n' +
        'Clear all selected boards with "Clear"\n' +
        'Press Esc to clear search or close dropdown'
    );
}

// Обновим renderBoardList
function renderBoardList(notificationId) {
    const state = notificationStates.get(notificationId);
    const container = document.querySelector(`#${notificationId} .board-list`);
    if (!container) return;

    const filteredBoards = boards.filter(board => 
        board.name.toLowerCase().includes(state.searchTerm.toLowerCase())
    );

    const selectedFilteredCount = filteredBoards.filter(board => 
        state.selectedBoards.has(board.id)
    ).length;

    const controlsHTML = `
        <div class="sticky top-0 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 z-10">
            <div class="flex items-center justify-between p-3">
                <div class="flex items-center gap-3">
                    <span class="text-gray-400 text-sm">
                        ${state.searchTerm ? 
                            `Filtered: <span class="text-gray-200 ml-1">${filteredBoards.length}</span> of ${boards.length}` : 
                            `Total boards: <span class="text-gray-200 ml-1">${boards.length}</span>`
                        }
                    </span>
                    ${filteredBoards.length > 0 ? `
                        <div class="relative" data-tooltip="Add filtered boards to your selection">
                            <button onclick="selectFilteredBoards('${notificationId}')"
                                    class="text-sm h-8 px-2 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 transition-colors flex items-center gap-1.5">
                                <i class="ph ph-plus-circle text-lg"></i>
                                <span>Add (${filteredBoards.length})</span>
                            </button>
                        </div>
                    ` : ''}
                </div>

                <div class="flex items-center gap-2">
                    ${state.searchTerm && selectedFilteredCount > 0 ? `
                        <div class="relative" data-tooltip="Remove filtered boards from your selection">
                            <button onclick="unselectFilteredBoards('${notificationId}')"
                                    class="text-sm h-8 px-2 rounded text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors flex items-center gap-1.5">
                                <i class="ph ph-minus-circle text-lg"></i>
                                <span>Remove (${selectedFilteredCount})</span>
                            </button>
                        </div>
                    ` : ''}
                    ${state.selectedBoards.size > 0 ? `
                        <div class="relative" data-tooltip="Clear all selected boards">
                            <button onclick="unselectAllBoards('${notificationId}')"
                                    class="text-sm h-8 px-2 rounded text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors flex items-center gap-1.5">
                                <i class="ph ph-x-circle text-lg"></i>
                                <span>Clear (${state.selectedBoards.size})</span>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    const noResultsHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-gray-400">
            <i class="ph ph-list-magnifying-glass text-4xl mb-2"></i>
            <p class="text-sm">No boards found. Try a different search query.</p>
        </div>
    `;

    container.innerHTML = `
        ${controlsHTML}
        <div class="p-2 space-y-1">
            ${filteredBoards.length ? 
                filteredBoards.map(board => `
                    <div class="flex items-center gap-3 p-2 hover:bg-gray-700/50 rounded-lg transition-colors min-w-0">
                        <input type="checkbox" 
                               id="board-${notificationId}-${board.id}" 
                               class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-600 focus:ring-yellow-600/20 focus:ring-offset-0 flex-shrink-0"
                               ${state.selectedBoards.has(board.id) ? 'checked' : ''}
                               onchange="toggleBoard('${notificationId}', ${board.id}, '${board.name}')">
                        <label for="board-${notificationId}-${board.id}" 
                               class="text-sm text-gray-300 cursor-pointer truncate">
                            ${highlightMatch(board.name, state.searchTerm)}
                        </label>
                    </div>
                `).join('') : 
                noResultsHTML
            }
        </div>
    `;
}

// Обновим renderSelectedBoards для предотвращения горизонтального скролла
function renderSelectedBoards(notificationId) {
    const state = notificationStates.get(notificationId);
    const container = document.querySelector(`#${notificationId} .selected-boards`);
    if (!container) return;

    container.innerHTML = Array.from(state.selectedBoards).map(boardId => {
        const board = boards.find(b => b.id === boardId);
        return `
            <span class="bg-gray-700/50 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 text-gray-300 border border-gray-600/50 max-w-full">
                <span class="truncate">${board.name}</span>
                <button onclick="toggleBoard('${notificationId}', ${board.id}, '${board.name}')" 
                        class="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0">
                    <i class="ph ph-x"></i>
                </button>
            </span>
        `;
    }).join('');

    // Update board count
    const countElement = document.querySelector(`#${notificationId} .board-count`);
    if (countElement) {
        const selectedCount = state.selectedBoards.size;
        countElement.textContent = state.allBoardsEnabled ? 
            `All boards (${boards.length})` : 
            `${selectedCount} of ${boards.length} boards selected`;
    }
}

// Добавим новые функции для массовых действий
function selectFilteredBoards(notificationId) {
    const state = notificationStates.get(notificationId);
    const filteredBoards = boards.filter(board => 
        board.name.toLowerCase().includes(state.searchTerm.toLowerCase())
    );
    
    filteredBoards.forEach(board => {
        state.selectedBoards.add(board.id);
    });
    
    renderSelectedBoards(notificationId);
    renderBoardList(notificationId);
}

function unselectAllBoards(notificationId) {
    const state = notificationStates.get(notificationId);
    state.selectedBoards.clear();
    renderSelectedBoards(notificationId);
    renderBoardList(notificationId);
}

function clearSearch(notificationId) {
    const state = notificationStates.get(notificationId);
    const searchInput = document.querySelector(`#${notificationId} .board-search`);
    
    state.searchTerm = '';
    searchInput.value = ''; // Явно очищаем значение инпута
    renderBoardList(notificationId);
}

// Добавим новую функцию для снятия выделения с отфильтрованных бордов
function unselectFilteredBoards(notificationId) {
    const state = notificationStates.get(notificationId);
    const filteredBoards = boards.filter(board => 
        board.name.toLowerCase().includes(state.searchTerm.toLowerCase())
    );
    
    filteredBoards.forEach(board => {
        state.selectedBoards.delete(board.id);
    });
    
    renderSelectedBoards(notificationId);
    renderBoardList(notificationId);
}

// Initialize the app
init(); 