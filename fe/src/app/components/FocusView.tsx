import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import {
  Play,
  Pause,
  Square,
  Clock,
  Zap,
  StickyNote,
  Mic,
  Maximize2,
  Minimize2,
  AlertTriangle,
  X,
  Volume2,
} from "lucide-react";
import { COLOR_MAP } from "../data/mockData";
import { useData } from "../context/DataContext";

function parseScheduledAt(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDueDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getTaskStatus(task: { status?: string; completed: boolean; dueDate?: string }) {
  if (task.status) return task.status;
  if (task.completed) return "COMPLETED";
  if (task.dueDate) {
    const dueDate = new Date(`${task.dueDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!Number.isNaN(dueDate.getTime()) && dueDate < today) return "MISSED";
  }
  return "IN_PROGRESS";
}

const MAX_PAUSE_COUNT = 3;

export function FocusView() {
  const { tasks, dailyFocus } = useData();
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(25 * 60);
  const [quickNote, setQuickNote] = useState("");

  // Focus Mode State
  const [showPreFocusDialog, setShowPreFocusDialog] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [showDistractionWarning, setShowDistractionWarning] = useState(false);
  const [distractionCount, setDistractionCount] = useState(0);

  const focusModeRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().slice(0, 10);
  const selectedTopTaskIds = dailyFocus?.date === todayKey ? dailyFocus.topTasks : [];
  const activeTasks = tasks.filter((task) => getTaskStatus(task) !== "COMPLETED");
  const topTasks = [...activeTasks]
    .sort((a, b) => {
      const aSelected = selectedTopTaskIds.includes(a.id) ? 0 : 1;
      const bSelected = selectedTopTaskIds.includes(b.id) ? 0 : 1;
      if (aSelected !== bSelected) return aSelected - bSelected;

      const aScheduled = parseScheduledAt(a.scheduledAt);
      const bScheduled = parseScheduledAt(b.scheduledAt);
      const aScheduledToday = aScheduled && isSameDay(aScheduled, today) ? 0 : 1;
      const bScheduledToday = bScheduled && isSameDay(bScheduled, today) ? 0 : 1;
      if (aScheduledToday !== bScheduledToday) return aScheduledToday - bScheduledToday;

      const aStatus = getTaskStatus(a);
      const bStatus = getTaskStatus(b);
      const aInProgress = aStatus === "IN_PROGRESS" ? 0 : 1;
      const bInProgress = bStatus === "IN_PROGRESS" ? 0 : 1;
      if (aInProgress !== bInProgress) return aInProgress - bInProgress;

      const aMissed = aStatus === "MISSED" ? 0 : 1;
      const bMissed = bStatus === "MISSED" ? 0 : 1;
      if (aMissed !== bMissed) return aMissed - bMissed;

      const aScheduledTime = aScheduled?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bScheduledTime = bScheduled?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (aScheduledTime !== bScheduledTime) return aScheduledTime - bScheduledTime;

      const aDueTime = parseDueDate(a.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDueTime = parseDueDate(b.dueDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aDueTime - bDueTime;
    })
    .slice(0, 3);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && currentTime > 0) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => prev - 1);
      }, 1000);
    } else if (currentTime === 0) {
      setIsTimerRunning(false);
      // Play completion sound or notification
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, currentTime]);

  // Tab visibility detection
  useEffect(() => {
    if (!isFocusMode) return;

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      setIsTabVisible(isVisible);

      if (!isVisible) {
        setShowDistractionWarning(true);
        setDistractionCount((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isFocusMode]);

  // Prevent browser back/refresh in focus mode
  useEffect(() => {
    if (!isFocusMode) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn đang trong Focus Mode. Bạn có chắc muốn rời đi?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isFocusMode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getEisenhowerLabel = (matrix?: string) => {
    const labels: Record<string, string> = {
      "urgent-important": "Khẩn cấp & Quan trọng",
      "not-urgent-important": "Quan trọng & Không khẩn cấp",
      "urgent-not-important": "Khẩn cấp & Không quan trọng",
      "not-urgent-not-important": "Không khẩn cấp & Không quan trọng",
    };
    return labels[matrix || ""] || "";
  };

  const getEisenhowerColor = (matrix?: string) => {
    const colors: Record<string, string> = {
      "urgent-important": "bg-red-100 text-red-700 border-red-200",
      "not-urgent-important": "bg-green-100 text-green-700 border-green-200",
      "urgent-not-important": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "not-urgent-not-important": "bg-gray-100 text-gray-700 border-gray-200",
    };
    return colors[matrix || ""] || "bg-gray-100 text-gray-700";
  };

  // Fullscreen handlers
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.log("Fullscreen not supported or denied");
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.log("Exit fullscreen error");
    }
  }, []);

  // Focus Mode handlers
  const startFocusMode = async (duration: number) => {
    setShowPreFocusDialog(false);
    setCurrentTime(duration);
    setPauseCount(0);
    setDistractionCount(0);
    setIsFocusMode(true);

    // Auto-enter fullscreen
    await enterFullscreen();
  };

  const endFocusMode = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    setIsFocusMode(false);
    setIsFullscreen(false);
    setIsTimerRunning(false);
    setCurrentTime(25 * 60);
    setPauseCount(0);
  };

  const handlePause = () => {
    if (pauseCount >= MAX_PAUSE_COUNT) {
      // Already used all pauses
      return;
    }
    setIsTimerRunning(!isTimerRunning);
    if (isTimerRunning) {
      setPauseCount((prev) => prev + 1);
    }
  };

  const dismissDistractionWarning = () => {
    setShowDistractionWarning(false);
    setIsTabVisible(true);
  };

  // Pre-focus Dialog
  if (showPreFocusDialog) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Card className="w-full max-w-lg mx-4">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl">Chuẩn bị vào Focus Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Lưu ý quan trọng
              </h4>
              <ul className="space-y-2 text-sm text-amber-700">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>
                    <strong>Màn hình to:</strong> Trình duyệt sẽ tự động chuyển sang chế độ toàn màn hình khi bắt đầu. Nhấn{" "}
                    <kbd className="px-1.5 py-0.5 bg-amber-200 rounded text-xs font-mono">ESC</kbd> hoặc nút "Thoát" để thoát.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>
                    <strong>Tạm dừng:</strong> Bạn có tối đa <strong>3 lần</strong> tạm dừng timer. Sử dụng một cách có
                    chủ đích!
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>
                    <strong>Chống phân tâm:</strong> Nếu bạn chuyển sang tab khác hoặc rời khỏi trang, hệ thống sẽ ghi
                    nhận và cảnh báo bạn.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span>
                    <strong>Không thể rời đi:</strong> Khi đang trong Focus Mode, bạn sẽ được nhắc xác nhận trước khi
                    đóng tab/trình duyệt.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 space-y-3">
              <p className="text-sm text-muted-foreground font-medium">Chọn thời gian focus:</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => startFocusMode(25 * 60)}
                >
                  <span className="text-lg font-bold">25 phút</span>
                  <span className="text-xs opacity-70">Pomodoro</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => startFocusMode(45 * 60)}
                >
                  <span className="text-lg font-bold">45 phút</span>
                  <span className="text-xs opacity-70">Extended</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => startFocusMode(90 * 60)}
                >
                  <span className="text-lg font-bold">90 phút</span>
                  <span className="text-xs opacity-70">Deep Work</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => startFocusMode(60 * 60)}
                >
                  <span className="text-lg font-bold">60 phút</span>
                  <span className="text-xs opacity-70">Standard</span>
                </Button>
              </div>
            </div>

            <Button variant="ghost" className="w-full" onClick={() => setShowPreFocusDialog(false)}>
              Hủy bỏ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Distraction Warning Overlay
  if (showDistractionWarning && isFocusMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <Card className="w-full max-w-md mx-4 border-2 border-rose-300">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <CardTitle className="text-2xl text-rose-600">Cảnh báo phân tâm!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Bạn đang cố rời khỏi Focus Mode
            </p>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <p className="text-sm text-rose-700">
                Hành động này đã được ghi nhận ({distractionCount} lần). Hãy tập trung vào công việc của bạn!
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Nhấn <strong> Quay lại Focus</strong> để tiếp tục phiên làm việc của bạn.
              </p>
            </div>
            <Button
              className="w-full bg-rose-600 hover:bg-rose-700 text-white"
              onClick={dismissDistractionWarning}
            >
              <Play className="w-4 h-4 mr-2" />
              Quay lại Focus
            </Button>
            <Button variant="ghost" className="w-full text-slate-500" onClick={endFocusMode}>
              Thoát Focus Mode (mất tiến độ)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Focus Mode Fullscreen View
  if (isFocusMode) {
    return (
      <div
        ref={focusModeRef}
        className="fixed inset-0 z-40 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/50">
              Focus Mode
            </Badge>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Lần tạm dừng: {pauseCount}/{MAX_PAUSE_COUNT}</span>
              {distractionCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {distractionCount} lần phân tâm
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={endFocusMode}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Thoát
            </Button>
          </div>
        </div>

        {/* Timer */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-8xl font-mono font-bold text-white mb-8 tracking-wider">
              {formatTime(currentTime)}
            </div>

            {/* Progress ring */}
            <div className="relative w-64 h-2 bg-white/10 rounded-full mb-8 mx-auto overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                style={{
                  width: `${((25 * 60 - currentTime) / (25 * 60)) * 100}%`,
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                variant={isTimerRunning ? "outline" : "default"}
                className={`w-16 h-16 rounded-full ${
                  isTimerRunning
                    ? "bg-white/10 border-white/30 text-white hover:bg-white/20"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
                onClick={handlePause}
                disabled={!isTimerRunning && pauseCount >= MAX_PAUSE_COUNT}
              >
                {isTimerRunning ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>

              {pauseCount >= MAX_PAUSE_COUNT && !isTimerRunning && (
                <div className="text-amber-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Đã hết lượt tạm dừng
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-sm text-slate-500">
          Hãy tập trung vào công việc của bạn. Nhấn ESC hoặc nút Thoát để kết thúc.
        </div>
      </div>
    );
  }

  // Normal View
  return (
    <div className="space-y-6 pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Focus Timer */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Focus Timer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="mb-4 font-mono text-4xl font-bold text-blue-600 sm:text-6xl">
                {formatTime(currentTime)}
              </div>
              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="w-12 h-12 rounded-full"
                >
                  {isTimerRunning ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsTimerRunning(false);
                    setCurrentTime(25 * 60);
                  }}
                  className="w-12 h-12 rounded-full"
                >
                  <Square className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCurrentTime(25 * 60)}
              >
                Pomodoro (25 phút)
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCurrentTime(90 * 60)}
              >
                Deep Work (90 phút)
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                onClick={() => setShowPreFocusDialog(true)}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Bắt đầu Focus Mode
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Chế độ chống phân tâm + fullscreen
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Tasks */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Top 3 nhiệm vụ hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={COLOR_MAP[task.color].badge}>
                        {task.priority}
                      </Badge>
                      {task.eisenhowerMatrix && (
                        <Badge
                          variant="outline"
                          className={getEisenhowerColor(task.eisenhowerMatrix)}
                        >
                          {getEisenhowerLabel(task.eisenhowerMatrix)}
                        </Badge>
                      )}
                      {task.estimatedTime && (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {task.estimatedTime}p
                        </Badge>
                      )}
                      {task.contexts &&
                        task.contexts.map((ctx: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {ctx}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="self-start">
                    Bắt đầu
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eisenhower Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Ma trận Eisenhower</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:h-96">
            {/* Urgent & Important */}
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="font-semibold text-red-700 mb-3">
                Khẩn cấp & Quan trọng
              </h3>
              <div className="space-y-2">
                {tasks.filter((t) => t.eisenhowerMatrix === "urgent-important").map(
                  (task) => (
                    <div key={task.id} className="text-sm p-2 bg-white rounded border">
                      {task.title}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Not Urgent & Important */}
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold text-green-700 mb-3">
                Quan trọng & Không khẩn cấp
              </h3>
              <div className="space-y-2">
                {tasks.filter(
                  (t) => t.eisenhowerMatrix === "not-urgent-important"
                ).map((task) => (
                  <div key={task.id} className="text-sm p-2 bg-white rounded border">
                    {task.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Urgent & Not Important */}
            <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h3 className="font-semibold text-yellow-700 mb-3">
                Khẩn cấp & Không quan trọng
              </h3>
              <div className="space-y-2">
                {tasks.filter((t) => t.eisenhowerMatrix === "urgent-not-important").map(
                  (task) => (
                    <div key={task.id} className="text-sm p-2 bg-white rounded border">
                      {task.title}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Not Urgent & Not Important */}
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-3">
                Không khẩn cấp & Không quan trọng
              </h3>
              <div className="space-y-2">
                {tasks.filter(
                  (t) => t.eisenhowerMatrix === "not-urgent-not-important"
                ).map((task) => (
                  <div key={task.id} className="text-sm p-2 bg-white rounded border">
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Capture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5" />
            Ghi chú nhanh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Textarea
              placeholder="Ghi lại ý tưởng, ghi chú nhanh..."
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2 sm:flex-col">
              <Button size="sm">
                <StickyNote className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Recent Notes */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Ghi chú gần đây</h4>
            {(dailyFocus?.quickNotes ?? []).map((note) => (
              <div
                key={note.id}
                className="text-sm p-2 bg-gray-50 rounded border-l-4 border-blue-500"
              >
                <p>{note.content}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(note.createdAt).toLocaleTimeString("vi-VN")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
