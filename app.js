// Generate 120 sample boards
const boards = Array.from({ length: 120 }, (_, i) => {
    const teamIndex = i % 10;
    const team = [
        'Product', 'Marketing', 'Development', 'Sales', 'Support',
        'HR', 'Finance', 'Operations', 'Research', 'Design'
    ][teamIndex];
    const teamNumber = Math.floor(i / 10) + 1;
    const boardName = `Board ${String(i + 1).padStart(3, '0')} - ${team} Team ${teamNumber}`;

    // Add voting board data to 10% of boards
    let voting = null;
    if (i % 10 === 0) { // Every 10th board
        const votingNames = [
            "Public Roadmap", "Customer Requests", "Feature Voting", "Ideas Portal",
            "Community Feedback", "Product Backlog", "User Suggestions", "Open Ideas",
            "Client Input", "Future Features"
        ];
        voting = {
            name: votingNames[i / 10 % votingNames.length], // Cycle through names
            icon: "lightbulb"
        };
    }

    // Add "My estimations" to 30% of boards
    const myEstimations = i % 3 === 0 ? true : null; // Every third board
    const facilitator = i % 4 === 0 ? true : null; // Every fourth board

    return {
        id: i + 1,
        name: boardName,
        voting: voting,
        myEstimations: myEstimations,
        facilitator: facilitator, // ADDED facilitator property
        searchText: voting ? `voting ${boardName} ${voting.name}`.toLowerCase() : boardName.toLowerCase() // Added for search
    };
});

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
                searchTerm: '',
                votingFilterEnabled: false,
                myEstimationsFilterEnabled: false,
                facilitatorFilterEnabled: false // ADDED facilitatorFilterEnabled
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
                        .replace(/\{id\}/g, notification.id)
                        .replace('data-channel="email"', 'data-channel="email" data-tooltip="Toggle email notifications"')
                        .replace('data-channel="mattermost"', 'data-channel="mattermost" data-tooltip="Toggle Mattermost notifications"');
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

// Обновим функцию highlightMatch
function highlightMatch(text, searchTerm) {
    if (!searchTerm) return text;
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Экранируем спецсимволы
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-600/20 text-yellow-200">$1</mark>');
}

// Состояния кнопки поиска
const SearchButtonState = {
    HIDDEN: 'hidden',
    CLEAR: 'clear',
    CLOSE: 'close'
};

// Функция определения состояния кнопки
function getSearchButtonState(state, isDropdownVisible) {
    if (!isDropdownVisible) {
        return SearchButtonState.HIDDEN;
    }
    return state.searchTerm ? SearchButtonState.CLEAR : SearchButtonState.CLOSE;
}

// Обновленная функция updateSearchControls
function updateSearchControls(notificationId) {
    const state = notificationStates.get(notificationId);
    const notificationElement = document.getElementById(notificationId);
    const searchInput = notificationElement.querySelector('.board-search');
    const searchClearBtn = notificationElement.querySelector('.search-clear-btn');
    const boardDropdown = notificationElement.querySelector('.board-dropdown');
    const isDropdownVisible = !boardDropdown.classList.contains('hidden');

    // Определяем состояние кнопки
    const buttonState = getSearchButtonState(state, isDropdownVisible);

    // Обновляем видимость и содержимое кнопки
    if (buttonState === SearchButtonState.HIDDEN) {
        searchClearBtn.classList.add('hidden');
    } else {
        searchClearBtn.classList.remove('hidden');
        if (buttonState === SearchButtonState.CLEAR) {
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
    }

    // Обновляем плейсхолдер и тултип поисковой строки
    if (isDropdownVisible) {
        searchInput.placeholder = "Search, add or remove boards...";
    } else {
        searchInput.placeholder = "Click to search and manage boards...";
    }

    // Обновляем плейсхолдер и тултип поисковой строки
    searchInput.setAttribute('data-tooltip', isDropdownVisible ? `Search, add or remove boards... Tip: type "voting" to find boards with linked voting boards` : `Click to search and manage boards...`);
}

// Обновим обработчики событий
function setupBoardSelectionHandlers(notificationElement, notificationId) {
    const searchInput = notificationElement.querySelector('.board-search');
    const searchClearBtn = notificationElement.querySelector('.search-clear-btn');
    const boardDropdown = notificationElement.querySelector('.board-dropdown');
    const state = notificationStates.get(notificationId);

    if (!state.searchTerm) state.searchTerm = '';

    // Показываем дропдаун при фокусе на поиск
    searchInput.addEventListener('focus', () => {
        boardDropdown.classList.remove('hidden');
        renderBoardList(notificationId);
        updateSearchControls(notificationId);
    });

    // Добавляем обработчик события input
    searchInput.addEventListener('input', () => {
        state.searchTerm = searchInput.value;
        renderBoardList(notificationId);
        updateSearchControls(notificationId);
    });

    // Обработка клика вне дропдауна
    document.addEventListener('click', (e) => {
        const isClickInside = notificationElement.contains(e.target);
        if (!isClickInside) {
            boardDropdown.classList.add('hidden');
            updateSearchControls(notificationId);
        }
    });

    // Обработка Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault(); // Предотвращаем стандартное поведение
            const buttonState = getSearchButtonState(state, !boardDropdown.classList.contains('hidden'));

            if (buttonState === SearchButtonState.CLEAR) {
                clearSearch(notificationId);
            } else if (buttonState === SearchButtonState.CLOSE) {
                boardDropdown.classList.add('hidden');
                searchInput.blur();
                updateSearchControls(notificationId);
            }
        }
    });

    // Обработка кнопки очистки/закрытия
    searchClearBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Предотвращаем всплытие события
        e.stopPropagation(); // Предотвращаем всплытие события

        const buttonState = getSearchButtonState(state, !boardDropdown.classList.contains('hidden'));

        if (buttonState === SearchButtonState.CLEAR) {
            clearSearch(notificationId);
        } else if (buttonState === SearchButtonState.CLOSE) {
            boardDropdown.classList.add('hidden');
            searchInput.blur();
            updateSearchControls(notificationId);
        }
    });

    // Предотвращаем закрытие дропдауна при клике внутри
    boardDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Обновим renderBoardList
function renderBoardList(notificationId) {
    const state = notificationStates.get(notificationId);
    const container = document.querySelector(`#${notificationId} .board-list`);
    if (!container) return;

    // Apply search term, voting filter, myEstimations filter, and facilitator filter
    let filteredBoards = boards.filter(board =>
        board.searchText.includes(state.searchTerm.toLowerCase()) &&
        (!state.votingFilterEnabled || board.voting) &&
        (!state.myEstimationsFilterEnabled || board.myEstimations) &&
        (!state.facilitatorFilterEnabled || board.facilitator)
    );

    const selectedFilteredCount = filteredBoards.filter(board =>
        state.selectedBoards.has(board.id)
    ).length;

    const availableToAddCount = filteredBoards.length - selectedFilteredCount;

    const votingBoardsCount = filteredBoards.filter(board => board.voting).length;
    const myEstimationsCount = filteredBoards.filter(board => board.myEstimations).length;
    const facilitatorCount = filteredBoards.filter(board => board.facilitator).length;

    const controlsHTML = `
        <div class="sticky top-0 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 z-10">
            <div class="flex items-center justify-between p-3">
                <div class="flex items-center gap-2 text-xs text-gray-400">
                    <span>
                        ${state.searchTerm || state.votingFilterEnabled || state.myEstimationsFilterEnabled || state.facilitatorFilterEnabled ?
                        `Filtered: <span class="text-gray-200">${filteredBoards.length}</span> of ${boards.length}` :
                        `Total: <span class="text-gray-200">${boards.length}</span>`
                    }
                    </span>
                    <div class="relative" data-tooltip="${state.votingFilterEnabled ? 'Disable filtering by voting boards' : 'Filter by voting boards'}">
                        <button onclick="toggleVotingFilter('${notificationId}')"
                                class="text-xs h-8 px-2 rounded ${state.votingFilterEnabled ? 'text-sky-400 bg-sky-400/10' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-400/10'} transition-colors flex items-center gap-1.5">
                            <i class="ph ph-lightbulb text-lg"></i>
                            <span>Voting (${votingBoardsCount})</span>
                        </button>
                    </div>
                    <div class="relative" data-tooltip="${state.myEstimationsFilterEnabled ? 'Disable filtering by My estimations' : 'Filter by My estimations'}">
                        <button onclick="toggleMyEstimationsFilter('${notificationId}')"
                                class="text-xs h-8 px-2 rounded ${state.myEstimationsFilterEnabled ? 'text-green-400 bg-green-400/10' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-400/10'} transition-colors flex items-center gap-1.5">
                            <i class="ph ph-list-numbers text-lg"></i>
                            <span>Evals (${myEstimationsCount})</span>
                        </button>
                    </div>
                    <div class="relative" data-tooltip="${state.facilitatorFilterEnabled ? 'Disable filtering by Facilitator' : 'Filter by Facilitator'}">
                        <button onclick="toggleFacilitatorFilter('${notificationId}')"
                                class="text-xs h-8 px-2 rounded ${state.facilitatorFilterEnabled ? 'text-purple-400 bg-purple-400/10' : 'text-gray-400 hover:text-gray-300 hover:bg-gray-400/10'} transition-colors flex items-center gap-1.5">
                            <i class="ph ph-scales text-lg"></i>
                            <span>Facilitator (${facilitatorCount})</span>
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-2 text-xs">
                    ${availableToAddCount > 0 ? `
                        <div class="relative" data-tooltip="Add filtered boards to your selection">
                            <button onclick="selectFilteredBoards('${notificationId}')"
                                    class="text-xs h-8 px-2 rounded text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 transition-colors flex items-center gap-1.5">
                                <i class="ph ph-plus-circle text-lg"></i>
                                <span>Add (${availableToAddCount})</span>
                            </button>
                        </div>
                    ` : ''}
                    ${state.searchTerm && selectedFilteredCount > 0 ? `
                        <div class="relative" data-tooltip="Remove filtered boards from your selection">
                            <button onclick="unselectFilteredBoards('${notificationId}')"
                                    class="text-xs h-8 px-2 rounded text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors flex items-center gap-1.5">
                                <i class="ph ph-minus-circle text-lg"></i>
                                <span>Remove (${selectedFilteredCount})</span>
                            </button>
                        </div>
                    ` : ''}
                    ${state.selectedBoards.size > 0 ? `
                        <div class="relative" data-tooltip="Clear all selected boards">
                            <button onclick="unselectAllBoards('${notificationId}')"
                                    class="text-xs h-8 px-2 rounded text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors flex items-center gap-1.5">
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
                               class="text-sm text-gray-300 cursor-pointer truncate flex-grow flex items-center gap-1">
                            <span>${highlightMatch(board.name, state.searchTerm)}</span>
                            ${board.myEstimations ? `
                                <span class="text-sm text-gray-400 truncate flex items-center gap-1" data-tooltip="You are an estimator in this board"><i class="ph ph-list-numbers text-gray-400"></i></span>
                            ` : ''}
                            ${board.facilitator ? `
                                <span class="text-sm text-gray-400 truncate flex items-center gap-1" data-tooltip="You are a facilitator in this board"><i class="ph ph-scales text-gray-400"></i></span>
                            ` : ''}
                        </label>
                        ${board.voting ? `
                            <span class="text-sm text-gray-400 truncate flex items-center gap-1"><i class="ph ph-${board.voting.icon} text-gray-400"></i> ${highlightMatch(board.voting.name, state.searchTerm)}</span>
                        `: ''}
                    </div>
                `).join('') :
        noResultsHTML
    }
        </div>
    `;
}

// Обновим renderSelectedBoards для добавления тултипов к чипсам
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
                        class="text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0"
                        data-tooltip="Remove board from selection">
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

// Обновим функции массовых действий, чтобы они не закрывали дропдаун
function selectFilteredBoards(notificationId) {
    const state = notificationStates.get(notificationId);
    // Use the SAME filtering logic as renderBoardList
    const filteredBoards = boards.filter(board =>
        board.searchText.includes(state.searchTerm.toLowerCase()) &&
        (!state.votingFilterEnabled || board.voting) &&
        (!state.myEstimationsFilterEnabled || board.myEstimations) &&
        (!state.facilitatorFilterEnabled || board.facilitator)
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
    searchInput.value = '';
    renderBoardList(notificationId);
    updateSearchControls(notificationId);
}

function unselectFilteredBoards(notificationId) {
    const state = notificationStates.get(notificationId);
    // Use the SAME filtering logic as renderBoardList
    const filteredBoards = boards.filter(board =>
        board.searchText.includes(state.searchTerm.toLowerCase()) &&
        (!state.votingFilterEnabled || board.voting) &&
        (!state.myEstimationsFilterEnabled || board.myEstimations) &&
        (!state.facilitatorFilterEnabled || board.facilitator)
    );

    filteredBoards.forEach(board => {
        state.selectedBoards.delete(board.id);
    });

    renderSelectedBoards(notificationId);
    renderBoardList(notificationId);
}

// Toggle voting filter
function toggleVotingFilter(notificationId) {
    const state = notificationStates.get(notificationId);
    state.votingFilterEnabled = !state.votingFilterEnabled;
    renderBoardList(notificationId);
}

// Toggle My Estimations filter
function toggleMyEstimationsFilter(notificationId) {
    const state = notificationStates.get(notificationId);
    state.myEstimationsFilterEnabled = !state.myEstimationsFilterEnabled;
    renderBoardList(notificationId);
}

// Toggle Facilitator filter
function toggleFacilitatorFilter(notificationId) {
    const state = notificationStates.get(notificationId);
    state.facilitatorFilterEnabled = !state.facilitatorFilterEnabled;
    renderBoardList(notificationId);
}

// Initialize the app
init(); 