import React from "react";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }) {
    return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
            <Sidebar />
            {/* Responsive offset: top bar height on mobile, sidebar width on desktop */}
            <main className="min-h-screen p-6 pt-20 lg:ml-64 lg:p-8">
                {children}
            </main>
        </div>
    );
}