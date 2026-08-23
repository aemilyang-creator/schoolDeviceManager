import React, { useState } from 'react';
import { DeviceProvider, useDevices } from './context/DeviceContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ClassroomView } from './components/ClassroomView';
import { DeviceManagement } from './components/DeviceManagement';
import { ConsumablesManagement } from './components/ConsumablesManagement';
import { DeviceRegisterModal } from './components/DeviceRegisterModal';
import { DeviceDetailModal } from './components/DeviceDetailModal';
import { TeacherReportModal } from './components/TeacherReportModal';
import { SettingsModal } from './components/SettingsModal';
import { Device, DeviceStatus } from './types';

function MainApp() {
  const { updateDevice } = useDevices();

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'classes' | 'devices' | 'consumables' | 'report'>('dashboard');

  // Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const handleQuickStatusChange = (device: Device, newStatus: DeviceStatus) => {
    const reason = newStatus === 'repair' ? '대시보드에서 빠른 수리 접수' : '대시보드에서 빠른 수리 완료 조치';
    updateDevice(
      device.id,
      {
        status: newStatus,
        repairDescription: newStatus === 'repair' ? '수리 점검 접수 진행 중' : '수리 완료하여 정상 복구 완료',
      },
      reason
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Top Header & Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard
            onSelectDevice={(device) => setSelectedDevice(device)}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onQuickStatusChange={handleQuickStatusChange}
          />
        )}

        {currentTab === 'classes' && (
          <ClassroomView
            onSelectDevice={(device) => setSelectedDevice(device)}
            onOpenRegisterModalForLocation={(loc) => {
              setIsRegisterModalOpen(true);
            }}
          />
        )}

        {currentTab === 'devices' && (
          <DeviceManagement
            onSelectDevice={(device) => setSelectedDevice(device)}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          />
        )}

        {currentTab === 'consumables' && (
          <ConsumablesManagement />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-slate-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-purple-900">학교 디지털기기 관리 시스템</span>
            <span>·</span>
            <span>디지털 튜터 & 담당 교사 스마트 업무 지원</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>크롬북 · 마우스 · 이어폰 실시간 모니터링</span>
            <span>·</span>
            <span>로컬 스토리지 데이터 자동 동기화</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DeviceRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

      <DeviceDetailModal
        device={selectedDevice}
        isOpen={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
      />

      <TeacherReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <DeviceProvider>
      <MainApp />
    </DeviceProvider>
  );
}
