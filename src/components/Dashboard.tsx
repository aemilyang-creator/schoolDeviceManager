import React from 'react';
import { 
  Laptop, 
  Mouse, 
  Headphones, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  TrendingUp, 
  Wrench, 
  ChevronRight, 
  PlusCircle, 
  FileText, 
  Building, 
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Search
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { Device, DeviceStatus } from '../types';
import { getStatusBadgeStyle, formatDate } from '../utils/formatters';

interface DashboardProps {
  onSelectDevice: (device: Device) => void;
  onNavigateTab: (tab: 'dashboard' | 'classes' | 'devices' | 'consumables' | 'report') => void;
  onOpenRegisterModal: () => void;
  onOpenReportModal: () => void;
  onQuickStatusChange: (device: Device, newStatus: DeviceStatus) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectDevice,
  onNavigateTab,
  onOpenRegisterModal,
  onOpenReportModal,
  onQuickStatusChange,
}) => {
  const { stats, devices, systemConfig, updateConsumableCount, consumables } = useDevices();

  // Find all devices currently in repair or broken
  const issueDevices = devices.filter((d) => d.status === 'repair' || d.status === 'broken');
  const brokenDevices = devices.filter((d) => d.status === 'broken');
  const repairDevices = devices.filter((d) => d.status === 'repair');

  // Quick adjust total consumables via storage room
  const handleQuickAdjust = (type: 'mouse' | 'earphone', delta: number) => {
    const storage = consumables.find(c => c.location.includes('보관실')) || consumables[0];
    if (storage) {
      if (type === 'mouse') {
        const nextVal = Math.max(0, storage.mouseWirelessCount + delta);
        updateConsumableCount(storage.id, 'mouseWirelessCount', nextVal);
      } else {
        const nextVal = Math.max(0, storage.earphoneCount + delta);
        updateConsumableCount(storage.id, 'earphoneCount', nextVal);
      }
    }
  };

  const mfrList = [
    { key: '삼성전자', name: 'SAMSUNG', total: stats.chromebook.byManufacturer['삼성전자']?.total || 0, normal: stats.chromebook.byManufacturer['삼성전자']?.normal || 0 },
    { key: 'LG', name: 'LG', total: (stats.chromebook.byManufacturer['LG']?.total || 0) + (stats.chromebook.byManufacturer['LG전자']?.total || 0), normal: (stats.chromebook.byManufacturer['LG']?.normal || 0) + (stats.chromebook.byManufacturer['LG전자']?.normal || 0) },
    { key: '레노버', name: 'LENOVO', total: stats.chromebook.byManufacturer['레노버']?.total || 0, normal: stats.chromebook.byManufacturer['레노버']?.normal || 0 },
    { key: 'ASUS', name: 'ASUS', total: stats.chromebook.byManufacturer['ASUS']?.total || 0, normal: stats.chromebook.byManufacturer['ASUS']?.normal || 0 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP REALTIME STATUS HEADER */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
            전체 기기 실시간 현황
          </h2>
          {/* Real-time Chromebook Status Indicators: Green (정상), Yellow (수리), Red (고장) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              정상 {stats.chromebook.normal}대
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              수리 {stats.chromebook.repair}대
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              고장 {stats.chromebook.broken}대
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl font-bold">
            {systemConfig.academicYear} · {systemConfig.schoolName}
          </span>
        </div>
      </div>

      {/* 2. MAIN BOLD HERO GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* BIG HERO CARD: 8 COLS */}
        <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-between shadow-lg shadow-purple-100 border border-purple-300/30">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold opacity-95 tracking-wide">
                사용 가능한 크롬북
              </h3>
              <span className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-xs">
                실시간 가동 지표
              </span>
            </div>
            <p className="text-6xl sm:text-8xl lg:text-[110px] font-black leading-none tracking-tighter mt-3 sm:mt-5 drop-shadow-xs font-sans">
              {stats.chromebook.normal.toLocaleString()}
              <span className="text-xl sm:text-2xl font-normal opacity-70 ml-3 sm:ml-4 tracking-normal font-sans">
                / {stats.chromebook.total.toLocaleString()} TOTAL
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-8 pt-6 border-t border-white/25">
            <div className="flex gap-8 sm:gap-12">
              <div>
                <p className="text-xs uppercase opacity-85 font-bold tracking-wider mb-1">수리 중</p>
                <p className="text-2xl sm:text-3xl font-black font-mono">
                  {String(stats.chromebook.repair).padStart(2, '0')}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase opacity-85 font-bold tracking-wider mb-1">고장 (불가)</p>
                <p className="text-2xl sm:text-3xl font-black font-mono">
                  {String(stats.chromebook.broken).padStart(2, '0')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="bg-white/15 px-4 py-2 rounded-full text-xs sm:text-sm font-bold backdrop-blur-md border border-white/25 text-white">
                가동률 {stats.chromebook.operationalRate}%
              </div>
              <button
                onClick={() => onNavigateTab('classes')}
                className="bg-white text-purple-700 hover:bg-purple-50 px-4 py-2 rounded-full text-xs font-bold transition-transform active:scale-95 shadow-sm flex items-center gap-1"
              >
                <span>학급별 보기</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2 CONSUMABLE CARDS: 4 COLS */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
          {/* MOUSE CARD */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                  마우스 현황
                </h4>
                <p className="text-3xl sm:text-4xl font-black text-slate-800 mt-1 tracking-tight">
                  {stats.mouse.total.toLocaleString()}
                  <span className="text-sm font-medium text-slate-400 ml-1.5 font-sans">개</span>
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleQuickAdjust('mouse', -1)}
                  title="수량 1 감소"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => handleQuickAdjust('mouse', 1)}
                  title="수량 1 증가"
                  className="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-600 font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex justify-between text-xs border-t border-slate-50 pt-4 font-medium">
              <span className="text-slate-500">유선 {stats.mouse.wired} / 무선 {stats.mouse.wireless}</span>
              <span className={stats.mouse.spare === 0 ? "text-rose-500 font-bold" : "text-emerald-600 font-bold"}>
                예비 {stats.mouse.spare}
              </span>
            </div>
          </div>

          {/* EARPHONE CARD */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">
                  이어폰 현황
                </h4>
                <p className="text-3xl sm:text-4xl font-black text-slate-800 mt-1 tracking-tight">
                  {stats.earphone.total.toLocaleString()}
                  <span className="text-sm font-medium text-slate-400 ml-1.5 font-sans">개</span>
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleQuickAdjust('earphone', -1)}
                  title="수량 1 감소"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => handleQuickAdjust('earphone', 1)}
                  title="수량 1 증가"
                  className="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-600 font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex justify-between text-xs border-t border-slate-50 pt-4 font-medium">
              <span className="text-slate-500">전량 지급 완료 ({stats.earphone.assigned}개)</span>
              <span className={stats.earphone.spare === 0 ? "text-rose-500 font-bold" : "text-emerald-600 font-bold"}>
                예비 {stats.earphone.spare}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECOND ROW GRID: MANUFACTURER BARS + REAL-TIME ISSUES TABLE */}
      <div className="grid grid-cols-12 gap-6">
        {/* MANUFACTURER BREAKDOWN: 5 COLS */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                제조사별 크롬북 대수
              </h4>
              <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50/80 px-2 py-0.5 rounded">
                총 {stats.chromebook.total}대
              </span>
            </div>

            <div className="space-y-4">
              {mfrList.map((mfr) => {
                const pct = stats.chromebook.total > 0 ? (mfr.total / stats.chromebook.total) * 100 : 0;
                return (
                  <div key={mfr.key} className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold text-slate-600 w-32 truncate uppercase tracking-wide">
                      {mfr.name}
                    </span>
                    <div className="flex-1 mx-3 sm:mx-4 h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-purple-400 rounded-full transition-all duration-500"
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-800 font-mono w-16 text-right">
                      {mfr.total}대
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extra info footer */}
          <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
            <span>정상 배정 기기 우선 가동</span>
            <button
              onClick={() => onNavigateTab('devices')}
              className="text-purple-500 hover:text-purple-700 font-bold flex items-center gap-0.5"
            >
              <span>기기 필터</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* RECENT ISSUES TABLE: 7 COLS */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                최근 기기 이슈 (실시간)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                {issueDevices.length}건
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('devices')}
              className="text-xs text-purple-500 hover:text-purple-700 font-bold flex items-center gap-0.5"
            >
              <span>전체보기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {issueDevices.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-slate-700">현재 고장 또는 수리 중인 기기가 없습니다.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">모든 디지털 기기가 정상 상태입니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] text-slate-400 border-b border-slate-50 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="pb-2">관리번호</th>
                    <th className="pb-2">장소</th>
                    <th className="pb-2">상태</th>
                    <th className="pb-2">내용</th>
                    <th className="pb-2 text-right">빠른 조치</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-slate-50">
                  {issueDevices.slice(0, 5).map((device) => {
                    const isBroken = device.status === 'broken';
                    return (
                      <tr
                        key={device.id}
                        onClick={() => onSelectDevice(device)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 font-mono font-bold text-slate-900 group-hover:text-purple-700">
                          {device.managementNumber}
                        </td>
                        <td className="py-3 font-medium text-slate-700">
                          {device.location}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded font-bold text-[11px] inline-block ${
                              isBroken
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-amber-100 text-amber-600'
                            }`}
                          >
                            {isBroken ? '고장' : '수리 중'}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 max-w-[180px] truncate">
                          {device.issueDescription || device.repairDescription || '-'}
                        </td>
                        <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {isBroken ? (
                            <button
                              onClick={() => onQuickStatusChange(device, 'repair')}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold shadow-xs transition-transform active:scale-95"
                            >
                              수리 접수
                            </button>
                          ) : (
                            <button
                              onClick={() => onQuickStatusChange(device, 'normal')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition-transform active:scale-95"
                            >
                              수리 완료
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM QUICK ACTION CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('classes')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">학급별 배정 현황</span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">33개 학급</div>
          <div className="text-xs text-purple-500 font-bold mt-1 flex items-center">
            <span>바로가기</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>

        <div
          onClick={onOpenReportModal}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">담당 교사 보고</span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">원클릭 보고서</div>
          <div className="text-xs text-purple-500 font-bold mt-1 flex items-center">
            <span>출력 및 복사</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>

        <div
          onClick={onOpenRegisterModal}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">신규 기기 등록</span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">+ 개별/일괄</div>
          <div className="text-xs text-purple-500 font-bold mt-1 flex items-center">
            <span>등록 폼 열기</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('consumables')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">소모품 관리</span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.mouse.total + stats.earphone.total}개</div>
          <div className="text-xs text-purple-500 font-bold mt-1 flex items-center">
            <span>재고 조정</span>
            <ChevronRight className="w-3 h-3 ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
