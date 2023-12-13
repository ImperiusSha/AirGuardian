<template>
  <div class="background" :style="{ backgroundImage: `url(${backgroundImage})` }" @touchstart="handleTouchStart"
    @touchend="handleTouchEnd">
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, ref, nextTick, Ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import goodAir from '../assets/GuteLuft.gif';
import moderateAir from '../assets/MaeßigeLuft.gif';
import badAir from '../assets/SchlechteLuft.gif';
import { onMounted } from 'vue';
import Shepherd from 'shepherd.js';

console.log("Startseite beginn");

export default defineComponent({
  setup() {
    console.log("Startseite setup erreicht");
    const router = useRouter();
    const store = useStore();
    const touchStartX = ref(0);
    const touchEndX = ref(0);
    const backgroundImage = ref(goodAir); // Initialer Wert
    const tour = ref<Shepherd.Tour | null>(null);

    onMounted(() => {
      if (!tour.value && store.state.currentTutorialStep === 'homepage' && !store.state.tutorialCompleted) {
        initializeHomePageTutorial();
      }
    });

    function initializeHomePageTutorial() {
      tour.value = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          classes: 'shadow-md bg-purple-dark',
          scrollTo: true
        }
      });

      // Schritt 3: Background
      tour.value.addStep({
        id: 'background',
        text:  `
        <div class="tutorial-background">
          <span>Der Hintergrund passt sich dynamisch an deine Umgebungsverhältnisse an.</span>
          <img class="background-good" src="src/assets/GuteLuft.gif" alt="Gute Luft">
          <img class="background-medium" src="src/assets/MaeßigeLuft.gif" alt="Mäßige Luft">
          <img class="background-bad" src="src/assets/SchlechteLuft.gif" alt="Schlechte Luft">
        </div>`
        ,
        attachTo: { element: '.background', on: 'bottom' },
        buttons: [
          {
            text: 'Weiter 3/5',
            action: tour.value.next
          }
        ]
      });

      // Schritt 4: Wischgesten-Navigation
      tour.value.addStep({
        id: 'swipe-navigation',
        text: `
    <div class="tutorial-swipe-right">
      <span>Wische nach rechts, um zu den Diagrammen zu gelangen.</span>
      <br>
      <img class="swipe-gif" src="images/swipe.gif" alt="Swipe Right"></img>
    </div>
    `,
        attachTo: { element: '.swipe-area', on: 'bottom' },
        buttons: [
          {
            text: 'Weiter 4/5',
            action: tour.value.next
          }
        ]
      });

      // Schritt 5: Wischgesten-Navigation
      tour.value.addStep({
        id: 'swipe-navigation-left',
        text: `
              <div class="tutorial-swipe-left">
                  <span>Wische nach links, um zur Karte zu gelangen.</span>
                  <br>
                  <img class="swipe-gif" src="images/swipe-left.gif" alt="Swipe Left"></img>
              </div>
            `,
        attachTo: { element: '.swipe-area', on: 'bottom' },
        buttons: [
          {
            text: 'Fertig 5/5',
            action: () => {
              if (tour.value) {
                tour.value.complete();
                store.commit('SET_TUTORIAL_COMPLETED', true);
              }
            }
          }
        ]
      });
    }

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

    watch(() => store.state.currentTutorialStep, (newStep) => {
      if (newStep === 'homepage' && !store.state.tutorialCompleted) {
        initializeHomePageTutorial();
        if (tour.value) {
          tour.value.start();
        }
      }
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

