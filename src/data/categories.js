// Shared category definitions used by the home page, nav, and category pages.
export const categories = [
  {
    id: "Internship",
    name: "Internship, Grant, Job Opportunity, Graduate School",
    short: "Careers",
    blurb:
      "Internships, grants, jobs, and graduate programs for people who want to work on a greener future.",
    bgImg: "/image/internship.jpg",
  },
  {
    id: "Home",
    name: "Upgrade your Home",
    short: "Home",
    blurb: "Practical upgrades that lower your footprint and your bills.",
    bgImg: "/image/athome.jpg",
  },
  {
    id: "Work",
    name: "At work",
    short: "Work",
    blurb: "Ways to make your workplace more sustainable.",
    bgImg: "/image/atwork.jpg",
  },
  {
    id: "Community",
    name: "Community Engagement",
    short: "Community",
    blurb:
      "Groups, events, and projects that are building stronger neighborhoods.",
    bgImg: "/image/community.jpg",
  },
  {
    id: "Waste",
    name: "Waste Reduction/ Disposal",
    short: "Waste",
    blurb: "Reduce, reuse, recycle, and dispose of things the right way.",
    bgImg: "/image/waste.webp",
  },
  {
    id: "Government",
    name: "Government",
    short: "Government",
    blurb: "Programs, policies, and ways to make your voice heard.",
    bgImg: "/image/government.jpg",
  },
  {
    id: "USF",
    name: "USF Specific (Go Bulls!)",
    short: "USF",
    blurb: "Green opportunities right on campus.",
    bgImg: "/image/usf.jpg",
  },
  {
    id: "Donate",
    name: "Donate/ Use your Resources",
    short: "Donate",
    blurb: "Give your time, money, and things to people who can use them.",
    bgImg: "/image/donation.webp",
  },
  {
    id: "Entertainment",
    name: "Entertainment, Utility, Education, News",
    short: "Learn",
    blurb: "Books, shows, tools, and news to keep you curious and informed.",
    bgImg: "/image/entertainment.jpg",
  },
];

export const categoryMapping = Object.fromEntries(
  categories.map((c) => [c.id, c.name]),
);
