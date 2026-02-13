'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4 text-slate-900">
                    <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
                    <h2 className="mb-2 text-2xl font-bold">Something went wrong</h2>
                    <p className="mb-6 text-slate-600 max-w-md text-center">
                        {this.state.error?.message || "An unexpected error occurred while rendering this page."}
                    </p>
                    <Button onClick={() => window.location.reload()} className="bg-teal-600 hover:bg-teal-700">
                        Reload Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
