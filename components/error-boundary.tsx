'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ProductErrorView } from './product-error-view';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChronicleErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChronicleErrorBoundary caught an error:', error, errorInfo);
  }

  public reset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4 sm:p-6 w-full">
          <ProductErrorView
            kind="500_UNEXPECTED"
            technicalDetails={this.state.error?.message || 'Component render exception caught by ChronicleErrorBoundary.'}
            onRetry={this.reset}
            onGoHome={() => (window.location.href = '/')}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
