import { useState, useMemo } from 'react';
import { people } from './data.js';
import { SUBMIT_URL } from './config.js';
import './App.css';

const QUESTION = 'What stretch goal are you ready to take on for August 1, 2026 through July 31, 2027?';

function money(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function getPersonFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return people.find((p) => p.id === id) || null;
}

export default function App() {
  const person = useMemo(getPersonFromUrl, []);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error

  if (!person) {
    return (
      <div className="page">
        <div className="card">
          <p className="eyebrow">Stretch Bonus Survey</p>
          <h1>Link not recognized</h1>
          <p className="body">
            This link is missing or doesn't match anyone on file. Check the QR code or link you were given, or
            reach out to your manager for a new one.
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit() {
    if (selected === null) return;
    setStatus('submitting');
    const chosen = person.options[selected];
    const payload = {
      name: person.name,
      id: person.id,
      level: chosen.level,
      bv: chosen.bv,
      bonus: chosen.bonus,
      submittedAt: new Date().toISOString(),
    };
   try {
      const res = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.status === 'ok') {
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="page">
        <div className="card">
          <p className="eyebrow">Stretch Bonus Survey</p>
          <h1>Choice recorded</h1>
          <p className="body">
            {person.name}, you're set for Level {person.options[selected].level}: {money(person.options[selected].bv)} BV,{' '}
            <span className="highlight">{money(person.options[selected].bonus)} bonus</span>. Thanks for confirming.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <p className="eyebrow">Stretch Bonus Survey &middot; Aug 1, 2026 &ndash; Jul 31, 2027</p>
        <h1>{person.name}</h1>
        <p className="question">{QUESTION}</p>

        <div className="options">
          {person.options.map((opt, i) => (
            <button
              key={opt.level}
              className={`option ${selected === i ? 'selected' : ''}`}
              onClick={() => setSelected(i)}
              type="button"
            >
              <span className="option-level">Level {opt.level}</span>
              <span className="option-row">
                <span className="option-label">BV</span>
                <span className="option-value">{money(opt.bv)}</span>
              </span>
              <span className="option-row bonus">
                <span className="option-label">Bonus</span>
                <span className="option-value">{money(opt.bonus)}</span>
              </span>
            </button>
          ))}
        </div>

        {status === 'error' && (
          <p className="error-text">Submission didn't go through. Check your connection and try again.</p>
        )}

        <button
          className="submit"
          onClick={handleSubmit}
          disabled={selected === null || status === 'submitting'}
          type="button"
        >
          {status === 'submitting' ? 'Submitting…' : 'Confirm my choice'}
        </button>
      </div>
    </div>
  );
}
