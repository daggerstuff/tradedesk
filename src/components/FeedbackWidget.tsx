'use client';

import { useState } from 'react';

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!message.trim()) return;
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, message, page: window.location.pathname }),
    });
    setSent(true);
    setMessage('');
    setTimeout(() => { setOpen(false); setSent(false); }, 2000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full px-4 py-2 shadow-lg text-sm font-medium hover:bg-blue-700 z-50"
      >
        Feedback
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Send feedback</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
            </div>

            {sent ? (
              <p className="text-green-600 font-medium py-4">Thanks! We got it.</p>
            ) : (
              <>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mb-3 text-sm"
                >
                  <option value="general">General feedback</option>
                  <option value="bug">Bug report</option>
                  <option value="feature">Feature request</option>
                </select>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full border rounded-lg px-3 py-2 h-28 text-sm resize-none mb-3"
                />
                <button
                  onClick={submit}
                  disabled={!message.trim()}
                  className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
                >
                  Send
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
