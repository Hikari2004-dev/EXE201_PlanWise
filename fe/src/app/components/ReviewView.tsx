import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { BookOpen, TrendingUp, Activity, CheckCircle2 } from "lucide-react";
import { DAILY_REFLECTIONS } from "../data/mockData";

const MOCK_ANALYTICS = [
  { name: 'T2', completed: 4, focusTime: 120, energy: 7 },
  { name: 'T3', completed: 6, focusTime: 180, energy: 8 },
  { name: 'T4', completed: 3, focusTime: 90, energy: 5 },
  { name: 'T5', completed: 8, focusTime: 240, energy: 9 },
  { name: 'T6', completed: 5, focusTime: 150, energy: 6 },
  { name: 'T7', completed: 2, focusTime: 60, energy: 8 },
  { name: 'CN', completed: 7, focusTime: 210, energy: 9 },
];

export function ReviewView() {
  const [reflectionList] = useState(DAILY_REFLECTIONS);
  const [todayReflection, setTodayReflection] = useState({
    completed: "",
    obstacles: "",
    improvements: ""
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tầng Đánh giá</h1>
          <p className="text-muted-foreground">Nhìn lại để tiến xa hơn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Reflection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Nhật ký cuối ngày
            </CardTitle>
            <CardDescription>
              Điền lần lượt 3 mục để nhìn lại kết quả trong ngày, nhận diện điểm nghẽn và chốt hành động cho ngày mai.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Hôm nay mình đã hoàn thành gì?</label>
              <p className="text-xs text-muted-foreground">
                Dùng mục này để ghi lại việc đã xong, kể cả các bước nhỏ, nhằm thấy rõ tiến độ thực tế của bạn.
              </p>
              <Textarea 
                placeholder="Ghi lại những thành tựu dù là nhỏ nhất..." 
                value={todayReflection.completed}
                onChange={(e) => setTodayReflection({...todayReflection, completed: e.target.value})}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Điều gì làm mình trì hoãn?</label>
              <p className="text-xs text-muted-foreground">
                Hãy viết cụ thể nguyên nhân khiến bạn chậm lại để dễ nhận ra thói quen hoặc bối cảnh cần điều chỉnh.
              </p>
              <Textarea 
                placeholder="Mạng xã hội, thiếu năng lượng, v.v." 
                value={todayReflection.obstacles}
                onChange={(e) => setTodayReflection({...todayReflection, obstacles: e.target.value})}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cải thiện gì cho ngày mai?</label>
              <p className="text-xs text-muted-foreground">
                Chốt 1-2 việc thật rõ ràng, dễ làm ngay vào ngày mai để biến rút kinh nghiệm thành hành động.
              </p>
              <Textarea 
                placeholder="Hành động cụ thể để làm tốt hơn..." 
                value={todayReflection.improvements}
                onChange={(e) => setTodayReflection({...todayReflection, improvements: e.target.value})}
                className="resize-none"
              />
            </div>
            <Button className="w-full mt-2">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Lưu nhật ký
            </Button>
          </CardContent>
        </Card>

        {/* Analytics Overview */}
        <div className="grid grid-rows-2 gap-6 h-full">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Task hoàn thành tuần này
              </CardTitle>
              <CardDescription>
                Biểu đồ này cho biết ngày nào bạn xử lý được nhiều việc nhất để dễ so sánh nhịp làm việc trong tuần.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-48 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_ANALYTICS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                  <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-orange-500" />
                Thời gian tập trung (phút)
              </CardTitle>
              <CardDescription>
                Dùng để đối chiếu thời lượng làm việc sâu với số task hoàn thành, từ đó biết ngày nào bạn tập trung hiệu quả.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-48 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_ANALYTICS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="focusTime" stroke="#f97316" fillOpacity={1} fill="url(#colorFocus)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Energy Level & History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Biến động năng lượng (1-10)
            </CardTitle>
            <CardDescription>
              Theo dõi cảm giác năng lượng từng ngày để tìm ra thời điểm và nhịp làm việc phù hợp với bản thân.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_ANALYTICS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="energy" stroke="#a855f7" strokeWidth={3} dot={{r: 4, fill: '#a855f7'}} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử nhật ký</CardTitle>
            <CardDescription>
              Mỗi thẻ lưu lại 3 phần: việc đã làm, điểm gây trì hoãn và hướng cải thiện để bạn nhìn ra mẫu lặp theo thời gian.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
              {reflectionList.map(item => (
                <div key={item.id} className="p-4 border rounded-lg bg-gray-50/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm">{new Date(item.date).toLocaleDateString('vi-VN')}</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Năng lượng: {item.energyLevel}/10</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium text-emerald-600">✓ Đã làm:</span> {item.completed}</p>
                    <p><span className="font-medium text-rose-600">! Trì hoãn:</span> {item.obstacles}</p>
                    <p><span className="font-medium text-blue-600">→ Cải thiện:</span> {item.improvements}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
