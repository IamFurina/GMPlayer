<template>
  <LyricPlayer 
    ref="lyricPlayerRef" 
    :lyricLines="currentLyrics" 
    :currentTime="currentTime"
    :playing="music.playState"
    :alignAnchor="alignAnchor"
    :alignPosition="alignPosition" 
    :enableSpring="setting.showYrcAnimation"
    :enableScale="setting.showYrcAnimation" 
    :enableBlur="setting.lyricsBlur"
    :enableInterludeDots="true"
    :wordFadeWidth="0.5" 
    :linePosXSpringParams="setting.springParams.posX"
    :linePosYSpringParams="setting.springParams.posY" 
    :lineScaleSpringParams="setting.springParams.scale" 
    :style="lyricStyles"
    @line-click="handleLineClick" 
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { musicStore, settingStore, siteStore } from "../../store";
import { LyricPlayer, type LyricPlayerRef } from "@applemusic-like-lyrics/vue";
import { createLyricsProcessor, type LyricLine } from "./processLyrics";

const lyricPlayerRef = ref<LyricPlayerRef>();
const site = siteStore();
const music = musicStore();
const setting = settingStore();

const emit = defineEmits<{
  lrcTextClick: [time: number]
}>();

// 计算当前播放时间
const currentTime = computed(() => 
  music.persistData.playSongTime.currentTime * 1000
);

// 计算对齐方式
const alignAnchor = computed(() => 
  setting.lyricsBlock === 'center' ? 'center' : 'top'
);

const alignPosition = computed(() => 
  setting.lyricsBlock === 'center' ? 0.5 : 0.2
);

// 计算歌词样式
const lyricStyles = computed(() => ({
  '--amll-lyric-view-color': setting.immersivePlayer ? site.songPicColor : 'rgb(239, 239, 239)',
  '--amll-lyric-player-font-size': `${setting.lyricsFontSize * 10}px`,
  '--amll-lyric-player-line-height': setting.lyricLineHeight,
  'font-weight': setting.lyricFontWeight,
  'font-family': setting.lyricFont,
  'letter-spacing': setting.lyricLetterSpacing,
  'cursor': 'pointer',
  'user-select': 'none',
  '-webkit-tap-highlight-color': 'transparent'
}));

// 处理歌词点击
const handleLineClick = (e: { line: { getLine: () => { startTime: number } } }) => {
  const time = e.line.getLine().startTime;
  if (time != null) {
    console.log("click time:", time);
    emit("lrcTextClick", time);
    music.playState = true;
  }
};

// 获取当前歌词
const currentLyrics = computed<LyricLine[]>(() => {
  const songLyric = music.songLyric || { lrcAMData: [], yrcAMData: [] };
  return createLyricsProcessor(songLyric, {
    showYrc: setting.showYrc,
    showRoma: setting.showRoma,
    showTransl: setting.showTransl
  });
});

watch(() => music.playState, (newState) => {
  console.log("music.playState:", newState);
  if (newState) {
    lyricPlayerRef.value?.lyricPlayer?.value?.setCurrentTime(currentTime.value);
  }
});
</script>



