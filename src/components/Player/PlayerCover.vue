<template>
  <div class="cover">
    <Transition name="fade" mode="out-in">
      <div :key="`cover_pic--${music.getPlaySongData.album.pic}`"
        :class="['pic', !music.getPlayState ? 'pause' : '', music.getLoadingState ? 'loading' : '']">
        <img class="album" :src="music.getPlaySongData
          ? music.getPlaySongData.album.picUrl.replace(/^http:/, 'https:') +
          '?param=1024y1024'
          : '/images/pic/default.png'
          " alt="cover" />
        <img class="shadow" :src="music.getPlaySongData
          ? music.getPlaySongData.album.picUrl.replace(/^http:/, 'https:') +
          '?param=1024y1024'
          : '/images/pic/default.png'
          " alt="shadow" />

        <!-- Hover Metadata -->
        <div class="metadata-overlay">
          <div class="song-info">
            <div class="title text-hidden">
              {{ music.getPlaySongData ? music.getPlaySongData.name : $t("other.noSong") }}
              <span v-if="music.getPlaySongData && music.getPlaySongData.alia">
                {{ music.getPlaySongData.alia[0] }}
              </span>
            </div>
            <div class="artist text-hidden" v-if="music.getPlaySongData && music.getPlaySongData.artist">
              <AllArtists :artistsData="music.getPlaySongData.artist" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import {
  PlayArrowRound,
  PauseRound,
  SkipNextRound,
  SkipPreviousRound,
  MessageFilled,
  ThumbDownRound,
  FavoriteBorderRound,
  FavoriteRound,
  VolumeOffRound,
  VolumeMuteRound,
  VolumeDownRound,
  VolumeUpRound,
} from "@vicons/material";
import { PlayCycle, PlayOnce, ShuffleOne } from "@icon-park/vue-next";
import { musicStore, userStore } from "@/store";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { setSeek } from "@/utils/Player";
import AllArtists from "@/components/DataList/AllArtists.vue";
import VueSlider from "vue-slider-component";
import "vue-slider-component/theme/default.css";

const router = useRouter();
const music = musicStore();
const user = userStore();
const { persistData } = storeToRefs(music);

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

// 页面跳转
const routerJump = (url, query) => {
  music.setBigPlayerState(false);
  router.push({
    path: url,
    query,
  });
};

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
.cover {
  .pic {
    position: relative;
    width: 50vh;
    height: 50vh;
    z-index: 1;
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
      filter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

    &.pause {
      transform: scale(0.9);
    }

    &.loading {
      transform: scale(0.9);
      filter: opacity(0.2) grayscale(0.8);
    }

    @media (max-width: 1200px) {
      width: 44vh;
      height: 44vh;
    }

    @media (max-width: 870px) {
      width: 40vh;
      height: 40vh;
    }

    .album {
      width: 100%;
      height: 100%;
      border-radius: 8px;
    }

    .shadow {
      position: absolute;
      left: 0;
      top: 12px;
      height: 100%;
      width: 100%;
      filter: blur(16px) opacity(0.6);
      transform: scale(0.92, 0.96);
      z-index: -1;
      background-size: cover;
      aspect-ratio: 1/1;
    }
  }

  .metadata-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1.5rem;
    background: rgba(var(--main-cover-color), 0.14);
    backdrop-filter: blur(10px);
    opacity: 0;
    transition: opacity 0.3s ease;
    color: rgb(var(--main-cover-color));
    z-index: 2;

    .song-info {
      .title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .artist {
        font-size: 1rem;
        opacity: 0.8;
      }
    }
  }

  &:hover .metadata-overlay {
    opacity: 1;
  }
}
</style>
