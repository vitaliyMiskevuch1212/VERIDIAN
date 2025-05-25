import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary:${this.props.name || 'unknown'}]`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-red)]/10 border border-[var(--color-red)]/20 flex items-center justify-center mb-4">
            <i className="fa-solid fa-triangle-exclamation text-[var(--color-red)] text-lg" />
          </div>
          <h3 className="text-white/80 text-xs font-heading uppercase tracking-[0.15em] mb-2">
            {this.props.name || 'Module'} Offline
          </h3>
          <p className="text-white/30 text-[10px] font-mono mb-4 max-w-xs">
            SIGNAL LOST — Component encountered a runtime fault.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm text-[9px] font-bold uppercase tracking-[0.2em] text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-rotate-right mr-2 text-[var(--color-cyan)]" />
            Reconnect Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
