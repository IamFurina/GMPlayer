import { parseLrc as parseCoreLrc, parseYrc as parseCoreYrc } from "@applemusic-like-lyrics/lyric";
import { msToS, msToTime } from "./timeTools";
import { musicStore } from "../store";

interface LyricWord {
  word: string;
  startTime: number;
  endTime: number;
}

interface LyricLine {
  words: LyricWord[];
  isBG?: boolean;
  isDuet?: boolean;
}

interface ParsedLyricLine {
  time: number;
  content: string;
  tran?: string;
  roma?: string;
}

interface YrcLine {
  time: number;
  endTime: number;
  content: {
    time: number;
    endTime: number;
    duration: number;
    content: string;
    endsWithSpace: boolean;
  }[];
  TextContent: string;
}

interface LyricData {
  lrc?: { lyric: string } | null;
  tlyric?: { lyric: string } | null;
  romalrc?: { lyric: string } | null;
  yrc?: { lyric: string } | null;
  ytlrc?: { lyric: string } | null;
  yromalrc?: { lyric: string } | null;
  code?: number;
}

interface ParsedLyricResult {
  hasLrcTran: boolean;
  hasLrcRoma: boolean;
  hasYrc: boolean;
  hasYrcTran: boolean;
  hasYrcRoma: boolean;
  lrc: ParsedLyricLine[];
  yrc: YrcLine[];
  lrcAMData: any[];
  yrcAMData: any[];
}

// 恢复默认
const resetSongLyric = (): void => {
  const music = musicStore();
  music.songLyric = {
    lrc: [],
    yrc: [],
    lrcAMData: [],
    yrcAMData: [],
    hasLrcTran: false,
    hasLrcRoma: false,
    hasYrc: false,
    hasYrcTran: false,
    hasYrcRoma: false
  };
};

/**
 * Parse lyric data from API response
 * @param {LyricData} data API response data
 * @returns {ParsedLyricResult | undefined} Parsed lyric data
 */
const parseLyric = (data: LyricData): ParsedLyricResult | undefined => {
  if (!data || data.code !== 200) {
    resetSongLyric();
    return;
  }

  // Initialize lyric data
  const { lrc, tlyric, romalrc, yrc, ytlrc, yromalrc } = data;
  const lrcData = {
    lrc: lrc?.lyric || null,
    tlyric: tlyric?.lyric || null,
    romalrc: romalrc?.lyric || null,
    yrc: yrc?.lyric || null,
    ytlrc: ytlrc?.lyric || null,
    yromalrc: yromalrc?.lyric || null
  };

  // Initialize result object
  const result: ParsedLyricResult = {
    hasLrcTran: !!lrcData.tlyric,
    hasLrcRoma: !!lrcData.romalrc,
    hasYrc: !!lrcData.yrc,
    hasYrcTran: !!lrcData.ytlrc,
    hasYrcRoma: !!lrcData.yromalrc,
    lrc: [],
    yrc: [],
    lrcAMData: [],
    yrcAMData: []
  };

  // Parse normal lyrics
  if (lrcData.lrc) {
    const lrcParsed = parseCoreLrc(lrcData.lrc);
    result.lrc = parseLrcData(lrcParsed);

    // Parse translations if they exist
    let tranParsed: LyricLine[] = [];
    let romaParsed: LyricLine[] = [];

    if (lrcData.tlyric) {
      tranParsed = parseCoreLrc(lrcData.tlyric);
      result.lrc = alignLyrics(result.lrc, parseLrcData(tranParsed), "tran");
    }
    if (lrcData.romalrc) {
      romaParsed = parseCoreLrc(lrcData.romalrc);
      result.lrc = alignLyrics(result.lrc, parseLrcData(romaParsed), "roma");
    }

    // Generate AM format data for LRC
    result.lrcAMData = parseAMData(lrcParsed, tranParsed, romaParsed);
  }

  // Parse YRC lyrics
  if (lrcData.yrc) {
    const yrcParsed = parseCoreYrc(lrcData.yrc);
    result.yrc = parseYrcData(yrcParsed);

    // Parse translations if they exist
    let tranParsed: LyricLine[] = [];
    let romaParsed: LyricLine[] = [];

    if (lrcData.ytlrc) {
      tranParsed = parseCoreLrc(lrcData.ytlrc);
      result.yrc = alignLyrics(result.yrc, parseLrcData(tranParsed), "tran");
    }
    if (lrcData.yromalrc) {
      romaParsed = parseCoreLrc(lrcData.yromalrc);
      result.yrc = alignLyrics(result.yrc, parseLrcData(romaParsed), "roma");
    }

    // Generate AM format data for YRC
    result.yrcAMData = parseAMData(yrcParsed, tranParsed, romaParsed);
  }

  return result;
};

/**
 * Parse normal LRC lyrics
 * @param {LyricLine[]} lrcData Array of LyricLine objects
 * @returns {ParsedLyricLine[]} Parsed lyric data
 */
const parseLrcData = (lrcData: LyricLine[]): ParsedLyricLine[] => {
  if (!lrcData) return [];

  return lrcData
    .map(line => {
      const words = line.words;
      const time = msToS(words[0].startTime);
      const content = words[0].word.trim();

      if (!content) return null;

      return {
        time,
        content
      };
    })
    .filter((line): line is ParsedLyricLine => line !== null);
};

/**
 * Parse YRC (word-by-word) lyrics
 * @param {LyricLine[]} yrcData Array of LyricLine objects
 * @returns {YrcLine[]} Parsed YRC data
 */
const parseYrcData = (yrcData: LyricLine[]): YrcLine[] => {
  if (!yrcData) return [];

  return yrcData
    .map(line => {
      const words = line.words;
      const time = msToS(words[0].startTime);
      const endTime = msToS(words[words.length - 1].endTime);

      const content = words.map(word => ({
        time: msToS(word.startTime),
        endTime: msToS(word.endTime),
        duration: msToS(word.endTime - word.startTime),
        content: word.word.endsWith(" ") ? word.word : word.word.trim(),
        endsWithSpace: word.word.endsWith(" ")
      }));

      const contentStr = content
        .map(word => word.content)
        .join("");

      if (!contentStr) return null;

      return {
        time,
        endTime,
        content,
        TextContent: contentStr
      };
    })
    .filter((line): line is YrcLine => line !== null);
};

/**
 * Align lyrics with translations
 * @param {(ParsedLyricLine[] | YrcLine[])} lyrics Main lyrics array
 * @param {ParsedLyricLine[]} otherLyrics Translation lyrics array
 * @param {string} key Property key for translation ('tran' or 'roma')
 * @returns {(ParsedLyricLine[] | YrcLine[])} Aligned lyrics array
 */
const alignLyrics = <T extends ParsedLyricLine | YrcLine>(
  lyrics: T[],
  otherLyrics: ParsedLyricLine[],
  key: 'tran' | 'roma'
): T[] => {
  if (lyrics.length && otherLyrics.length) {
    lyrics.forEach(mainLine => {
      otherLyrics.forEach(transLine => {
        if (mainLine.time === transLine.time || Math.abs(mainLine.time - transLine.time) < 0.6) {
          (mainLine as any)[key] = transLine.content;
        }
      });
    });
  }
  return lyrics;
};

/**
 * Parse lyrics for Apple Music like format
 * @param {LyricLine[]} lrcData Main lyrics array
 * @param {LyricLine[]} tranData Translation lyrics array
 * @param {LyricLine[]} romaData Romanization lyrics array
 * @returns {any[]} Formatted lyrics array
 */
const parseAMData = (
  lrcData: LyricLine[],
  tranData: LyricLine[] = [],
  romaData: LyricLine[] = []
): any[] => {
  return lrcData.map((line, index, lines) => ({
    words: line.words,
    startTime: line.words[0]?.startTime ?? 0,
    endTime: lines[index + 1]?.words?.[0]?.startTime ??
             line.words?.[line.words.length - 1]?.endTime ??
             Infinity,
    translatedLyric: tranData?.[index]?.words?.[0]?.word ?? "",
    romanLyric: romaData?.[index]?.words?.[0]?.word ?? "",
    isBG: line.isBG ?? false,
    isDuet: line.isDuet ?? false,
  }));
};

export {
  parseLyric,
  parseLrcData,
  parseYrcData,
  alignLyrics,
  parseAMData,
  resetSongLyric
};

export default parseLyric;