import { DeviceStatus, DeviceType } from '../types';

export const getStatusBadgeStyle = (status: DeviceStatus) => {
  switch (status) {
    case 'normal':
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        text: '정상',
        pill: 'bg-emerald-500 text-white',
        border: 'border-emerald-500',
      };
    case 'repair':
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500 animate-pulse',
        text: '수리 중',
        pill: 'bg-amber-500 text-white',
        border: 'border-amber-500',
      };
    case 'broken':
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        text: '고장(사용 불가)',
        pill: 'bg-rose-500 text-white',
        border: 'border-rose-500',
      };
  }
};

export const getDeviceTypeLabel = (type: DeviceType) => {
  switch (type) {
    case 'chromebook':
      return '크롬북';
    case 'mouse':
      return '마우스';
    case 'earphone':
      return '이어폰';
  }
};

export const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch {
    return dateString;
  }
};

export const formatKoreanDateTime = (date: Date) => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const day = days[date.getDay()];
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}년 ${m}월 ${d}일 (${day}) ${hh}:${mm}:${ss}`;
};
