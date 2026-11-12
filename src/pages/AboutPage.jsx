import React from 'react';
import { Link } from 'react-router-dom';
const AboutPage = () => {
  return (
    <article className="mx-auto max-w-[760px]">
      <header>
        <p className="byline">About</p>
        <h1 className="headline-xl mt-4">Rooted in purpose.</h1>
      </header>

      <div className="rule-t mt-8 space-y-7 pt-10 font-serif text-[22px] leading-[1.6]">
        <p>
          Climate change, inequality, injustice, political and ideological division, hunger, lack of resources, lack of power, lack of knowledge. There are so many negative messages being presented to us daily from various sources. It is easy to give into despair. Despair leads to hopelessness, and hopelessness leads to inaction.
        </p>

        <p>
          The antidote to despair is hope. Hope leads to action, and action leads to positive change. Through educating yourself of the amazing opportunities around you to improve your community and the environment and learning of the thousands of individuals and groups that engage in these practices every day you can counteract the hopelessness that comes from our negative news media.
        </p>

        <blockquote className="my-12 bg-forest px-7 text-white py-9 font-display text-[28px] font-medium leading-[1.2] tracking-[-0.01em] sm:px-10 sm:text-[34px]">
          If you are not actively working to change the world, then you are implicitly accepting the world as it is.
        </blockquote>

        <p>
          We can then find initiatives and opportunities that will allow us to meaningfully contribute to creating the world we want to live in rather than the one that is given to us.
        </p>

        <div className="rule-t" />

        <p>
          Through crowdsourcing via student submissions in Dr. Hargrove's USF Honor's classes, we have compiled a database of resources that will help USF students and Tampa residents get involved with their community and make improvements and changes to their lives that will help us create more sustainable futures! Explore and find ways that you can benefit and contribute to your community and the environment.
        </p>

        <p>
          This resource is a tool to empower you to make the change you want to see in the world. Because if you don't know that something exists, then you can't make meaningful contributions to its success. Get involved today!
        </p>
      </div>

      <div className="rule-t mt-14 flex flex-wrap items-center gap-3 pt-8">
        <Link to="/" className="btn-sprout">Explore topics</Link>
        <Link to="/search" className="btn-white">Search resources</Link>
      </div>
      <p className="byline mt-6">This website is free for you to use and share.</p>
    </article>
  );
};

export default AboutPage;
