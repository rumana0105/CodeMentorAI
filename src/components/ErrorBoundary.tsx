import React, { Component, ErrorInfo, ReactNode } from 'react';

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
      let errorMessage = "Something went wrong.";
      
      try {
        // Try to parse Firestore error JSON
        const firestoreError = JSON.parse(this.state.error?.message || "");
        if (firestoreError.error === "Missing or insufficient permissions.") {
          errorMessage = "You don't have permission to perform this action. Please make sure you are logged in correctly.";
        }
      } catch (e) {
        // Not a Firestore error JSON
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#E5E7EB] p-10 shadow-xl space-y-6">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Oops!</h2>
            <p className="text-[#6B7280]">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#4F46E5] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#4338CA] transition-all shadow-lg shadow-indigo-100"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
