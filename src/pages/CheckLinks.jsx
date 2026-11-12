import React, { useEffect, useMemo, useState } from 'react';
import { fetchActivities } from '../services/googleSheets';
import { categories } from '../data/categories';
import {
  VERDICT_VALID,
  VERDICT_EXPIRED,
  loadMyAnswers,
  reportKey,
  saveMyAnswer,
  submitLinkReport,
} from '../services/linkReports';

// Listings the link checker could not verify on its own.
// A "Link Override" means a person already pinned the listing as good, so skip those.
const needsReview = (activity) =>
  (activity.linkStatus || '').toLowerCase() === 'unknown' &&
  !activity.linkOverride &&
  Boolean(activity.websiteUrl);

const topicLabel = (activity) => {
  const match = categories.find((c) => activity.categories?.includes(c.name));
  return match ? match.short : activity.categories?.[0] || '';
};

const openableUrl = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

const domainOf = (url) => {
  try {
    return new URL(openableUrl(url)).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const FILTER_TODO = 'todo';
const FILTER_ALL = 'all';

const CheckLinks = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState(() => loadMyAnswers());
  // Rows answered on earlier visits are hidden from "Still to review". Rows answered during
  // this visit stay on screen so the thank-you is visible.
  const [answeredBefore] = useState(() => new Set(Object.keys(loadMyAnswers())));
  const [sending, setSending] = useState({}); // key -> verdict being sent
  const [errors, setErrors] = useState({}); // key -> true when the last send failed
  const [filter, setFilter] = useState(FILTER_TODO);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchActivities();
        if (!cancelled) setItems(data.filter(needsReview));
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const answeredCount = useMemo(
    () => items.filter((a) => answers[reportKey(a)]).length,
    [items, answers]
  );
  const todoCount = items.length - answeredCount;
  const visible =
    filter === FILTER_TODO ? items.filter((a) => !answeredBefore.has(reportKey(a))) : items;

  const answer = async (activity, verdict) => {
    const key = reportKey(activity);
    if (sending[key]) return;
    setSending((s) => ({ ...s, [key]: verdict }));
    setErrors((e) => ({ ...e, [key]: false }));
    try {
      await submitLinkReport(activity, verdict);
      setAnswers(saveMyAnswer(activity, verdict));
    } catch (error) {
      console.error('Could not send link report:', error);
      setErrors((e) => ({ ...e, [key]: true }));
    } finally {
      setSending((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
    }
  };

  const changeAnswer = (activity) => {
    // Re-open the row's buttons locally; the new answer is sent when they pick again.
    const key = reportKey(activity);
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="byline py-24 text-center" role="status">
        Loading links…
      </div>
    );
  }

  return (
    <div>
      <header className="max-w-3xl">
        <p className="byline">Contribute</p>
        <h1 className="headline-xl mt-4">Help us check the links.</h1>
        <p className="deck mt-5">
          Our link checker couldn’t tell whether these listings are still open.
          Open each link, then tell us if it’s still valid or has expired. It
          keeps the guide trustworthy for everyone.
        </p>
      </header>

      {items.length === 0 ? (
        <p className="title-serif mt-12 border-y border-dotted border-ink py-8 text-muted">
          Nothing to check right now. Every listing’s link has been verified.
          Thank you!
        </p>
      ) : (
        <>
          {/* Progress + filter */}
          <div className="mt-12">
            <div className="section-title flex flex-wrap items-baseline justify-between gap-4">
              <h2>Links to confirm</h2>
              <span className="font-sans text-sm font-bold" aria-live="polite">
                {answeredCount} of {items.length} answered
              </span>
            </div>

            <div
              className="h-1.5 w-full bg-[#EBE4D4]"
              role="progressbar"
              aria-label="Links you have answered"
              aria-valuemin={0}
              aria-valuemax={items.length}
              aria-valuenow={answeredCount}
            >
              <div
                className="h-full bg-forest transition-all duration-300"
                style={{ width: `${(answeredCount / items.length) * 100}%` }}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={filter === FILTER_TODO}
                onClick={() => setFilter(FILTER_TODO)}
                className={`chip ${filter === FILTER_TODO ? 'chip-active' : ''}`}
              >
                Still to review ({todoCount})
              </button>
              <button
                type="button"
                aria-pressed={filter === FILTER_ALL}
                onClick={() => setFilter(FILTER_ALL)}
                className={`chip ${filter === FILTER_ALL ? 'chip-active' : ''}`}
              >
                All ({items.length})
              </button>
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="title-serif mt-10 border-y border-dotted border-ink py-8 text-muted">
              You’ve answered every link on the list. Thank you for helping keep
              the guide up to date!
            </p>
          ) : (
            <ol className="mt-8 border-t border-dotted border-ink">
              {visible.map((activity) => {
                const key = reportKey(activity);
                const mine = answers[key];
                const busy = sending[key];
                return (
                  <li key={key} className="rule-b py-6">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10">
                      <div className="min-w-0">
                        <h3 className="font-display text-2xl font-medium leading-[1.2] tracking-[-0.003em] sm:text-[26px]">
                          {activity.name}
                        </h3>
                        <p className="byline dots mt-2 flex flex-wrap">
                          {topicLabel(activity) && <span>{topicLabel(activity)}</span>}
                          <span className="break-all">{domainOf(activity.websiteUrl)}</span>
                        </p>
                        {activity.linkReason && (
                          <p className="mt-2 font-serif text-[17px] leading-[1.5] text-muted">
                            Checker note: {activity.linkReason}
                          </p>
                        )}
                        <a
                          href={openableUrl(activity.websiteUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block font-sans text-sm font-bold underline underline-offset-4 hover:decoration-2"
                        >
                          Open the link ↗
                          <span className="sr-only"> for {activity.name} (opens in a new tab)</span>
                        </a>
                      </div>

                      <div className="lg:justify-self-end">
                        {mine ? (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <p className="font-sans text-sm font-bold" role="status">
                              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center border border-forest bg-sprout text-forest" aria-hidden="true">
                                ✓
                              </span>
                              Thanks! You marked this{' '}
                              {mine.verdict === VERDICT_VALID ? 'still valid' : 'expired'}.
                            </p>
                            <button
                              type="button"
                              onClick={() => changeAnswer(activity)}
                              className="font-sans text-sm font-bold underline underline-offset-4"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div
                              className="flex flex-wrap gap-3"
                              role="group"
                              aria-label={`Is the link for ${activity.name} still valid?`}
                            >
                              <button
                                type="button"
                                disabled={Boolean(busy)}
                                onClick={() => answer(activity, VERDICT_VALID)}
                                className="btn-sprout !px-4 !py-3 disabled:cursor-wait disabled:opacity-60"
                              >
                                {busy === VERDICT_VALID ? 'Sending…' : 'Still valid'}
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(busy)}
                                onClick={() => answer(activity, VERDICT_EXPIRED)}
                                className="btn-white !px-4 !py-3 disabled:cursor-wait disabled:opacity-60"
                              >
                                {busy === VERDICT_EXPIRED ? 'Sending…' : 'Expired or broken'}
                              </button>
                            </div>
                            {errors[key] && (
                              <p className="mt-2 font-sans text-sm font-bold text-[#B3261E]" role="alert">
                                Couldn’t send that. Check your connection and try again.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </div>
  );
};

export default CheckLinks;
