import { useState, useEffect, useRef } from 'react';

// Initials Avatar Component
const Avatar = ({ name }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const bgColors = [
    '#3525cd', // brand primary
    '#4f46e5', // indigo
    '#0ea5e9', // sky blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];
  const charCodeSum = name ? [...name].reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
  const bgColor = bgColors[charCodeSum % bgColors.length];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: bgColor,
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '15px',
      textTransform: 'uppercase',
      userSelect: 'none'
    }}>
      {initial}
    </div>
  );
};

export default function Dashboard({ user, token, onLogout }) {
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('public');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedLoading, setFeedLoading] = useState(false);

  const fileInputRef = useRef(null);
  const imagePreviewRef = useRef(null);

  // Fetch posts from API inside useEffect
  useEffect(() => {
    const fetchPosts = async () => {
      setFeedLoading(true);
      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch('http://localhost:5000/api/posts', { headers });
        if (!response.ok) throw new Error('Failed to load feed.');
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setFeedLoading(false);
      }
    };

    fetchPosts();
  }, [token]);

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed.');
        return;
      }
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  // Remove Selected Image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Post
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content && !imageFile) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('content', content);
    formData.append('audience', audience);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      // Add to feed immediately
      setPosts([data, ...posts]);
      
      // Reset composer
      setContent('');
      handleRemoveImage();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3D Card Hover Effect for Image Preview
  const handleMouseMove = (e) => {
    if (!imagePreviewRef.current) return;
    const card = imagePreviewRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const rotateX = (y - rect.height / 2) / 15;
    const rotateY = (rect.width / 2 - x) / 15;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!imagePreviewRef.current) return;
    imagePreviewRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  };

  const isCloseToLimit = content.length >= 260;

  return (
    <div className="app-container">
      {/* Decorative Background Blobs */}
      <div className="bg-blob-1"></div>
      <div className="bg-blob-2"></div>

      {/* Top Navigation */}
      <header className="header-nav">
        <div className="brand-logo-container">
          <div className="brand-icon-wrapper">
            <span className="material-symbols-outlined">bubble_chart</span>
          </div>
          <span className="brand-title">Aura</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="user-badge">
            <div className="avatar-wrapper" style={{ width: '24px', height: '24px' }}>
              <Avatar name={user?.name} />
            </div>
            <span>{user?.name}</span>
          </div>
          <button className="logout-icon-btn tap-active" onClick={onLogout} title="Log Out">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Dashboard */}
      <main className="dashboard-container">
        {/* Composer Card */}
        <section className="composer-card">
          {/* User profile row & audience pill */}
          <div className="user-profile-bar">
            <div className="avatar-wrapper">
              <Avatar name={user?.name} />
            </div>
            <div className="user-info-meta">
              <span className="user-display-name">{user?.name}</span>
              <button 
                className="audience-pill"
                onClick={() => setAudience(audience === 'public' ? 'private' : 'public')}
              >
                <span className="material-symbols-outlined">
                  {audience === 'public' ? 'public' : 'lock'}
                </span>
                <span>{audience === 'public' ? 'Public' : 'Private'}</span>
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
          </div>

          {/* Text Area */}
          <div className="textarea-wrapper">
            <textarea
              className="composer-textarea"
              maxLength={280}
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            
            {/* Character Counter */}
            <div className={`char-counter-badge ${isCloseToLimit ? 'limit-danger' : ''}`}>
              <span>{content.length}</span>/280
            </div>
          </div>

          {/* Image preview box */}
          {imagePreviewUrl && (
            <div 
              ref={imagePreviewRef}
              className="image-preview-container"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <img src={imagePreviewUrl} alt="Upload Preview" className="image-preview" />
              <button 
                type="button" 
                className="remove-image-btn"
                onClick={handleRemoveImage}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}

          {error && <div className="error-banner" style={{ margin: 0 }}>{error}</div>}

          {/* Bottom Toolbar & Post actions */}
          <div className="composer-toolbar">
            <div className="toolbar-actions">
              <input
                type="file"
                accept="image/*"
                className="hidden-file-input"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <button 
                className="toolbar-btn tap-active"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Attach Image"
              >
                <span className="material-symbols-outlined">image</span>
              </button>
              <button className="toolbar-btn tap-active" title="GIF (Static)">
                <span className="material-symbols-outlined">gif_box</span>
              </button>
              <button className="toolbar-btn tap-active" title="Poll (Static)">
                <span className="material-symbols-outlined">poll</span>
              </button>
              <button className="toolbar-btn tap-active" title="Location (Static)">
                <span className="material-symbols-outlined">location_on</span>
              </button>
            </div>
            
            <button 
              className={`post-submit-btn tap-active ${(content || imageFile) ? 'active-submit' : ''}`}
              disabled={loading || (!content && !imageFile)}
              onClick={handlePostSubmit}
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </section>

        {/* Feed Listing */}
        <section>
          <h2 className="feed-header">Recent Feed</h2>
          {feedLoading && posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--outline)' }}>
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px var(--space-md)', 
              backgroundColor: 'var(--surface-container-lowest)',
              borderRadius: 'var(--radius-2xl)',
              color: 'var(--outline)',
              boxShadow: 'var(--shadow-soft)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '12px' }}>
                forum
              </span>
              <p style={{ fontWeight: 500 }}>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            <div className="feed-list">
              {posts.map((post) => (
                <article key={post.id} className="feed-item">
                  <div className="feed-item-header">
                    <div className="feed-item-user">
                      <div className="feed-item-avatar">
                        <Avatar name={post.user_name} />
                      </div>
                      <div className="feed-item-name-box">
                        <span className="feed-item-name">{post.user_name}</span>
                        <span className="feed-item-time">
                          {new Date(post.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <span className="feed-item-audience">
                      <span className="material-symbols-outlined">
                        {post.audience === 'public' ? 'public' : 'lock'}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>
                        {post.audience}
                      </span>
                    </span>
                  </div>
                  
                  <div className="feed-item-content">
                    {post.content}
                  </div>
                  
                  {post.media_url && (
                    <img 
                      src={`http://localhost:5000${post.media_url}`} 
                      alt="Attached media" 
                      className="feed-item-media" 
                    />
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
