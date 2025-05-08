import React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";

export default function AdminMessages() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Chat Feature Coming Soon</h2>
            <p className="text-gray-600 text-center mb-6">
              The live chat messaging system is currently under development and will be available soon. 
              This section will allow you to respond to user inquiries about packages, hotels, 
              and other services in real-time.
            </p>
            <div className="w-full max-w-md p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Features to expect:</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Real-time conversation with customers</li>
                <li>Message history and chat archives</li>
                <li>Support for attachments and images</li>
                <li>Notifications for new inquiries</li>
                <li>Customer information and booking history</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}