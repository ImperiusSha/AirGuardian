<template>
  <div class="background" :style="{ backgroundImage: `url(${backgroundImage})` }" @touchstart="handleTouchStart"
    @touchend="handleTouchEnd">
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import goodAir from '../assets/GuteLuft.gif';
import moderateAir from '../assets/MaeßigeLuft.gif';
import badAir from '../assets/SchlechteLuft.gif';

console.log("Startseite beginn");

export default defineComponent({
  setup() {
    console.log("Startseite setup erreicht");
    const router = useRouter();
    const store = useStore();
    const touchStartX = ref(0);
    const touchEndX = ref(0);
    const backgroundImage = ref(goodAir); // Initialer Wert
    console.log("Startseite GIF sollte initialisiert sein");

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.value = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX.value = e.changedTouches[0].clientX;
      handleSwipeGesture();
    };

    const handleSwipeGesture = () => {
      const minSwipeDistance = 30; // Minimale Distanz für einen Swipe
      if (touchEndX.value - touchStartX.value > minSwipeDistance) {
        // Swipe nach rechts
        router.push({ name: 'Dashboard' });
      } else if (touchStartX.value - touchEndX.value > minSwipeDistance) {
        // Swipe nach links
        router.push({ name: 'MapView' });
      }
    };

    watch(store.state.co2Values, (newValue: number | null) => {
      nextTick().then(() => {
        if (newValue !== null) {
          if (newValue < 1000) {
            backgroundImage.value = goodAir;
          } else if (newValue < 2000) {
            backgroundImage.value = moderateAir;
          } else {
            backgroundImage.value = badAir;
          }
        }
      })
    });

    const goToDashboard = () => {
      router.push({ name: 'Dashboard' });
    };

    return {
      goToDashboard,
      backgroundImage,
      handleTouchStart,
      handleTouchEnd,
    };
  },
})
</script>

<style scoped>
.background {
  background-size: cover;
  background-position: center;
  transition: background-image 3s ease-in-out;
  width: 100vw;
  height: 100vh;
}
</style>

