import React from 'react';

import { AuthProvider } from './Auth';
import { ToastProvider } from './Toast';
import { NotificationsProvider } from './Notifications';
import { BrandingProvider } from './Branding';

const AppProvider: React.FC = ({ children }) => (
  <BrandingProvider>
    <AuthProvider>
      <ToastProvider>
        <NotificationsProvider>{children}</NotificationsProvider>
      </ToastProvider>
    </AuthProvider>
  </BrandingProvider>
);
export default AppProvider;
