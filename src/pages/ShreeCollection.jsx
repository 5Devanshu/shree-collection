import React from 'react';
import './ShreeCollection.css';

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
    icon: '◎',
    url: 'https://www.instagram.com/shreecollection_byaarya?mdxt=eDYyZjg3bW5jbHR4',
  },
  {
    id: 'facebook',
    title: 'Facebook',
    description: 'Connect with Shree Collection',
    icon: 'f',
    url: 'https://www.facebook.com/share/1CfAXKYTq5/',
  },
  {
    id: 'google',
    title: 'Google Reviews',
    description: 'We would love to hear your experience',
    icon: '★',
    url: 'https://g.page/r/Ce_iDyBJhgWkEBM/review',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Business',
    description: 'Chat with us directly',
    icon: '◉',
    url: 'https://wa.me/message/JQP6C6WXSXCTP1',
  },
  {
    id: 'youtube',
    title: 'YouTube Channel',
    description: 'Watch our latest videos',
    icon: '▶',
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
