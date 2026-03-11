import React, { useEffect, useState } from 'react';
import {
  gameApi,
  type AdminSessionEvent,
  type AdminSessionSummary,
} from '../../../api/gameApi';

interface AdminSessionsScreenProps {
  onBack: () => void;
}

const AdminSessionsScreen: React.FC<AdminSessionsScreenProps> = ({ onBack }) => {
  const [sessions, setSessions] = useState<AdminSessionSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [events, setEvents] = useState<AdminSessionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const data = await gameApi.getAdminSessions(50);
      setSessions(data);
      setLoading(false);
      if (data[0]) {
        setSelectedSession(data[0].sessionId);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    void (async () => {
      setDetailLoading(true);
      const data = await gameApi.getAdminSession(selectedSession);
      setEvents(data);
      setDetailLoading(false);
    })();
  }, [selectedSession]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-slate-950 p-6 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-teal-300">Admin Sessions</h1>
            <p className="text-gray-400">Inspect live and historical session logs</p>
          </div>
          <button
            onClick={onBack}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-6">
          <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 max-h-[75vh] overflow-y-auto">
            {loading ? (
              <p className="text-gray-400">Loading sessions...</p>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => (
                  <button
                    key={session.sessionId}
                    onClick={() => setSelectedSession(session.sessionId)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${
                      selectedSession === session.sessionId
                        ? 'bg-teal-900/30 border-teal-400'
                        : 'bg-gray-900/60 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold text-white">{session.username}</div>
                    <div className="text-xs text-gray-400 break-all">{session.sessionId}</div>
                    <div className="mt-2 text-sm text-gray-300">
                      {session.latestEventType} | {session.gamePhase}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Fuel {session.fuel.toFixed(1)} | Time {Math.floor(session.timeRemaining)} | Cash $
                      {session.earnings.toFixed(0)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 max-h-[75vh] overflow-y-auto">
            {detailLoading ? (
              <p className="text-gray-400">Loading session detail...</p>
            ) : (
              <div className="space-y-4">
                {events.map(event => (
                  <div key={event.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="font-semibold text-teal-300">{event.eventType}</div>
                      <div className="text-xs text-gray-500">{event.createdAt}</div>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">Phase: {event.gamePhase}</div>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all bg-black/30 rounded p-3 mb-2">
                      {JSON.stringify(event.eventData, null, 2)}
                    </pre>
                    <pre className="text-xs text-slate-400 whitespace-pre-wrap break-all bg-black/30 rounded p-3">
                      {JSON.stringify(event.stateSnapshot, null, 2)}
                    </pre>
                  </div>
                ))}
                {!detailLoading && events.length === 0 && (
                  <p className="text-gray-500">No events for this session.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSessionsScreen;
