import React from 'react';

import { AuthProvider } from './Auth';
import { ToastProvider } from './Toast';
import { NotificationsProvider } from './Notifications';
import { BrandingProvider } from './Branding';
import { ThemeProvider } from './Theme';

const AppProvider: React.FC = ({ children }) => (
  <ThemeProvider>
    <BrandingProvider>
      <AuthProvider>
        <ToastProvider>
          <NotificationsProvider>{children}</NotificationsProvider>
        </ToastProvider>
      </AuthProvider>
    </BrandingProvider>
  </ThemeProvider>
);
export default AppProvider;
