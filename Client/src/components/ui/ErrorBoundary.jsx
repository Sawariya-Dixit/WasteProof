import { Component } from 'react';
import i18n from '@/i18n';

// Render me koi error aaye to blank white screen ki jagah ye dikhao
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('UI crash:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-base">{i18n.t('errors.generic')}</p>
        <button
          onClick={() => window.location.assign('/')}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          {i18n.t('pages.goHome')}
        </button>
      </div>
    );
  }
}
