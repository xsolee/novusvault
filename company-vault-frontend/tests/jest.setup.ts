import React from 'react';

// React 19's test renderer requires this flag to recognize the environment supports `act()`.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('expo-router', () => {
  const actualReact = require('react');
  return {
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    usePathname: () => '/',
    useLocalSearchParams: () => ({}),
    Redirect: () => null,
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) => actualReact.createElement(actualReact.Fragment, null, children),
      { Screen: () => null },
    ),
    Link: ({ children }: { children?: React.ReactNode }) => actualReact.createElement(actualReact.Fragment, null, children),
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
