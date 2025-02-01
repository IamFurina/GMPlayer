import type { ComputedRef } from 'vue';
import type { Store } from 'pinia';

export interface LyricWord {
  word: string;
  startTime: number;
  endTime: number;
}

export interface LyricLine {
  startTime: number;
  endTime: number;
  words: LyricWord[];
  translatedLyric: string;
  romanLyric: string;
  isBG: boolean;
  isDuet: boolean;
}

export interface SongLyric {
  lrcAMData: LyricLine[];
  yrcAMData: LyricLine[];
}

export interface SettingState {
  showYrc: boolean;
  showRoma: boolean;
  showTransl: boolean;
}

// 创建一个工厂函数来处理歌词
export function createLyricsProcessor(songLyric: SongLyric, settings: SettingState): LyricLine[] {
  const lyrics = settings.showYrc && songLyric.yrcAMData?.length
    ? songLyric.yrcAMData
    : songLyric.lrcAMData || [];

  return lyrics.map((line: LyricLine) => ({
    ...line,
    romanLyric: settings.showRoma ? line.romanLyric : "",
    translatedLyric: settings.showTransl ? line.translatedLyric : ""
  }));
}