import React from 'react';

import { AuthProvider } from './Auth';
import { ToastProvider } from './Toast';
import { NotificationsProvider } from './Notifications';

const AppProvider: React.FC = ({ children }) => (
  <AuthProvider>
    <ToastProvider>
      <NotificationsProvider>{children}</NotificationsProvider>
    </ToastProvider>
  </AuthProvider>
);
export default AppProvider;
