import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  // FIX: The `render` method is defined as a standard class method. In class components, lifecycle methods like `render` should be standard methods. This ensures that React correctly manages the component's `this` context, resolving potential issues where `this.props` and `this.setState` might not be recognized.
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="w-full h-full flex items-center justify-center text-center bg-red-50 text-red-700 rounded-lg p-4">
          <div>
            <h2 className="font-bold text-lg">Something went wrong.</h2>
            <p className="text-sm mt-1">There was an error trying to render this component.</p>
            <p className="text-xs text-red-500 mt-2">{this.state.error?.message}</p>
            <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
                Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
