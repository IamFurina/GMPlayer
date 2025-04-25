import { toRaw } from 'vue';
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
  const rawLyrics = settings.showYrc && songLyric.yrcAMData?.length
    ? toRaw(songLyric.yrcAMData)
    : toRaw(songLyric.lrcAMData) || [];

  return rawLyrics.map((line: LyricLine) => {
    const rawLine = toRaw(line);
    const processedWords = toRaw(rawLine.words).reduce<LyricWord[]>((acc, word, index, array) => {
      // 添加当前单词
      acc.push({
        startTime: word.startTime,
        endTime: word.endTime,
        word: word.word.trimEnd()
      });
      
      // 如果不是最后一个单词，添加空格（使用不间断空格）
      if (index < array.length - 1) {
        acc.push({
          word: "\u00A0",
          startTime: 0,
          endTime: 0
        });
      }
      
      return acc;
    }, []);

    return {
      startTime: rawLine.startTime,
      endTime: rawLine.endTime,
      words: processedWords,
      translatedLyric: settings.showTransl ? rawLine.translatedLyric : "",
      romanLyric: settings.showRoma ? rawLine.romanLyric : "",
      isBG: rawLine.isBG,
      isDuet: rawLine.isDuet
    };
  });
}