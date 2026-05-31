import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Play, Pause, Square, Clock, Zap, StickyNote, Mic } from "lucide-react";
import { DAILY_FOCUS, TASKS, COLOR_MAP } from "../data/mockData";

export function FocusView() {
  const [dailyFocus] = useState(DAILY_FOCUS[0]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(25 * 60); // 25 minutes in seconds
  const [quickNote, setQuickNote] = useState("");

  const topTasks = TASKS.filter(task => dailyFocus.topTasks.includes(task.id));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getEisenhowerLabel = (matrix?: string) => {
    const labels = {
      "urgent-important": "Khẩn cấp & Quan trọng",
      "not-urgent-important": "Quan trọng & Không khẩn cấp",
      "urgent-not-important": "Khẩn cấp & Không quan trọng",
      "not-urgent-not-important": "Không khẩn cấp & Không quan trọng"
    };
    return labels[matrix as keyof typeof labels] || "";
  };

  const getEisenhowerColor = (matrix?: string) => {
    const colors = {
      "urgent-important": "bg-red-100 text-red-700 border-red-200",
      "not-urgent-important": "bg-green-100 text-green-700 border-green-200", 
      "urgent-not-important": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "not-urgent-not-important": "bg-gray-100 text-gray-700 border-gray-200"
    };
    return colors[matrix as keyof typeof colors] || "bg-gray-100 text-gray-700";
  };

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
              <div className="text-6xl font-mono font-bold text-blue-600 mb-4">
                {formatTime(currentTime)}
              </div>
              <div className="flex justify-center gap-2">
                <Button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="w-12 h-12 rounded-full"
                >
                  {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
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
              <Button variant="outline" className="w-full" onClick={() => setCurrentTime(25 * 60)}>
                Pomodoro (25 phút)
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setCurrentTime(90 * 60)}>
                Deep Work (90 phút)
              </Button>
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
                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={COLOR_MAP[task.color].badge}>
                        {task.priority}
                      </Badge>
                      {task.eisenhowerMatrix && (
                        <Badge variant="outline" className={getEisenhowerColor(task.eisenhowerMatrix)}>
                          {getEisenhowerLabel(task.eisenhowerMatrix)}
                        </Badge>
                      )}
                      {task.estimatedTime && (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {task.estimatedTime}p
                        </Badge>
                      )}
                      {task.context && task.context.map((ctx, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {ctx}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
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
          <div className="grid grid-cols-2 gap-4 h-96">
            {/* Urgent & Important */}
            <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
              <h3 className="font-semibold text-red-700 mb-3">Khẩn cấp & Quan trọng</h3>
              <div className="space-y-2">
                {TASKS.filter(t => t.eisenhowerMatrix === "urgent-important").map(task => (
                  <div key={task.id} className="text-sm p-2 bg-white rounded border">
                    {task.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Not Urgent & Important */}
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
              <h3 className="font-semibold text-green-700 mb-3">Quan trọng & Không khẩn cấp</h3>
              <div className="space-y-2">
                {TASKS.filter(t => t.eisenhowerMatrix === "not-urgent-important").map(task => (
                  <div key={task.id} className="text-sm p-2 bg-white rounded border">
                    {task.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Urgent & Not Important */}
            <div className="border-2 border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h3 className="font-semibold text-yellow-700 mb-3">Khẩn cấp & Không quan trọng</h3>
              <div className="space-y-2">
                {TASKS.filter(t => t.eisenhowerMatrix === "urgent-not-important").map(task => (
                  <div key={task.id} className="text-sm p-2 bg-white rounded border">
                    {task.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Not Urgent & Not Important */}
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-3">Không khẩn cấp & Không quan trọng</h3>
              <div className="space-y-2">
                {TASKS.filter(t => t.eisenhowerMatrix === "not-urgent-not-important").map(task => (
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
          <div className="flex gap-2">
            <Textarea
              placeholder="Ghi lại ý tưởng, ghi chú nhanh..."
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              className="flex-1"
            />
            <div className="flex flex-col gap-2">
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
            {dailyFocus.quickNotes.map((note) => (
              <div key={note.id} className="text-sm p-2 bg-gray-50 rounded border-l-4 border-blue-500">
                <p>{note.content}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(note.timestamp).toLocaleTimeString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}