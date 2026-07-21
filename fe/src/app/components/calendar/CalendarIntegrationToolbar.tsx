import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CalendarSync,
  Check,
  CloudOff,
  Link2,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import {
  calendarIntegrationApi,
  getGoogleAuthorizationUrl,
  type CalendarIntegrationStatus,
  type CalendarSyncResponse,
} from "../../api";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface CalendarIntegrationToolbarProps {
  enabled?: boolean;
  language: "vi" | "en";
  planwiseEventCount: number;
  googleEventCount: number;
  showPlanwise: boolean;
  showGoogle: boolean;
  onTogglePlanwise: () => void;
  onToggleGoogle: () => void;
  onRefresh: () => Promise<void>;
}

export function CalendarIntegrationToolbar({
  enabled = true,
  language,
  planwiseEventCount,
  googleEventCount,
  showPlanwise,
  showGoogle,
  onTogglePlanwise,
  onToggleGoogle,
  onRefresh,
}: CalendarIntegrationToolbarProps) {
  const [status, setStatus] = useState<CalendarIntegrationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [action, setAction] = useState<"refresh" | "sync" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const statuses = await calendarIntegrationApi.getStatuses();
      setStatus(statuses.find((item) => item.provider === "google") || null);
    } catch (error) {
      setStatus({
        provider: "google",
        connected: false,
        state: "ERROR",
        message: error instanceof Error ? error.message : "Unable to check Google Calendar",
      });
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      loadStatus();
    }
  }, [enabled, loadStatus]);

  const handleRefresh = async () => {
    setAction("refresh");
    setFeedback(null);
    try {
      await onRefresh();
      await loadStatus();
      setFeedback(language === "vi" ? "Đã làm mới dữ liệu lịch." : "Calendar data refreshed.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to refresh calendars");
    } finally {
      setAction(null);
    }
  };

  const handleSync = async () => {
    setAction("sync");
    setFeedback(null);
    try {
      const result: CalendarSyncResponse = await calendarIntegrationApi.sync("google");
      await onRefresh();
      await loadStatus();
      setFeedback(
        language === "vi"
          ? `Đã đồng bộ ${result.synchronizedCount}/${result.total} sự kiện.`
          : `Synced ${result.synchronizedCount}/${result.total} events.`,
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to synchronize calendars");
    } finally {
      setAction(null);
    }
  };

  const reconnect = () => {
    window.location.href = getGoogleAuthorizationUrl();
  };

  const state = loadingStatus ? "CHECKING" : status?.state || "DISCONNECTED";
  const isReady = state === "READY";
  const isError = state === "ERROR";
  const stateLabel = state === "CHECKING"
    ? (language === "vi" ? "Đang kiểm tra" : "Checking")
    : isReady
      ? (language === "vi" ? "Đã kết nối" : "Connected")
      : isError
        ? (language === "vi" ? "Cần xử lý" : "Needs attention")
        : (language === "vi" ? "Chưa kết nối" : "Disconnected");

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-slate-900" role="group" aria-label="Calendar sources">
        <button
          type="button"
          aria-pressed={showPlanwise}
          onClick={onTogglePlanwise}
          className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors ${showPlanwise ? "bg-white text-gray-800 shadow-sm dark:bg-slate-800 dark:text-slate-100" : "text-gray-400 dark:text-slate-500"}`}
        >
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-indigo-600 text-white">{showPlanwise && <Check size={10} />}</span>
          <span>PlanWise</span>
        </button>
        <button
          type="button"
          aria-pressed={showGoogle}
          onClick={onToggleGoogle}
          className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors ${showGoogle ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-200" : "text-gray-400 dark:text-slate-500"}`}
        >
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-blue-600 text-white">{showGoogle ? <Check size={10} /> : "G"}</span>
          <span>Google</span>
        </button>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`flex h-8 shrink-0 items-center gap-2 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${isReady ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200" : isError ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200" : "border-gray-200 bg-white text-gray-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}
            title="Google Calendar"
          >
            <CalendarSync size={14} className={loadingStatus ? "animate-pulse" : ""} />
            <span className="hidden sm:inline">Google Calendar</span>
            <span className={`h-1.5 w-1.5 rounded-full ${isReady ? "bg-emerald-500" : isError ? "bg-amber-500" : "bg-gray-400"}`} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(340px,calc(100vw-2rem))] overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">G</span>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">Google Calendar</p>
                <p className={`text-[11px] font-medium ${isReady ? "text-emerald-600 dark:text-emerald-300" : isError ? "text-amber-600 dark:text-amber-300" : "text-gray-400"}`}>{stateLabel}</p>
              </div>
            </div>
            <button type="button" onClick={handleRefresh} disabled={action !== null} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200" title={language === "vi" ? "Làm mới" : "Refresh"}>
              <RefreshCw size={14} className={action === "refresh" ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="space-y-3 px-4 py-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-400 dark:text-slate-500">{language === "vi" ? "Event đã tải" : "Loaded events"}</p>
                <p className="mt-0.5 font-semibold text-gray-800 dark:text-slate-200">{googleEventCount}</p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-slate-500">{language === "vi" ? "Lịch ứng dụng" : "App calendar"}</p>
                <p className="mt-0.5 truncate font-semibold text-gray-800 dark:text-slate-200">{status?.applicationCalendarName || "-"}</p>
              </div>
            </div>

            {isError && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span className="break-words">{status?.message || (language === "vi" ? "Không thể truy cập Google Calendar." : "Google Calendar is unavailable.")}</span>
              </div>
            )}

            {!isReady ? (
              <button type="button" onClick={reconnect} className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                {isError ? <RotateCw size={14} /> : <Link2 size={14} />}
                {language === "vi" ? (isError ? "Kết nối lại" : "Kết nối Google") : (isError ? "Reconnect" : "Connect Google")}
              </button>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={handleRefresh} disabled={action !== null} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <CalendarDays size={14} />
                  {language === "vi" ? "Làm mới" : "Refresh"}
                </button>
                <button type="button" onClick={handleSync} disabled={action !== null} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-700">
                  <RotateCw size={14} className={action === "sync" ? "animate-spin" : ""} />
                  {language === "vi" ? "Đồng bộ" : "Sync"}
                </button>
              </div>
            )}

            {state === "DISCONNECTED" && (
              <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-slate-500">
                <CloudOff size={13} />
                <span>{language === "vi" ? "Không có kết nối Google đang hoạt động" : "No active Google connection"}</span>
              </div>
            )}
            {feedback && <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">{feedback}</p>}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
