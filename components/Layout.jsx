import React from 'react';

export default function Layout({ children }) {
    const title = "Visualize AWS Member Accounts Across Root Organizations"
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl text-center font-bold text-gray-900">{title}</h1>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto p-4">{children}</main>
        </div>
    );
};
