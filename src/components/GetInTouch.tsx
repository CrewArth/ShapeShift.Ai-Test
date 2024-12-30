'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

export default function GetInTouch() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          message,
          type: 'getInTouch'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      showNotification('Message sent successfully!', 'success');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification(
        error instanceof Error ? error.message : 'Failed to send message',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="get-in-touch-section">
      <div className="get-in-touch-container">
        <h2 className="get-in-touch-title">Get in Touch</h2>
        <p className="get-in-touch-description">
          Have questions or feedback? We'd love to hear from you!
        </p>

        <form onSubmit={handleSubmit} className="get-in-touch-form">
          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message..."
              required
              className="form-textarea"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
} 