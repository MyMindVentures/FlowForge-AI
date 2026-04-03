import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 max-w-md mb-8">
            An unexpected error occurred. This might be due to a connection issue or a temporary glitch.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
          >
            <RefreshCw size={18} />
            Reload Application
          </button>
          {import.meta.env.DEV && (
            <pre className="mt-8 p-4 bg-red-500/5 border border-red-500/10 rounded-lg text-red-400 text-xs text-left max-w-2xl overflow-auto">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
