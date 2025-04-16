import React from 'react';

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-center mb-8 text-earth-dark">
        Rooted in Purpose
      </h1>

      <div className="bg-earth-white/80 rounded-lg p-6 md:p-8 border border-earth-olive shadow-lg backdrop-blur-sm space-y-6 text-earth-dark/90">
        <section>
          <p className="text-lg leading-relaxed mb-4">
            Climate change, inequality, injustice, political and ideological division, hunger, lack of resources, lack of power, lack of knowledge. There are so many negative messages being presented to us daily from various sources. It is easy to give into despair. Despair leads to hopelessness, and hopelessness leads to inaction.
          </p>
          <p className="text-lg leading-relaxed mb-4">
            The antidote to despair is hope. Hope leads to action, and action leads to positive change. Through educating yourself of the amazing opportunities around you to improve your community and the environment and learning of the thousands of individuals and groups that engage in these practices every day you can counteract the hopelessness that comes from our negative news media.
          </p>
          <p className="text-lg leading-relaxed">
            We can then find initiatives and opportunities that will allow us to meaningfully contribute to creating the world we want to live in rather than the one that is given to us. Because if you are not actively working to change the world, then you are implicitly accepting the world as it is.
          </p>
        </section>

        <hr className="border-earth-olive/30 my-6" />

        <section>
          <p className="text-lg leading-relaxed mb-4">
            Through crowdsourcing via student submissions in Dr. Hargrove's USF Honor's classes, we have compiled a database of resources that will help USF students and Tampa residents get involved with their community and make improvements and changes to their lives that will help us create more sustainable futures! Explore and find ways that you can benefit and contribute to your community and the environment.
          </p>
          <p className="text-lg leading-relaxed">
            This resource is a tool to empower you to make the change you want to see in the world. Because if you don't know that something exists, then you can't make meaningful contributions to its success. Get involved today!
          </p>
        </section>

        <hr className="border-earth-olive/30 my-6" />

        <section className="text-center text-earth-olive italic">
          <p>
            This website is free for you to use and share.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage; 