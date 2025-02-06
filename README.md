# Board Selection Component

A sophisticated board selection interface built with HTML, CSS (Tailwind), and vanilla JavaScript. This component provides an intuitive way to manage board selections in notification settings.

![Component Preview](preview.gif)

## Features

### Toggle Functionality
- Switch between "All boards" and specific board selection modes
- Visual toggle switch with smooth animation
- Informative board count display

### Search & Filter
- Real-time board filtering
- Highlighted search matches
- Empty state with suggestions
- Keyboard shortcuts support (Esc)
- Clear/close functionality with context-aware buttons

### Bulk Actions
- Add filtered boards to selection
- Remove filtered boards from selection
- Clear all selected boards
- Dynamic button states based on context
- Accurate count indicators for all actions

### UI/UX Improvements
- Sticky header with action controls
- Custom scrollbar styling
- Smooth transitions and hover effects
- Responsive layout with truncation
- Informative tooltips for all actions
- No horizontal scrolling issues
- Proper dropdown positioning

### Smart Controls
- Context-aware Esc key behavior:
  - Clears search when query exists
  - Closes dropdown when search is empty
- Click-outside behavior for dropdown
- Focus management
- Proper keyboard navigation

### Visual Feedback
- Loading states
- Error states
- Empty states with helpful messages
- Clear action indicators
- Consistent styling

## Technical Details

### State Management
- Individual state for each notification
- Proper search term isolation
- Selected boards tracking
- Channel preferences

### Performance
- Efficient DOM updates
- Proper event delegation
- Smart rendering
- Memory leak prevention

### Accessibility
- Proper ARIA attributes
- Keyboard navigation
- Focus management
- Clear visual indicators

## Code Structure

```javascript
// Core Functions
- initNotificationStates()
- renderNotifications()
- setupBoardSelectionHandlers()

// UI Updates
- updateSearchControls()
- renderBoardList()
- renderSelectedBoards()

// Event Handlers
- toggleAllBoards()
- toggleBoard()
- selectFilteredBoards()
- unselectFilteredBoards()
- clearSearch()
```

## Usage

```html
<!-- Include required styles -->
<link rel="stylesheet" href="https://cdn.tailwindcss.com">
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1">

<!-- Component Template -->
<div id="notification-template">
    <!-- Component markup -->
</div>

<!-- Initialize -->
<script>
    init();
</script>
```

## Dependencies
- Tailwind CSS
- Phosphor Icons
- Modern browser with ES6 support

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

