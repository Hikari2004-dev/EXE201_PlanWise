import { useState } from "react";
import { X, Star, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface FeedbackModalProps {
  onClose: () => void;
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { fetchWithAuth } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Vui lòng chọn số sao đánh giá");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetchWithAuth("/api/v1/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      if (res.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        let errorMsg = "Có lỗi xảy ra khi gửi đánh giá";
        try {
          const data = await res.json();
          if (data.error) errorMsg = data.error;
          else if (data.message) errorMsg = data.message;
        } catch (parseError) {
          // Response is not JSON
          console.error("Failed to parse error response:", parseError);
        }
        setError(errorMsg);
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <MessageSquare size={18} className="text-primary" />
            Đánh giá ứng dụng
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {isSuccess ? (
            <div className="text-center py-8 space-y-3 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star size={32} className="fill-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Cảm ơn bạn!</h3>
              <p className="text-sm text-muted-foreground">
                Đánh giá của bạn đã được ghi nhận. Chúng tôi rất trân trọng đóng góp của bạn để cải thiện PlanWise.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-foreground">Bạn cảm thấy PlanWise như thế nào?</p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${
                          star <= (hoverRating || rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  <span>Nhận xét của bạn</span>
                  <span className="text-xs text-muted-foreground font-normal">(Không bắt buộc)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm hoặc góp ý của bạn để chúng tôi làm tốt hơn..."
                  className="w-full h-28 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || rating === 0}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    "Gửi đánh giá"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
