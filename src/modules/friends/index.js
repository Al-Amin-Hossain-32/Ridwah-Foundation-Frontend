// Reducer (register this in your store as key: 'friends')
export { default as friendReducer }   from './friendSlice.js';

// Selectors & actions
export * from './friendSlice.js';

// Thunks
export * from './friend.thunks.js';

// Service
export { default as friendService }   from './friend.service.js';

// Hook
export { default as useFriendship }   from './hooks/useFriendship.js';

// Components
export { default as FriendButton }    from './components/FriendButton.jsx';
export { default as FriendCard }      from './components/FriendCard.jsx';
export { default as FriendTabs }      from './components/FriendTabs.jsx';
export { default as RequestCard }     from './components/RequestCard.jsx';
export { default as SuggestionCard }  from './components/SuggestionCard.jsx';
export { default as EmptyState }      from './components/EmptyState.jsx';
export { default as SkeletonCard }    from './components/SkeletonCard.jsx';
export { default as ProfileHeader }   from './components/ProfileHeader.jsx';

// Pages
export { default as FriendsPage }     from './pages/FriendsPage.jsx';
export { default as RequestsPage }    from './pages/RequestsPage.jsx';
export { default as SuggestionsPage } from './pages/SuggestionsPage.jsx';