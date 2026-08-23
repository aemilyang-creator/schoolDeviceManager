import React, { useState, useEffect } from 'react';
import { 
  X, 
  Laptop, 
  Mouse, 
  Headphones, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Save, 
  Trash2, 
  Clock, 
  User, 
  Calendar, 
  MapPin, 
  Sparkles,
  Wrench,
  FileCheck
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';
import { Device, DeviceStatus } from '../types';
import { getStatusBadgeStyle, formatDate, getDeviceTypeLabel } from '../utils/formatters';

interface DeviceDetailModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceDetailModal: React.FC<DeviceDetailModalProps> = ({
  device,
  isOpen,
  onClose,
}) => {
  const { updateDevice, deleteDevice } = useDevices();

  const [status, setStatus] = useState<DeviceStatus>('normal');
  const [location, setLocation] = useState<string>('');
  const [managementNumber, setManagementNumber] = useState<string>('');
  const [classDeviceNumber, setClassDeviceNumber] = useState<string>('');
  const [deviceName, setDeviceName] = useState<string>('');
  const [manufacturer, setManufacturer] = useState<string>('');
  const [modelName, setModelName] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [repairDescription, setRepairDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [actionReason, setActionReason] = useState<string>('');

  useEffect(() => {
    if (device) {
      setStatus(device.status);
      setLocation(device.location);
      setManagementNumber(device.managementNumber || '');
      setClassDeviceNumber(device.classDeviceNumber !== undefined ? String(device.classDeviceNumber) : '');
      setDeviceName(device.deviceName);
      setManufacturer(device.manufacturer || '');
      setModelName(device.modelName || '');
      setIssueDescription(device.issueDescription || '');
      setRepairDescription(device.repairDescription || '');
      setNote(device.note || '');
      setActionReason('');
    }
  }, [device]);

  if (!isOpen || !device) return null;

  const currentBadge = getStatusBadgeStyle(status);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedClassNum = classDeviceNumber.trim() ? parseInt(classDeviceNumber.replace(/[^0-9]/g, ''), 10) : undefined;

    updateDevice(
      device.id,
      {
        managementNumber: managementNumber.trim(),
        classDeviceNumber: !isNaN(parsedClassNum as number) ? parsedClassNum : undefined,
        deviceName,
        manufacturer,
        modelName,
        location,
        status,
        issueDescription: status !== 'normal' ? issueDescription : undefined,
        repairDescription: status === 'repair' ? repairDescription : status === 'normal' && device.status !== 'normal' ? (actionReason || '수리 조치 완료') : repairDescription,
        note,
      },
      actionReason || (status !== device.status ? `기기 상태 변경 (${device.status} -> ${status})` : '기기 상세 정보 수정')
    );

    onClose();
  };

  const handleDelete = () => {
    const displayName = device.classDeviceNumber ? `${device.location} ${device.classDeviceNumber}번` : device.managementNumber || device.deviceName;
    if (window.confirm(`[${displayName}] 기기를 정말 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.`)) {
      deleteDevice(device.id);
      onClose();
    }
  };

  // Quick workflow triggers
  const handleTriggerStatus = (newStatus: DeviceStatus) => {
    setStatus(newStatus);
    if (newStatus === 'broken' && !issueDescription) {
      setIssueDescription('사용 중 고장 발생 (증상 점검 필요)');
      setActionReason('고장 발생 접수');
    } else if (newStatus === 'repair' && !repairDescription) {
      setRepairDescription('제조사 서비스센터 AS 수리 의뢰 접수');
      setActionReason('수리 접수 진행');
    } else if (newStatus === 'normal') {
      setActionReason('수리 및 점검 완료 후 정상 복구');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-purple-900 text-white px-8 py-5 flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-800 flex items-center justify-center border border-purple-700">
              {device.deviceType === 'chromebook' ? (
                <Laptop className="w-5 h-5 text-purple-200" />
              ) : device.deviceType === 'mouse' ? (
                <Mouse className="w-5 h-5 text-purple-200" />
              ) : (
                <Headphones className="w-5 h-5 text-purple-200" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                {device.classDeviceNumber !== undefined && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-950">
                    {device.location} {device.classDeviceNumber}번
                  </span>
                )}
                <span className="font-mono text-sm font-black text-purple-200 tracking-wider">
                  {device.managementNumber ? `[관리번호: ${device.managementNumber}]` : '[관리번호: 미입력]'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-800 text-purple-200 border border-purple-700">
                  {getDeviceTypeLabel(device.deviceType)}
                </span>
              </div>
              <h3 className="text-sm font-bold text-purple-200 mt-0.5">
                {device.deviceName} 상세 정보 및 유지보수
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Quick Action Bar */}
        <div className="bg-purple-50 px-8 py-3.5 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 font-black text-purple-950">
            <Sparkles className="w-4 h-4 text-purple-900" />
            <span>원클릭 상태 변경 워크플로우:</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleTriggerStatus('normal')}
              className={`px-3.5 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                status === 'normal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>정상 복구</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerStatus('repair')}
              className={`px-3.5 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                status === 'repair'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-amber-800 border border-amber-300 hover:bg-amber-50'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>수리 진행</span>
            </button>

            <button
              type="button"
              onClick={() => handleTriggerStatus('broken')}
              className={`px-3.5 py-1.5 rounded-xl font-black transition-all flex items-center gap-1.5 ${
                status === 'broken'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-800 border border-rose-300 hover:bg-rose-50'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>고장 신고</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form id="device-detail-form" onSubmit={handleSave} className="p-8 overflow-y-auto space-y-5 text-xs">
          {/* Status Indicator Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${currentBadge.bg}`}>
            <div className="flex items-center space-x-2.5">
              <span className={`w-3 h-3 rounded-full ${currentBadge.dot}`} />
              <span className="font-black text-sm">
                현재 상태: {currentBadge.text}
              </span>
            </div>
            <span className="text-[11px] font-bold opacity-90 font-mono">
              최종 수정일: {formatDate(device.updatedAt)}
            </span>
          </div>

          {/* Issue & Repair Description Fields (If Broken or Under Repair) */}
          {status === 'broken' && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 animate-fade-in">
              <label className="block text-rose-950 font-black flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>고장 내용 및 증상 (필수)</span>
              </label>
              <textarea
                required
                rows={2}
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="고장 증상을 상세히 작성하세요 (예: 화면 파손, 부팅 불가, 충전 단자 파손 등)"
                className="w-full p-3 text-xs border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white font-medium"
              />
            </div>
          )}

          {status === 'repair' && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 animate-fade-in">
              <label className="block text-amber-950 font-black flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>수리 접수 내용 및 진행 현황</span>
              </label>
              <textarea
                rows={2}
                value={repairDescription}
                onChange={(e) => setRepairDescription(e.target.value)}
                placeholder="수리 업체, 접수 번호 및 예정 일자 (예: 삼성 AS센터 액정 교체 접수)"
                className="w-full p-3 text-xs border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white font-medium"
              />
            </div>
          )}

          {/* Basic Device Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
            <div>
              <label className="block text-purple-950 font-black mb-1">
                학급 내 반 번호 (1번~20번)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={classDeviceNumber}
                onChange={(e) => setClassDeviceNumber(e.target.value)}
                placeholder="예: 1"
                className="w-full px-3.5 py-2.5 text-xs border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-black text-purple-950 bg-white"
              />
            </div>

            <div>
              <label className="block text-purple-950 font-black mb-1">
                학교 자산 관리번호 (추후 입력 가능)
              </label>
              <input
                type="text"
                value={managementNumber}
                onChange={(e) => setManagementNumber(e.target.value)}
                placeholder="미입력 (예: CB-0102, 2026-초등-01 등)"
                className="w-full px-3.5 py-2.5 text-xs border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-mono font-bold text-purple-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-900 font-bold mb-1">기기명</label>
              <input
                type="text"
                required
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-900 font-bold mb-1">보관 장소 (학급/특별실)</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-black text-purple-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-900 font-bold mb-1">제조사 (브랜드)</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-900 font-bold mb-1">
                기기 메모 <span className="text-slate-400 font-normal">(선택)</span>
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="예: 2024년 구입, 터치펜 포함 등"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-900 font-bold mb-1">비고 및 메모</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 학생 번호 스티커 부착, 케이스 포함"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-medium"
            />
          </div>

          {/* Change Log / Action Reason Note */}
          <div>
            <label className="block text-slate-900 font-bold mb-1">
              변경 사유 (이력 저장용)
            </label>
            <input
              type="text"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="예: 3학년 1반 정기 점검 중 조치"
              className="w-full px-3.5 py-2.5 text-xs border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none bg-purple-50/40 font-medium"
            />
          </div>

          {/* Maintenance History Log */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="font-black text-slate-900 text-xs flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-900" />
              <span>기기 상태 변경 및 조치 이력</span>
            </h4>

            {(!device.history || device.history.length === 0) ? (
              <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-400 text-[11px] font-medium">
                기록된 변경 이력이 없습니다.
              </div>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {device.history.map((hist) => {
                  const histBadge = getStatusBadgeStyle(hist.newStatus);
                  return (
                    <div
                      key={hist.id}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between text-[11px]"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${histBadge.bg}`}>
                            {histBadge.text}
                          </span>
                          <span className="font-bold text-slate-900">{hist.description}</span>
                        </div>
                        <div className="text-slate-500 text-[10px]">
                          처리자: {hist.userName || '디지털 튜터'}
                        </div>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-2">
                        {hist.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3.5 py-2 text-xs font-black text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>기기 삭제</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
            >
              닫기
            </button>
            <button
              type="submit"
              form="device-detail-form"
              className="px-6 py-2 text-xs font-black text-white bg-purple-900 hover:bg-purple-800 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>변경 사항 저장</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
