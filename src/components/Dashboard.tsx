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
  const requestedConsumables = consumables.filter((c) => c.requestMemo && c.requestMemo.trim() !== '');

  // Quick adjust total consumables via smart room
  const handleQuickAdjust = (type: 'mouse' | 'earphone', delta: number) => {
    const storage = consumables.find(c => c.location.includes('스마트')) || consumables[0];
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

  const otherTotal = Object.entries(stats.chromebook.byManufacturer)
    .filter(([key]) => !['삼성전자', 'LG', 'LG전자', '레노버', 'ASUS'].includes(key))
    .reduce((sum, [, val]) => sum + ((val as { total?: number })?.total || 0), 0);

  const mfrList = [
    { key: '삼성전자', name: '삼성전자', total: stats.chromebook.byManufacturer['삼성전자']?.total || 0, normal: stats.chromebook.byManufacturer['삼성전자']?.normal || 0 },
    { key: 'LG', name: 'LG', total: (stats.chromebook.byManufacturer['LG']?.total || 0) + (stats.chromebook.byManufacturer['LG전자']?.total || 0), normal: (stats.chromebook.byManufacturer['LG']?.normal || 0) + (stats.chromebook.byManufacturer['LG전자']?.normal || 0) },
    { key: '레노버', name: '레노버', total: stats.chromebook.byManufacturer['레노버']?.total || 0, normal: stats.chromebook.byManufacturer['레노버']?.normal || 0 },
    { key: 'ASUS', name: 'ASUS', total: stats.chromebook.byManufacturer['ASUS']?.total || 0, normal: stats.chromebook.byManufacturer['ASUS']?.normal || 0 },
    { key: '기타', name: '기타', total: otherTotal, normal: 0 },
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
        <div className="col-span-12 lg:col-span-8 bg-gradient-to-br from-purple-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-between shadow-lg shadow-purple-950/20 border border-purple-700/50">
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold opacity-95 tracking-wide">
                사용 가능한 크롬북
              </h3>
              <span className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-xs">
                실시간 가동 지표
              </span>
            </div>

            {/* Grid for Big Count & Rectangular Notepad */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center mt-3 sm:mt-4">
              {/* Left: Big Number Count */}
              <div className="md:col-span-6 lg:col-span-7">
                <p className="text-5xl sm:text-7xl lg:text-[76px] xl:text-[88px] font-black leading-none tracking-tighter drop-shadow-xs font-sans">
                  {stats.chromebook.normal.toLocaleString()}
                  <span className="text-lg sm:text-2xl font-normal opacity-75 ml-2 sm:ml-3 tracking-normal font-sans">
                    / {stats.chromebook.total.toLocaleString()} TOTAL
                  </span>
                </p>
                <p className="text-xs text-white/80 font-semibold mt-2 sm:mt-2.5">
                  정상 가동 가능 학생용 크롬북
                </p>
              </div>

              {/* Right: Rectangular Notepad below '실시간 가동 지표' with dark purple text & preserve newlines */}
              <div className="md:col-span-6 lg:col-span-5 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-purple-200/80 shadow-md flex flex-col">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-purple-100">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-950" />
                    <span className="text-xs font-black tracking-tight text-purple-950">학급별 요청·점검 관리 메모</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-950 text-white shadow-2xs">
                    {requestedConsumables.length}건
                  </span>
                </div>

                {/* Scrollable List with custom scrollbar */}
                <div className="max-h-28 sm:max-h-32 overflow-y-auto space-y-1.5 pr-1 custom-memo-scroll text-xs">
                  {requestedConsumables.length === 0 ? (
                    <div className="py-3 text-center text-purple-900/60">
                      <p className="text-xs font-medium">등록된 요청 및 점검 관리 메모가 없습니다.</p>
                    </div>
                  ) : (
                    requestedConsumables.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onNavigateTab('consumables')}
                        className="bg-purple-50/80 hover:bg-purple-100/90 rounded-xl p-2.5 transition-all cursor-pointer border border-purple-200/70 group/memo shadow-2xs"
                        title="소모품 관리로 이동"
                      >
                        <div className="flex items-center justify-between text-[11px] font-black text-purple-950 mb-1">
                          <span className="flex items-center gap-1">
                            <span>📍</span>
                            <span>{item.location}</span>
                          </span>
                          {item.updatedAt && (
                            <span className="text-[10px] text-purple-900/70 font-semibold font-mono">{item.updatedAt}</span>
                          )}
                        </div>
                        <p className="text-purple-950 text-xs leading-relaxed font-semibold whitespace-pre-line break-words">
                          {item.requestMemo}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
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
                className="bg-white text-purple-900 hover:bg-purple-50 px-4 py-2 rounded-full text-xs font-bold transition-transform active:scale-95 shadow-sm flex items-center gap-1"
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
                  마우스 배부 현황
                </h4>
                <p className="text-3xl sm:text-4xl font-black text-slate-800 mt-1 tracking-tight">
                  {stats.mouse.total.toLocaleString()}
                  <span className="text-sm font-medium text-slate-400 ml-1.5 font-sans">개</span>
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleQuickAdjust('mouse', -1)}
                  title="스마트실 수량 1 감소"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => handleQuickAdjust('mouse', 1)}
                  title="스마트실 수량 1 증가"
                  className="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-600 font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex justify-between text-xs border-t border-slate-50 pt-4 font-medium">
              <span className="text-slate-500">유선 {stats.mouse.assignedWired || stats.mouse.wired} / 무선 {stats.mouse.assignedWireless || stats.mouse.wireless}</span>
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
                  이어폰 배부 현황
                </h4>
                <p className="text-3xl sm:text-4xl font-black text-slate-800 mt-1 tracking-tight">
                  {stats.earphone.total.toLocaleString()}
                  <span className="text-sm font-medium text-slate-400 ml-1.5 font-sans">개</span>
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleQuickAdjust('earphone', -1)}
                  title="스마트실 수량 1 감소"
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition-colors cursor-pointer"
                >
                  -
                </button>
                <button
                  onClick={() => handleQuickAdjust('earphone', 1)}
                  title="스마트실 수량 1 증가"
                  className="w-8 h-8 rounded-lg bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-600 font-bold transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex justify-between text-xs border-t border-slate-50 pt-4 font-medium">
              <span className="text-slate-500">학급 배부 완료 ({stats.earphone.assigned}개)</span>
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
                        <td className="py-3 text-slate-500 max-w-[240px] truncate">
                          {device.issueDescription || device.repairDescription || '-'}
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
          onClick={() => onNavigateTab('devices')}
          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">전체 기기 관리</span>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.chromebook.total}대 기기</div>
          <div className="text-xs text-purple-500 font-bold mt-1 flex items-center">
            <span>목록 조회 및 필터</span>
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
