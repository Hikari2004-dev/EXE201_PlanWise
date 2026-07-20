import { Send, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { SuggestionChips } from "./SuggestionChips";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ConversationPanelProps {
  language: "vi" | "en";
  messages: ConversationMessage[];
  input: string;
  isLoading: boolean;
  loadingText: string;
  onInputChange: (value: string) => void;
  onSend: (value: string) => void;
}

export function ConversationPanel({
  language,
  messages,
  input,
  isLoading,
  loadingText,
  onInputChange,
  onSend,
}: ConversationPanelProps) {
  const hasMessages = messages.length > 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSend(input);
  };

  return (
    <section className="flex min-h-[420px] flex-col bg-white dark:bg-slate-950">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200">
            <Sparkles size={17} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {language === "vi" ? "Trao đổi" : "Conversation"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === "vi" ? "Nói rõ việc cần lên lịch" : "Describe the planning job"}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!hasMessages ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {language === "vi" ? "Bạn muốn sắp xếp gì tiếp theo?" : "What should we plan next?"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {language === "vi"
                  ? "Planner Assistant có thể biến yêu cầu ngắn thành bản nháp gồm lịch, task và thói quen để bạn duyệt trước."
                  : "Planner Assistant can turn a short request into a draft of events, tasks, and habits for review."}
              </p>
            </div>
            <SuggestionChips language={language} disabled={isLoading} onSelect={onSend} />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-8 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                    : "mr-8 border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="mr-8 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-200">
                {loadingText}
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-slate-200 p-3 dark:border-slate-800">
        <div className="space-y-2">
          <Textarea
            value={input}
            disabled={isLoading}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={language === "vi" ? "Ví dụ: Lên kế hoạch tuần sau cho các task học tập." : "Example: Plan my next week around my study tasks."}
            className="min-h-[76px] bg-white text-sm dark:bg-slate-900"
          />
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={isLoading || !input.trim()} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200">
              <Send size={15} />
              {language === "vi" ? "Gửi" : "Send"}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
