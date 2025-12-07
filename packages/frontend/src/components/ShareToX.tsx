import { useState, useEffect, useRef } from 'react';
import { Share2, Twitter, Check, ExternalLink, LogIn, Video } from 'lucide-react';
import { xApi, XAuthConfig } from '../services/api';

interface ShareToXProps {
  code: string; // Strudel code to reference (for future: include in share)
  description?: string;
  videoBlob?: Blob | null; // Recorded video to attach
}

// X OAuth tokens stored in memory (cleared on page refresh)
// In production, consider using secure httpOnly cookies via backend
interface XSession {
  accessToken: string;
  refreshToken: string;
  username: string;
  expiresAt: number;
}

const X_SESSION_KEY = 'kre8_x_session';

function getStoredSession(): XSession | null {
  try {
    const stored = localStorage.getItem(X_SESSION_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored) as XSession;
    // Check if expired
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(X_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

// Store session for future use when full OAuth flow returns tokens
function storeSession(session: XSession): void {
  localStorage.setItem(X_SESSION_KEY, JSON.stringify(session));
}
void storeSession; // Silence unused warning - will be used when OAuth callback stores tokens

function clearSession(): void {
  localStorage.removeItem(X_SESSION_KEY);
}

export function ShareToX({ code: _code, description, videoBlob }: ShareToXProps) {
  const [config, setConfig] = useState<XAuthConfig | null>(null);
  const [session, setSession] = useState<XSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [shareResult, setShareResult] = useState<{ url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [tweetText, setTweetText] = useState('');
  const [attachVideo, setAttachVideo] = useState(true);
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check for OAuth callback on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authSuccess = params.get('x_auth_success');
    const username = params.get('x_username');
    const authError = params.get('x_auth_error');

    if (authSuccess && username) {
      // OAuth succeeded - for now, we'll prompt user to try sharing again
      // In a full implementation, tokens would be stored server-side in session
      setError(null);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (authError) {
      setError(`X authorization failed: ${authError}`);
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Load stored session
    const stored = getStoredSession();
    if (stored) {
      setSession(stored);
    }

    // Check X config
    checkConfig();
  }, []);

  async function checkConfig() {
    try {
      const cfg = await xApi.getConfig();
      setConfig(cfg);
    } catch (err) {
      console.error('Failed to check X config:', err);
    }
  }

  async function handleConnect() {
    setIsLoading(true);
    setError(null);
    try {
      const authUrl = await xApi.getAuthUrl();
      // Redirect to X for authorization
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start authorization');
      setIsLoading(false);
    }
  }

  function handleOpenModal() {
    // Compose default tweet text
    const defaultText = description
      ? `${description}\n\nCreated with Kre8 - Beat Maker for X by @xai`
      : `Just made this beat with Kre8!\n\nPowered by Grok from @xai`;

    setTweetText(defaultText);
    setShareResult(null);
    setError(null);
    setUploadedMediaId(null);
    setAttachVideo(!!videoBlob);
    setShowModal(true);
  }

  async function handleShare() {
    if (!session?.accessToken) {
      setError('Please connect your X account first');
      return;
    }

    if (!tweetText.trim()) {
      setError('Tweet text cannot be empty');
      return;
    }

    if (tweetText.length > 280) {
      setError('Tweet exceeds 280 character limit');
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      // Upload video if enabled and not already uploaded
      let mediaId = uploadedMediaId;
      if (attachVideo && videoBlob && !mediaId) {
        setIsUploading(true);
        // Determine video mime type
        const mimeType = videoBlob.type || 'video/webm';
        const uploadResult = await xApi.uploadMedia(session.accessToken, videoBlob, mimeType);
        mediaId = uploadResult.mediaId;
        setUploadedMediaId(mediaId);
        setIsUploading(false);
      }

      const result = await xApi.postTweet(session.accessToken, tweetText, attachVideo ? mediaId ?? undefined : undefined);
      setShareResult({ url: result.tweetUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to post tweet';
      if (message.includes('401') || message.includes('unauthorized')) {
        // Token expired, clear session
        clearSession();
        setSession(null);
        setError('Session expired. Please reconnect your X account.');
      } else {
        setError(message);
      }
    } finally {
      setIsSharing(false);
      setIsUploading(false);
    }
  }

  function handleDisconnect() {
    clearSession();
    setSession(null);
    setShareResult(null);
  }

  // Not configured
  if (config && !config.configured) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-card text-text-secondary rounded-full cursor-not-allowed border border-border-primary"
        title="X sharing not configured"
      >
        <Twitter size={18} />
        Share to X
      </button>
    );
  }

  return (
    <>
      {/* Share Button */}
      <button
        onClick={session ? handleOpenModal : handleConnect}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-x-blue text-white rounded-full hover:bg-x-blue-hover transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : session ? (
          <Share2 size={18} />
        ) : (
          <LogIn size={18} />
        )}
        {session ? 'Share to X' : 'Connect X'}
        {session && (
          <span className="text-xs text-text-secondary">@{session.username}</span>
        )}
      </button>

      {/* Share Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl border border-border-primary">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Twitter size={24} />
                Share to X
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-secondary hover:text-text-primary text-2xl"
              >
                &times;
              </button>
            </div>

            {shareResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-400">
                  <Check size={20} />
                  <span>Posted successfully!</span>
                </div>
                <a
                  href={shareResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-x-blue hover:underline"
                >
                  View your post <ExternalLink size={16} />
                </a>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-2 bg-border-primary text-text-primary rounded-full hover:bg-card"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <textarea
                    value={tweetText}
                    onChange={(e) => setTweetText(e.target.value)}
                    className="w-full h-32 bg-background text-text-primary rounded-lg p-3 resize-none border border-border-primary focus:outline-none focus:ring-2 focus:ring-x-blue"
                    placeholder="What's happening?"
                    maxLength={280}
                  />
                  <div className={`text-right text-sm ${tweetText.length > 260 ? 'text-yellow-400' : 'text-text-secondary'} ${tweetText.length > 280 ? 'text-red-400' : ''}`}>
                    {tweetText.length}/280
                  </div>
                </div>

                {/* Video Attachment Section */}
                {videoBlob && (
                  <div className="bg-background rounded-lg p-3 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Video size={16} className="text-purple-400" />
                        <span className="text-sm font-medium text-text-primary">Video Attachment</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={attachVideo}
                          onChange={(e) => setAttachVideo(e.target.checked)}
                          className="w-4 h-4 rounded accent-purple-500"
                        />
                        <span className="text-xs text-text-secondary">Include video</span>
                      </label>
                    </div>
                    {attachVideo && (
                      <div className="space-y-2">
                        <video
                          ref={videoRef}
                          src={URL.createObjectURL(videoBlob)}
                          controls
                          className="w-full h-32 rounded bg-black"
                        />
                        <div className="flex items-center justify-between text-xs text-text-secondary">
                          <span>{(videoBlob.size / 1024 / 1024).toFixed(2)} MB</span>
                          {uploadedMediaId && (
                            <span className="flex items-center gap-1 text-green-400">
                              <Check size={12} />
                              Uploaded
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No Video Message */}
                {!videoBlob && (
                  <div className="bg-background rounded-lg p-3 border border-border-primary text-center">
                    <Video size={20} className="mx-auto mb-1 text-text-secondary" />
                    <p className="text-xs text-text-secondary">
                      Record a 30s video to share with your post
                    </p>
                  </div>
                )}

                {error && (
                  <div className="text-red-400 text-sm">{error}</div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 bg-border-primary text-text-primary rounded-full hover:bg-card"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={isSharing || isUploading || tweetText.length > 280}
                    className="flex-1 py-2 bg-x-blue text-white rounded-full hover:bg-x-blue-hover disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSharing || isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isUploading ? 'Uploading...' : 'Posting...'}
                      </>
                    ) : (
                      <>
                        <Twitter size={18} />
                        {attachVideo && videoBlob ? 'Post with Video' : 'Post'}
                      </>
                    )}
                  </button>
                </div>

                <div className="border-t border-border-primary pt-3">
                  <button
                    onClick={handleDisconnect}
                    className="text-sm text-text-secondary hover:text-red-400"
                  >
                    Disconnect @{session?.username}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
