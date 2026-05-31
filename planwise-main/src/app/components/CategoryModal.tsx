import { useState } from "react";
import { X, Trash2, Edit2, Plus } from "lucide-react";
import { useData } from "../context/DataContext";
import { COLOR_MAP, type EventColor } from "../data/mockData";

const EVENT_COLORS: EventColor[] = ["indigo", "blue", "emerald", "amber", "rose", "purple", "teal", "orange"];

interface CategoryModalProps {
  onClose: () => void;
}

export function CategoryModal({ onClose }: CategoryModalProps) {
  const { categories, addCategory, updateCategory, deleteCategory } = useData();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", color: "indigo" as EventColor });

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      updateCategory(editingId, formData);
      setEditingId(null);
    } else {
      addCategory(formData);
      setShowAddForm(false);
    }
    setFormData({ name: "", color: "indigo" });
  };

  const handleEdit = (id: number) => {
    const cat = categories.find(c => c.id === id);
    if (cat) {
      setFormData({ name: cat.name, color: cat.color });
      setEditingId(id);
      setShowAddForm(false);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này? Các sự kiện và công việc liên quan sẽ không bị xóa.")) {
      deleteCategory(id);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ name: "", color: "indigo" });
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-96 max-h-[600px] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-800">Quản lý danh mục</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Existing categories */}
          <div className="space-y-2 mb-4">
            {categories.map((cat) => {
              const colors = COLOR_MAP[cat.color];
              const isEditing = editingId === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    isEditing ? "border-indigo-300 bg-indigo-50" : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {isEditing ? (
                    <>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Tên danh mục"
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          autoFocus
                        />
                        <div className="flex gap-1.5 flex-wrap">
                          {EVENT_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setFormData({ ...formData, color: c })}
                              className={`w-5 h-5 rounded-full ${COLOR_MAP[c].bg} transition-all ${
                                formData.color === c ? "ring-2 ring-offset-1 " + COLOR_MAP[c].ring : ""
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={handleSave}
                          className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-2 py-1 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colors.dot}`} />
                      <span className="flex-1 text-sm text-gray-700 font-medium">{cat.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(cat.id)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add new category */}
          {!editingId && (
            <div>
              {showAddForm ? (
                <div className="p-3 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 space-y-3">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Tên danh mục"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    autoFocus
                  />
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">Chọn màu</label>
                    <div className="flex gap-2 flex-wrap">
                      {EVENT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c })}
                          className={`w-6 h-6 rounded-full ${COLOR_MAP[c].bg} transition-all ${
                            formData.color === c ? "ring-2 ring-offset-2 " + COLOR_MAP[c].ring : ""
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="flex-1 border border-gray-200 text-gray-600 text-sm py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-indigo-600 text-white text-sm py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  <span className="text-sm">Thêm danh mục mới</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
