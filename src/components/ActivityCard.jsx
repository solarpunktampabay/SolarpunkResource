import React from 'react';
import { parseMMDDYYYYToUTCDate, formatUTCDateToMMDDYYYY } from '../utils/dateUtils';

// A flat, editorial-style entry for a single resource/activity.
const ActivityCard = ({ activity, showMeta = false }) => {
  const expiredDateUTC = parseMMDDYYYYToUTCDate(activity.expiredDate);
  const displayDate = expiredDateUTC ? formatUTCDateToMMDDYYYY(expiredDateUTC) : null;

  return (
    <article className="flex h-full flex-col border-t border-ink pt-4">
      {showMeta && (activity.subcategory || activity.categories?.length > 0) && (
        <p className="byline dots mb-2 flex flex-wrap">
          {[activity.subcategory, ...(activity.categories || [])]
            .filter(Boolean)
            .slice(0, 2)
            .map((m) => (
              <span key={m}>{m}</span>
            ))}
        </p>
      )}

      <h3 className="font-display text-[22px] font-medium leading-snug tracking-[-0.005em]">
        {activity.name}
      </h3>

      {activity.location && <p className="byline mt-2">{activity.location}</p>}

      {activity.description && (
        <p className="mt-3 font-serif text-[18px] leading-[1.55]">{activity.description}</p>
      )}

      {displayDate && <p className="meta mt-3 font-bold text-muted">Expires on {displayDate}</p>}

      <div className="mt-auto pt-5">
        {activity.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activity.tags.map((tag) => (
              <span key={tag} className="chip-static">
                {tag}
              </span>
            ))}
          </div>
        )}

        {activity.websiteUrl && (
          <a
            href={activity.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-white mt-4"
          >
            Visit website&nbsp;→
          </a>
        )}
      </div>
    </article>
  );
};

export default ActivityCard;
