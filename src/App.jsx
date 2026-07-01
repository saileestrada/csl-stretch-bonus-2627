import { useState, useMemo, useRef } from 'react';
import { people } from './data.js';
import { SUBMIT_URL } from './config.js';
import './App.css';

const QUESTION = "You had an All-Star season. What's your next move for August 1, 2026 through July 31, 2027?";

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
  const formRef = useRef(null);
  const iframeRef = useRef(null);
  const hasSubmittedRef = useRef(false);

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

  function handleSubmit() {
    if (selected === null) return;
    setStatus('submitting');
    hasSubmittedRef.current = true;
    formRef.current.submit();
  }

  function handleIframeLoad() {
    // The iframe fires one load event on initial mount (blank page) before any submission.
    // Only treat a load event as a real completion once we've actually submitted.
    if (hasSubmittedRef.current) {
      setStatus('done');
    }
  }

  if (status === 'done') {
    return (
      <div className="page">
        <div className="card">
          <p className="eyebrow">Stretch Bonus Survey</p>
          <h1>Game on</h1>
          <p className="body">
            {person.name}, you're locked in for Level {person.options[selected].level}: {money(person.options[selected].bv)} BV,{' '}
            <span className="highlight">{money(person.options[selected].bonus)} bonus</span>. Go get it.
          </p>
        </div>
      </div>
    );
  }

  const chosen = selected !== null ? person.options[selected] : null;

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

        <div className="note">
          <span className="note-label">Extra bonus potential</span>
          <span className="note-text">
            Age-based bonuses stack on top of whichever level you pick above &mdash; Under 50: <strong>$1,250</strong> &middot; Age 65&ndash;69: <strong>$250</strong>.
          </span>
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

        {/* Hidden form + iframe: submits to Apps Script without triggering CORS,
            since this is a real browser navigation, not a fetch. */}
        <iframe
          ref={iframeRef}
          name="submit-target"
          title="submit-target"
          style={{ display: 'none' }}
          onLoad={handleIframeLoad}
        />
        <form ref={formRef} action={SUBMIT_URL} method="POST" target="submit-target" style={{ display: 'none' }}>
          <input type="hidden" name="name" value={person.name} readOnly />
          <input type="hidden" name="id" value={person.id} readOnly />
          <input type="hidden" name="level" value={chosen ? chosen.level : ''} readOnly />
          <input type="hidden" name="bv" value={chosen ? chosen.bv : ''} readOnly />
          <input type="hidden" name="bonus" value={chosen ? chosen.bonus : ''} readOnly />
          <input type="hidden" name="submittedAt" value={new Date().toISOString()} readOnly />
        </form>
      </div>
    </div>
  );
}

