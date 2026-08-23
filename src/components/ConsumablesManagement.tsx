import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Mouse, 
  Headphones, 
  Plus, 
  Minus, 
  Search, 
  MessageSquare, 
  Save, 
  Edit3, 
  Sparkles, 
  AlertCircle,
  Download
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { ConsumableInventory } from '../types';

export const ConsumablesManagement: React.FC = () => {
  const { consumables, updateConsumableCount, updateConsumableMemo, stats } = useDevices();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoDraft, setMemoDraft] = useState<string>('');

  const filteredConsumables = useMemo(() => {
    return consumables.filter((c) => {
      const matchSearch = searchQuery === '' || 
        c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.requestMemo && c.requestMemo.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchGrade = gradeFilter === 'all' || 
        (gradeFilter === 'special' ? (!c.location.includes('학년')) : c.location.startsWith(gradeFilter));

      return matchSearch && matchGrade;
    });
  }, [consumables, searchQuery, gradeFilter]);

  const handleStartEditMemo = (item: ConsumableInventory) => {
    setEditingMemoId(item.id);
    setMemoDraft(item.requestMemo || '');
  };

  const handleSaveMemo = (id: string) => {
    updateConsumableMemo(id, memoDraft);
    setEditingMemoId(null);
  };

  const handleExportCSV = () => {
    const headers = ['장소/학급', '유선마우스', '무선마우스', '마우스합계', '이어폰', '요청사항및비고', '최근수정일'];
    const rows = consumables.map((c) => [
      c.location,
      c.mouseWiredCount,
      c.mouseWirelessCount,
      c.mouseWiredCount + c.mouseWirelessCount,
      c.earphoneCount,
      c.requestMemo ? `"${c.requestMemo.replace(/"/g, '""')}"` : '',
      c.updatedAt || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `소모품_재고현황_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. TOP STATS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center">
              <Mouse className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Mice Total</div>
              <div className="text-3xl font-black text-slate-900 font-sans">{stats.mouse.total}<span className="text-sm font-bold text-slate-400 ml-1">개</span></div>
            </div>
          </div>
          <div className="text-right text-xs space-y-1">
            <div className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">유선 {stats.mouse.wired}개</div>
            <div className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-bold text-[11px]">무선 {stats.mouse.wireless}개</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Earphones Total</div>
              <div className="text-3xl font-black text-slate-900 font-sans">{stats.earphone.total}<span className="text-sm font-bold text-slate-400 ml-1">개</span></div>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-900 font-black text-xs">
              학급 배정 {stats.earphone.assigned}개
            </span>
          </div>
        </div>

        <div className="bg-purple-900 text-white rounded-3xl p-6 sm:p-8 border border-purple-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[10px] text-purple-300 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-purple-300" />
              <span>Consumable Stock Status</span>
            </div>
            <div className="text-xl sm:text-2xl font-black mt-2 text-white">마우스 0개 · 이어폰 0개</div>
            <div className="text-xs text-purple-300 mt-1 font-medium">학기 중 파손 대비 추가 품의 권장</div>
          </div>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-purple-800 hover:bg-purple-700 rounded-xl text-xs font-bold border border-purple-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER & TABLE CONTROLS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Inventory Management</div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-900" />
              학급 및 보관소별 소모품 상세 재고
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              각 학급의 유선/무선 마우스 및 이어폰 수량을 +/- 버튼으로 즉시 조율하고 요청 메모를 관리합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="학급명 / 메모 내용 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-900 w-48 font-medium"
              />
            </div>

            {/* Grade Filter */}
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-900 bg-white font-bold text-slate-700"
            >
              <option value="all">전체 장소</option>
              <option value="1학년">1학년</option>
              <option value="2학년">2학년</option>
              <option value="3학년">3학년</option>
              <option value="4학년">4학년</option>
              <option value="5학년">5학년</option>
              <option value="6학년">6학년</option>
              <option value="special">스마트실</option>
            </select>
          </div>
        </div>

        {/* Consumables Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">장소 / 학급</th>
                <th className="py-3 px-4 text-center">유선 마우스 (개)</th>
                <th className="py-3 px-4 text-center">무선 마우스 (개)</th>
                <th className="py-3 px-4 text-center">마우스 합계</th>
                <th className="py-3 px-4 text-center">이어폰 수량 (개)</th>
                <th className="py-3 px-5">요청 사항 및 특이사항 메모</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsumables.map((item) => {
                const totalMouse = item.mouseWiredCount + item.mouseWirelessCount;
                const isEditing = editingMemoId === item.id;

                return (
                  <tr key={item.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-4 px-4 font-black text-slate-900">
                      <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-900 font-bold text-xs">
                        {item.location}
                      </span>
                    </td>

                    {/* Wired Mouse Stepper */}
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => updateConsumableCount(item.id, 'mouseWiredCount', -1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center active:scale-95 transition-all font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-mono font-black text-sm text-slate-900">
                          {item.mouseWiredCount}
                        </span>
                        <button
                          onClick={() => updateConsumableCount(item.id, 'mouseWiredCount', 1)}
                          className="w-7 h-7 rounded-lg bg-purple-900 hover:bg-purple-800 text-white flex items-center justify-center active:scale-95 transition-all shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Wireless Mouse Stepper */}
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => updateConsumableCount(item.id, 'mouseWirelessCount', -1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center active:scale-95 transition-all font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-mono font-black text-sm text-slate-900">
                          {item.mouseWirelessCount}
                        </span>
                        <button
                          onClick={() => updateConsumableCount(item.id, 'mouseWirelessCount', 1)}
                          className="w-7 h-7 rounded-lg bg-purple-900 hover:bg-purple-800 text-white flex items-center justify-center active:scale-95 transition-all shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Mouse Total */}
                    <td className="py-4 px-4 text-center font-black text-sm text-purple-950 font-mono">
                      {totalMouse}개
                    </td>

                    {/* Earphone Stepper */}
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => updateConsumableCount(item.id, 'earphoneCount', -1)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center active:scale-95 transition-all font-bold"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center font-mono font-black text-sm text-purple-950">
                          {item.earphoneCount}
                        </span>
                        <button
                          onClick={() => updateConsumableCount(item.id, 'earphoneCount', 1)}
                          className="w-7 h-7 rounded-lg bg-purple-900 hover:bg-purple-800 text-white flex items-center justify-center active:scale-95 transition-all shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Request Memo Field */}
                    <td className="py-4 px-5">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={memoDraft}
                            onChange={(e) => setMemoDraft(e.target.value)}
                            placeholder="요청 사항 입력..."
                            className="flex-1 px-3 py-1.5 text-xs border border-purple-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-900 bg-white font-medium"
                          />
                          <button
                            onClick={() => handleSaveMemo(item.id)}
                            className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>저장</span>
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleStartEditMemo(item)}
                          className="group flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-purple-50/60 cursor-pointer border border-slate-100 transition-colors"
                        >
                          <span className={`text-xs truncate ${item.requestMemo ? 'text-slate-900 font-semibold' : 'text-slate-400 italic'}`}>
                            {item.requestMemo || '메모 없음 (클릭하여 작성)'}
                          </span>
                          <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-900 shrink-0 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
