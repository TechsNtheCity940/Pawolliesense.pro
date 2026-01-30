import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';

export type FooterLink = {
  label: string;
  to: string;
};

const defaultLinks: FooterLink[] = [
  { label: 'Services', to: '/services' },
  { label: 'About', to: '/about' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Community', to: '/community' },
  { label: 'Intake', to: '/intake' }
];

const SiteFooter: React.FC<{ links?: FooterLink[] }> = ({ links }) => {
  const items = links?.length ? links : defaultLinks;

  return (
    <footer className="footer">
      <div className="container">
        <div>
          {items.map((link, index) => (
            <Fragment key={`${link.to}-${link.label}`}>
              <Link to={link.to}>{link.label}</Link>
              {index < items.length - 1 ? ' | ' : null}
            </Fragment>
          ))}
        </div>
        <div className="mini">Copyright Pawollie Sense. In memory of Oliver Herbert.</div>
      </div>
    </footer>
  );
};

export default SiteFooter;
