import React from 'react';
import './ShreeCollection.css';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" className="sc-icon-fill" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M14 8h3V4h-3c-3.3 0-5 1.8-5 5v3H6v4h3v4h4v-4h3.5l.5-4H13V9c0-.7.3-1 1-1Z" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285f4" d="M21.8 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.5 3-7.8Z" />
    <path fill="#34a853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.2H3v2.7A10 10 0 0 0 12 22Z" />
    <path fill="#fbbc05" d="M6.4 13.7a6 6 0 0 1 0-3.4V7.6H3a10 10 0 0 0 0 8.8l3.4-2.7Z" />
    <path fill="#ea4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3 7.6l3.4 2.7C7.2 7.9 9.4 6.1 12 6.1Z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5Zm0 17.2a7.7 7.7 0 0 1-3.9-1.1l-.3-.2-2.8.8.8-2.7-.2-.3a7.7 7.7 0 1 1 6.4 3.5Zm4.2-5.8c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.1-.3.2-.5.1a6.2 6.2 0 0 1-3.1-2.7c-.2-.3.2-.3.6-1.1.1-.2 0-.3 0-.4l-.6-1.5c-.2-.4-.3-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5a8.8 8.8 0 0 0 3.4 3c1.3.6 1.8.6 2.5.5.4-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1-.1-.1-.2-.2-.4-.3Z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.6 9.4.6 9.4.6s7.6 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
  </svg>
);

const businessLinks = [
  {
    id: 'website',
    title: 'Official Website',
    description: 'Explore our exclusive collections',
    icon: '🌐',
    url: 'https://shreecollection.co.in/',
  },
  {
    id: 'instagram',
    title: 'Instagram',
    description: 'Follow us for latest designs and updates',
    icon: <InstagramIcon />,
    url: 'https://www.instagram.com/shreecollection_byaarya?mdxt=eDYyZjg3bW5jbHR4',
  },
  {
    id: 'facebook',
    title: 'Facebook',
    description: 'Connect with Shree Collection',
    icon: <FacebookIcon />,
    url: 'https://www.facebook.com/share/1CfAXKYTq5/',
  },
  {
    id: 'google',
    title: 'Google Reviews',
    description: 'We would love to hear your experience',
    icon: <GoogleIcon />,
    url: 'https://g.page/r/Ce_iDyBJhgWkEBM/review',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Business',
    description: 'Chat with us directly',
    icon: <WhatsAppIcon />,
    url: 'https://wa.me/message/JQP6C6WXSXCTP1',
  },
  {
    id: 'youtube',
    title: 'YouTube Channel',
    description: 'Watch our latest videos',
    icon: <YouTubeIcon />,
    url: 'https://youtube.com/@shreecollection_byaarya?si=ZTGXccBcPVGJ4EK6',
  },
];

export default function ShreeCollection() {
  const handleShare = async () => {
    const shareData = {
      title: 'Shree Collection by Aarya',
      text: 'Discover Shree Collection. Connect with us through our website and social media.',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        window.alert('Profile link copied successfully!');
      } else {
        window.prompt('Copy your profile link:', shareData.url);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Unable to share profile:', error);
      }
    }
  };

  return (
    <main className="sc-page">
      <div className="sc-card">
        <div className="sc-gold-border" />

        <header className="sc-header">
          <div className="sc-logo-container">
            <img src="/logo.png" alt="Shree Collection by Aarya" className="sc-logo" />
          </div>

          <div className="sc-divider">
            <span>✦</span>
          </div>

          <h1>SHREE COLLECTION</h1>
          <p className="sc-brand-name">BY AARYA</p>
          <p className="sc-tagline">Elegance in Every Detail</p>
          <p className="sc-intro">
            Discover our collections and stay connected with Shree Collection.
          </p>
        </header>

        <section className="sc-links-section">
          <div className="sc-section-title">
            <span />
            <p>CONNECT WITH US</p>
            <span />
          </div>

          <div className="sc-links">
            {businessLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`sc-link sc-link-${link.id}`}
                aria-label={link.title}
              >
                <div className="sc-link-icon">{link.icon}</div>
                <div className="sc-link-content">
                  <h2>{link.title}</h2>
                  <p>{link.description}</p>
                </div>
                <div className="sc-arrow">↗</div>
              </a>
            ))}
          </div>
        </section>

        <button className="sc-share-button" onClick={handleShare} type="button">
          <span>↗</span>
          SHARE OUR PROFILE
        </button>

        <footer className="sc-footer">
          <div className="sc-footer-decoration">✧ ─── ✦ ─── ✧</div>
          <p className="sc-footer-brand">SHREE COLLECTION BY AARYA</p>
          <p className="sc-footer-message">Thank you for connecting with us.</p>
          <p className="sc-copyright">
            © {new Date().getFullYear()} Shree Collection. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
