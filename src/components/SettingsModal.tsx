import React, { useState, useRef } from 'react';
import { 
  X, 
  Settings, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  School, 
  User, 
  Save, 
  HelpCircle,
  Terminal,
  Code2
} from 'lucide-react';
import { useDevices } from '../context/DeviceContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { systemConfig, updateSystemConfig, exportDataToJson, importDataFromJson, resetToDefaultData } = useDevices();

  const [schoolName, setSchoolName] = useState(systemConfig.schoolName);
  const [academicYear, setAcademicYear] = useState(systemConfig.academicYear);
  const [digitalTutorName, setDigitalTutorName] = useState(systemConfig.digitalTutorName);
  const [deviceTeacherName, setDeviceTeacherName] = useState(systemConfig.deviceTeacherName);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemConfig({
      schoolName,
      academicYear,
      digitalTutorName,
      deviceTeacherName,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportJSON = () => {
    const data = exportDataToJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `학교디지털기기_데이터백업_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDataFromJson(content);
        if (success) {
          alert('데이터를 성공적으로 복원하였습니다!');
          onClose();
        } else {
          alert('올바른 JSON 백업 파일이 아닙니다.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      window.confirm(
        '모든 기기 및 소모품 데이터를 초기 기본값(크롬북 730대, 마우스 705개, 이어폰 389개)으로 재설정하시겠습니까?'
      )
    ) {
      resetToDefaultData();
      alert('초기 데이터로 재설정되었습니다.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-purple-900 text-white px-8 py-5 flex items-center justify-between border-b border-purple-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-800 flex items-center justify-center border border-purple-700">
              <Settings className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">System Preferences</div>
              <h3 className="font-black text-lg text-white tracking-tight">시스템 설정 및 데이터 관리</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Section 1: School System Metadata */}
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <School className="w-4 h-4 text-purple-900" />
              <span>학교 기본 정보 및 담당자 설정</span>
            </h4>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-900 font-bold mb-1">학교명</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-900 font-bold mb-1">학년도</label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-900 font-bold mb-1">디지털 튜터명</label>
                <input
                  type="text"
                  value={digitalTutorName}
                  onChange={(e) => setDigitalTutorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-900 font-bold mb-1">디지털기기 담당 교사명</label>
                <input
                  type="text"
                  value={deviceTeacherName}
                  onChange={(e) => setDeviceTeacherName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-900 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{savedSuccess ? '저장 완료!' : '학교 정보 저장'}</span>
              </button>
            </div>
          </form>

          {/* Section 2: Data Backup & Restore */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-black text-slate-900 text-sm flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Download className="w-4 h-4 text-purple-900" />
              <span>데이터 백업 및 복원</span>
            </h4>

            <p className="text-slate-600 font-medium leading-relaxed">
              등록된 모든 기기, 소모품 수량, 수리 이력을 JSON 파일로 안전하게 백업하거나 불러올 수 있습니다.
            </p>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={handleExportJSON}
                className="p-4 bg-purple-50 hover:bg-purple-100 text-purple-950 border border-purple-200 rounded-2xl font-black flex flex-col items-center justify-center space-y-1.5 transition-colors"
              >
                <Download className="w-5 h-5 text-purple-900" />
                <span>데이터 JSON 내보내기</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl font-black flex flex-col items-center justify-center space-y-1.5 transition-colors"
              >
                <Upload className="w-5 h-5 text-purple-900" />
                <span>데이터 JSON 불러오기</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>

          {/* Section 3: VS Code Local Execution Guide */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h4 className="font-black text-slate-950 text-xs flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-900" />
              <span>Visual Studio Code에서 실행하는 방법</span>
            </h4>
            <p className="text-slate-600 text-[11px] leading-relaxed font-medium">
              이 프로젝트를 VS Code에서 다운로드하여 단독 실행할 때 아래 명령어를 터미널에 입력하세요:
            </p>
            <div className="bg-slate-950 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] space-y-1.5 select-all border border-slate-800">
              <div className="text-purple-300 font-bold"># 1. 패키지 의존성 설치</div>
              <div className="text-emerald-400 font-bold">npm install</div>
              <div className="text-purple-300 font-bold pt-1"># 2. 로컬 개발 서버 실행 (포트 3000)</div>
              <div className="text-emerald-400 font-bold">npm run dev</div>
            </div>
          </div>

          {/* Section 4: Factory Reset */}
          <div className="space-y-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="font-black text-rose-700">데이터 초기화</div>
              <div className="text-[11px] text-slate-500 font-medium">제주이도초등학교 기본 샘플 데이터로 복구</div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-black flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기값 복원</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
