'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  User, 
  Compass, 
  RotateCcw, 
  Sparkles,
  Info,
  X
} from 'lucide-react';

// データファイルのインポート
import jaTrans from '@/data/translations/ja.json';

import defaultMapData from '@/data/maps/Default.json';
import peaksMapData from '@/data/maps/peaks.json';
import craterMapData from '@/data/maps/crater.json';
import rottedMapData from '@/data/maps/rotted.json';
import noklateoMapData from '@/data/maps/noklateo.json';
import hollowMapData from '@/data/maps/hollow.json';

import coordinates from '@/data/maps/coordinates.json';
import bosses from '@/data/maps/bosses.json';

interface BaseOption {
  type: string;
  text: string;
  element: string | null;
}

interface MapPattern {
  nightLord: string;
  shiftingEarth: string;
  spawnPoint: string;
  specialEvent: string | null;
  nightCircle1: { place: string; text: string } | null;
  nightCircle2: { place: string; text: string; extra?: unknown } | null;
  castleBoss: string;
  majorBases: Record<string, BaseOption>;
  minorBases: Record<string, { type: string; text: string }>;
  evergaols: Record<string, { text: string }>;
  fieldBosses: Record<string, { text: string | null } | null>;
  rotBlessing: unknown;
}

// マップデータのマッピング
const MAP_DATA_MAP: Record<string, MapPattern[]> = {
  Default: defaultMapData as unknown as MapPattern[],
  山嶺: peaksMapData as unknown as MapPattern[],
  火口: craterMapData as unknown as MapPattern[],
  腐れ森: rottedMapData as unknown as MapPattern[],
  隠れ都ノクラテオ: noklateoMapData as unknown as MapPattern[],
  大空洞: hollowMapData as unknown as MapPattern[]
};



// マップ画像の日本語名からアルファベットファイル名へのマッピング
const MAP_IMAGE_MAP: Record<string, string> = {
  'Default': 'Default',
  '山嶺': 'peaks',
  '火口': 'crater',
  '腐れ森': 'rotted',
  '隠れ都ノクラテオ': 'noklateo',
  '大空洞': 'hollow'
};

// ボス画像の日本語名からアルファベットファイル名へのマッピング
const BOSS_IMAGE_MAP: Record<string, string> = {
  '三つ首の獣': 'three_headed_beast',
  '喰らいつく顎': 'snapping_jaws',
  '知性の蟲': 'intellect_insect',
  '兆し': 'omen',
  '調律の魔物': 'tuning_monster',
  '闇駆ける狩人': 'dark_hunter',
  '霧 of 裂け目': 'mist_rift',
  '霧の裂け目': 'mist_rift',
  '夜を象る者': 'night_shaper',
  '安寧者達': 'harmonia',
  '瓦礫の王': 'straghess'
};

// マップ選択画面でのマップ背景ズーム・フォーカス用クラス
const MAP_ZOOM_CLASSES: Record<string, string> = {
  'Default': 'scale-100',
  '山嶺': 'scale-[180%] origin-top-left',
  '火口': 'scale-[180%] origin-top',
  '腐れ森': 'scale-[180%] origin-bottom-right',
  '隠れ都ノクラテオ': 'scale-[200%] origin-bottom-left',
  '大空洞': 'scale-100'
};

// ボスの危険度設定
const tv: Record<string, { isDanger: boolean }> = {
  '祖霊': { isDanger: true },
  'カーリアの親衛騎士': { isDanger: true },
  '死儀礼の鳥': { isDanger: true },
  '溶岩土竜': { isDanger: true },
  '爛れた樹霊': { isDanger: true },
  '黒き剣の眷属': { isDanger: true },
  '竜 of ツリーガード': { isDanger: true }, // Note: 実際は「竜のツリーガード」などですがキー対応
  '竜のツリーガード': { isDanger: true },
  'ツリーガード': { isDanger: true },
  '黄金樹の化身': { isDanger: true },
  '鈴玉狩り': { isDanger: true },
  '獅子の混種': { isDanger: false },
  '黄金カバ': { isDanger: false },
  'ザミェルの古英雄': { isDanger: false },
  '王族の幽鬼': { isDanger: false },
  '老獅子': { isDanger: false },
  '亜人の女王': { isDanger: false },
  'ミランダフラワー': { isDanger: false },
  '黒き刃の刺客': { isDanger: false },
  '夜の騎兵': { isDanger: false },
  '丘陵の飛竜': { isDanger: true },
  '接ぎ木の貴公子': { isDanger: false },
  '王配の赤狼': { isDanger: false }
};

interface BossStatRow {
  name: string;
  nameEn: string;
  physical: { standard: string; slash: string; strike: string; pierce: string };
  elemental: { magic: string; fire: string; lightning: string; holy: string };
  status: { poison: string; rot: string; bleed: string; frost: string; sleep: string; madness: string };
}

const DAY3_BOSS_STATS: Record<string, BossStatRow[]> = {
  '三つ首の獣': [
    {
      name: 'グラディウス',
      nameEn: 'Gladius',
      physical: { standard: '0', slash: '0', strike: '0', pierce: '10' },
      elemental: { magic: '0', fire: '-50', lightning: '0', holy: '35' },
      status: { poison: '542', rot: '252', bleed: '252', frost: '542', sleep: '154', madness: '無効' }
    }
  ],
  '喰らいつく顎': [
    {
      name: 'エデレ',
      nameEn: 'Edele',
      physical: { standard: '0', slash: '0', strike: '0', pierce: '0' },
      elemental: { magic: '0', fire: '-20', lightning: '-50', holy: '0' },
      status: { poison: '154', rot: '154', bleed: '542', frost: '154', sleep: '154', madness: '無効' }
    }
  ],
  '知性の蟲': [
    {
      name: 'グノスター(蛾)',
      nameEn: 'Gnoster (Moth)',
      physical: { standard: '15', slash: '25', strike: '15', pierce: '25' },
      elemental: { magic: '-50', fire: '40', lightning: '-10', holy: '-10' },
      status: { poison: '542', rot: '154', bleed: '154', frost: '154', sleep: '542', madness: '無効' }
    },
    {
      name: 'グノスター(サソリ)',
      nameEn: 'Gnoster (Scorpion)',
      physical: { standard: '-10', slash: '-20', strike: '20', pierce: '10' },
      elemental: { magic: '-10', fire: '35', lightning: '-10', holy: '-10' },
      status: { poison: '252', rot: '154', bleed: '154', frost: '154', sleep: '154', madness: '無効' }
    },
    {
      name: 'グノスター(アニムス)',
      nameEn: 'Gnoster (Animus)',
      physical: { standard: '15', slash: '25', strike: '15', pierce: '25' },
      elemental: { magic: '-50', fire: '40', lightning: '-10', holy: '-10' },
      status: { poison: '542', rot: '154', bleed: '154', frost: '154', sleep: '542', madness: '無効' }
    }
  ],
  '兆し': [
    {
      name: 'マリス',
      nameEn: 'Maris',
      physical: { standard: '0', slash: '15', strike: '-20', pierce: '-10' },
      elemental: { magic: '-20', fire: '-50', lightning: '40', holy: '15' },
      status: { poison: '無効', rot: '252', bleed: '無効', frost: '252', sleep: '無効', madness: '無効' }
    }
  ],
  '調律の魔物': [
    {
      name: 'リブラ',
      nameEn: 'Libra',
      physical: { standard: '0', slash: '10', strike: '0', pierce: '0' },
      elemental: { magic: '-20', fire: '20', lightning: '0', holy: '35' },
      status: { poison: '154', rot: '154', bleed: '252', frost: '252', sleep: '無効', madness: '154' }
    }
  ],
  '闇駆ける狩人': [
    {
      name: 'フルゴール',
      nameEn: 'Fulgur',
      physical: { standard: '0', slash: '0', strike: '0', pierce: '0' },
      elemental: { magic: '0', fire: '0', lightning: '20', holy: '-30' },
      status: { poison: '154', rot: '154', bleed: '154', frost: '154', sleep: '154', madness: '無効' }
    }
  ],
  '霧の裂け目': [
    {
      name: 'カリゴ',
      nameEn: 'Caligo',
      physical: { standard: '-15', slash: '-15', strike: '15', pierce: '-10' },
      elemental: { magic: '-20', fire: '35', lightning: '-20', holy: '-20' },
      status: { poison: '252', rot: '252', bleed: '252', frost: '542', sleep: '542', madness: '無効' }
    }
  ],
  '夜を象る者': [
    {
      name: 'ナメレス(夜の輪郭)',
      nameEn: 'Nameless (Night Silhouette)',
      physical: { standard: '0', slash: '15', strike: '-10', pierce: '10' },
      elemental: { magic: '0', fire: '20', lightning: '0', holy: '35' },
      status: { poison: '無効', rot: '252', bleed: '無効', frost: '無効', sleep: '542', madness: '無効' }
    },
    {
      name: 'ナメレス第二形態',
      nameEn: 'Nameless Second Form',
      physical: { standard: '0', slash: '-10', strike: '10', pierce: '15' },
      elemental: { magic: '0', fire: '0', lightning: '20', holy: '20' },
      status: { poison: '無効', rot: '252', bleed: '無効', frost: '無効', sleep: '542', madness: '無効' }
    }
  ],
  '安寧者達': [
    {
      name: 'ハルモニア',
      nameEn: 'Harmonia',
      physical: { standard: '0', slash: '-8', strike: '10', pierce: '0' },
      elemental: { magic: '0', fire: '-8', lightning: '-10', holy: '-30' },
      status: { poison: '252', rot: '252', bleed: '252', frost: '252', sleep: '84', madness: '無効' }
    }
  ],
  '瓦礫の王': [
    {
      name: '瓦礫の王',
      nameEn: 'Straghess',
      physical: { standard: '0', slash: '10', strike: '0', pierce: '10' },
      elemental: { magic: '0', fire: '20', lightning: '-10', holy: '25' },
      status: { poison: '542', rot: '542', bleed: '252', frost: '252', sleep: '252', madness: '無効' }
    }
  ]
};

const LOCAL_TRANS: Record<string, Record<string, string>> = {
  ja: {
    standard: '標準',
    slash: '斬撃',
    strike: '打撃',
    pierce: '刺突',
    magic: '魔力',
    fire: '炎',
    lightning: '雷',
    holy: '聖',
    poison: '毒',
    rot: '腐敗',
    bleed: '出血',
    frost: '凍傷',
    sleep: '睡眠',
    madness: '発狂',
    title: '3日目のボス 属性耐性表',
    bossName: 'ボス名',
    immune: '無効'
  }
};

interface FilterOption {
  text: string | null;
  type?: string;
  element?: string | null;
}

export default function MapSearch() {
  // 翻訳と言語
  const currentLocale = 'ja';
  const t: Record<string, string> = jaTrans;

  // 1. 基本となる絞り込みステート
  const [currentMap, setCurrentMap] = useState<string | null>(null);
  const [selectedNightLord, setSelectedNightLord] = useState<string | null | undefined>(undefined);
  const [selectedSpawnPoint, setSelectedSpawnPoint] = useState<string | null>(null);
  
  // 各ピンの種類ごとの個別フィルター
  const [filters, setFilters] = useState<{
    majorBases: Record<string, FilterOption>;
    minorBases: Record<string, FilterOption>;
    evergaols: Record<string, FilterOption>;
    fieldBosses: Record<string, FilterOption>;
    castleBoss: string | null;
  }>({
    majorBases: {},
    minorBases: {},
    evergaols: {},
    fieldBosses: {},
    castleBoss: null
  });

  // UI用の状態
  const [activePopup, setActivePopup] = useState<{
    type: 'major' | 'minor' | 'evergaol' | 'fieldBoss' | 'castle' | 'spawn' | 'rot' | 'nightCircle';
    name: string;
    x: number;
    y: number;
  } | null>(null);
  
  const [showInstruction, setShowInstruction] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hide_instruction') !== 'true';
    }
    return true;
  });

  // タイマー用の状態
  const [timerSeconds, setTimerSeconds] = useState<number>(270);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // 45分自動リセット用（リセット予定時刻と現在時刻）の状態
  const [resetAt, setResetAt] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const handleDontShowAgain = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hide_instruction', 'true');
    }
    setShowInstruction(false);
  };

  // 全マップデータ
  const mapPatterns = useMemo(() => {
    const rawPatterns = currentMap ? (MAP_DATA_MAP[currentMap] || defaultMapData) : [];
    // 神鳥の戦士の拠点に聖属性を付与するなどの動的調整、および Castle Roof -> Castle Rooftop の正規化
    return rawPatterns.map(pattern => {
      let modified = false;
      
      let newMajors = pattern.majorBases;
      if (newMajors) {
        Object.entries(newMajors).forEach(([key, val]) => {
          if (val) {
            if (val.text === 'Divine Bird Warrior' && val.element !== 'holy') {
              if (newMajors === pattern.majorBases) {
                newMajors = { ...newMajors };
              }
              newMajors[key] = { ...val, element: 'holy' };
              modified = true;
            } else if ((val.text === 'Spider Scorpions' || val.text === 'Ruin: Curseblade & Spider Scorpions') && val.element !== 'poison') {
              if (newMajors === pattern.majorBases) {
                newMajors = { ...newMajors };
              }
              newMajors[key] = { ...val, element: 'poison' };
              modified = true;
            } else if (val.text === 'Ancient Heroes of Zamor' && val.element !== 'frostbite') {
              if (newMajors === pattern.majorBases) {
                newMajors = { ...newMajors };
              }
              newMajors[key] = { ...val, element: 'frostbite' };
              modified = true;
            }
          }
        });
      }

      let newFieldBosses = pattern.fieldBosses;
      if (newFieldBosses && 'Castle Roof' in newFieldBosses) {
        newFieldBosses = { ...newFieldBosses };
        newFieldBosses['Castle Rooftop'] = newFieldBosses['Castle Roof'];
        delete newFieldBosses['Castle Roof'];
        modified = true;
      }

      if (modified) {
        const result = { ...pattern };
        if (pattern.majorBases) {
          result.majorBases = newMajors;
        }
        if (pattern.fieldBosses) {
          result.fieldBosses = newFieldBosses;
        }
        return result;
      }
      return pattern;
    });
  }, [currentMap]);

  // マップや夜の王などの基本的な切り替えがあった時にフィルターをクリア
  const resetFilters = useCallback(() => {
    setFilters({
      majorBases: {},
      minorBases: {},
      evergaols: {},
      fieldBosses: {},
      castleBoss: null
    });
    setActivePopup(null);
  }, []);

  const handleMapChange = (mapName: string) => {
    setCurrentMap(mapName);
    setSelectedSpawnPoint(null);
    resetFilters();
    if (selectedNightLord !== undefined) {
      setIsMapScreen(true);
      setTimerSeconds(270);
      setTimerRunning(true);
    }
  };

  const handleNightLordChange = (lordName: string | null) => {
    setSelectedNightLord(lordName);
    setSelectedSpawnPoint(null);
    resetFilters();
    if (currentMap !== null) {
      setIsMapScreen(true);
      setTimerSeconds(270);
      setTimerRunning(true);
    }
  };

  // 2. 現在の絞り込み条件に一致するパターンリスト
  const activePatterns = useMemo(() => {
    return mapPatterns
      .filter(p => selectedNightLord === undefined || !selectedNightLord || p.nightLord === selectedNightLord)
      .filter(p => !selectedSpawnPoint || p.spawnPoint === selectedSpawnPoint)
      .filter(p => {
        // 大拠点フィルター
        return Object.entries(filters.majorBases).every(([name, cond]) => {
          const pb = p.majorBases[name];
          return pb && pb.text === cond.text && pb.type === cond.type && pb.element === cond.element;
        });
      })
      .filter(p => {
        // 小拠点フィルター
        return Object.entries(filters.minorBases).every(([name, cond]) => {
          const pb = p.minorBases[name];
          return pb && pb.text === cond.text && pb.type === cond.type;
        });
      })
      .filter(p => {
        // 封牢フィルター
        return Object.entries(filters.evergaols).every(([name, cond]) => {
          const pb = p.evergaols[name];
          return pb && pb.text === cond.text;
        });
      })
      .filter(p => {
        // フィールドボスフィルター
        return Object.entries(filters.fieldBosses).every(([name, cond]) => {
          const pb = p.fieldBosses[name];
          return pb && pb.text === cond.text;
        });
      })
      .filter(p => {
        // 城ボスフィルター
        return !filters.castleBoss || p.castleBoss === filters.castleBoss;
      });
  }, [mapPatterns, selectedNightLord, selectedSpawnPoint, filters]);

  // 3. 現在の候補で出現しうる選択肢のユニークなリストを取得するヘルパー
  const getAvailableOptions = useMemo(() => {
    const opts = {
      majorBases: {} as Record<string, Array<{ type: string, text: string, element: string | null }>>,
      minorBases: {} as Record<string, Array<{ type: string, text: string }>>,
      evergaols: {} as Record<string, Array<{ text: string }>>,
      fieldBosses: {} as Record<string, Array<{ text: string | null }>>,
      castleBoss: [] as string[]
    };

    activePatterns.forEach(p => {
      // 大拠点
      Object.entries(p.majorBases).forEach(([name, data]) => {
        if (!data) return;
        if (!opts.majorBases[name]) opts.majorBases[name] = [];
        const exists = opts.majorBases[name].some(o => o.text === data.text && o.type === data.type && o.element === data.element);
        if (!exists) opts.majorBases[name].push({ type: data.type, text: data.text, element: data.element });
      });

      // 小拠点
      Object.entries(p.minorBases).forEach(([name, data]) => {
        if (!data) return;
        if (!opts.minorBases[name]) opts.minorBases[name] = [];
        const exists = opts.minorBases[name].some(o => o.text === data.text && o.type === data.type);
        if (!exists) opts.minorBases[name].push({ type: data.type, text: data.text });
      });

      // 封牢
      Object.entries(p.evergaols).forEach(([name, data]) => {
        if (!data) return;
        if (!opts.evergaols[name]) opts.evergaols[name] = [];
        const exists = opts.evergaols[name].some(o => o.text === data.text);
        if (!exists) opts.evergaols[name].push({ text: data.text });
      });

      // フィールドボス
      Object.entries(p.fieldBosses).forEach(([name, data]) => {
        if (!data) return;
        if (!opts.fieldBosses[name]) opts.fieldBosses[name] = [];
        const exists = opts.fieldBosses[name].some(o => o.text === data.text);
        if (!exists) opts.fieldBosses[name].push({ text: data.text });
      });

      // 城ボス
      if (p.castleBoss && !opts.castleBoss.includes(p.castleBoss)) {
        opts.castleBoss.push(p.castleBoss);
      }
    });

    return opts;
  }, [activePatterns]);

  // 出現可能な出現地点
  const availableSpawnPoints = useMemo(() => {
    const set = new Set<string>();
    mapPatterns.forEach(p => {
      if (selectedNightLord === undefined || !selectedNightLord || p.nightLord === selectedNightLord) {
        set.add(p.spawnPoint);
      }
    });
    return Array.from(set);
  }, [mapPatterns, selectedNightLord]);

  // 夜の王のリスト
  const availableNightLords = useMemo(() => {
    const set = new Set<string>();
    defaultMapData.forEach(p => {
      if (p.nightLord) set.add(p.nightLord);
    });
    hollowMapData.forEach(p => {
      if (p.nightLord) set.add(p.nightLord);
    });
    return Array.from(set);
  }, []);

  // 翻訳キーの適用関数
  const transText = (key: string | null) => {
    if (!key) return '';
    return t[key] || key;
  };

  // 拠点アイコンの画像パスを取得する関数（湖沼と鍛冶村は追加画像に差し替え）
  const getIconSrc = (type: string | null | undefined, name?: string | null) => {
    if (!type) return '/icon/undefined.png';
    if (name) {
      const lowerName = name.toLowerCase();
      if (
        lowerName.includes('spider scorpion') || 
        lowerName.includes('ancestral follower') || 
        lowerName.includes('nomad') ||
        lowerName.includes('crayfish') ||
        lowerName.includes('sanguine noble') ||
        lowerName.includes('kindred of rot') ||
        lowerName.includes('kindreds of rot') ||
        lowerName.includes('cuckoo knight') ||
        lowerName.includes('cuckoo knights')
      ) {
        return '/icon/lake.png';
      }
      if (
        lowerName.includes('death knight') || 
        lowerName.includes('chief bloodfiend') ||
        lowerName.includes('black flame monk') ||
        lowerName.includes('divine bird warrior') ||
        lowerName.includes('grave warden duelist') ||
        lowerName.includes('grave warden duelists') ||
        lowerName.includes('omenkiller') ||
        lowerName.includes('omenkillers') ||
        lowerName.includes('omen') ||
        lowerName.includes('omens')
      ) {
        return '/icon/kajimura.png';
      }
    }
    if (type === 'Church') {
      const isLake = currentMap === '腐れ森' || (name && (name.toLowerCase().includes('lake') || name.includes('湖')));
      return isLake ? '/icon/lake.png' : '/icon/Church.png';
    }
    if (type === 'Township') return '/icon/Township.png';
    if (type === 'Town') return '/icon/kajimura.png';
    return `/icon/${type}.png`;
  };

  // 拠点の種別テキスト（翻訳含む）を取得する関数
  const getTypeLabel = (type: string | null | undefined, name?: string | null) => {
    if (!type) return '';
    if (type === 'Church') {
      const isLake = currentMap === '腐れ森' || (name && (name.toLowerCase().includes('lake') || name.includes('湖')));
      if (isLake) {
        return currentLocale === 'ja' ? '湖沼' : currentLocale === 'zh' ? '湖沼' : 'Marsh';
      } else {
        return currentLocale === 'ja' ? '教会' : currentLocale === 'zh' ? '教堂' : 'Church';
      }
    }
    if (type === 'Township') {
      return currentLocale === 'ja' ? 'ショップ' : currentLocale === 'zh' ? '商店' : 'Shop';
    }
    if (type === 'Town') {
      return currentLocale === 'ja' ? '鍛冶村' : currentLocale === 'zh' ? '锻冶村' : 'Blacksmith Village';
    }
    return t[type] || type;
  };

  // 拠点の表示名（翻訳含む）を取得する関数
  const getBaseLabel = (type: string | null | undefined, text: string | null) => {
    if (!text) return '';
    if (type === 'Township') {
      return currentLocale === 'ja' ? 'ショップ' : currentLocale === 'zh' ? '商店' : 'Shop';
    }
    return t[text] || text;
  };

  // 属性弱点とアイコン
  const getElementBadge = (element: string | null) => {
    if (!element) return null;
    const trans = transText(element);
    
    return (
      <div className="flex items-center gap-1.5 bg-gray-950/60 border border-gray-800 rounded px-1.5 py-0.5 w-fit">
        <div className="relative w-3.5 h-3.5 shrink-0">
          <Image 
            src={`/icon/element/${element}.png`} 
            alt={element} 
            fill 
            sizes="14px"
            className="object-contain pointer-events-none"
          />
        </div>
        <span className="text-[10px] text-gray-300 font-semibold">{trans}</span>
      </div>
    );
  };

  // ボス耐性表示のテーブル生成
  const renderBossTable = (bossName: string | null) => {
    if (!bossName) return null;
    const bossData = (bosses as Record<string, { weakness: string | null, weaks: Record<string, number[]> }>)[bossName];
    if (!bossData) return null;

    const weakness = bossData.weakness;
    const weaks = bossData.weaks;

    return (
      <div className="mt-3 p-3 bg-gray-900/90 rounded-lg border border-gray-800 text-xs">
        <div className="font-semibold text-gray-300 mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-yellow-400" />
          {transText('specialEvent') /* 耐性・弱点ステータス */}
        </div>
        
        {weakness && (
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-gray-400">弱点属性:</span>
            <span className="px-1.5 py-0.5 bg-green-950 text-green-400 border border-green-800/50 rounded font-semibold text-[10px]">
              {transText(weakness)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-1">
          {Object.entries(weaks).map(([element, values]) => {
            const val = values[0];
            const isWeak = val < 0 || element === weakness;
            const isResist = val > 0;
            return (
              <div key={element} className="flex justify-between items-center py-0.5 border-b border-gray-800">
                <span className="text-gray-400">{transText(element)}:</span>
                <span className={`font-mono font-semibold ${isWeak ? 'text-green-400' : isResist ? 'text-red-400' : 'text-gray-400'}`}>
                  {val > 0 ? `+${val}%` : `${val}%`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 画面遷移ステート
  const [isMapScreen, setIsMapScreen] = useState<boolean>(false);

  // タイマーのカウントダウン処理
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  // 時間のフォーマット関数 (分:秒)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 全状態を初期化する関数
  const performReset = useCallback(() => {
    setCurrentMap(null);
    setSelectedNightLord(undefined);
    setSelectedSpawnPoint(null);
    setIsMapScreen(false);
    resetFilters();
    setTimerRunning(false);
    setResetAt(null);
  }, [resetFilters]);

  // 地図が確定した（パターンが1つに絞られた）時に自動リセット用タイマー（45分）を開始
  useEffect(() => {
    if (activePatterns.length === 1) {
      const timer = setTimeout(() => {
        setResetAt(prev => prev === null ? Date.now() + 45 * 60 * 1000 : prev);
        setCurrentTime(Date.now());
      }, 0);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setResetAt(prev => prev !== null ? null : prev);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activePatterns.length]);

  // 自動リセットまでの残り秒数を算出
  const autoResetSeconds = resetAt !== null ? Math.max(0, Math.ceil((resetAt - currentTime) / 1000)) : null;

  // 自動リセット用のカウントダウン処理
  useEffect(() => {
    if (resetAt === null) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);
      if (now >= resetAt) {
        clearInterval(interval);
        performReset();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [resetAt, performReset]);

  // 決定された夜の王 (選択済み または 絞り込みで確定)
  const determinedNightLord = selectedNightLord || (activePatterns.length === 1 ? activePatterns[0].nightLord : null);

  // 3日目のボス（夜の王）属性耐性表の共通描画関数
  const renderDay3BossStats = (bossName: string | null | undefined) => {
    if (!bossName || !DAY3_BOSS_STATS[bossName]) return null;
    
    const trans = LOCAL_TRANS[currentLocale] || LOCAL_TRANS.ja;
    const rows = DAY3_BOSS_STATS[bossName];
    
    const getColorClass = (val: string) => {
      if (val.startsWith('-')) {
        return 'text-red-400 font-bold text-[11px] md:text-[13.5px]';
      }
      if (val !== '0') {
        return 'text-blue-400 font-bold text-[11px] md:text-[13.5px]';
      }
      return 'text-gray-500 text-[10px] md:text-xs';
    };
    
    const getCellClass = (val: string, isBorderRight = false) => {
      const base = `p-2 text-center ${isBorderRight ? 'border-r border-gray-800' : ''}`;
      return `${base} ${getColorClass(val)}`;
    };

    return (
      <div className="w-full bg-slate-900/60 border border-rose-500/30 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h3 className="text-sm md:text-base font-extrabold text-rose-400 tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          {trans.title} ({transText(bossName)})
        </h3>
        
        {/* PC用表示 (横幅に余裕があるため従来どおりテーブル表示) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/80">
          <table className="w-full border-collapse text-[10px] md:text-xs text-left min-w-[700px]">
            <thead>
              <tr className="bg-gray-900/80 border-b border-gray-800 text-gray-400 font-bold text-[13px] md:text-[15px]">
                <th className="p-3 border-r border-gray-800 font-bold">{trans.bossName}</th>
                <th className="p-2 text-center font-bold">{trans.standard}</th>
                <th className="p-2 text-center font-bold">{trans.slash}</th>
                <th className="p-2 text-center font-bold">{trans.strike}</th>
                <th className="p-2 text-center border-r border-gray-800 font-bold">{trans.pierce}</th>
                <th className="p-2 text-center font-bold">{trans.magic}</th>
                <th className="p-2 text-center font-bold">{trans.fire}</th>
                <th className="p-2 text-center font-bold">{trans.lightning}</th>
                <th className="p-2 text-center border-r border-gray-800 font-bold">{trans.holy}</th>
                <th className="p-2 text-center font-bold">{trans.poison}</th>
                <th className="p-2 text-center font-bold">{trans.rot}</th>
                <th className="p-2 text-center font-bold">{trans.bleed}</th>
                <th className="p-2 text-center font-bold">{trans.frost}</th>
                <th className="p-2 text-center font-bold">{trans.sleep}</th>
                <th className="p-2 text-center font-bold">{trans.madness}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 font-mono text-gray-200">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-900/40 transition-colors">
                  <td className="p-3 font-semibold text-white border-r border-gray-800">
                    {currentLocale === 'ja' ? row.name : row.nameEn}
                  </td>
                  <td className={getCellClass(row.physical.standard)}>{row.physical.standard}%</td>
                  <td className={getCellClass(row.physical.slash)}>{row.physical.slash}%</td>
                  <td className={getCellClass(row.physical.strike)}>{row.physical.strike}%</td>
                  <td className={getCellClass(row.physical.pierce, true)}>{row.physical.pierce}%</td>
                  <td className={getCellClass(row.elemental.magic)}>{row.elemental.magic}%</td>
                  <td className={getCellClass(row.elemental.fire)}>{row.elemental.fire}%</td>
                  <td className={getCellClass(row.elemental.lightning)}>{row.elemental.lightning}%</td>
                  <td className={getCellClass(row.elemental.holy, true)}>{row.elemental.holy}%</td>
                  <td className={`p-2 text-center ${row.status.poison === '無効' ? 'text-gray-500 font-normal' : 'text-gray-300'}`}>{row.status.poison === '無効' ? trans.immune : row.status.poison}</td>
                  <td className={`p-2 text-center ${row.status.rot === '無効' ? 'text-gray-500 font-normal' : 'text-gray-300'}`}>{row.status.rot === '無効' ? trans.immune : row.status.rot}</td>
                  <td className={`p-2 text-center ${row.status.bleed === '無効' ? 'text-gray-500 font-normal' : 'text-gray-300'}`}>{row.status.bleed === '無効' ? trans.immune : row.status.bleed}</td>
                  <td className={`p-2 text-center ${row.status.frost === '無効' ? 'text-gray-500 font-normal' : 'text-gray-300'}`}>{row.status.frost === '無効' ? trans.immune : row.status.frost}</td>
                  <td className={`p-2 text-center ${row.status.sleep === '無効' ? 'text-gray-500 font-normal' : 'text-gray-300'}`}>{row.status.sleep === '無効' ? trans.immune : row.status.sleep}</td>
                  <td className={`p-2 text-center ${row.status.madness === '無効' ? 'text-gray-500 font-normal' : 'text-gray-300'}`}>{row.status.madness === '無効' ? trans.immune : row.status.madness}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SP用表示 (スクロールを排除し、各ボスをカード化して2段構成で綺麗に収める) */}
        <div className="block md:hidden space-y-4">
          {rows.map((row, idx) => (
            <div key={idx} className="bg-gray-950/80 border border-gray-800 rounded-xl p-3 flex flex-col gap-2 shadow-inner">
              <div className="font-bold text-white text-[12px] border-b border-gray-800 pb-1 flex justify-between items-center">
                <span>{currentLocale === 'ja' ? row.name : row.nameEn}</span>
              </div>
              
              {/* 1段目: 物理・属性 (8列の等幅グリッド) */}
              <div className="grid grid-cols-8 gap-0.5 text-center text-[9px]">
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.standard}</span>
                  <span className={getColorClass(row.physical.standard)}>{row.physical.standard}%</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.slash}</span>
                  <span className={getColorClass(row.physical.slash)}>{row.physical.slash}%</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.strike}</span>
                  <span className={getColorClass(row.physical.strike)}>{row.physical.strike}%</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded border-r border-gray-800/60">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.pierce}</span>
                  <span className={getColorClass(row.physical.pierce)}>{row.physical.pierce}%</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.magic}</span>
                  <span className={getColorClass(row.elemental.magic)}>{row.elemental.magic}%</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.fire}</span>
                  <span className={getColorClass(row.elemental.fire)}>{row.elemental.fire}%</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.lightning}</span>
                  <span className={getColorClass(row.elemental.lightning)}>{row.elemental.lightning}%</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.holy}</span>
                  <span className={getColorClass(row.elemental.holy)}>{row.elemental.holy}%</span>
                </div>
              </div>

              {/* 2段目: 状態異常 (6列の等幅グリッド) */}
              <div className="grid grid-cols-6 gap-0.5 text-center text-[9px]">
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.poison}</span>
                  <span className={`font-mono ${row.status.poison === '無効' ? 'text-gray-500' : 'text-gray-300 font-bold'}`}>{row.status.poison === '無効' ? trans.immune : row.status.poison}</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.rot}</span>
                  <span className={`font-mono ${row.status.rot === '無効' ? 'text-gray-500' : 'text-gray-300 font-bold'}`}>{row.status.rot === '無効' ? trans.immune : row.status.rot}</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.bleed}</span>
                  <span className={`font-mono ${row.status.bleed === '無効' ? 'text-gray-500' : 'text-gray-300 font-bold'}`}>{row.status.bleed === '無効' ? trans.immune : row.status.bleed}</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.frost}</span>
                  <span className={`font-mono ${row.status.frost === '無効' ? 'text-gray-500' : 'text-gray-300 font-bold'}`}>{row.status.frost === '無効' ? trans.immune : row.status.frost}</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.sleep}</span>
                  <span className={`font-mono ${row.status.sleep === '無効' ? 'text-gray-500' : 'text-gray-300 font-bold'}`}>{row.status.sleep === '無効' ? trans.immune : row.status.sleep}</span>
                </div>
                <div className="flex flex-col bg-gray-900/40 p-1 rounded">
                  <span className="text-gray-400 font-bold mb-0.5">{trans.madness}</span>
                  <span className={`font-mono ${row.status.madness === '無効' ? 'text-gray-500' : 'text-gray-300 font-bold'}`}>{row.status.madness === '無効' ? trans.immune : row.status.madness}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!isMapScreen) {
    return (
      <div className="flex flex-col items-center justify-start md:justify-center min-h-screen w-full bg-slate-950 text-gray-100 p-3 md:p-8 overflow-y-auto">
        {/* タイトルロゴ画像 */}
        <div className="mb-[21px] md:mb-[29px] flex justify-center w-full shrink-0">
          <Image 
            src="/title.png" 
            alt="Title" 
            width={630} 
            height={180} 
            className="max-w-full h-auto object-contain pointer-events-none" 
            priority
          />
        </div>

        <div className="w-full max-w-[85vh] bg-gray-900/60 border border-gray-800 rounded-2xl p-4 md:p-8 backdrop-blur-md shadow-2xl flex flex-col gap-3 md:gap-6 my-4 md:my-0">
          {/* 夜の王の選択 */}
          <div>
            <h2 className="text-[11px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center md:justify-start">
              <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-500" />
              1. SELECT NIGHT LORD (夜の王の選択)
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
              {availableNightLords.map(lord => {
                const isSelected = selectedNightLord === lord;
                return (
                  <button
                    key={lord}
                    onClick={() => handleNightLordChange(lord)}
                    className={`group rounded-none transition-all flex flex-col w-full select-none ${
                      isSelected
                        ? 'border-4 border-rose-500 ring-2 ring-rose-500/40'
                        : 'border border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="relative w-full aspect-square shrink-0">
                      <Image 
                        src={`/icon/nightLord/${BOSS_IMAGE_MAP[lord] || lord}.jpg`} 
                        alt={lord} 
                        fill 
                        sizes="150px" 
                        className="object-cover pointer-events-none" 
                      />
                    </div>
                    <span className="w-full text-center font-semibold text-[9px] md:text-xs text-white bg-black/80 py-1 border-t border-gray-800/60 truncate px-0.5">
                      {transText(lord)}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => handleNightLordChange(null)}
                className={`group rounded-none transition-all flex flex-col w-full select-none ${
                  selectedNightLord === null
                    ? 'border-4 border-rose-500 ring-2 ring-rose-500/40'
                    : 'border border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="relative w-full aspect-square shrink-0">
                  <Image src="/icon/nightLord/unnamed.jpg" alt="All" fill sizes="200px" className="object-cover pointer-events-none" />
                </div>
                <span className="w-full text-center font-semibold text-[10px] md:text-xs text-white bg-black/80 py-1.5 border-t border-gray-800/60 truncate px-1">
                  不明
                </span>
              </button>
            </div>
          </div>

          {/* マップ選択 */}
          <div>
            <h2 className="text-[11px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-center md:justify-start">
              <Compass className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
              2. MAP SELECT (マップ選択)
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
              {Object.keys(MAP_DATA_MAP).map(mapName => {
                const isDisabled = false;
                return (
                  <button
                    key={mapName}
                    onClick={() => handleMapChange(mapName)}
                    disabled={isDisabled}
                    className={`group rounded-none border text-center transition-all relative overflow-hidden select-none w-full aspect-square ${
                      currentMap === mapName 
                        ? 'border-blue-500 ring-2 ring-blue-500/40' 
                        : 'border-gray-800 hover:border-gray-700'
                    } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className="absolute inset-0 z-0">
                      <Image 
                        src={`/map/${MAP_IMAGE_MAP[mapName] || mapName}.webp`}
                        alt={mapName}
                        fill
                        sizes="150px"
                        className={`object-cover pointer-events-none transition-transform duration-300 ${MAP_ZOOM_CLASSES[mapName] || 'scale-100'}`}
                      />
                    </div>
                    {isDisabled && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                        <span className="text-[10px] md:text-xs font-bold text-yellow-500 bg-black/80 px-1.5 py-0.5 rounded border border-yellow-600/50 shadow-md">
                          {transText('Under Construction')}
                        </span>
                      </div>
                    )}
                    <span className="absolute bottom-0 left-0 right-0 w-full text-center font-semibold text-[10px] md:text-sm text-white z-10 bg-black/80 py-0.5 md:py-1 border-t border-gray-800/60 backdrop-blur-[2px] truncate px-0.5">
                      {mapName === 'Default' ? (currentLocale === 'ja' ? 'ノーマル' : 'Default') : mapName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ボスを選んだ時点(不明時以外)でボスの属性情報を表示 */}
        {selectedNightLord && DAY3_BOSS_STATS[selectedNightLord] && (
          <div className="w-full max-w-[85vh] mt-4 md:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {renderDay3BossStats(selectedNightLord)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 p-4 md:p-8 overflow-auto select-none">
      
      <div className="relative w-full max-w-[85vh] flex flex-col items-center gap-6">
        
        {/* Instruction パネルの表示（オーバーレイ） */}
        {showInstruction && (
          <div className="absolute top-4 left-4 right-4 md:right-auto md:w-96 bg-gray-900/90 border border-gray-800 rounded-xl p-4 backdrop-blur-md shadow-2xl z-30 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-400" />
                {t.instructionTitle}
              </h3>
              <button 
                onClick={() => setShowInstruction(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="text-xs text-gray-300 space-y-2 list-decimal list-inside">
              <li>{t.instructionStep1}</li>
              <li>{t.instructionStep2}</li>
              <li>{t.instructionStep3}</li>
            </ul>
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleDontShowAgain}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-lg text-[10px] font-semibold transition-colors"
              >
                {t.instructionDontShowAgain}
              </button>
            </div>
          </div>
        )}

        {/* 特殊イベント表示 */}
        {activePatterns.length === 1 && activePatterns[0].specialEvent && (
          <div className="w-full text-center py-2.5 px-4 bg-yellow-950/40 border border-yellow-800/50 rounded-xl backdrop-blur-sm animate-pulse shrink-0">
            <span className="text-xs text-yellow-500 uppercase tracking-widest block font-semibold">
              {transText('specialEvent')}
            </span>
            <h2 className="text-xl md:text-2xl font-black text-yellow-400 tracking-wide mt-0.5">
              {transText(activePatterns[0].specialEvent)}
            </h2>
          </div>
        )}

        {/* マップコンテナ */}
        <div className="relative aspect-square w-full max-w-[85vh] bg-gray-900 border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl shrink-0 text-gray-100">
          
          {/* マップ背景画像 */}
          <div className="absolute inset-0 pointer-events-none">
            <Image 
              src={`/map/${MAP_IMAGE_MAP[currentMap || 'Default'] || 'Default'}.webp`} 
              alt={currentMap || 'map'} 
              fill 
              sizes="100vw"
              priority
              className="object-cover opacity-90 transition-opacity duration-300"
            />
            {/* ダークオーバーレイ */}
            <div className="absolute inset-0 bg-blue-950/10 mix-blend-overlay"></div>
          </div>

          {/* === マップピン・マーカーの描画 === */}
          
          {/* 出現地点 (spawnPoints) の描画 */}
          {!selectedSpawnPoint && Object.entries(coordinates.spawnPoints).map(([name, pos]) => {
            const isAvailable = availableSpawnPoints.includes(name);
            if (!isAvailable) return null;
            return (
              <button
                key={`spawn-${name}`}
                onClick={() => handleSpawnPointClick(name, pos)}
                style={{ 
                  left: `${(pos.x / 1000) * 100}%`, 
                  top: `${(pos.y / 1000) * 100}%`,
                  width: 'var(--spawn-size)',
                  height: 'var(--spawn-size)',
                  border: 'var(--spawn-border) solid #10b981'
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all z-20 cursor-pointer drop-shadow-md hover:scale-110 rounded-full bg-slate-950/20"
                title={transText(name)}
              >
                <Image 
                  src="/icon/spawn.png" 
                  alt="spawn" 
                  fill 
                  sizes="64px"
                  className="object-contain pointer-events-none"
                />
              </button>
            );
          })}

          {/* 大拠点 (majorBases) の描画 */}
          {selectedSpawnPoint && Object.entries(coordinates.majorBases).map(([name, pos]) => {
            const isGreatChurch = name.includes('Great Church');
            const isSoutheastRuin = name === 'Southeast Ruin';
            const isTempleFloor = name.includes('Temple Floor');
            const isCastle = name.includes('Castle');
            const shouldHide = currentMap === '大空洞' && (isGreatChurch || isSoutheastRuin || isTempleFloor || isCastle);

            const uniqueOptions = activePatterns
              .map(p => p.majorBases[name])
              .filter((item, idx, self) => 
                item && idx === self.findIndex(t => t?.type === item.type && t?.element === item.element)
              );

            if (uniqueOptions.length === 0) return null;

            const filterActive = filters.majorBases[name];
            const isPatternDetermined = activePatterns.length === 1;

            // 魔法塔や聖杯瓶の教会の判定 (1.5倍)
            let isRiseOrChurch = false;
            if (uniqueOptions.length === 1) {
              const type = uniqueOptions[0].type;
              isRiseOrChurch = type === 'Church' || type.includes('Rise');
            } else {
              const currentFilter = filters.majorBases[name];
              if (currentFilter && currentFilter.type) {
                const type = currentFilter.type;
                isRiseOrChurch = type === 'Church' || type.includes('Rise');
              }
            }

            // 表示するボス名の判定
            let bossNameToShow = '';
            let isCampType = false;
            if (uniqueOptions.length === 1) {
              const isChurch = uniqueOptions[0].type === 'Church';
              if (!isChurch) {
                bossNameToShow = uniqueOptions[0].text;
              }
              isCampType = uniqueOptions[0].type === 'Camp';
            } else {
              const currentFilter = filters.majorBases[name];
              if (currentFilter && currentFilter.text) {
                const isChurch = currentFilter.type === 'Church';
                if (!isChurch) {
                  bossNameToShow = currentFilter.text;
                }
                isCampType = currentFilter.type === 'Camp';
              }
            }

            return (
              <React.Fragment key={`major-frag-${name}`}>
                <button
                  key={`major-${name}`}
                  onClick={() => handleBaseClick('major', name, pos)}
                  disabled={false}
                  style={{ 
                    left: `${(pos.x / 1000) * 100}%`, 
                    top: `${(pos.y / 1000) * 100}%`,
                    width: isRiseOrChurch ? 'calc(var(--major-base-size) * 1.5)' : 'var(--major-base-size)',
                    height: isRiseOrChurch ? 'calc(var(--major-base-size) * 1.5)' : 'var(--major-base-size)',
                    filter: 'drop-shadow(0 0 8px #000000)'
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all z-10 cursor-pointer hover:scale-110 ${
                    !isPatternDetermined && !shouldHide ? 'ring-2 ring-yellow-50/50 rounded-full' : ''
                  } ${filterActive && !shouldHide ? 'ring-2 ring-yellow-300 rounded-full' : ''}`}
                  title={transText(name)}
                >
                  {uniqueOptions.length > 1 ? (
                    <Image 
                      src="/icon/undefined.png" 
                      alt="undefined" 
                      fill 
                      sizes="96px"
                      className="object-contain pointer-events-none"
                      style={{ opacity: shouldHide ? 0 : 1 }}
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <Image 
                        src={getIconSrc(uniqueOptions[0].type, uniqueOptions[0].text)} 
                        alt={uniqueOptions[0].type} 
                        fill 
                        sizes="96px"
                        className="object-contain pointer-events-none"
                        style={{ opacity: shouldHide ? 0 : 1 }}
                      />
                      {uniqueOptions[0].element && (
                        <div 
                          className="absolute z-20"
                          style={{
                            width: isRiseOrChurch ? 'calc(var(--element-icon-size) * 1.5)' : 'var(--element-icon-size)',
                            height: isRiseOrChurch ? 'calc(var(--element-icon-size) * 1.5)' : 'var(--element-icon-size)',
                            bottom: isRiseOrChurch ? 'calc(var(--element-icon-bottom) * 1.5)' : 'var(--element-icon-bottom)',
                            right: isRiseOrChurch ? 'calc(var(--element-icon-right) * 1.5)' : 'var(--element-icon-right)'
                          }}
                        >
                          <Image 
                            src={`/icon/element/${uniqueOptions[0].element}.png`} 
                            alt={uniqueOptions[0].element} 
                            fill 
                            sizes="28px"
                            className="object-contain pointer-events-none"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </button>
                {bossNameToShow && (
                  <div 
                    className="absolute text-white font-normal tracking-wider whitespace-nowrap bg-black/80 border border-gray-800/80 px-1.5 py-0.5 rounded shadow pointer-events-none z-20"
                    style={{ 
                      left: `${(pos.x / 1000) * 100}%`, 
                      top: `${(pos.y / 1000) * 100}%`, 
                      transform: isCampType 
                        ? 'translate(-50%, var(--label-offset-camp))' 
                        : (isRiseOrChurch 
                          ? 'translate(-50%, var(--label-offset-rise-church))' 
                          : 'translate(-50%, var(--label-offset-other))'),
                      fontSize: 'var(--font-size-base)'
                    }}
                  >
                    {transText(bossNameToShow)}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* 小拠点 (minorBases) の描画（パターン確定時のみ） */}
          {activePatterns.length === 1 && Object.entries(coordinates.minorBases).map(([name, pos]) => {
            const baseInfo = activePatterns[0].minorBases[name];
            if (!baseInfo || baseInfo.type === 'Small Camp') return null;
            if (baseInfo.text && baseInfo.text.toLowerCase().includes('caravan')) return null;

            const filterActive = filters.minorBases[name];
            const isChurch = baseInfo.type === 'Church';
            const isRiseOrChurch = baseInfo.type === 'Church' || baseInfo.type.includes('Rise');

            return (
              <React.Fragment key={`minor-frag-${name}`}>
                <button
                  key={`minor-${name}`}
                  onClick={() => handleBaseClick('minor', name, pos)}
                  disabled={false}
                  style={{ 
                    left: `${(pos.x / 1000) * 100}%`, 
                    top: `${(pos.y / 1000) * 100}%`,
                    width: isRiseOrChurch ? 'calc(var(--evergaol-size) * 1.5)' : 'var(--evergaol-size)',
                    height: isRiseOrChurch ? 'calc(var(--evergaol-size) * 1.5)' : 'var(--evergaol-size)',
                    filter: 'drop-shadow(0 0 8px #000000)'
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all z-10 cursor-pointer hover:scale-110 ${
                    filterActive ? 'ring-2 ring-yellow-300 rounded-full' : ''
                  }`}
                  title={transText(name)}
                >
                  <Image 
                    src={getIconSrc(baseInfo.type, baseInfo.text)} 
                    alt={baseInfo.type} 
                    fill 
                    sizes="96px"
                    className="object-contain pointer-events-none"
                  />
                </button>
                {!isChurch && (
                  <div 
                    className="absolute text-white font-normal tracking-wider whitespace-nowrap bg-black/80 border border-gray-800/80 px-1.5 py-0.5 rounded shadow pointer-events-none z-20"
                    style={{ 
                      left: `${(pos.x / 1000) * 100}%`, 
                      top: `${(pos.y / 1000) * 100}%`, 
                      transform: baseInfo.type === 'Camp'
                        ? 'translate(-50%, var(--label-offset-camp))'
                        : (isRiseOrChurch 
                          ? 'translate(-50%, var(--label-offset-rise-church))' 
                          : 'translate(-50%, var(--label-offset-other))'),
                      fontSize: 'var(--font-size-base)'
                    }}
                  >
                    {getBaseLabel(baseInfo.type, baseInfo.text)}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* 封牢 (evergaols) の描画（パターン確定時のみ） */}
          {activePatterns.length === 1 && Object.entries(coordinates.evergaols).map(([name, pos]) => {
            const evergaolInfo = activePatterns[0].evergaols[name];
            if (!evergaolInfo) return null;

            const filterActive = filters.evergaols[name];

            return (
              <button
                key={`evergaol-${name}`}
                onClick={() => handleBaseClick('evergaol', name, pos)}
                disabled={false}
                style={{ 
                  left: `${(pos.x / 1000) * 100}%`, 
                  top: `${(pos.y / 1000) * 100}%`,
                  width: 'var(--evergaol-size)',
                  height: 'var(--evergaol-size)'
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all z-10 cursor-pointer hover:scale-110 ${
                  filterActive ? 'ring-2 ring-purple-500 rounded-full' : ''
                }`}
                title={transText(name)}
              >
                <Image 
                  src="/icon/evergaol.png" 
                  alt="evergaol" 
                  fill 
                  sizes="48px"
                  className="object-contain pointer-events-none"
                />
              </button>
            );
          })}

          {/* フィールドボス (fieldBosses) の描画（パターン確定時のみ） */}
          {activePatterns.length === 1 && Object.entries(coordinates.fieldBosses).map(([name, pos]) => {
            const bossInfo = activePatterns[0].fieldBosses[name];
            if (!bossInfo || !bossInfo.text) return null;

            // 中央砦がある場合のみ、屋上ボスを表示する
            if (name === 'Castle Rooftop') {
              const hasCastle = activePatterns[0].castleBoss && activePatterns[0].castleBoss !== '';
              if (!hasCastle) return null;
            }

            const filterActive = filters.fieldBosses[name];
            const tvInfo = tv[bossInfo.text];
            const isDanger = tvInfo ? tvInfo.isDanger : false;
            const iconSrc = isDanger ? '/icon/redBoss.png' : '/icon/field-boss.png';

            // 地下ボスの場合は位置を右下に15pxシフトする
            const isCastleBasement = name === 'Castle Basement';
            const leftStyle = isCastleBasement 
              ? `calc(${(pos.x / 1000) * 100}% + 15px)` 
              : `${(pos.x / 1000) * 100}%`;
            const topStyle = isCastleBasement 
              ? `calc(${(pos.y / 1000) * 100}% + 15px)` 
              : `${(pos.y / 1000) * 100}%`;

            return (
              <React.Fragment key={`fieldBoss-frag-${name}`}>
                <button
                  key={`fieldBoss-${name}`}
                  onClick={() => handleBaseClick('fieldBoss', name, pos)}
                  disabled={false}
                  style={{ 
                    left: leftStyle, 
                    top: topStyle,
                    width: 'var(--field-boss-size)',
                    height: 'var(--field-boss-size)',
                    filter: 'drop-shadow(0 0 6px #000000) drop-shadow(0 0 2px #000000)'
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all z-10 cursor-pointer hover:scale-110 ${
                    filterActive ? 'ring-2 ring-rose-500 rounded-full' : ''
                  }`}
                  title={transText(name)}
                >
                  <Image 
                    src={iconSrc} 
                    alt="fieldBoss" 
                    fill 
                    sizes="48px"
                    className="object-contain pointer-events-none"
                  />
                </button>
                <div 
                  className="absolute text-white font-normal tracking-wider whitespace-nowrap bg-black/80 border border-gray-800/80 px-1.5 py-0.5 rounded shadow pointer-events-none z-20"
                  style={{ 
                    left: leftStyle, 
                    top: topStyle, 
                    transform: 'translate(-50%, calc(var(--field-boss-size) / 2 + var(--label-offset-field-boss-gap)))',
                    fontSize: 'var(--font-size-base)'
                  }}
                >
                  {transText(bossInfo.text)}
                </div>
              </React.Fragment>
            );
          })}

          {/* 中央砦 (Castle Boss) の敵名称表示とボスピン */}
          {activePatterns.length === 1 && activePatterns[0].castleBoss && (() => {
            const castleBoss = activePatterns[0].castleBoss;
            let centerImgSrc = '';
            const lowerBoss = castleBoss.toLowerCase();
            if (lowerBoss.includes('troll') || lowerBoss.includes('トロール')) {
              centerImgSrc = '/icon/center_trol.jpg';
            } else if (lowerBoss.includes('banished') || lowerBoss.includes('失地')) {
              centerImgSrc = '/icon/center_sitti.jpg';
            } else if (lowerBoss.includes('crucible') || lowerBoss.includes('坩堝')) {
              centerImgSrc = '/icon/center_rutubo.jpg';
            }

            return (
              <React.Fragment key="center-fort-boss">
                {centerImgSrc && (
                  <div 
                    style={{ 
                      left: '45.5%', 
                      top: '43.5%',
                      width: 'var(--major-base-size)',
                      height: 'var(--major-base-size)',
                      transform: 'translate(calc(-50% + 8px), -50%)',
                      filter: 'drop-shadow(0 0 8px #000000)'
                    }}
                    className="absolute z-10 rounded-full border border-gray-800/80 overflow-hidden shadow-lg bg-gray-900"
                  >
                    <Image 
                      src={centerImgSrc} 
                      alt={castleBoss} 
                      fill 
                      sizes="96px"
                      className="object-cover pointer-events-none"
                    />
                  </div>
                )}
                <div 
                  className="absolute text-white font-normal tracking-wider text-center whitespace-nowrap bg-black/80 border border-gray-800/80 px-1.5 py-0.5 rounded shadow pointer-events-none z-20"
                  style={{ 
                    left: '45.5%', 
                    top: '48.5%', 
                    transform: 'translate(calc(-50% + 8px), -50%)',
                    fontSize: 'var(--font-size-castle-boss)'
                  }}
                >
                  {transText('Center Fort')}: {transText(castleBoss)}
                </div>
              </React.Fragment>
            );
          })()}

          {/* 祝福 (rotBlessings) の描画（腐れ森マップ限定、かつ確定パターンに存在する場合） */}
          {activePatterns.length === 1 && currentMap === '腐れ森' && (() => {
            const blessingName = activePatterns[0].rotBlessing as string | null;
            if (!blessingName) return null;
            const pos = (coordinates.rotBlessings as Record<string, { x: number, y: number }>)[blessingName];
            if (!pos) return null;
            return (
              <button
                key={`rot-${blessingName}`}
                onClick={() => setActivePopup({ type: 'rot', name: blessingName, x: pos.x, y: pos.y })}
                style={{ 
                  left: `${(pos.x / 1000) * 100}%`, 
                  top: `${(pos.y / 1000) * 100}%`,
                  width: 'var(--blessing-size)',
                  height: 'var(--blessing-size)'
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 transition-all z-10 cursor-pointer drop-shadow-md hover:scale-110"
                title={`祝福: ${blessingName}`}
              >
                <Image 
                  src="/icon/RotBlessing.png" 
                  alt="rotBlessing" 
                  fill 
                  sizes="32px"
                  className="object-contain pointer-events-none"
                />
              </button>
            );
          })()}

          {/* 夜の追加イベント円 (nightCircle1, nightCircle2) の描画（確定時） */}
          {activePatterns.length === 1 && (
            <>
              {/* nightCircle1 */}
              {(() => {
                const item = activePatterns[0].nightCircle1;
                if (!item) return null;
                const pos = (coordinates.nightCircle1 as Record<string, { x: number, y: number }>)[item.place];
                if (!pos) return null;
                return (
                  <button
                    key="nc1"
                    onClick={() => setActivePopup({ type: 'nightCircle', name: `Night Event 1: ${item.text}`, x: pos.x, y: pos.y })}
                    style={{ 
                      left: `${(pos.x / 1000) * 100}%`, 
                      top: `${(pos.y / 1000) * 100}%`,
                      width: 'var(--night-circle-size)',
                      height: 'var(--night-circle-size)'
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer z-15 drop-shadow-md ring-4 ring-orange-700 bg-orange-700 transition-all hover:scale-110 flex items-center justify-center animate-pulse"
                    title={`夜イベント: ${transText(item.text)}`}
                  >
                    <div 
                      className="absolute text-white font-bold whitespace-nowrap bg-orange-950/90 border border-orange-700/50 px-2 py-0.5 rounded shadow-lg pointer-events-none"
                      style={{ 
                        bottom: 'var(--night-circle-label-offset)', 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        fontSize: 'var(--font-size-night-circle-text)'
                      }}
                    >
                      <div className="text-center text-orange-300 leading-none mb-0.5" style={{ fontSize: 'var(--font-size-night-circle-badge)' }}>DAY 1</div>
                      {transText(item.text)}
                    </div>
                  </button>
                );
              })()}

              {/* nightCircle2 */}
              {(() => {
                const item = activePatterns[0].nightCircle2;
                if (!item) return null;
                const pos = (coordinates.nightCircle2 as Record<string, { x: number, y: number }>)[item.place];
                if (!pos) return null;
                return (
                  <button
                    key="nc2"
                    onClick={() => setActivePopup({ type: 'nightCircle', name: `Night Event 2: ${item.text}`, x: pos.x, y: pos.y })}
                    style={{ 
                      left: `${(pos.x / 1000) * 100}%`, 
                      top: `${(pos.y / 1000) * 100}%`,
                      width: 'var(--night-circle-size)',
                      height: 'var(--night-circle-size)'
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer z-15 drop-shadow-md ring-4 ring-violet-800 bg-violet-800 transition-all hover:scale-110 flex items-center justify-center animate-pulse"
                    title={`夜イベント: ${transText(item.text)}`}
                  >
                    <div 
                      className="absolute text-white font-bold whitespace-nowrap bg-violet-950/90 border border-violet-800/50 px-2 py-0.5 rounded shadow-lg pointer-events-none"
                      style={{ 
                        bottom: 'var(--night-circle-label-offset)', 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        fontSize: 'var(--font-size-night-circle-text)'
                      }}
                    >
                      <div className="text-center text-violet-300 leading-none mb-0.5" style={{ fontSize: 'var(--font-size-night-circle-badge)' }}>DAY 2</div>
                      {transText(item.text)}
                    </div>
                  </button>
                );
              })()}
              {/* 3日目のボス (Night Lord) アイコン表示 */}
              {activePatterns[0].nightLord && (
                <div 
                  className="absolute z-20 bg-slate-950/90 border border-rose-500/50 rounded-2xl backdrop-blur-md shadow-2xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-300"
                  style={{
                    bottom: 'var(--day3-boss-card-bottom)',
                    right: 'var(--day3-boss-card-right)',
                    padding: 'var(--day3-boss-card-padding)',
                    gap: 'var(--day3-boss-card-gap)'
                  }}
                >
                  <span 
                    className="text-rose-400 font-bold uppercase tracking-wider leading-none"
                    style={{ fontSize: 'var(--day3-boss-font-title)' }}
                  >
                    {currentLocale === 'ja' ? '3日目のボス' : currentLocale === 'zh' ? '第三日夜王' : 'Day 3 Boss'}
                  </span>
                  <div 
                    className="relative rounded-xl overflow-hidden border border-gray-800 shadow-inner"
                    style={{
                      width: 'var(--day3-boss-icon-size)',
                      height: 'var(--day3-boss-icon-size)'
                    }}
                  >
                    <Image 
                      src={`/icon/nightLord/${BOSS_IMAGE_MAP[activePatterns[0].nightLord] || activePatterns[0].nightLord}.jpg`} 
                      alt={activePatterns[0].nightLord} 
                      fill 
                      sizes="168px" 
                      className="object-cover pointer-events-none" 
                    />
                  </div>
                  <span 
                    className="text-white font-bold truncate text-center leading-none mt-0.5"
                    style={{ 
                      fontSize: 'var(--day3-boss-font-text)',
                      maxWidth: 'var(--day3-boss-icon-size)'
                    }}
                  >
                    {transText(activePatterns[0].nightLord)}
                  </span>
                </div>
              )}
            </>
          )}

          {/* === 詳細ポップアップダイアログ === */}
          {activePopup && (() => {
            const popup = activePopup;
            const isMajorUnfiltered = popup.type === 'major' && !filters.majorBases[popup.name];
            const opts = isMajorUnfiltered ? (getAvailableOptions.majorBases[popup.name] || []) : [];
            const isMultiLine = opts.length >= 5;

            return (
              <div 
                style={{
                  // 地下ボスの場合はポップアップ表示位置も右下にシフトする
                  left: popup.name === 'Castle Basement'
                    ? `calc(${(popup.x / 1000) * 100}% + var(--castle-basement-offset))`
                    : `${(popup.x / 1000) * 100}%`,
                  top: popup.name === 'Castle Basement'
                    ? `calc(${(popup.y / 1000) * 100}% + var(--castle-basement-offset))`
                    : `${(popup.y / 1000) * 100}%`,
                  transform: `translate(-50%, ${popup.y > 600 ? '-105%' : '15%'})`,
                  width: isMajorUnfiltered ? (isMultiLine ? 'var(--popup-width-large)' : 'fit-content') : 'var(--popup-width)',
                  maxHeight: isMajorUnfiltered ? 'none' : 'var(--popup-max-height)',
                  padding: isMajorUnfiltered ? 'var(--popup-padding-large)' : 'var(--popup-padding)',
                }}
                className="absolute bg-gray-950/95 border border-gray-800 rounded-xl backdrop-blur-md shadow-2xl z-30 select-text pointer-events-auto text-gray-100 overflow-y-auto"
              >
                {/* 大拠点未選択時の絶対配置バツボタン */}
                {isMajorUnfiltered && (
                  <button 
                    onClick={() => setActivePopup(null)}
                    className="absolute -top-2 -right-2 p-1.5 bg-gray-900 border border-gray-800 rounded-full text-gray-500 hover:text-white transition-colors z-40 shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* 通常のヘッダー */}
                {!isMajorUnfiltered && (
                  <div className="flex justify-between items-start mb-2 border-b border-gray-800 pb-1.5" style={{ gap: 'var(--popup-gap)' }}>
                    <div>
                      <h4 className="font-bold text-blue-400" style={{ fontSize: 'var(--popup-font-badge)' }}>
                        {transText(popup.type.toUpperCase())}
                      </h4>
                      <h3 className="font-bold text-white" style={{ fontSize: 'var(--popup-font-title)' }}>
                        {transText(popup.name)}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActivePopup(null)}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* 選択肢/状態の描画 */}
                <div className="space-y-1" style={{ fontSize: 'var(--popup-font-text)' }}>
                  {/* 1. 出現地点のポップアップ */}
                  {popup.type === 'spawn' && (
                    <p className="text-gray-300">
                      出現地点に選択されています。マップ左側のパネルまたは鷹アイコンから選択解除できます。
                    </p>
                  )}

                  {/* 2. 祝福 (腐れ森限定) */}
                  {popup.type === 'rot' && (
                    <p className="text-gray-300">
                      腐れ森の祝福ポイントです。
                    </p>
                  )}

                  {/* 3. 夜のイベント円 */}
                  {popup.type === 'nightCircle' && (
                    <div>
                      <p className="text-gray-300">
                        夜間に出現するボスまたはイベントポイントです。
                      </p>
                      <div className="mt-2 px-2 py-1 bg-indigo-950/30 border border-indigo-800/30 text-indigo-400 rounded font-semibold text-center text-[10px]">
                        {popup.name.split(': ')[1]}
                      </div>
                    </div>
                  )}

                  {/* 4. 各種拠点（大拠点など）で、絞り込みのための選択肢を表示 */}
                  {popup.type === 'major' && (() => {
                    const currentFilter = filters.majorBases[popup.name];
                    
                    if (currentFilter) {
                      return (
                        <div className="space-y-2">
                          <div className="p-2 bg-blue-950/40 border border-blue-800/40 rounded flex items-center gap-3">
                            <div 
                              className="relative shrink-0 bg-blue-950/60 rounded border border-blue-800 p-1 flex items-center justify-center"
                              style={{
                                width: 'var(--evergaol-size)',
                                height: 'var(--evergaol-size)'
                              }}
                            >
                              <Image 
                                src={getIconSrc(currentFilter.type, currentFilter.text)} 
                                alt={currentFilter.type ?? 'base'} 
                                fill 
                                sizes="40px"
                                className="object-contain pointer-events-none p-0.5"
                              />
                            </div>
                            <div className="flex-grow min-w-0">
                              <span className="text-blue-400 uppercase tracking-wider block" style={{ fontSize: 'var(--popup-font-badge)' }}>{getTypeLabel(currentFilter.type, currentFilter.text)}</span>
                              <span className="font-semibold text-blue-100 block truncate" style={{ fontSize: 'var(--popup-font-title)' }}>{getBaseLabel(currentFilter.type, currentFilter.text)}</span>
                              {currentFilter.element && <div className="mt-1">{getElementBadge(currentFilter.element)}</div>}
                            </div>
                            <button
                              onClick={() => handleFilterRemove('major', popup.name)}
                              className="p-1.5 hover:bg-blue-900/60 rounded text-red-400 hover:text-red-300 transition-colors shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {renderBossTable(currentFilter.text)}
                        </div>
                      );
                    }

                    if (opts.length === 1) {
                      const opt = opts[0];
                      return (
                        <div>
                          <div className="p-2.5 bg-gray-900/60 rounded border border-gray-800 flex items-center gap-3 mb-2">
                            <div 
                              className="relative shrink-0 bg-gray-950/40 rounded border border-gray-800 p-1 flex items-center justify-center"
                              style={{
                                width: 'var(--evergaol-size)',
                                height: 'var(--evergaol-size)'
                              }}
                            >
                              <Image 
                                src={getIconSrc(opt.type, opt.text)} 
                                alt={opt.type} 
                                fill 
                                sizes="40px"
                                className="object-contain pointer-events-none p-0.5"
                              />
                            </div>
                            <div className="flex-grow min-w-0">
                              <span className="text-gray-500 uppercase tracking-wider block" style={{ fontSize: 'var(--popup-font-badge)' }}>{getTypeLabel(opt.type, opt.text)}</span>
                              <span className="font-semibold text-gray-200 block truncate" style={{ fontSize: 'var(--popup-font-title)' }}>{getBaseLabel(opt.type, opt.text)}</span>
                              {opt.element && <div className="mt-1">{getElementBadge(opt.element)}</div>}
                            </div>
                          </div>
                          {renderBossTable(opt.text)}
                        </div>
                      );
                    }

                    return (
                      <div className={isMultiLine ? "grid grid-cols-5 gap-3 md:gap-3.5 justify-items-center p-1" : "flex gap-3.5 items-center justify-center p-1"}>
                        {opts.map((opt, i) => {
                          const displayName = getBaseLabel(opt.type, opt.text);
                          const showText = 
                            ['老獅子', '獅子の混種', '失地騎士'].includes(displayName) ||
                            opts.filter(o => o.type === opt.type).length > 1;
                          return (
                            <button
                              key={i}
                              onClick={() => handleFilterSelect('major', popup.name, opt)}
                              className="relative bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-1.5 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group shadow-sm shrink-0 overflow-hidden"
                              style={{
                                width: 'var(--element-badge-size)',
                                height: 'var(--element-badge-size)'
                              }}
                              title={displayName}
                            >
                              <div className="relative w-full h-full">
                                <Image 
                                  src={getIconSrc(opt.type, opt.text)} 
                                  alt={opt.type} 
                                  fill 
                                  sizes="64px"
                                  className="object-contain pointer-events-none p-0.5"
                                />
                              </div>
                              {opt.element && (
                                <div 
                                  className="absolute bottom-1 left-1.5 z-20 drop-shadow-md"
                                  style={{
                                    width: 'var(--element-icon-size)',
                                    height: 'var(--element-icon-size)'
                                  }}
                                >
                                  <Image 
                                    src={`/icon/element/${opt.element}.png`} 
                                    alt={opt.element} 
                                    fill 
                                    sizes="28px"
                                    className="object-contain pointer-events-none"
                                  />
                                </div>
                              )}
                              {showText && (
                                <span 
                                  className="absolute bottom-0 left-0 right-0 text-white font-bold tracking-tight text-center py-0.5 bg-black/60 z-30 leading-none truncate px-0.5 border-t border-gray-800/40"
                                  style={{ fontSize: 'var(--popup-font-badge)' }}
                                >
                                  {displayName}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* 5. 小拠点のポップアップ */}
                  {popup.type === 'minor' && (() => {
                    const opts = getAvailableOptions.minorBases[popup.name] || [];
                    const currentFilter = filters.minorBases[popup.name];
                    
                    if (currentFilter) {
                      return (
                        <div className="p-2 bg-amber-950/40 border border-amber-800/40 rounded flex items-center gap-3">
                          <div 
                            className="relative shrink-0 bg-amber-950/60 rounded border border-amber-800 p-1 flex items-center justify-center"
                            style={{
                              width: 'var(--evergaol-size)',
                              height: 'var(--evergaol-size)'
                            }}
                          >
                            <Image 
                              src={getIconSrc(currentFilter.type, currentFilter.text)} 
                              alt={currentFilter.type ?? 'base'} 
                              fill 
                              sizes="40px"
                              className="object-contain pointer-events-none p-0.5"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <span className="text-amber-400 uppercase tracking-wider block" style={{ fontSize: 'var(--popup-font-badge)' }}>{getTypeLabel(currentFilter.type, currentFilter.text)}</span>
                            <span className="font-semibold text-amber-100 block truncate" style={{ fontSize: 'var(--popup-font-title)' }}>{getBaseLabel(currentFilter.type, currentFilter.text)}</span>
                          </div>
                          <button
                            onClick={() => handleFilterRemove('minor', popup.name)}
                            className="p-1.5 hover:bg-amber-900/60 rounded text-red-400 hover:text-red-300 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    }

                    if (opts.length === 1) {
                      const opt = opts[0];
                      return (
                        <div className="p-2.5 bg-gray-900/60 rounded border border-gray-800 flex items-center gap-3">
                          <div 
                            className="relative shrink-0 bg-gray-950/40 rounded border border-gray-800 p-1 flex items-center justify-center"
                            style={{
                              width: 'var(--evergaol-size)',
                              height: 'var(--evergaol-size)'
                            }}
                          >
                            <Image 
                              src={opt.type ? getIconSrc(opt.type, opt.text) : '/icon/undefined.png'} 
                              alt={opt.type ?? 'base'} 
                              fill 
                              sizes="40px"
                              className="object-contain pointer-events-none p-0.5"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <span className="text-gray-500 uppercase tracking-wider block" style={{ fontSize: 'var(--popup-font-badge)' }}>{getTypeLabel(opt.type, opt.text)}</span>
                            <span className="font-semibold text-gray-200 block truncate" style={{ fontSize: 'var(--popup-font-title)' }}>{getBaseLabel(opt.type, opt.text)}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        <p className="text-[10px] text-gray-400 mb-1">条件を絞り込む:</p>
                        {opts.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleFilterSelect('minor', popup.name, opt)}
                            className="w-full text-left p-2 rounded hover:bg-gray-900 border border-gray-900 hover:border-gray-800 transition-colors flex items-center gap-3"
                          >
                            <div 
                              className="relative shrink-0 bg-gray-950/40 rounded border border-gray-800 p-1 flex items-center justify-center"
                              style={{
                                width: 'var(--evergaol-size)',
                                height: 'var(--evergaol-size)'
                              }}
                            >
                              <Image 
                                src={getIconSrc(opt.type, opt.text)} 
                                alt={opt.type} 
                                fill 
                                sizes="40px"
                                className="object-contain pointer-events-none p-0.5"
                              />
                            </div>
                            <div className="flex-grow min-w-0">
                              <span className="font-semibold text-gray-200 block truncate" style={{ fontSize: 'var(--popup-font-text)' }}>{getBaseLabel(opt.type, opt.text)}</span>
                              <span className="text-gray-500 uppercase tracking-wider block mt-0.5" style={{ fontSize: 'var(--popup-font-badge)' }}>{getTypeLabel(opt.type, opt.text)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  {/* 6. 封牢のポップアップ */}
                  {popup.type === 'evergaol' && (() => {
                    const opts = getAvailableOptions.evergaols[popup.name] || [];
                    const currentFilter = filters.evergaols[popup.name];
                    
                    if (currentFilter) {
                      return (
                        <div className="space-y-2">
                          <div className="p-2 bg-purple-950/40 border border-purple-800/40 rounded flex justify-between items-center">
                            <span className="font-semibold text-gray-200 block">{transText(currentFilter.text)}</span>
                            <button
                              onClick={() => handleFilterRemove('evergaol', popup.name)}
                              className="p-1 hover:bg-gray-800 rounded text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {renderBossTable(currentFilter.text)}
                        </div>
                      );
                    }

                    if (opts.length === 1) {
                      const opt = opts[0];
                      return (
                        <div>
                          <div className="p-2 bg-gray-900/60 rounded">
                            <span className="font-semibold text-gray-200 block text-sm">{transText(opt.text)}</span>
                          </div>
                          {renderBossTable(opt.text)}
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        <p className="text-[10px] text-gray-400 mb-1">条件を絞り込む:</p>
                        {opts.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleFilterSelect('evergaol', popup.name, opt)}
                            className="w-full text-left p-2 rounded hover:bg-gray-900 border border-gray-900 hover:border-gray-800 transition-colors"
                          >
                            <span className="font-semibold text-gray-200 block">{transText(opt.text)}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  {/* 7. フィールドボスのポップアップ */}
                  {popup.type === 'fieldBoss' && (() => {
                    const opts = getAvailableOptions.fieldBosses[popup.name] || [];
                    const currentFilter = filters.fieldBosses[popup.name];
                    
                    if (currentFilter) {
                      return (
                        <div className="space-y-2">
                          <div className="p-2 bg-rose-950/40 border border-rose-800/40 rounded flex justify-between items-center">
                            <span className="font-semibold text-gray-200 block">{transText(currentFilter.text)}</span>
                            <button
                              onClick={() => handleFilterRemove('fieldBoss', popup.name)}
                              className="p-1 hover:bg-gray-800 rounded text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {renderBossTable(currentFilter.text)}
                        </div>
                      );
                    }

                    if (opts.length === 1) {
                      const opt = opts[0];
                      return (
                        <div>
                          <div className="p-2 bg-gray-900/60 rounded">
                            <span className="font-semibold text-gray-200 block text-sm">{transText(opt.text)}</span>
                          </div>
                          {renderBossTable(opt.text)}
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        <p className="text-[10px] text-gray-400 mb-1">条件を絞り込む:</p>
                        {opts.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleFilterSelect('fieldBoss', popup.name, opt)}
                            className="w-full text-left p-2 rounded hover:bg-gray-900 border border-gray-900 hover:border-gray-800 transition-colors"
                          >
                            <span className="font-semibold text-gray-200 block">{transText(opt.text)}</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()}

          {/* タイマー表示 (左下) */}
          <div className={`absolute bottom-2 left-2 md:bottom-4 md:left-4 z-30 border rounded-lg md:rounded-xl px-1 py-0.5 md:px-3 md:py-2 flex flex-col items-center justify-center gap-0 md:gap-1 shadow-2xl backdrop-blur-md select-none min-w-[40px] md:min-w-[150px] transition-all duration-300 ${
            timerSeconds <= 10 
              ? 'bg-red-950/90 border-red-500/80 animate-pulse' 
              : 'bg-slate-950/85 border-gray-800/80'
          }`}>
            <div className="hidden md:block text-[10px] text-gray-400 font-semibold tracking-wider uppercase text-center">
              {transText('timerTitle')}
            </div>
            <div className={`text-[10px] md:text-3xl font-bold font-mono tracking-wider transition-colors duration-300 ${
              timerSeconds <= 10 ? 'text-red-400' : 'text-cyan-400'
            }`}>
              {formatTime(timerSeconds)}
            </div>
          </div>
        </div>

        {/* 3日目のボスの弱点属性情報テーブル */}
        {renderDay3BossStats(determinedNightLord)}

        {/* マップの下部にリセットボタンを配置 */}
        <button
          onClick={performReset}
          className="w-full h-[76px] md:h-[88px] bg-red-950/40 hover:bg-red-900/60 text-red-200 hover:text-red-100 border border-red-800/50 text-base md:text-xl font-extrabold tracking-wider rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 md:gap-3 shadow-xl cursor-pointer"
        >
          <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
          {autoResetSeconds !== null ? `リセット (自動リセットまで ${formatTime(autoResetSeconds)})` : 'リセット'}
        </button>
      </div>
    </div>
  );

  // マップ上の鷹（出現地点）ピンをクリックした時のハンドラ
  function handleSpawnPointClick(name: string, pos: { x: number, y: number }) {
    if (selectedSpawnPoint === name) {
      setSelectedSpawnPoint(null);
      setActivePopup(null);
    } else {
      setSelectedSpawnPoint(name);
      setActivePopup({ type: 'spawn', name, x: pos.x, y: pos.y });
      resetFilters();
    }
  }

  // 拠点のピンをクリックした時のハンドラ
  function handleBaseClick(type: 'major' | 'minor' | 'evergaol' | 'fieldBoss', name: string, pos: { x: number, y: number }) {
    setActivePopup({ type, name, x: pos.x, y: pos.y });
  }

  // ポップアップでの条件選択ハンドラ
  function handleFilterSelect(type: 'major' | 'minor' | 'evergaol' | 'fieldBoss', name: string, option: FilterOption) {
    setFilters(prev => {
      const next = { ...prev };
      if (type === 'major') next.majorBases = { ...prev.majorBases, [name]: option };
      if (type === 'minor') next.minorBases = { ...prev.minorBases, [name]: option };
      if (type === 'evergaol') next.evergaols = { ...prev.evergaols, [name]: option };
      if (type === 'fieldBoss') next.fieldBosses = { ...prev.fieldBosses, [name]: option };
      return next;
    });
    // 条件選択後はポップアップを閉じる
    setActivePopup(null);
  }

  // 条件解除ハンドラ
  function handleFilterRemove(type: 'major' | 'minor' | 'evergaol' | 'fieldBoss', name: string) {
    setFilters(prev => {
      const next = { ...prev };
      if (type === 'major') {
        const copy = { ...prev.majorBases };
        delete copy[name];
        next.majorBases = copy;
      }
      if (type === 'minor') {
        const copy = { ...prev.minorBases };
        delete copy[name];
        next.minorBases = copy;
      }
      if (type === 'evergaol') {
        const copy = { ...prev.evergaols };
        delete copy[name];
        next.evergaols = copy;
      }
      if (type === 'fieldBoss') {
        const copy = { ...prev.fieldBosses };
        delete copy[name];
        next.fieldBosses = copy;
      }
      return next;
    });
    // ポップアップを更新
    setActivePopup(prev => prev ? { ...prev } : null);
  }
}
