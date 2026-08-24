import { Device, ConsumableInventory, SystemConfig } from '../types';

export const INITIAL_SYSTEM_CONFIG: SystemConfig = {
  schoolName: '제주초등학교',
  systemName: '학교 디지털기기 통합 관리 시스템',
  academicYear: '2026학년도',
  digitalTutorName: '김디지털 (디지털 튜터)',
  deviceTeacherName: '이정보 (디지털기기 담당 교사)',
  userRole: 'tutor',
  customGrades: [3, 4, 5, 6],
  customClasses: {
    3: [1, 2, 3, 4, 5],
    4: [1, 2, 3, 4, 5, 6],
    5: [1, 2, 3, 4, 5, 6],
    6: [1, 2, 3, 4, 5, 6],
  },
  customSpecialRooms: [
    '스마트실'
  ]
};

// Generates the initial standard dataset matching the school specification starting from Grade 3
export function generateInitialDevices(): Device[] {
  const devices: Device[] = [];
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Classes: Grade 3 to 6 (3학년: 5개 반, 4~6학년: 6개 반) = 23 classrooms
  const classes: { grade: number; classNum: number; name: string }[] = [];
  for (let g = 3; g <= 6; g++) {
    const classCount = g === 3 ? 5 : 6;
    for (let c = 1; c <= classCount; c++) {
      classes.push({ grade: g, classNum: c, name: `${g}학년 ${c}반` });
    }
  }

  // 1. Chromebooks (Total 530: 23 classes * 20 = 460 in classrooms + 70 in Smart room)
  // Manufacturers: Samsung, LG, Lenovo, ASUS
  const chromebookMfrs = [
    { name: '삼성전자', model: '삼성전자 크롬북', count: 210 },
    { name: 'LG', model: 'LG 크롬북', count: 150 },
    { name: '레노버', model: '레노버 크롬북', count: 100 },
    { name: 'ASUS', model: 'ASUS 크롬북', count: 70 },
  ];

  // Prepare a flat pool of manufacturer models
  const mfrPool: { name: string; model: string }[] = [];
  chromebookMfrs.forEach((mfrGroup) => {
    for (let i = 0; i < mfrGroup.count; i++) {
      mfrPool.push({ name: mfrGroup.name, model: mfrGroup.model });
    }
  });

  const brokenIssues = [
    '화면 패널 파손 (LCD 줄 생김)',
    '배터리 충전 불량 및 전원 꺼짐 현상',
    '키보드 스페이스바 및 엔터키 입력 불량',
    '터치스크린 인식 오류 및 고스트 터치',
    'C타입 충전 포트 헐거움 및 단자 손상',
    '경첩(힌지) 유격 및 케이스 파손',
    '와이파이(Wi-Fi) 모듈 인식 불가',
    '트랙패드 클릭 미작동',
    '화면 백라이트 점등 불가',
    '오디오 잭 부러짐으로 내부 박힘'
  ];

  // Specific locations & management numbers for broken devices and repair device
  const brokenTargetMap: Record<string, number> = {
    '3학년 1반-14': 4,
    '3학년 2반-3': 5,
    '3학년 5반-17': 6,
    '4학년 2반-9': 7,
    '4학년 4반-20': 8,
    '5학년 1반-2': 9,
    '5학년 3반-11': 0,
    '5학년 6반-16': 1,
    '6학년 2반-7': 2,
    '6학년 5반-15': 3,
    '스마트실-8': 4,
    '스마트실-22': 5,
  };

  const repairTargetKey = '3학년 1반-7';

  let poolIdx = 0;

  // 1. Generate 20 Chromebooks for each classroom (1번 ~ 20번)
  classes.forEach((targetClass) => {
    for (let num = 1; num <= 20; num++) {
      const mfrInfo = mfrPool[poolIdx % mfrPool.length];
      poolIdx++;

      const locationKey = `${targetClass.name}-${num}`;

      let status: 'normal' | 'repair' | 'broken' = 'normal';
      let issueDesc = '';
      let repairDesc = '';

      if (locationKey === repairTargetKey) {
        status = 'repair';
        issueDesc = '메인보드 부팅 불가 - 제조사 AS센터 접수 완료';
        repairDesc = '서비스센터 부품 교체 대기 중 (접수번호: AS-202608-091)';
      } else if (brokenTargetMap[locationKey] !== undefined) {
        status = 'broken';
        const issueIndex = brokenTargetMap[locationKey];
        issueDesc = brokenIssues[issueIndex % brokenIssues.length];
        repairDesc = '점검 완료 / 수리 신청 예정';
      }

      devices.push({
        id: `device-cb-${targetClass.grade}-${targetClass.classNum}-${num}`,
        deviceType: 'chromebook',
        managementNumber: '', // 관리번호는 비워두고 필요시 입력
        classDeviceNumber: num, // 반 번호 (1번 ~ 20번)
        deviceName: `${mfrInfo.name} 크롬북`,
        modelName: '',
        manufacturer: mfrInfo.name,
        location: targetClass.name,
        grade: targetClass.grade,
        classNum: targetClass.classNum,
        status,
        issueDescription: issueDesc,
        repairDescription: repairDesc,
        createdAt: '2024-03-02',
        updatedAt: status !== 'normal' ? dateStr : '2025-09-01',
        note: `학생 배정용 (${targetClass.name} ${num}번)`,
        history: status !== 'normal' ? [
          {
            id: `hist-${targetClass.grade}-${targetClass.classNum}-${num}`,
            date: dateStr,
            previousStatus: 'normal',
            newStatus: status,
            description: issueDesc || '상태 변경 접수',
            userName: '김디지털 (튜터)'
          }
        ] : []
      });
    }
  });

  // 2. Generate 70 Chromebooks for Smart Room (Total 530)
  const specialRoomDistributions = [
    { room: '스마트실', count: 70 },
  ];

  specialRoomDistributions.forEach(({ room, count }) => {
    for (let num = 1; num <= count; num++) {
      const mfrInfo = mfrPool[poolIdx % mfrPool.length];
      poolIdx++;

      const locationKey = `${room}-${num}`;

      let status: 'normal' | 'repair' | 'broken' = 'normal';
      let issueDesc = '';
      let repairDesc = '';

      if (brokenTargetMap[locationKey] !== undefined) {
        status = 'broken';
        const issueIndex = brokenTargetMap[locationKey];
        issueDesc = brokenIssues[issueIndex % brokenIssues.length];
        repairDesc = '점검 완료 / 수리 신청 예정';
      }

      devices.push({
        id: `device-cb-${room}-${num}`,
        deviceType: 'chromebook',
        managementNumber: '',
        classDeviceNumber: num,
        deviceName: `${mfrInfo.name} 크롬북`,
        modelName: '',
        manufacturer: mfrInfo.name,
        location: room,
        status,
        issueDescription: issueDesc,
        repairDescription: repairDesc,
        createdAt: '2024-03-02',
        updatedAt: status !== 'normal' ? dateStr : '2025-09-01',
        note: `스마트실 공용 (${room} ${num}번)`,
        history: status !== 'normal' ? [
          {
            id: `hist-${room}-${num}`,
            date: dateStr,
            previousStatus: 'normal',
            newStatus: status,
            description: issueDesc || '상태 점검',
            userName: '김디지털 (튜터)'
          }
        ] : []
      });
    }
  });

  return devices;
}

// Consumables (Mice & Earphones by Classroom / Location)
export function generateInitialConsumables(): ConsumableInventory[] {
  const list: ConsumableInventory[] = [];
  const now = new Date().toISOString().split('T')[0];

  const locations: string[] = [];
  for (let g = 3; g <= 6; g++) {
    const classCount = g === 3 ? 5 : 6;
    for (let c = 1; c <= classCount; c++) {
      locations.push(`${g}학년 ${c}반`);
    }
  }
  locations.push('스마트실');

  locations.forEach((loc, idx) => {
    let wired = 0;
    let wireless = 0;
    let earphone = 0;

    if (loc === '스마트실') {
      wired = 25;
      wireless = 25;
      earphone = 30;
    } else {
      wired = 0;
      wireless = 20;
      earphone = 15;
    }

    list.push({
      id: `cons-${idx + 1}`,
      location: loc,
      deviceType: 'mouse',
      mouseWiredCount: wired,
      mouseWirelessCount: wireless,
      earphoneCount: earphone,
      mouseSpareCount: 0,
      earphoneSpareCount: 0,
      requestMemo: loc === '3학년 2반' ? '무선마우스 2개 휠 스크롤 뻑뻑함, 교체 요망' : (loc === '5학년 1반' ? '이어폰 3개 단선 접촉불량 교체 요청' : ''),
      updatedAt: now
    });
  });

  return list;
}
