import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const About: React.FC = () => {
  return (
    <SiteLayout
      footerLinks={[
        { label: 'Services', to: '/services' },
        { label: 'Our Story', to: '/story' },
        { label: 'Intake', to: '/intake' }
      ]}
    >
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Our Story | Why Pawollie Sense Exists</div>
            <h1 className="hero-title">Our Story</h1>
            <p className="section-lede">Born from a lifetime of loving, losing, and learning from the animals who shaped this heart.</p>
            <div className="hero-actions">
              <Link className="cta" to="/services">View Services</Link>
              <Link className="cta secondary" to="/intake">Start the Intake</Link>
            </div>
          </div>
          <div className="stack">
            <img className="hero-logo" src="/assets/pawollelogo.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card story-frame">
            <h2 className="section-title">Why Pawollie Sense Exists</h2>
            <p className="section-lede">
              Pawollie Sense was born from a truth I’ve known my whole life: animals are not “just pets.” They are teachers, protectors, and souls that choose to walk beside us.
              When you’ve loved an animal deeply, you know the bond lives far beyond words.
            </p>

            <p>
              My journey began with a tiny teacup Yorkie named Coupe. He came to me fragile, carrying illness and a body that couldn’t withstand stress. We were inseparable.
              I protected him the best I could, but one spring I had to leave briefly—and his little body never recovered from my absence. Letting him go was devastating.
              Before he passed, I touched my finger to the tip of his nose and whispered, “Come back to me.” I didn’t know what comes after death—I only knew love like that doesn’t disappear.
            </p>

            <p>
              About a year later, my mother called: her Shih Tzu had a litter of puppies. Most were black or black-and-white—except one small brown pup with Yorkie markings.
              She offered him to me, and that puppy became Browser Boy. From the moment I raised him, something felt familiar, comforting… meant. Like Coupe had found a way back, or at least guided him to me.
            </p>

            <p>
              Browser was my heart for six beautiful years. Then, without warning, he was taken in a tragic accident. I held him in my arms, my hand over his chest, begging his heartbeat to stay.
              When it stopped, something inside me broke in a way I still carry today.
            </p>

            <p>
              I swore I couldn’t love like that again. I adopted other dogs—wonderful companions—but none touched that same soul-deep place. Until one day, a coworker called.
              She had adopted one of Browser’s siblings, and that dog had just had puppies. She said there was one little brown fuzzy pup in the litter that made her think of me.
              I hesitated… and then I said yes.
            </p>

            <p>
              That day, I met Oliver Herbert—Ollie Bear—named for the black “O” marking on the roof of his mouth. From the start, we were inseparable. Oliver was brilliant, expressive, and almost human in his understanding.
              He learned faster than I could teach. He had inside games, personal commands, and preferences—like refusing unfiltered water simply because he saw that’s what I drank.
            </p>

            <p>
              Then came January 7, 2025—the day my childhood home burned to the ground. I lost a lifetime of belongings, the place that shaped me, and over half of my animals.
              Oliver was trapped upstairs with five of his siblings. I begged the firemen to save them. They didn’t. I went into shock and had to be sedated and taken to the hospital.
              The grief comes in waves, through memories and quiet triggers, still catching my breath when it hits.
            </p>

            <p>
              For a long time, I stopped wishing. I stopped hoping for miracles. I told myself I must not be meant to experience a love like that without losing it. And that is why Pawollie Sense exists.
              I couldn’t let Oliver’s spirit—his joy, intelligence, and tenderness—end in tragedy. I wanted his presence to keep touching hearts. I wanted my pain to become purpose.
            </p>

            <p>
              Pawollie Sense is dedicated to helping pet lovers build deeper, more respectful, soul-connected bonds with their companions—through gentle, grounded guidance rooted in care and consent.
              Because when we truly understand the spirit behind the eyes, we don’t just raise better-behaved pets. We create calmer homes, stronger trust, and more compassionate humans.
            </p>

            <p>
              Whether you’re deepening your bond or learning how to carry love after loss, Pawollie Sense is here to honor that connection—because some love never leaves us. It only changes form.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2 className="section-title">How it works</h2>
            <div className="steps">
              <div className="step">
                <h3>1. Choose a service</h3>
                <p>Select the reading or daily service that fits your question.</p>
              </div>
              <div className="step">
                <h3>2. Submit photos and intake</h3>
                <p>Upload 2 to 4 photos and share the emotional context needed for accuracy.</p>
              </div>
              <div className="step">
                <h3>3. Receive your reading</h3>
                <p>Detailed readings arrive in 3 to 5 business days. Daily services arrive instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2 className="section-title">FAQ</h2>
            <p className="section-lede">Visit the full FAQ page for quick answers about readings, photo uploads, and delivery timing.</p>
            <div className="hero-actions">
              <Link className="cta secondary" to="/faq">Open FAQ</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default About;
