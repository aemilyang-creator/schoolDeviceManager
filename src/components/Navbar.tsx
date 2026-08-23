import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Mouse, 
  Headphones, 
  LayoutDashboard, 
  School, 
  Layers, 
  FileText, 
  PlusCircle, 
  Settings, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  UserCheck,
  Package
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { formatKoreanDateTime } from '../utils/formatters';

interface NavbarProps {
  currentTab: 'dashboard' | 'classes' | 'devices' | 'consumables' | 'report';
  setCurrentTab: (tab: 'dashboard' | 'classes' | 'devices' | 'consumables' | 'report') => void;
  onOpenRegisterModal: () => void;
  onOpenReportModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenRegisterModal,
  onOpenReportModal,
  onOpenSettingsModal,
}) => {
  const { systemConfig, updateSystemConfig, stats } = useDevices();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-purple-900 text-white shadow-lg sticky top-0 z-40">
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-purple-800/80">
        <div className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* School and System Identity */}
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-800 text-purple-200 border border-purple-700">
              <School className="w-3.5 h-3.5 mr-1 text-purple-300" />
              {systemConfig.schoolName}
            </span>
            <span className="hidden sm:inline text-purple-300 font-semibold tracking-wide">
              {systemConfig.academicYear} 디지털 선도학교
            </span>
          </div>

          {/* Live Clock & Quick Status Indicators */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-1.5 text-purple-200 bg-purple-950/60 px-3 py-1 rounded-md border border-purple-800">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-mono font-medium text-purple-100">{formatKoreanDateTime(currentTime)}</span>
            </div>

            {/* Quick Status Pill */}
            <div className="flex items-center space-x-2 font-bold text-[11px]">
              <div className="flex items-center space-x-1 bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>정상 {stats.chromebook.normal}대</span>
              </div>
              <div className="flex items-center space-x-1 bg-amber-950/80 border border-amber-600/40 text-amber-300 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>수리 {stats.chromebook.repair}대</span>
              </div>
              <div className="flex items-center space-x-1 bg-rose-950/80 border border-rose-600/40 text-rose-300 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>고장 {stats.chromebook.broken}대</span>
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex items-center space-x-1.5 bg-purple-800/90 px-2.5 py-1 rounded-lg border border-purple-700">
              <div className="w-5 h-5 rounded-full bg-purple-700 flex items-center justify-center text-[10px] font-bold text-purple-200">
                DT
              </div>
              <span className="text-white font-bold text-xs">
                디지털 튜터 (관리권한)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Main Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-purple-800 flex items-center justify-center shadow-md border border-purple-700">
              <Laptop className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  S.D.D.M
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-800 text-purple-300 border border-purple-700 rounded">
                  스쿨 디바이스 매니저
                </span>
              </div>
              <p className="text-xs text-purple-300 uppercase tracking-widest font-medium">
                학교 디지털기기 관리 시스템
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1.5">
            <button
              id="nav-tab-dashboard"
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-purple-300 hover:text-white hover:bg-purple-800/60'
              }`}
            >
              {currentTab === 'dashboard' ? (
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              ) : (
                <LayoutDashboard className="w-4 h-4" />
              )}
              <span>대시보드</span>
            </button>

            <button
              id="nav-tab-classes"
              onClick={() => setCurrentTab('classes')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                currentTab === 'classes'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-purple-300 hover:text-white hover:bg-purple-800/60'
              }`}
            >
              {currentTab === 'classes' ? (
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              ) : (
                <School className="w-4 h-4" />
              )}
              <span>학급별 현황</span>
            </button>

            <button
              id="nav-tab-devices"
              onClick={() => setCurrentTab('devices')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                currentTab === 'devices'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-purple-300 hover:text-white hover:bg-purple-800/60'
              }`}
            >
              {currentTab === 'devices' ? (
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
              <span>전체 기기 관리</span>
            </button>

            <button
              id="nav-tab-consumables"
              onClick={() => setCurrentTab('consumables')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                currentTab === 'consumables'
                  ? 'bg-purple-800 text-white shadow-xs'
                  : 'text-purple-300 hover:text-white hover:bg-purple-800/60'
              }`}
            >
              {currentTab === 'consumables' ? (
                <div className="w-2 h-2 rounded-full bg-purple-400" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              <span>소모품 관리</span>
            </button>

            <button
              id="nav-tab-report"
              onClick={onOpenReportModal}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-bold text-purple-300 hover:text-white hover:bg-purple-800/60 transition-all"
            >
              <FileText className="w-4 h-4 text-purple-300" />
              <span>담당교사 보고서</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              id="btn-register-device-top"
              onClick={onOpenRegisterModal}
              className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-transform active:scale-95 border border-purple-500"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">기기 등록</span>
            </button>

            <button
              id="btn-open-settings"
              onClick={onOpenSettingsModal}
              title="설정 및 데이터 관리"
              className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-800 transition-colors border border-purple-800"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex overflow-x-auto space-x-2 pb-2.5 scrollbar-none">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1.5 ${
              currentTab === 'dashboard' ? 'bg-purple-800 text-white' : 'text-purple-300 bg-purple-950/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>대시보드</span>
          </button>
          <button
            onClick={() => setCurrentTab('classes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1.5 ${
              currentTab === 'classes' ? 'bg-purple-800 text-white' : 'text-purple-300 bg-purple-950/60'
            }`}
          >
            <School className="w-3.5 h-3.5" />
            <span>학급별 현황</span>
          </button>
          <button
            onClick={() => setCurrentTab('devices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1.5 ${
              currentTab === 'devices' ? 'bg-purple-800 text-white' : 'text-purple-300 bg-purple-950/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>전체 기기 관리</span>
          </button>
          <button
            onClick={() => setCurrentTab('consumables')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1.5 ${
              currentTab === 'consumables' ? 'bg-purple-800 text-white' : 'text-purple-300 bg-purple-950/60'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>소모품 관리</span>
          </button>
          <button
            onClick={onOpenReportModal}
            className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 flex items-center space-x-1.5 text-purple-300 bg-purple-950/60"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>교사 보고서</span>
          </button>
        </div>
      </div>
    </header>
  );
};
