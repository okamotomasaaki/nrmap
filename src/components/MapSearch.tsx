'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Map as MapIcon, 
  User, 
  Compass, 
  RotateCcw, 
  Sparkles,
  Info,
  Globe,
  X
} from 'lucide-react';

// データファイルのインポート
import jaTrans from '@/data/translations/ja.json';
import enTrans from '@/data/translations/en.json';
import zhTrans from '@/data/translations/zh.json';

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

// 翻訳データのマッピング
const TRANS_MAP: Record<string, Record<string, string>> = {
  ja: jaTrans,
  en: enTrans,
  zh: zhTrans
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

interface MapSearchProps {
  locale: string;
}

interface FilterOption {
  text: string | null;
  type?: string;
  element?: string | null;
}

export default function MapSearch({ locale }: MapSearchProps) {
  // 翻訳と言語
  const currentLocale = locale === 'en' || locale === 'zh' || locale === 'ja' ? locale : 'ja';
  const t = TRANS_MAP[currentLocale] || jaTrans;

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

  const handleDontShowAgain = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hide_instruction', 'true');
    }
    setShowInstruction(false);
  };

  // 全マップデータ
  const mapPatterns = useMemo(() => {
    return currentMap ? (MAP_DATA_MAP[currentMap] || defaultMapData) : [];
  }, [currentMap]);

  // マップや夜の王などの基本的な切り替えがあった時にフィルターをクリア
  const resetFilters = () => {
    setFilters({
      majorBases: {},
      minorBases: {},
      evergaols: {},
      fieldBosses: {},
      castleBoss: null
    });
    setActivePopup(null);
  };

  const handleMapChange = (mapName: string) => {
    setCurrentMap(mapName);
    setSelectedSpawnPoint(null);
    resetFilters();
    if (selectedNightLord !== undefined) {
      setIsMapScreen(true);
    }
  };

  const handleNightLordChange = (lordName: string | null) => {
    setSelectedNightLord(lordName);
    setSelectedSpawnPoint(null);
    resetFilters();
    if (currentMap !== null) {
      setIsMapScreen(true);
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



  const handleBackToSelect = () => {
    setIsMapScreen(false);
    resetFilters();
  };

  if (!isMapScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-slate-950 text-gray-100 p-4 md:p-8">
        <div className="w-full max-w-2xl bg-gray-900/60 border border-gray-800 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-2xl flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-3 mb-2">
              <MapIcon className="w-8 h-8 text-blue-500" />
              {t.title}
            </h1>
            <p className="text-xs md:text-sm text-gray-400 max-w-md mx-auto">{t.description}</p>
          </div>

          <div className="border-t border-gray-800/80 my-2"></div>

          {/* マップ選択 */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 justify-center md:justify-start">
              <Compass className="w-4 h-4 text-blue-500" />
              1. MAP SELECT (マップ選択)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.keys(MAP_DATA_MAP).map(mapName => (
                <button
                  key={mapName}
                  onClick={() => handleMapChange(mapName)}
                  className={`group rounded-none border text-center transition-all relative overflow-hidden aspect-square w-full select-none ${
                    currentMap === mapName 
                      ? 'border-blue-500 ring-2 ring-blue-500/40' 
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="absolute inset-0 z-0">
                    <Image 
                      src={`/map/${MAP_IMAGE_MAP[mapName] || mapName}.webp`}
                      alt={mapName}
                      fill
                      sizes="200px"
                      className={`object-cover pointer-events-none transition-transform duration-300 ${MAP_ZOOM_CLASSES[mapName] || 'scale-100'}`}
                    />
                  </div>
                  <span className="absolute bottom-0 left-0 right-0 w-full text-center font-semibold text-xs md:text-sm text-white z-10 bg-black/80 py-1 border-t border-gray-800/60 backdrop-blur-[2px] truncate px-1">
                    {mapName === 'Default' ? (currentLocale === 'ja' ? 'ノーマル' : 'Default') : mapName}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 夜の王の選択 */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 justify-center md:justify-start">
              <User className="w-4 h-4 text-rose-500" />
              2. SELECT NIGHT LORD (夜の王の選択)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableNightLords.map(lord => {
                const isSelected = selectedNightLord === lord;
                return (
                  <button
                    key={lord}
                    onClick={() => handleNightLordChange(lord)}
                    className={`group rounded-none border text-center transition-all relative overflow-hidden aspect-square w-full select-none ${
                      isSelected
                        ? 'border-rose-500 ring-2 ring-rose-500/40'
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="absolute inset-0 z-0">
                      <Image 
                        src={`/icon/nightLord/${BOSS_IMAGE_MAP[lord] || lord}.jpg`} 
                        alt={lord} 
                        fill 
                        sizes="200px" 
                        className="object-cover pointer-events-none" 
                      />
                    </div>
                    <span className="absolute bottom-0 left-0 right-0 w-full text-center font-semibold text-[10px] md:text-xs text-white z-10 bg-black/80 py-1 border-t border-gray-800/60 backdrop-blur-[2px] truncate px-1">
                      {transText(lord)}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => handleNightLordChange(null)}
                className={`group rounded-none border text-center transition-all relative overflow-hidden aspect-square w-full select-none ${
                  selectedNightLord === null
                    ? 'border-rose-500 ring-2 ring-rose-500/40'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="absolute inset-0 z-0">
                  <Image src="/icon/nightLord/unnamed.jpg" alt="All" fill sizes="200px" className="object-cover pointer-events-none" />
                </div>
                <span className="absolute bottom-0 left-0 right-0 w-full text-center font-semibold text-[10px] md:text-xs text-white z-10 bg-black/80 py-1 border-t border-gray-800/60 backdrop-blur-[2px] truncate px-1">
                  不明
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 言語切り替え & クレジット */}
        <div className="mt-8 flex flex-col items-center gap-3 text-xs text-gray-500">
          <div className="flex gap-2">
            <Globe className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex gap-1.5 font-semibold text-gray-400 text-sm">
              <Link href="/ja" className={`hover:text-white transition-colors ${currentLocale === 'ja' ? 'text-blue-500 font-bold' : ''}`}>JA</Link>
              <span>/</span>
              <Link href="/en" className={`hover:text-white transition-colors ${currentLocale === 'en' ? 'text-blue-500 font-bold' : ''}`}>EN</Link>
              <span>/</span>
              <Link href="/zh" className={`hover:text-white transition-colors ${currentLocale === 'zh' ? 'text-blue-500 font-bold' : ''}`}>ZH</Link>
            </div>
          </div>
          <span>© 2026 nightreignmap.com</span>
        </div>
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
                style={{ left: `${(pos.x / 1000) * 100}%`, top: `${(pos.y / 1000) * 100}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 transition-all z-20 cursor-pointer drop-shadow-md hover:scale-110 border-[3px] border-emerald-500 rounded-full bg-slate-950/20"
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
            const uniqueOptions = activePatterns
              .map(p => p.majorBases[name])
              .filter((item, idx, self) => 
                item && idx === self.findIndex(t => t?.type === item.type && t?.element === item.element)
              );

            if (uniqueOptions.length === 0) return null;

            const filterActive = filters.majorBases[name];
            const isPatternDetermined = activePatterns.length === 1;

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

            const labelOffset = isCampType ? '30px' : '38px';

            return (
              <React.Fragment key={`major-frag-${name}`}>
                <button
                  key={`major-${name}`}
                  onClick={() => handleBaseClick('major', name, pos)}
                  style={{ 
                    left: `${(pos.x / 1000) * 100}%`, 
                    top: `${(pos.y / 1000) * 100}%`,
                    filter: 'drop-shadow(0 0 8px #000000)'
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-24 h-24 transition-all z-10 cursor-pointer hover:scale-110 ${
                    !isPatternDetermined ? 'ring-2 ring-yellow-50/50 rounded-full' : ''
                  } ${filterActive ? 'ring-2 ring-yellow-300 rounded-full' : ''}`}
                  title={transText(name)}
                >
                  {uniqueOptions.length > 1 ? (
                    <Image 
                      src="/icon/undefined.png" 
                      alt="undefined" 
                      fill 
                      sizes="96px"
                      className="object-contain pointer-events-none"
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      <Image 
                        src={`/icon/${uniqueOptions[0].type}.png`} 
                        alt={uniqueOptions[0].type} 
                        fill 
                        sizes="96px"
                        className="object-contain pointer-events-none"
                      />
                      {uniqueOptions[0].element && (
                        <div className="absolute bottom-2 right-2 w-7 h-7 z-20">
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
                    className="absolute text-white text-[12px] font-normal tracking-wider whitespace-nowrap bg-black/80 border border-gray-800/80 px-1.5 py-0.5 rounded shadow pointer-events-none z-20"
                    style={{ 
                      left: `${(pos.x / 1000) * 100}%`, 
                      top: `${(pos.y / 1000) * 100}%`, 
                      transform: `translate(-50%, ${labelOffset})` 
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

            const filterActive = filters.minorBases[name];
            const isChurch = baseInfo.type === 'Church';
            const minorLabelOffset = baseInfo.type === 'Camp' ? '30px' : '38px';

            return (
              <React.Fragment key={`minor-frag-${name}`}>
                <button
                  key={`minor-${name}`}
                  onClick={() => handleBaseClick('minor', name, pos)}
                  style={{ 
                    left: `${(pos.x / 1000) * 100}%`, 
                    top: `${(pos.y / 1000) * 100}%`,
                    filter: 'drop-shadow(0 0 8px #000000)'
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-24 h-24 transition-all z-10 cursor-pointer hover:scale-110 ${
                    filterActive ? 'ring-2 ring-yellow-300 rounded-full' : ''
                  }`}
                  title={transText(name)}
                >
                  <Image 
                    src={`/icon/${baseInfo.type}.png`} 
                    alt={baseInfo.type} 
                    fill 
                    sizes="96px"
                    className="object-contain pointer-events-none"
                  />
                </button>
                {!isChurch && (
                  <div 
                    className="absolute text-white text-[12px] font-normal tracking-wider whitespace-nowrap bg-black/80 border border-gray-800/80 px-1.5 py-0.5 rounded shadow pointer-events-none z-20"
                    style={{ 
                      left: `${(pos.x / 1000) * 100}%`, 
                      top: `${(pos.y / 1000) * 100}%`, 
                      transform: `translate(-50%, ${minorLabelOffset})` 
                    }}
                  >
                    {transText(baseInfo.text)}
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
                style={{ left: `${(pos.x / 1000) * 100}%`, top: `${(pos.y / 1000) * 100}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 transition-all z-10 cursor-pointer drop-shadow-md hover:scale-110 ${
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

            const filterActive = filters.fieldBosses[name];
            const tvInfo = tv[bossInfo.text];
            const isDanger = tvInfo ? tvInfo.isDanger : false;
            const iconSrc = isDanger ? '/icon/redBoss.png' : '/icon/field-boss.png';

            return (
              <React.Fragment key={`fieldBoss-frag-${name}`}>
                <button
                  key={`fieldBoss-${name}`}
                  onClick={() => handleBaseClick('fieldBoss', name, pos)}
                  style={{ 
                    left: `${(pos.x / 1000) * 100}%`, 
                    top: `${(pos.y / 1000) * 100}%`,
                    filter: 'drop-shadow(0 0 6px #000000) drop-shadow(0 0 2px #000000)'
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 transition-all z-10 cursor-pointer hover:scale-110 ${
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
                  className="absolute text-white text-[12px] font-normal tracking-wider whitespace-nowrap bg-black/80 border border-gray-800/80 px-1.5 py-0.5 rounded shadow pointer-events-none z-20"
                  style={{ 
                    left: `${(pos.x / 1000) * 100}%`, 
                    top: `${(pos.y / 1000) * 100}%`, 
                    transform: 'translate(-50%, 20px)' 
                  }}
                >
                  {transText(bossInfo.text)}
                </div>
              </React.Fragment>
            );
          })}

          {/* 中央砦 (Castle Boss) の敵名称表示 */}
          {activePatterns.length === 1 && activePatterns[0].castleBoss && (
            <div 
              className="absolute text-white text-[14px] font-normal tracking-wider text-center whitespace-nowrap bg-black/80 border border-gray-800/80 px-1.5 py-0.5 rounded shadow pointer-events-none z-20"
              style={{ 
                left: '45.5%', 
                top: '48%', 
                transform: 'translate(calc(-50% + 8px), -50%)' 
              }}
            >
              {transText('Center Fort')}: {transText(activePatterns[0].castleBoss)}
            </div>
          )}

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
                style={{ left: `${(pos.x / 1000) * 100}%`, top: `${(pos.y / 1000) * 100}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 transition-all z-10 cursor-pointer drop-shadow-md hover:scale-110"
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
                    style={{ left: `${(pos.x / 1000) * 100}%`, top: `${(pos.y / 1000) * 100}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full cursor-pointer z-15 drop-shadow-md ring-4 ring-orange-700 bg-orange-700 transition-all hover:scale-110 flex items-center justify-center animate-pulse"
                    title={`夜イベント: ${transText(item.text)}`}
                  >
                    <div 
                      className="absolute text-white text-[14px] font-bold whitespace-nowrap bg-orange-950/90 border border-orange-700/50 px-2 py-0.5 rounded shadow-lg pointer-events-none"
                      style={{ bottom: '-45px', left: '50%', transform: 'translateX(-50%)' }}
                    >
                      <div className="text-center text-[11px] text-orange-300 leading-none mb-0.5">DAY 1</div>
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
                    style={{ left: `${(pos.x / 1000) * 100}%`, top: `${(pos.y / 1000) * 100}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full cursor-pointer z-15 drop-shadow-md ring-4 ring-violet-800 bg-violet-800 transition-all hover:scale-110 flex items-center justify-center animate-pulse"
                    title={`夜イベント: ${transText(item.text)}`}
                  >
                    <div 
                      className="absolute text-white text-[14px] font-bold whitespace-nowrap bg-violet-950/90 border border-violet-800/50 px-2 py-0.5 rounded shadow-lg pointer-events-none"
                      style={{ bottom: '-45px', left: '50%', transform: 'translateX(-50%)' }}
                    >
                      <div className="text-center text-[11px] text-violet-300 leading-none mb-0.5">DAY 2</div>
                      {transText(item.text)}
                    </div>
                  </button>
                );
              })()}
            </>
          )}

          {/* === 詳細ポップアップダイアログ === */}
          {activePopup && (
            <div 
              style={{
                left: `${(activePopup.x / 1000) * 100}%`,
                top: `${(activePopup.y / 1000) * 100}%`,
                transform: `translate(-50%, ${activePopup.y > 600 ? '-105%' : '15%'})`
              }}
              className={`absolute bg-gray-950/95 border border-gray-800 rounded-xl backdrop-blur-md shadow-2xl z-30 select-text pointer-events-auto text-gray-100 ${
                activePopup.type === 'major' && !filters.majorBases[activePopup.name] ? 'w-fit p-4' : 'w-72 max-h-80 overflow-y-auto p-3'
              }`}
            >
              {/* 大拠点未選択時の絶対配置バツボタン */}
              {activePopup.type === 'major' && !filters.majorBases[activePopup.name] && (
                <button 
                  onClick={() => setActivePopup(null)}
                  className="absolute -top-2 -right-2 p-1.5 bg-gray-900 border border-gray-800 rounded-full text-gray-500 hover:text-white transition-colors z-40 shadow-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* 通常のヘッダー */}
              {!(activePopup.type === 'major' && !filters.majorBases[activePopup.name]) && (
                <div className="flex justify-between items-start mb-2 border-b border-gray-800 pb-1.5">
                  <div>
                    <h4 className="font-bold text-xs text-blue-400">
                      {transText(activePopup.type.toUpperCase())}
                    </h4>
                    <h3 className="font-bold text-sm text-white">
                      {transText(activePopup.name)}
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
              <div className="space-y-1 text-xs">
                {/* 1. 出現地点のポップアップ */}
                {activePopup.type === 'spawn' && (
                  <p className="text-gray-300">
                    出現地点に選択されています。マップ左側のパネルまたは鷹アイコンから選択解除できます。
                  </p>
                )}

                {/* 2. 祝福 (腐れ森限定) */}
                {activePopup.type === 'rot' && (
                  <p className="text-gray-300">
                    腐れ森の祝福ポイントです。
                  </p>
                )}

                {/* 3. 夜のイベント円 */}
                {activePopup.type === 'nightCircle' && (
                  <div>
                    <p className="text-gray-300">
                      夜間に出現するボスまたはイベントポイントです。
                    </p>
                    <div className="mt-2 px-2 py-1 bg-indigo-950/30 border border-indigo-800/30 text-indigo-400 rounded font-semibold text-center text-[10px]">
                      {activePopup.name.split(': ')[1]}
                    </div>
                  </div>
                )}

                {/* 4. 各種拠点（大拠点など）で、絞り込みのための選択肢を表示 */}
                {activePopup.type === 'major' && (() => {
                  const opts = getAvailableOptions.majorBases[activePopup.name] || [];
                  const currentFilter = filters.majorBases[activePopup.name];
                  
                  if (currentFilter) {
                    return (
                      <div className="space-y-2">
                        <div className="p-2 bg-blue-950/40 border border-blue-800/40 rounded flex items-center gap-3">
                          <div className="relative w-12 h-12 shrink-0 bg-blue-950/60 rounded border border-blue-800 p-1 flex items-center justify-center">
                            <Image 
                              src={`/icon/${currentFilter.type}.png`} 
                              alt={currentFilter.type ?? 'base'} 
                              fill 
                              sizes="40px"
                              className="object-contain pointer-events-none p-0.5"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <span className="text-[9px] text-blue-400 uppercase tracking-wider block">{transText(currentFilter.type ?? null)}</span>
                            <span className="font-semibold text-blue-100 block text-sm truncate">{transText(currentFilter.text)}</span>
                            {currentFilter.element && <div className="mt-1">{getElementBadge(currentFilter.element)}</div>}
                          </div>
                          <button
                            onClick={() => handleFilterRemove('major', activePopup.name)}
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
                          <div className="relative w-12 h-12 shrink-0 bg-gray-950/40 rounded border border-gray-800 p-1 flex items-center justify-center">
                            <Image 
                              src={`/icon/${opt.type}.png`} 
                              alt={opt.type} 
                              fill 
                              sizes="40px"
                              className="object-contain pointer-events-none p-0.5"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider block">{transText(opt.type)}</span>
                            <span className="font-semibold text-gray-200 block text-sm truncate">{transText(opt.text)}</span>
                            {opt.element && <div className="mt-1">{getElementBadge(opt.element)}</div>}
                          </div>
                        </div>
                        {renderBossTable(opt.text)}
                      </div>
                    );
                  }

                  return (
                    <div className="flex gap-3.5 items-center justify-center p-1">
                      {opts.map((opt, i) => {
                        const displayName = transText(opt.text);
                        const showText = ['老獅子', '獅子の混種', '失地騎士'].includes(displayName);
                        return (
                          <button
                            key={i}
                            onClick={() => handleFilterSelect('major', activePopup.name, opt)}
                            className="relative w-20 h-20 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-1.5 flex items-center justify-center transition-all hover:scale-105 active:scale-95 group shadow-sm shrink-0 overflow-hidden"
                            title={displayName}
                          >
                            <div className="relative w-full h-full">
                              <Image 
                                src={`/icon/${opt.type}.png`} 
                                alt={opt.type} 
                                fill 
                                sizes="64px"
                                className="object-contain pointer-events-none p-0.5"
                              />
                            </div>
                            {opt.element && (
                              <div className="absolute bottom-1 left-1.5 z-20 drop-shadow-md w-7 h-7">
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
                              <span className="absolute bottom-0 left-0 right-0 text-[9px] text-white font-bold tracking-tight text-center py-0.5 bg-black/60 z-30 leading-none truncate px-0.5 border-t border-gray-800/40">
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
                {activePopup.type === 'minor' && (() => {
                  const opts = getAvailableOptions.minorBases[activePopup.name] || [];
                  const currentFilter = filters.minorBases[activePopup.name];
                  
                  if (currentFilter) {
                    return (
                      <div className="p-2 bg-amber-950/40 border border-amber-800/40 rounded flex items-center gap-3">
                        <div className="relative w-12 h-12 shrink-0 bg-amber-950/60 rounded border border-amber-800 p-1 flex items-center justify-center">
                          <Image 
                            src={`/icon/${currentFilter.type}.png`} 
                            alt={currentFilter.type ?? 'base'} 
                            fill 
                            sizes="40px"
                            className="object-contain pointer-events-none p-0.5"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <span className="text-[9px] text-amber-400 uppercase tracking-wider block">{transText(currentFilter.type ?? null)}</span>
                          <span className="font-semibold text-amber-100 block text-sm truncate">{transText(currentFilter.text)}</span>
                        </div>
                        <button
                          onClick={() => handleFilterRemove('minor', activePopup.name)}
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
                        <div className="relative w-12 h-12 shrink-0 bg-gray-950/40 rounded border border-gray-800 p-1 flex items-center justify-center">
                          <Image 
                            src={`/icon/${opt.type}.png`} 
                            alt={opt.type} 
                            fill 
                            sizes="40px"
                            className="object-contain pointer-events-none p-0.5"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <span className="text-[9px] text-gray-500 uppercase tracking-wider block">{transText(opt.type)}</span>
                          <span className="font-semibold text-gray-200 block text-sm truncate">{transText(opt.text)}</span>
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
                          onClick={() => handleFilterSelect('minor', activePopup.name, opt)}
                          className="w-full text-left p-2 rounded hover:bg-gray-900 border border-gray-900 hover:border-gray-800 transition-colors flex items-center gap-3"
                        >
                          <div className="relative w-12 h-12 shrink-0 bg-gray-950/40 rounded border border-gray-800 p-1 flex items-center justify-center">
                            <Image 
                              src={`/icon/${opt.type}.png`} 
                              alt={opt.type} 
                              fill 
                              sizes="40px"
                              className="object-contain pointer-events-none p-0.5"
                            />
                          </div>
                          <div className="flex-grow min-w-0">
                            <span className="font-semibold text-gray-200 block truncate text-xs">{transText(opt.text)}</span>
                            <span className="text-[9px] text-gray-500 uppercase tracking-wider block mt-0.5">{transText(opt.type)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* 6. 封牢のポップアップ */}
                {activePopup.type === 'evergaol' && (() => {
                  const opts = getAvailableOptions.evergaols[activePopup.name] || [];
                  const currentFilter = filters.evergaols[activePopup.name];
                  
                  if (currentFilter) {
                    return (
                      <div className="space-y-2">
                        <div className="p-2 bg-purple-950/40 border border-purple-800/40 rounded flex justify-between items-center">
                          <span className="font-semibold text-gray-200 block">{transText(currentFilter.text)}</span>
                          <button
                            onClick={() => handleFilterRemove('evergaol', activePopup.name)}
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
                          onClick={() => handleFilterSelect('evergaol', activePopup.name, opt)}
                          className="w-full text-left p-2 rounded hover:bg-gray-900 border border-gray-900 hover:border-gray-800 transition-colors"
                        >
                          <span className="font-semibold text-gray-200 block">{transText(opt.text)}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* 7. フィールドボスのポップアップ */}
                {activePopup.type === 'fieldBoss' && (() => {
                  const opts = getAvailableOptions.fieldBosses[activePopup.name] || [];
                  const currentFilter = filters.fieldBosses[activePopup.name];
                  
                  if (currentFilter) {
                    return (
                      <div className="space-y-2">
                        <div className="p-2 bg-rose-950/40 border border-rose-800/40 rounded flex justify-between items-center">
                          <span className="font-semibold text-gray-200 block">{transText(currentFilter.text)}</span>
                          <button
                            onClick={() => handleFilterRemove('fieldBoss', activePopup.name)}
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
                          onClick={() => handleFilterSelect('fieldBoss', activePopup.name, opt)}
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
          )}
        </div>

        {/* マップの下部にリセットボタンを配置 */}
        <button
          onClick={() => {
            setCurrentMap(null);
            setSelectedNightLord(undefined);
            handleBackToSelect();
          }}
          className="px-8 py-3 bg-red-950/40 hover:bg-red-900/60 text-red-200 hover:text-red-100 border border-red-800/50 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg"
        >
          <RotateCcw className="w-4 h-4" />
          リセット
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
    // ポップアップを更新して、選択済み状態を反映
    setActivePopup(prev => prev ? { ...prev } : null);
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
