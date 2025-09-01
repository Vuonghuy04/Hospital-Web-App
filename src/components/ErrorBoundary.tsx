import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Filter out common browser extension errors
    const isExtensionError = error.message?.includes('editorId') || 
                            error.message?.includes('chrome-extension') ||
                            error.message?.includes('moz-extension') ||
                            error.stack?.includes('chrome-extension') ||
                            error.stack?.includes('moz-extension');
    
    if (isExtensionError) {
      console.warn('Browser extension error detected - ignoring:', error.message);
      // Reset the error state for extension errors
      this.setState({ hasError: false, error: undefined });
      return;
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Check if it's a browser extension error
      const isExtensionError = this.state.error.message?.includes('editorId') || 
                              this.state.error.message?.includes('chrome-extension') ||
                              this.state.error.message?.includes('moz-extension');
      
      if (isExtensionError) {
        // Don't show error UI for browser extension errors
        return this.props.children;
      }

      // You can render any custom fallback UI for real application errors
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="text-red-500 text-2xl mr-3">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900">Something went wrong</h2>
            </div>
            <p className="text-gray-600 mb-4">
              An unexpected error occurred. Please refresh the page or contact support if the problem persists.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Try Again
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
