import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const Story: React.FC = () => {
  return (
    <SiteLayout
      footerLinks={[
        { label: 'About Us', to: '/about' },
        { label: 'Services', to: '/services' },
        { label: 'Intake', to: '/intake' }
      ]}
    >
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Origin story | Purpose | Reverence</div>
            <h1 className="hero-title">Our Story</h1>
            <p className="section-lede">A legacy of love carried forward with purpose.</p>
            <div className="hero-actions">
              <Link className="cta" to="/services" reloadDocument>View Services</Link>
              <Link className="cta secondary" to="/intake" reloadDocument>Start the Intake</Link>
            </div>
          </div>
          <div className="stack">
            <img className="hero-logo" src="/assets/branding/oli_globe_1.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2 className="section-title">Our Story</h2>
            <p className="section-lede">
              We believe animals are more than companions. They are teachers, protectors, and souls who walk beside us for a reason.
            </p>
            <p className="section-lede">
              Pawollie Sense is rooted in this belief, shaped by a bond I was fortunate enough to experience not once—but three times—with extraordinary little souls who forever changed my understanding of love, connection, and responsibility.
            </p>
            <p>
              It began years ago with a tiny teacup Yorkie named Coupe, given to me as a Valentine’s gift. Coupe was born into difficult circumstances, unknowingly carrying demodectic mange due to poor breeding conditions. Stress weakened his immune system, and despite careful management and deep devotion, his condition progressed. When I had to travel briefly and leave him in the care of family, the stress of separation became more than his fragile body could bear.
            </p>
            <p>
              Making the decision to let him rest peacefully was one of the hardest moments of my life. As I said goodbye, I touched his nose and whispered a promise—asking him, in whatever way possible, to come back to me. I didn’t know what existed beyond death, but I knew love did not simply disappear.
            </p>
            <p>
              About a year later, something extraordinary happened. My mother’s Shih Tzu gave birth to a litter of puppies after an unexpected pairing with two different males—one Yorkie, one Shih Tzu. All the puppies shared similar black-and-white markings… except one. One pup was brown, with unmistakable Yorkie features. Knowing my loss, my mother offered him to me.
            </p>
            <p>
              That pup became Browser Boy. From the moment we bonded, it felt familiar—deeply, unmistakably familiar. His intelligence, his awareness, his emotional sensitivity mirrored Coupe in ways that were impossible to ignore. It felt as though love had found its way back, transformed but intact.
            </p>
            <p>
              Browser and I shared six joyful years before a sudden accident took him from me far too soon. I held him in my arms as he passed, feeling his heartbeat fade beneath my hand. That moment left a permanent mark on my heart—a grief so sharp and sudden that it reshaped me.
            </p>
            <p>
              For years afterward, I believed I could never allow myself to love that deeply again. Then, life intervened—gently, insistently. A coworker who had adopted one of Browser’s siblings reached out years later. That sibling had puppies, and among them was another brown, fuzzy little soul. Knowing my story, she felt compelled to call me.
            </p>
            <p>
              That puppy was Oliver Herbert. Oliver carried something extraordinary—an intelligence, awareness, and personality that felt like the culmination of everything I had loved before. We were inseparable. He learned quickly, communicated intuitively, and formed a bond with me that went beyond training or routine. Oliver wasn’t just a pet—he was a presence.
            </p>
            <p>
              For nearly seven years, he was my constant. On January 7, 2025, a house fire changed everything. My childhood home—where I had returned as an adult—was destroyed. Despite every effort, despite desperate attempts to save them, Oliver and several of his companions were lost upstairs as the fire spread faster than anyone could reach. The loss was overwhelming—my home, my belongings, and more than half of my animals gone in a single day.
            </p>
            <p>
              That grief is not something you “get over.” You learn to carry it. Pawollie Sense was born from that place—not from despair, but from meaning.
            </p>
            <p>
              I realized that Oliver’s impact did not end with his life. His spirit—his way of connecting, teaching, and loving—could still serve others. Pawollie Sense exists as a way to honor that truth: to help people understand their animals more deeply while they are here, to strengthen bonds, to reduce misunderstanding, and to preserve connection even through loss.
            </p>
            <p className="section-lede">
              Our mission is simple, but profound: To help every pet lover experience a deeper, more conscious bond with their animal—one rooted in respect, awareness, and mutual understanding.
            </p>
            <p>
              Whether you are seeking insight into behavior, guidance through change, or a way to honor a beloved companion’s memory, Pawollie Sense offers compassionate support grounded in care—not fear, not spectacle, and never exploitation.
            </p>
            <p>
              I have always felt a natural connection with animals. From a young age, I recognized the individual spirit behind every set of eyes. Pawollie Sense reflects that lifelong understanding: that animals are not accessories to our lives, but participants in them.
            </p>
            <p>
              This work exists to enrich the bond you already share—to help you see your companion more clearly, love them more consciously, and honor the relationship in a way that supports both of you.
            </p>
            <p className="section-lede">
              That is Pawollie Sense. A legacy of love, carried forward with purpose.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Story;
