<template>
  <Transition name="up" mode="out-in">
    <div v-if="music.showBigPlayer" class="bplayer" :style="[
      music.getPlaySongData && setting.backgroundImageShow === 'blur' ? 'background-image: url(' +
        music.getPlaySongData.album.picUrl.replace(/^http:/, 'https:') +
        '?param=50y50)'
        : '',
      `--cover-bg: ${songPicGradient}`,
      `--main-cover-color: rgb(${setting.immersivePlayer ? songPicColor : '255,255,255'})`
    ]">
      <!-- 切歌取色背景过度 -->
      <Transition name="fade" mode="out-in">
        <div :key="`bg--${songPicGradient}`" :class="['overlay', setting.backgroundImageShow]">
          <template v-if="setting.backgroundImageShow === 'blur'">
            <img v-for="item in 4" :key="item" :src="music.getPlaySongData.album.picUrl.replace(/^http:/, 'https:') +
              `?param=${item * 50}y${item * 50}`" :style="{
                transform: `rotate(${item * 180}deg)`,
              }" class="overlay-img" alt="overlay" />
          </template>
        </div>
      </Transition>

      <template v-if="setting.backgroundImageShow === 'eplor'">
        <BackgroundRender :fps="music.getPlayState ? setting.fps : 0" :playing="music.getPlayState"
          :flowSpeed="music.getPlayState ? (setting.dynamicFlowSpeed ? dynamicFlowSpeed : setting.flowSpeed) : 0"
          :album="setting.albumImageUrl === 'none' ? music.getPlaySongData.album.picUrl.replace(/^http:/, 'https:') : setting.albumImageUrl"
          :renderScale="setting.renderScale" class="overlay" />
      </template>
      <div :class="setting.backgroundImageShow === 'blur' ? 'gray blur' : 'gray'" />
      <div class="icon-menu">
        <div class="menu-left">
          <div v-if="setting.showLyricSetting" class="icon">
            <n-icon class="setting" size="30" :component="SettingsRound" @click="LyricSettingRef.openLyricSetting()" />
          </div>
        </div>
        <div class="menu-right">
          <div class="icon">
            <n-icon class="screenfull" :component="screenfullIcon" @click="screenfullChange" />
          </div>
          <div class="icon">
            <n-icon class="close" :component="KeyboardArrowDownFilled" @click="music.setBigPlayerState(false)" />
          </div>
        </div>
      </div>

      <div :class="music.getPlaySongLyric.lrc[0] && music.getPlaySongLyric.lrc.length > 4 && !music.getLoadingState
        ? 'all'
        : 'all noLrc'
        ">
        <!-- 提示文本 -->
        <Transition name="lrc">
          <div class="tip" v-show="lrcMouseStatus">
            <n-text>{{ $t("other.lrcClicks") }}</n-text>
          </div>
        </Transition>
        <div class="left">
          <PlayerCover v-if="setting.playerStyle === 'cover'" />
          <PlayerRecord v-else-if="setting.playerStyle === 'record'" />
        </div>
        <Transition name="fade" mode="out-in">
          <div class="right">
            <Transition name="lrc">
              <div class="lrcShow" v-if="
                music.getPlaySongLyric.lrc[0] &&
                music.getPlaySongLyric.lrc.length > 4
              ">
                <div class="data" v-show="setting.playerStyle === 'record'">
                  <div class="name text-hidden">
                    <span>{{
                      music.getPlaySongData
                      ? music.getPlaySongData.name
                      : $t("other.noSong")
                      }}</span>
                    <span v-if="music.getPlaySongData && music.getPlaySongData.alia">{{ music.getPlaySongData.alia[0]
                      }}</span>
                  </div>
                  <div class="artists text-hidden" v-if="music.getPlaySongData && music.getPlaySongData.artist">
                    <span class="artist" v-for="(item, index) in music.getPlaySongData.artist" :key="item">
                      <span>{{ item.name }}</span>
                      <span v-if="index != music.getPlaySongData.artist.length - 1">/</span>
                    </span>
                  </div>
                </div>
                <RollingLyrics @mouseenter="
                  lrcMouseStatus = setting.lrcMousePause ? true : false
                  " @mouseleave="lrcAllLeave" @lrcTextClick="lrcTextClick" />
              </div>
            </Transition>
          </div>
        </Transition>
      </div>
      <!-- 音乐频谱 -->
      <Spectrum v-if="setting.musicFrequency" :height="60" :show="music.showBigPlayer" />
      <!-- 歌词设置 -->
      <LyricSetting ref="LyricSettingRef" />

      <!-- Immersive Controls -->
      <div class="immersive-controls-container">
        <Transition name="fade">
          <div class="immersive-controls">
            <div class="controls-backdrop"></div>
            <div class="control-content">
              <!-- Left Column -->
              <div class="control-left">
                <n-icon v-if="music.getPlaySongData && user.userLogin" class="control-icon"
                  :component="music.getSongIsLike(music.getPlaySongData.id) ? FavoriteRound : FavoriteBorderRound"
                  @click="music.changeLikeList(music.getPlaySongData.id, !music.getSongIsLike(music.getPlaySongData.id))" />
                <n-icon class="control-icon" :component="PlaylistAddRound" />
                <n-icon class="control-icon" :component="DownloadRound" />
              </div>

              <!-- Center Column -->
              <div class="control-center">
                <div class="playback-controls">
                  <n-icon v-if="!music.getPersonalFmMode" class="control-icon" :component="SkipPreviousRound"
                    @click.stop="music.setPlaySongIndex('prev')" />
                  <div class="play-state">
                    <n-button :loading="music.getLoadingState" secondary circle :keyboard="false" :focusable="false">
                      <template #icon>
                        <n-icon size="42" :component="music.getPlayState ? PauseRound : PlayArrowRound"
                          @click.stop="music.setPlayState(!music.getPlayState)" />
                      </template>
                    </n-button>
                  </div>
                  <n-icon class="control-icon" :component="SkipNextRound"
                    @click.stop="music.setPlaySongIndex('next')" />
                </div>
                <div class="progress-bar">
                  <span class="time">{{ music.getPlaySongTime.songTimePlayed }}</span>
                  <vue-slider v-model="music.getPlaySongTime.barMoveDistance" @drag-start="music.setPlayState(false)"
                    @drag-end="sliderDragEnd" @click.stop="songTimeSliderUpdate(music.getPlaySongTime.barMoveDistance)"
                    :tooltip="'none'" />
                  <span class="time">{{ music.getPlaySongTime.songTimeDuration }}</span>
                </div>
              </div>

              <!-- Right Column -->
              <div class="control-right">
                <div class="volume-control">
                  <n-popover trigger="hover" placement="top" :keep-alive-on-hover="false">
                    <template #trigger>
                      <n-icon class="control-icon" :component="volumeIcon" @click="volumeMute" />
                    </template>
                    <vue-slider :tooltip="'none'" :min="0" :max="1" :interval="0.001" v-model="persistData.playVolume"
                      class="volume-slider" />
                  </n-popover>
                </div>
                <n-icon class="control-icon"
                  :component="music.getPlaySongMode === 'normal' ? PlayCycle : music.getPlaySongMode === 'random' ? ShuffleOne : PlayOnce"
                  @click="music.setPlaySongMode()" />
                <n-icon class="control-icon" :component="QueueMusicRound" />
                <n-icon class="control-icon" :component="MessageFilled" @click="toComment" />
              </div>
            </div>
          </div>
        </Transition>
      </div>

    </div>
  </Transition>


</template>

<script setup>
import {
  PlayArrowRound,
  KeyboardArrowDownFilled,
  FullscreenRound,
  FullscreenExitRound,
  SettingsRound,
  PauseRound,
  SkipNextRound,
  SkipPreviousRound,
  ThumbDownRound,
  FavoriteRound,
  FavoriteBorderRound,
  PlaylistAddRound,
  QueueMusicRound,
  DownloadRound,
  VolumeOffRound,
  VolumeMuteRound,
  VolumeDownRound,
  VolumeUpRound,
  MessageFilled,
} from "@vicons/material";
import { PlayCycle, PlayOnce, ShuffleOne } from "@icon-park/vue-next";
import { musicStore, settingStore, siteStore, userStore } from "@/store";
import { useRouter } from "vue-router";
import { setSeek } from "@/utils/Player";
import PlayerRecord from "./PlayerRecord.vue";
import PlayerCover from "./PlayerCover.vue";
import RollingLyrics from "./RollingLyrics.vue";
import Spectrum from "./Spectrum.vue";
import LyricSetting from "@/components/DataModal/LyricSetting.vue";
import screenfull from "screenfull";
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";
import BackgroundRender from "@/libs/apple-music-like/BackgroundRender.vue";
import { throttle } from "throttle-debounce"
import { analyzeAudioIntensity } from "../../utils/fftIntensityAnalyze";
import { storeToRefs } from "pinia";

const router = useRouter();
const music = musicStore();
const site = siteStore();
const { persistData } = storeToRefs(music);
const setting = settingStore();
const user = userStore();

const { songPicGradient, songPicColor } = storeToRefs(site)

// 动态流速
const dynamicFlowSpeed = ref(2)

// 工具栏显隐
const menuShow = ref(false);

// 歌词设置弹窗
const LyricSettingRef = ref(null);

// 歌词文本点击事件
const lrcTextClick = (time) => {
  if (typeof $player !== "undefined") setSeek($player, time);
  music.setPlayState(true);
  lrcMouseStatus.value = false;
};

// 歌曲进度条更新
const sliderDragEnd = () => {
  songTimeSliderUpdate(music.getPlaySongTime.barMoveDistance);
  music.setPlayState(true);
};
const songTimeSliderUpdate = (val) => {
  if (typeof $player !== "undefined" && music.getPlaySongTime?.duration) {
    const currentTime = (music.getPlaySongTime.duration / 100) * val;
    setSeek($player, currentTime);
  }
};

// 鼠标移出歌词区域
const lrcMouseStatus = ref(false);
const lrcAllLeave = () => {
  lrcMouseStatus.value = false;
  lyricsScroll(music.getPlaySongLyricIndex);
};

// 全屏切换
const timeOut = ref(null);
const screenfullIcon = shallowRef(FullscreenRound);
const screenfullChange = () => {
  if (screenfull.isEnabled) {
    screenfull.toggle();
    screenfullIcon.value = screenfull.isFullscreen
      ? FullscreenRound
      : FullscreenExitRound;
    // 延迟一段时间执行列表滚动
    timeOut.value = setTimeout(() => {
      lrcMouseStatus.value = false;
      lyricsScroll(music.getPlaySongLyricIndex);
    }, 500);
  }
};

// 前往评论 | 暂时废弃
const toComment = () => {
  music.setBigPlayerState(false);
  router.push({
    path: "/comment",
    query: {
      id: music.getPlaySongData ? music.getPlaySongData.id : null,
    },
  });
};

// 歌词滚动
const lyricsScroll = (index) => {
  const type = setting.lyricsBlock;
  const lrcType =
    !music.getPlaySongLyric.hasYrc || !setting.showYrc ? "lrc" : "yrc";
  const el = document.getElementById(lrcType + index);
  if (el && !lrcMouseStatus.value) {
    const container = el.parentElement;
    const containerHeight = container.clientHeight;
    // 调整滚动的距离
    const scrollDistance =
      el.offsetTop -
      container.offsetTop -
      (type === "center" ? containerHeight / 2 - el.offsetHeight / 2 : 80);
    container.scrollTo({
      top: scrollDistance,
      behavior: "smooth",
    });
  }
};

// 改变 PWA 应用标题栏颜色
const changePwaColor = () => {
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (music.showBigPlayer) {
    themeColorMeta.setAttribute("content", songPicColor);
  } else {
    if (setting.getSiteTheme === "light") {
      themeColorMeta.setAttribute("content", "#ffffff");
    } else if (setting.getSiteTheme === "dark") {
      themeColorMeta.setAttribute("content", "#18181c");
    }
  }
};

onMounted(async () => {
  console.log('music data', music.getPlaySongData)
  nextTick().then(() => {
    // 滚动歌词
    lyricsScroll(music.getPlaySongLyricIndex);
  });
});

onBeforeUnmount(() => {
  clearTimeout(timeOut.value);
});

// 监听页面是否打开
watch(
  () => music.showBigPlayer,
  (val) => {
    changePwaColor();
    if (val) {
      console.log("开启播放器", music.getPlaySongLyricIndex);
      nextTick().then(() => {
        music.showPlayList = false;
        lyricsScroll(music.getPlaySongLyricIndex);
      });
    }
  }
);

// 监听歌词滚动
watch(
  () => music.getPlaySongLyricIndex,
  (val) => lyricsScroll(val)
);

// 监听频谱更新
watch(() => music.getSpectrumsData, throttle(200, (val) => {
  if (!music.getPlayState || !setting.dynamicFlowSpeed) return;
  const variance = Math.max(Math.round(analyzeAudioIntensity(val) * setting.dynamicFlowSpeedScale * 7), 6)
  dynamicFlowSpeed.value = variance
}))

// 监听主题色改变
watch(
  () => site.songPicColor,
  () => changePwaColor());
// Computed volume icon
const volumeIcon = computed(() => {
  if (persistData.value.playVolume === 0) return VolumeOffRound;
  if (persistData.value.playVolume < 0.4) return VolumeMuteRound;
  if (persistData.value.playVolume < 0.7) return VolumeDownRound;
  return VolumeUpRound;
});

// Volume mute toggle
const volumeMute = () => {
  if (persistData.value.playVolume > 0) {
    persistData.value.playVolumeMute = persistData.value.playVolume;
    persistData.value.playVolume = 0;
  } else {
    persistData.value.playVolume = persistData.value.playVolumeMute;
  }
};

</script>

<style lang="scss" scoped>
.up-enter-active,
.up-leave-active {
  transform: translateY(0);
  transition: all 0.5s cubic-bezier(0.65, 0.05, 0.36, 1);
}

.up-enter-from,
.up-leave-to {
  transform: translateY(100%);
}

.lrc-enter-active,
.lrc-leave-active {
  transition: opacity 0.3s ease;
}

.lrc-enter-active {
  transition-delay: 0.3s;
}

.lrc-enter-from,
.lrc-leave-to {
  opacity: 0;
}

.bplayer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
  overflow: hidden;
  color: var(--main-cover-color);
  background-repeat: no-repeat;
  background-size: 150% 150%;
  background-position: center;
  display: flex;
  justify-content: center;

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: -1;

    &.solid {
      background: var(--cover-bg)
    }

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #00000060;
      backdrop-filter: blur(20px);
    }

    &.blur {
      display: flex;
      align-items: center;
      justify-content: center;

      .overlay-img {
        width: 150%;
        height: 150%;
        filter: blur(80px) contrast(1.2);
      }
    }

    &.none {
      &::after {
        display: none;
      }
    }
  }

  &::after {
    // content: "";
    position: absolute;
    top: 0;
    left: calc(50% - 2px);
    height: 100%;
    width: 4px;
    background-color: red;
  }

  .gray {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #00000030;
    -webkit-backdrop-filter: blur(80px);
    backdrop-filter: blur(80px);
    z-index: -1;

    &.blur {
      background-color: #00000060;
    }
  }

  .icon-menu {
    padding: 20px;
    width: 100%;
    height: 80px;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 2;
    box-sizing: border-box;

    .menu-left,
    .menu-right {
      display: flex;
      align-items: center;

      .icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        opacity: 0.3;
        border-radius: 8px;
        transition: all 0.3s;
        cursor: pointer;

        &:hover {
          background-color: #ffffff20;
          transform: scale(1.05);
          opacity: 1;
        }

        &:active {
          transform: scale(1);
        }

        .screenfull,
        .setting {
          @media (max-width: 768px) {
            display: none;
          }
        }
      }
    }

    .menu-right {
      .icon {
        margin-left: 12px;
      }
    }
  }

  .all {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    will-change: transform, padding-right;
    align-items: center;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;

    &.noLrc {
      .left {
        padding-right: 0;
        width: 50%;
        transform: translateX(25vh);

        @media (max-width: 1200px) {
          transform: translateX(22.2vh);
        }

        @media (min-width: 769px) and (max-width: 869px) {
          transform: translateX(20.1vh);
        }
      }

      @media (max-width: 768px) {
        .left {
          width: 100%;
          display: flex !important;
          transform: none;
          align-items: center;
        }

        .right {
          opacity: 0 !important;
          display: none;
        }
      }
    }

    @media (max-width: 768px) {
      .left {
        display: none !important;
      }

      .right {
        padding: 0 2vw;

        .lrcShow {
          .lrc-all {
            height: 70vh !important;
            margin-right: 0 !important;
          }

          .data,
          .menu {
            display: block !important;
            opacity: 1 !important;
          }
        }
      }
    }

    .tip {
      position: absolute;
      top: 24px;
      left: calc(50% - 150px);
      width: 300px;
      height: 40px;
      border-radius: 25px;
      background-color: #ffffff20;
      -webkit-backdrop-filter: blur(20px);
      backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: center;

      span {
        color: #ffffffc7;
      }
    }

    .left {
      transform: translateX(0);
      width: 40%;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      transition: all 0.3s ease-in-out;
      padding-right: 5rem;
      box-sizing: border-box;
    }

    .right {
      transform: translateX(0);
      flex: 1;
      height: 100%;

      .lrcShow {
        height: 100%;
        display: flex;
        justify-content: center;
        flex-direction: column;

        .data {
          padding: 0 3vh;
          margin-bottom: 8px;

          .name {
            font-size: 3vh;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            padding-right: 26px;

            span {
              &:nth-of-type(2) {
                margin-left: 12px;
                font-size: 2.3vh;
                opacity: 0.6;
              }
            }
          }

          .artists {
            margin-top: 4px;
            opacity: 0.6;
            font-size: 1.8vh;

            .artist {
              span {
                &:nth-of-type(2) {
                  margin: 0 2px;
                }
              }
            }
          }
        }

        .menu {
          opacity: 0;
          padding: 1vh 2vh;
          display: flex !important;
          justify-content: center;
          align-items: center;
          transition: all 0.3s;
          flex-direction: column;

          .time {
            display: flex;
            flex-direction: row;
            align-items: center;
            width: 100%;
            margin-right: 3em;
            margin-left: 3em;

            span {
              opacity: 0.8;
            }

            .vue-slider {
              margin: 0 10px;
              width: 100% !important;
              transform: translateY(-1px);
              cursor: pointer;


              :deep(.vue-slider-rail) {
                background-color: #ffffff20;
                border-radius: 25px;

                .vue-slider-process {
                  background-color: var(--main-cover-color) !important;
                }

                .vue-slider-dot {
                  width: 12px !important;
                  height: 12px !important;
                  box-shadow: none;
                }

                .vue-slider-dot-handle-focus {
                  box-shadow: none;
                }

                .vue-slider-dot-tooltip-inner {
                  background-color: var(--main-cover-color) !important;
                  backdrop-filter: blur(2px);
                  border: none
                }

                .vue-slider-dot-handle {
                  background-color: var(--main-cover-color) !important
                }

                .vue-slider-dot-tooltip-text {
                  color: black;
                }
              }
            }
          }

          .control {
            margin-top: 0.8em;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            transform: scale(1.4);

            .next,
            .prev,
            .dislike {
              cursor: pointer;
              padding: 4px;
              border-radius: 50%;
              transition: all 0.3s;

              &:hover {
                background-color: var(--main-color);
              }

              &:active {
                transform: scale(0.9);
              }
            }

            .dislike {
              padding: 9px;
            }

            .play-state {
              --n-width: 42px;
              --n-height: 42px;
              color: var(--main-cover-color);
              margin: 0 12px;
              transition:
                background-color 0.3s,
                transform 0.3s;

              .n-icon {
                transition: opacity 0.1s ease-in-out;
                color: var(--main-cover-color);
              }

              &:active {
                transform: scale(1);
              }
            }
          }

          &.show {
            opacity: 1;
          }

          .n-icon {
            font-size: 24px;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            opacity: 0.4;
            transition: all 0.3s;

            &:hover {
              background-color: #ffffff30;
            }

            &:active {
              transform: scale(0.95);
            }

            &.open {
              opacity: 1;
            }

          }
        }
      }
    }
  }

  .canvas {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    max-width: 1600px;
    z-index: -1;
    position: absolute;
    bottom: 0;
    -webkit-mask: linear-gradient(to right,
        hsla(0deg, 0%, 100%, 0) 0,
        hsla(0deg, 0%, 100%, 0.6) 15%,
        #fff 30%,
        #fff 70%,
        hsla(0deg, 0%, 100%, 0.6) 85%,
        hsla(0deg, 0%, 100%, 0));
    mask: linear-gradient(to right,
        hsla(0deg, 0%, 100%, 0) 0,
        hsla(0deg, 0%, 100%, 0.6) 15%,
        #fff 30%,
        #fff 70%,
        hsla(0deg, 0%, 100%, 0.6) 85%,
        hsla(0deg, 0%, 100%, 0));

    .avBars {
      max-width: 1600px;
      opacity: 0.6;
    }
  }
}

.immersive-controls-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2001; // Higher than bplayer
  display: flex;
  opacity: 0;
  justify-content: center;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }

  .immersive-controls {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    transition: opacity 0.3s ease;

    .controls-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(var(--main-cover-color), 0.14);
      backdrop-filter: blur(10px);
      z-index: -1;
    }

    .control-content {
      display: grid;
      grid-template-columns: minmax(200px, 1fr) minmax(400px, 2fr) minmax(200px, 1fr);
      gap: 2rem;
      padding: 1.5rem 2rem;
      align-items: center;
      color: rgb(var(--main-cover-color));

      .control-left {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        justify-content: flex-start;
      }

      .control-right {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        justify-content: flex-end;

        .volume-control {
          display: flex;
          align-items: center;

          :deep(.volume-slider) {
            width: 100px;
            margin: 0.5rem;

            .vue-slider-rail {
              background-color: rgba(var(--main-cover-color), 0.2);

              .vue-slider-process {
                background-color: rgb(var(--main-cover-color));
              }

              .vue-slider-dot-handle {
                background-color: rgb(var(--main-cover-color));
                box-shadow: none;
              }
            }
          }
        }
      }

      .control-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;

        .playback-controls {
          display: flex;
          align-items: center;
          gap: 2rem;

          .play-state {
            transform: scale(1.2);
            margin: 0 1rem;

            :deep(.n-button) {
              background-color: transparent;
              border: none;
              color: rgb(var(--main-cover-color));

              &:hover {
                background-color: rgba(var(--main-cover-color), 0.1);
              }
            }
          }
        }

        .progress-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          width: 100%;
          padding: 0 1rem;

          .time {
            font-size: 0.875rem;
            opacity: 0.8;
            min-width: 45px;
          }

          :deep(.vue-slider) {
            flex: 1;

            .vue-slider-rail {
              background-color: rgba(var(--main-cover-color), 0.2);
              height: 4px;
              border-radius: 2px;

              .vue-slider-process {
                background-color: rgb(var(--main-cover-color));
              }

              .vue-slider-dot {
                height: 12px;
                width: 12px;

                .vue-slider-dot-handle {
                  background-color: rgb(var(--main-cover-color));
                  box-shadow: none;
                }
              }
            }
          }
        }
      }
    }

    .control-icon {
      font-size: 24px;
      cursor: pointer;
      transition: all 0.2s ease;
      opacity: 0.8;

      &:hover {
        transform: scale(1.1);
        opacity: 1;
      }
    }
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .immersive-controls-container {
    .immersive-controls {
      .control-content {
        grid-template-columns: 1fr 2fr 1fr;
        gap: 1rem;
        padding: 1rem;

        .control-left, .control-right {
          gap: 1rem;
        }

        .control-center {
          .playback-controls {
            gap: 1rem;
          }

          .progress-bar {
            padding: 0;
          }
        }
      }
    }
  }
}
</style>
