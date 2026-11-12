import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { testGoogleSheets } from "../services/testGoogleSheets";
import { fetchActivities } from "../services/googleSheets";
import { parseMMDDYYYYToUTCDate } from "../utils/dateUtils";
import { categories } from "../data/categories";
import { RECOMMEND_URL } from "../components/Navbar";

const byId = (id) => categories.find((c) => c.id === id);
const href = (c) => `/category/${encodeURIComponent(c.id)}`;

// How many entries the "Recent opportunities" sidebar shows
const RECENT_COUNT = 6;

// True unless the listing's expiration date (MM-DD-YYYY, end of that day) has passed
const isActive = (activity) => {
  if (!activity.expiredDate) return true;
  const start = parseMMDDYYYYToUTCDate(activity.expiredDate);
  if (!start) return true;
  const end = new Date(start.getTime());
  end.setUTCDate(end.getUTCDate() + 1);
  return Date.now() < end.getTime();
};

// Short topic label ("Careers", "Home"...) for a listing's full category name
const topicLabel = (activity) => {
  const match = categories.find((c) => activity.categories?.includes(c.name));
  return match ? match.short : activity.categories?.[0] || "";
};

// Big image + text rows (Grist's "Recent" section)
const featured = [
  {
    title: "Landing an internship.",
    text: "Find green jobs, grants, and graduate programs, and walk in knowing where to apply.",
    cat: byId("Internship"),
  },
  {
    title: "Greening your home.",
    text: "Practical upgrades that lower your footprint and your bills, from solar to swaps.",
    cat: byId("Home"),
  },
  {
    title: "Cutting your waste.",
    text: "Reduce, reuse, recycle, and dispose of things the right way, right here in Tampa.",
    cat: byId("Waste"),
  },
  {
    title: "Showing up on campus.",
    text: "Green clubs, gardens, and programs on campus. Go Bulls!",
    cat: byId("USF"),
  },
].filter((f) => f.cat);

// Lead item + list (Grist's "Energy" section)
const leadTopic = byId("Government");
// Every category not already shown in "Start here" or as the lead item,
// so no topic is ever left out (Work, Community, Donate, Learn...)
const shownIds = new Set([...featured.map((f) => f.cat.id), leadTopic?.id]);
const listTopics = categories.filter((c) => !shownIds.has(c.id));

const Icon = ({ children, className = "h-10 w-10" }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="square"
    strokeLinejoin="miter"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const getInvolved = [
  {
    kicker: "Search",
    title: "Search everything.",
    text: "Look up any program, group, or place by name, tag, or location, and filter down to what fits.",
    cta: "Search resources",
    to: "/search",
    tile: "bg-forest-deep text-white",
    icon: (
      <Icon>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </Icon>
    ),
  },
  {
    kicker: "Contribute",
    title: "Share what you know.",
    text: "Know a program we missed? Recommend it and help the next person find it.",
    cta: "Recommend a resource",
    to: RECOMMEND_URL,
    external: true,
    tile: "border border-forest bg-sprout text-forest",
    icon: (
      <Icon>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
      </Icon>
    ),
  },
];

const Home = () => {
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  // Newest entries are appended to the bottom of the sheet, so take the last few
  useEffect(() => {
    let cancelled = false;
    const loadRecent = async () => {
      try {
        const data = await fetchActivities();
        if (cancelled) return;
        setRecent(
          data
            .filter((a) => a.name && isActive(a))
            .slice(-RECENT_COUNT)
            .reverse(),
        );
      } catch (error) {
        console.error("Error loading recent opportunities:", error);
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    };
    loadRecent();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Run the test when the component mounts
    const runTest = async () => {
      console.log("Running Google Sheets API test...");
      const result = await testGoogleSheets();
      console.log("Test result:", !!result);
    };

    runTest();
  }, []);

  return (
    <div>
      {/* ───────── Cover story + sidebar ───────── */}
      <section className="page-wrap pt-10 sm:pt-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <h1 className="headline-xl max-w-[18ch] sm:max-w-3xl">
              <Link
                to="/search"
                className="hover:underline decoration-2 underline-offset-[6px]"
              >
                Find an opportunity to grow green.
              </Link>
            </h1>
            <p className="deck mt-5 max-w-2xl">
              A crowdsourced guide to the people, programs, and places helping
              USF students and Tampa residents build a more sustainable future.
            </p>

            <Link
              to="/search"
              className="group mt-8 block overflow-hidden bg-forest"
            >
              <img
                src="/image/community.webp"
                alt="Neighbors gathered in a community garden at sunset"
                className="zoom-img aspect-[16/10] w-full object-cover"
              />
            </Link>
          </div>

          <aside aria-labelledby="latest-heading">
            <h2 id="latest-heading" className="section-title !mb-0">
              Recent opportunities
            </h2>

            {recentLoading && (
              <p className="byline py-5" role="status">
                Loading…
              </p>
            )}
            {!recentLoading && recent.length === 0 && (
              <p className="title-serif py-5 text-muted">
                No opportunities yet. Check back soon.
              </p>
            )}

            <ul>
              {recent.map((a) => {
                const meta = [topicLabel(a), a.location].filter(Boolean);
                const inner = (
                  <>
                    <span className="title-serif block group-hover:underline underline-offset-4">
                      {a.name}
                    </span>
                    {meta.length > 0 && (
                      <span className="byline dots mt-2 flex flex-wrap">
                        {meta.map((m) => (
                          <span key={m}>{m}</span>
                        ))}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={a.id} className="hair-b last:border-b-0">
                    {a.websiteUrl ? (
                      <a
                        href={a.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block py-5"
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link to="/search" className="group block py-5">
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            <Link to="/search" className="btn-sprout hover:bg-[#EBE4D4] mt-2">
              See all opportunities →
            </Link>
          </aside>
        </div>
      </section>


      {/* ───────── Featured rows ───────── */}
      <section
        className="page-wrap mt-16 sm:mt-20"
        aria-labelledby="start-heading"
      >
        <h2 id="start-heading" className="section-title">
          Start here
        </h2>
        <ol className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((f) => (
            <li key={f.title}>
              <Link to={href(f.cat)} className="group flex h-full flex-col">
                <div className="overflow-hidden bg-forest">
                  <img
                    src={f.cat.bgImg}
                    alt=""
                    loading="lazy"
                    className="zoom-img aspect-[4/3] w-full object-cover"
                  />
                </div>
                <h3 className="mt-5 font-display text-[26px] font-medium leading-[1.2] tracking-[-0.005em] group-hover:underline decoration-2 underline-offset-[5px]">
                  {f.title}
                </h3>
                <p className="mt-3 font-serif text-[18px] leading-[1.55]">
                  {f.text}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ───────── Lead item + list + promo ───────── */}
      <section
        id="topics"
        className="page-wrap mt-16 scroll-mt-24 sm:mt-20"
        aria-labelledby="more-heading"
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <h2 id="more-heading" className="section-title">
              More topics
            </h2>
            <div className="grid gap-10 md:grid-cols-2 md:gap-10">
              {leadTopic && (
                <Link to={href(leadTopic)} className="group block">
                  <div className="overflow-hidden bg-forest">
                    <img
                      src={leadTopic.bgImg}
                      alt=""
                      loading="lazy"
                      className="zoom-img aspect-[4/3] w-full object-cover"
                    />
                  </div>
                  <h3 className="title-serif mt-4 group-hover:underline underline-offset-4">
                    {leadTopic.name}
                  </h3>
                  <p className="deck mt-2 !text-[18px] text-muted">
                    {leadTopic.blurb}
                  </p>
                  <p className="byline mt-3">{leadTopic.short}</p>
                </Link>
              )}

              <ul>
                {listTopics.map((c) => (
                  <li key={c.id} className="hair-t first:border-t-0">
                    <Link to={href(c)} className="group block py-5 first:pt-0">
                      <span className="title-serif block group-hover:underline underline-offset-4">
                        {c.name}
                      </span>
                      <span className="byline mt-2 block">{c.short}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className="section-title">About</h2>
            <div className="bg-[#EBE4D4] p-7 text-ink sm:p-9">
              <p className="font-display text-3xl font-medium leading-[1.15] tracking-[-0.01em] text-ink">
                Hope leads to action.
              </p>
              <p className="mt-4 font-serif text-[19px] leading-[1.55]">
                We built this guide so the good work happening around Tampa is
                easy to find, and easy to join.
              </p>
              <Link
                to="/about"
                className="btn mt-7 bg-forest text-white hover:bg-[#EBE4D4] hover:text-forest"
              >
                Why we built this
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Recommend band (just before Get involved) ───────── */}
      <section className="page-wrap mt-16 sm:mt-20">
        <div className="rule-t rule-b grid items-center gap-6 py-8 md:grid-cols-[1fr_auto] md:gap-12">
          <div>
            <h2 className="headline-md">
              This guide only grows when you add to it.
            </h2>
            <p className="title-serif mt-2 max-w-3xl text-muted">
              Know a program, group, job, or place helping Tampa grow greener?
              Share it in under a minute. Your tip could be the one that
              connects someone to their next opportunity, and helps keep this
              guide useful for the whole community.
            </p>
          </div>
          <a
            href={RECOMMEND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-sprout justify-self-start !px-4 !py-3 md:justify-self-end hover:bg-[#EBE4D4]"
          >
            Recommend a resource
          </a>
        </div>
      </section>

      {/* ───────── Get involved (forest closing stretch) ───────── */}
      <section
        className="mt-20 bg-forest pb-4 text-white pt-16 sm:mt-28 sm:pt-20"
        aria-labelledby="involved-heading"
      >
        <div className="page-wrap">
          <h2 id="involved-heading" className="section-title">
            Get involved
          </h2>
          <div className="mt-2 grid max-w-4xl gap-10 md:grid-cols-2 md:gap-8">
            {getInvolved.map((g) => {
              const body = (
                <>
                  {g.tile && (
                    <div
                      className={`flex h-32 items-center justify-center sm:h-36 ${g.tile}`}
                    >
                      {g.icon}
                    </div>
                  )}
                  <p className={`byline rule-b pb-2 ${g.tile ? "mt-5" : ""}`}>
                    {g.kicker}
                  </p>
                  <h3 className="headline-md mt-4">{g.title}</h3>
                  <p className="title-serif mt-2 !text-[19px]">{g.text}</p>
                  <span className="byline mt-4 inline-block underline underline-offset-4 group-hover:decoration-2">
                    {g.cta} →
                  </span>
                </>
              );
              const cls = "group block";
              return g.external ? (
                <a
                  key={g.title}
                  href={g.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                >
                  {body}
                </a>
              ) : g.to.startsWith("#") ? (
                <a key={g.title} href={g.to} className={cls}>
                  {body}
                </a>
              ) : (
                <Link key={g.title} to={g.to} className={cls}>
                  {body}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
