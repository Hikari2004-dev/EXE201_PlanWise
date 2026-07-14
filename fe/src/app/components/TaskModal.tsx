import { useEffect, useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { useData } from "../context/DataContext";
import { COLOR_MAP, type EventColor, type Task } from "../data/mockData";

const TASK_PRIORITIES: Task["priority"][] = ["Cao", "Trung bình", "Thấp"];
const EVENT_COLORS: EventColor[] = ["indigo", "blue", "emerald", "amber", "rose", "purple", "teal", "orange"];

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  Cao: "text-rose-600 bg-rose-50 border-rose-200",
  "Trung bình": "text-amber-600 bg-amber-50 border-amber-200",
  Thấp: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

type TaskModalInitialValues = Partial<Omit<Task, "id">>;

interface TaskModalProps {
  task?: Task;
  initialValues?: TaskModalInitialValues;
  onClose: () => void;
  onSave: (task: Omit<Task, "id"> | Task) => Promise<void>;
}

function normalizeColor(color: string | undefined): EventColor {
  const normalized = (color || "indigo").toLowerCase();
  return EVENT_COLORS.includes(normalized as EventColor) ? (normalized as EventColor) : "indigo";
}

function toDateTimeLocalValue(value?: string) {
  if (!value) return "";
  const trimmed = value.trim();
  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T00:00`;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function normalizeChecklistItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

export function TaskModal({ task, initialValues, onClose, onSave }: TaskModalProps) {
  const { categories, goals, addCategory } = useData();
  const resolvedCategoryId = task?.categoryId || initialValues?.categoryId || categories[0]?.id || "";
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "indigo" as EventColor });
  const [checklist, setChecklist] = useState<string[]>(task?.checklist || initialValues?.checklist || []);
  const [checkedChecklistItems, setCheckedChecklistItems] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    title: task?.title || initialValues?.title || "",
    categoryId: resolvedCategoryId,
    dueDate: toDateTimeLocalValue(task?.dueDate || initialValues?.dueDate),
    scheduledAt: toDateTimeLocalValue(task?.scheduledAt || initialValues?.scheduledAt),
    priority: (task?.priority || initialValues?.priority || "Trung bình") as Task["priority"],
    color: normalizeColor(task?.color || initialValues?.color),
    description: task?.description || initialValues?.description || "",
    status: task?.status || initialValues?.status || (task?.completed || initialValues?.completed ? "COMPLETED" : "IN_PROGRESS"),
    eisenhowerMatrix: task?.eisenhowerMatrix || initialValues?.eisenhowerMatrix || "",
    estimatedTime: task?.estimatedTime || initialValues?.estimatedTime || "",
    contexts: task?.contexts || initialValues?.contexts || [] as string[],
    goalId: task?.goalId || initialValues?.goalId || "",
    milestoneId: task?.milestoneId || initialValues?.milestoneId || "",
    showOnCalendar: task?.showOnCalendar ?? initialValues?.showOnCalendar ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!form.categoryId && categories[0]?.id) {
      setForm((current) => ({
        ...current,
        categoryId: categories[0].id,
        color: normalizeColor(categories[0].color),
      }));
    }
  }, [categories, form.categoryId]);

  const selectedGoal = goals.find((goal) => goal.id === form.goalId);
  const selectedMilestones = selectedGoal?.milestones || [];

  const updateChecklistItem = (index: number, value: string) => {
    setChecklist((items) => items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const removeChecklistItem = (index: number) => {
    setChecklist((items) => items.filter((_, itemIndex) => itemIndex !== index));
    setCheckedChecklistItems((current) => {
      const next = new Set<number>();
      current.forEach((itemIndex) => {
        if (itemIndex < index) next.add(itemIndex);
        if (itemIndex > index) next.add(itemIndex - 1);
      });
      return next;
    });
  };

  const toggleChecklistItem = (index: number) => {
    setCheckedChecklistItems((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || isSubmitting) return;

    const taskData: Omit<Task, "id"> = {
      title: form.title.trim(),
      categoryId: form.categoryId || categories[0]?.id || undefined,
      dueDate: form.dueDate,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      priority: form.priority,
      completed: form.status === "COMPLETED",
      status: form.status,
      color: form.color,
      description: form.description,
      eisenhowerMatrix: form.eisenhowerMatrix || undefined,
      estimatedTime: form.estimatedTime ? Number(form.estimatedTime) : undefined,
      contexts: form.contexts.length > 0 ? form.contexts : undefined,
      checklist: normalizeChecklistItems(checklist),
      goalId: form.goalId || undefined,
      milestoneId: form.milestoneId || undefined,
      showOnCalendar: form.showOnCalendar,
      sortOrder: task?.sortOrder ?? initialValues?.sortOrder ?? 0,
    };

    try {
      setIsSubmitting(true);
      if (task) {
        await onSave({
          ...task,
          ...taskData,
        });
      } else {
        await onSave(taskData);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryForm.name.trim() || isCreatingCategory) return;

    try {
      setCategoryError(null);
      setIsCreatingCategory(true);
      const createdCategory = await addCategory({ name: categoryForm.name.trim(), color: categoryForm.color });
      setCategoryForm({ name: "", color: "indigo" });
      setShowCategoryPopup(false);
      setForm((prev) => ({
        ...prev,
        categoryId: createdCategory.id,
        color: normalizeColor(createdCategory.color),
      }));
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Không thể tạo danh mục");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-[460px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-slate-800 dark:bg-slate-900 dark:ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-slate-50">
              {task ? "Chỉnh sửa công việc" : "Thêm công việc mới"}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-slate-400">
              {task ? "Cập nhật thông tin task" : "Điền thông tin để tạo task mới"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
              Tiêu đề *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Hoàn thành báo cáo"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
                Danh mục
              </label>
              <select
                value={form.categoryId || categories[0]?.id || ""}
                onChange={(e) => {
                  const catId = e.target.value;
                  if (catId === "__other__") {
                    setCategoryError(null);
                    setShowCategoryPopup(true);
                    return;
                  }
                  const cat = categories.find((item) => item.id === catId);
                  setForm({ ...form, categoryId: catId, color: normalizeColor(cat?.color) });
                }}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
              >
                {categories.length === 0 && <option value="">Đang tải danh mục...</option>}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="dark:bg-slate-900">
                    {cat.name}
                  </option>
                ))}
                <option value="__other__" className="dark:bg-slate-900">Khác</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
                Hạn chót
              </label>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
              >
                <option value="IN_PROGRESS" className="dark:bg-slate-900">Đang làm</option>
                <option value="COMPLETED" className="dark:bg-slate-900">Hoàn thành</option>
                <option value="MISSED" className="dark:bg-slate-900">Trễ hạn</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
                Thời gian diễn ra
              </label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
              Mức độ ưu tiên
            </label>
            <div className="flex gap-2">
              {TASK_PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setForm({ ...form, priority })}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all ${
                    form.priority === priority
                      ? PRIORITY_COLORS[priority]
                      : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
                Goal
              </label>
              <select
                value={form.goalId}
                onChange={(e) => setForm({ ...form, goalId: e.target.value, milestoneId: "" })}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
              >
                <option value="" className="dark:bg-slate-900">Không thuộc goal</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id} className="dark:bg-slate-900">
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
                Milestone
              </label>
              <select
                value={form.milestoneId}
                onChange={(e) => setForm({ ...form, milestoneId: e.target.value })}
                disabled={!selectedGoal}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 dark:focus:ring-slate-700"
              >
                <option value="" className="dark:bg-slate-900">Không thuộc milestone</option>
                {selectedMilestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id} className="dark:bg-slate-900">
                    {milestone.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
                Calendar
              </label>
              <label className="flex h-[42px] items-center gap-2 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 dark:border-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.showOnCalendar}
                  onChange={(e) => setForm({ ...form, showOnCalendar: e.target.checked })}
                  className="rounded border-zinc-300 dark:border-slate-700"
                />
                Hiển thị trên lịch
              </label>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
              Mô tả
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Thêm chi tiết..."
              rows={2}
              className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
                Checklist
              </label>
              <button
                type="button"
                onClick={() => setChecklist((items) => [...items, ""])}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-[10px] font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Plus size={12} />
                Thêm
              </button>
            </div>

            {checklist.length > 0 ? (
              <div className="space-y-2">
                {checklist.map((item, index) => {
                  const checked = checkedChecklistItems.has(index);

                  return (
                    <div key={`task-modal-checklist-${index}`} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleChecklistItem(index)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                          checked
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-zinc-300 bg-white text-transparent dark:border-slate-700 dark:bg-slate-950"
                        }`}
                        title="Đánh dấu trực quan"
                      >
                        <Check size={12} />
                      </button>
                      <input
                        value={item}
                        onChange={(e) => updateChecklistItem(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setChecklist((items) => {
                              const next = [...items];
                              next.splice(index + 1, 0, "");
                              return next;
                            });
                          }
                        }}
                        placeholder="Checklist item"
                        style={{ textDecoration: checked ? "line-through" : "none" }}
                        className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(index)}
                        className="rounded-md p-2 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                        title="Xóa mục"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setChecklist([""])}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-xs font-semibold text-zinc-500 transition hover:border-zinc-400 hover:bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900"
              >
                <Plus size={14} />
                Thêm checklist item
              </button>
            )}
          </div>

          <div className="mt-2 flex gap-3 border-t border-zinc-100 pt-2 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-300 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : task ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>

      {showCategoryPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => {
            setCategoryError(null);
            setShowCategoryPopup(false);
            setCategoryForm({ name: "", color: "indigo" });
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-zinc-900 dark:text-slate-50">Tạo danh mục mới</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-slate-400">Danh mục này sẽ thuộc tài khoản hiện tại của bạn.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCategoryError(null);
                  setShowCategoryPopup(false);
                  setCategoryForm({ name: "", color: "indigo" });
                }}
                className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
                  Tên danh mục
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => {
                    setCategoryError(null);
                    setCategoryForm({ ...categoryForm, name: e.target.value });
                  }}
                  placeholder="VD: Việc cá nhân"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-slate-700"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-slate-300">
                  Màu danh mục
                </label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, color })}
                      className={`h-7 w-7 rounded-full ${COLOR_MAP[color].bg} transition-all ${
                        categoryForm.color === color ? `ring-2 ring-offset-2 ${COLOR_MAP[color].ring}` : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              {categoryError && <p className="text-xs font-medium text-rose-600">{categoryError}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryError(null);
                    setShowCategoryPopup(false);
                    setCategoryForm({ name: "", color: "indigo" });
                  }}
                  className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                  disabled={!categoryForm.name.trim() || isCreatingCategory}
                >
                  {isCreatingCategory ? "Đang tạo..." : "Tạo danh mục"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
