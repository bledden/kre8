import { useState, useEffect } from 'react';
import { Star, X, Send, Loader2 } from 'lucide-react';
import { feedbackApi, FeedbackRating } from '../services/api';
import type { StrudelCode } from '@kre8/shared';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: StrudelCode;
  prompt: string;
  listenDurationMs?: number;
}

export function FeedbackModal({
  isOpen,
  onClose,
  code,
  prompt,
  listenDurationMs,
}: FeedbackModalProps) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [textFeedback, setTextFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setRating(null);
      setHoverRating(null);
      setTextFeedback('');
      setIsSubmitted(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await feedbackApi.submitFeedback({
        rating,
        textFeedback: textFeedback.trim() || undefined,
        prompt,
        code: code.code,
        metadata: {
          tempo: code.metadata?.tempo,
          genre: code.metadata?.instruments?.[0], // Use first instrument as genre hint
          instruments: code.metadata?.instruments,
          listenDurationMs,
        },
      });

      setIsSubmitted(true);

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('[FeedbackModal] Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const getRatingLabel = (r: number): string => {
    const labels: Record<number, string> = {
      1: 'Not for me',
      2: 'Needs work',
      3: 'It\'s okay',
      4: 'Really good',
      5: 'Perfect!',
    };
    return labels[r] || '';
  };

  const displayRating = hoverRating ?? rating ?? 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-border-primary">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-text-primary">
            How was this track?
          </h3>
          <button
            onClick={handleSkip}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">
              {rating && rating >= 4 ? '🎵' : rating && rating <= 2 ? '📝' : '👍'}
            </div>
            <p className="text-lg text-text-primary">Thanks for your feedback!</p>
            <p className="text-sm text-text-secondary mt-2">
              This helps Grok learn your preferences
            </p>
          </div>
        ) : (
          <>
            {/* Star Rating */}
            <div className="mb-6">
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star as FeedbackRating)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-x-blue rounded"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      size={36}
                      className={`transition-colors ${
                        star <= displayRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-text-secondary'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-text-secondary h-5">
                {displayRating > 0 ? getRatingLabel(displayRating) : 'Tap a star to rate'}
              </p>
            </div>

            {/* Text Feedback */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                What did you think? <span className="text-text-secondary">(optional)</span>
              </label>
              <textarea
                value={textFeedback}
                onChange={(e) => setTextFeedback(e.target.value)}
                placeholder="Tell us what you liked or what could be better..."
                className="w-full h-24 bg-background text-text-primary rounded-lg p-3 resize-none border border-border-primary focus:outline-none focus:ring-2 focus:ring-x-blue placeholder:text-text-secondary"
                maxLength={2000}
              />
              <div className="flex justify-between text-xs text-text-secondary mt-1">
                <span>Your feedback helps personalize future tracks</span>
                <span>{textFeedback.length}/2000</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 py-2.5 bg-border-primary text-text-primary rounded-full hover:bg-card transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={!rating || isSubmitting}
                className="flex-1 py-2.5 bg-x-blue text-white rounded-full hover:bg-x-blue-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
