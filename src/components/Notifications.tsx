import React from 'react';
import { Bell, Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const mockNotifications = [
  {
    id: '1',
    type: 'approval',
    title: 'Feature Approved',
    message: 'The feature "User Authentication" has been approved by the Architect.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  },
  {
    id: '2',
    type: 'comment',
    title: 'New Comment',
    message: 'A Builder added a question to the "Dashboard Layout" feature card.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    icon: MessageSquare,
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10'
  },
  {
    id: '3',
    type: 'system',
    title: 'System Update',
    message: 'FlowForge AI has been updated to version 2.1.0 with new Gemini 3 models.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10'
  }
];

export default function Notifications() {
  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Notifications</h2>
          <p className="text-gray-400 mt-1 text-sm lg:text-base">Stay updated on your project progress.</p>
        </div>
        <div className="p-3 bg-white/5 rounded-2xl text-gray-400">
          <Bell size={24} />
        </div>
      </div>

      <div className="space-y-4">
        {mockNotifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <div
              key={notification.id}
              className="group p-5 rounded-3xl bg-[#141414] border border-white/5 hover:border-white/10 transition-all cursor-pointer shadow-xl"
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 ${notification.bg} rounded-2xl flex items-center justify-center shrink-0`}>
                  <Icon className={notification.color} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 uppercase tracking-widest font-bold shrink-0">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(notification.timestamp))} ago
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{notification.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
