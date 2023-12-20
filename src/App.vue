<template>
  <div>
    <!-- Beginn der NavBar -->
    <div class="navbar">
      <!-- <div class="cloud"></div> -->
      <div class="navbar-content">
        <input type="checkbox" id="checkbox2" class="checkbox2 visuallyHidden" v-model="menuOpen">
        <h1 class="navbar-title" @click="restartTutorial">Air Guardian</h1>
        <ion-button fill="clear" id="statusIndicator" :class="{ 'status-indicator': true, 'is-connected': isConnected }"
          @click="scanDevices"></ion-button>
      </div>
      <div v-for="cloud in clouds" :key="cloud.id" class="cloud" :style="{ 'left': cloudPosition(cloud.id) + '%' }">
        <span class="cloud-value">{{ cloud.value }}</span>
      </div>
    </div>
    <!-- Ende der NavBar -->
    <div v-if="showDeviceModal" class="modal">
      <!-- Warnmeldung für Firefox-Benutzer -->
      <div v-if="isFirefox" class="firefox-warning">
        Der Firefox-Browser wird nicht unterstützt.
      </div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>Wähle ein Gerät</h2>
          <span class="close-button" @click="showDeviceModal = false">&times;</span>
        </div>
        <div class="modal-body">
          <div class="button-container-selection">
            <div v-for="device in availableDevices" :key="device.deviceId" class="device-entry">
              <span :class="{ 'connected-device-name': connectedDeviceId === device.deviceId }">
                {{ device.name }}
              </span>
              <button @click="toggleDeviceConnection(device)"
                :class="{ 'button-connected': connectedDeviceId === device.deviceId, 'button-disconnected': connectedDeviceId !== device.deviceId }"
                :disabled="isConnected && connectedDeviceId !== device.deviceId">
                {{ connectedDeviceId === device.deviceId ? 'Trennen' : 'Verbinden' }}
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <!-- <button @click="disconnectFromSensor">Verbindung trennen</button>
          <button @click="showDeviceModal = false">Schließen</button> -->
        </div>
      </div>
    </div>
    <router-view></router-view>
  </div>
</template>


<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue';
import { IonButton, IonCheckbox } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useBluetooth } from './composables/useBluetooth';
import useStatusIndicator from './composables/useStatusIndicator';
import { useStore } from 'vuex';
import Shepherd from 'shepherd.js';

export default defineComponent({
  name: 'App',
  components: {
    IonButton,
    IonCheckbox
  },
  setup() {
    const router = useRouter();
    const { isConnected, connectToSensor, disconnectFromSensor, availableDevices, scanForDevices, connectedDeviceId } = useBluetooth();
    const { isConnectedIndicator } = useStatusIndicator();
    const showModal = ref(false);
    const menuOpen = ref(false);
    const store = useStore();
    const clouds = computed(() => store.getters.clouds);
    const tour = ref<Shepherd.Tour | null>(null);
    const showDeviceModal = ref(false);
    const isFirefox = ref(false);

    // Überprüft, ob es sich um Firefox handelt
    const checkBrowser = () => {
      const firefoxRegex = /firefox|fxios/i;
      isFirefox.value = firefoxRegex.test(navigator.userAgent);
      isFirefox.value = !('bluetooth' in navigator);
    };

    //Funktion, um die Position der Wolke zu berechnen
    function cloudPosition(id: number) {
      return (id % 100) * 10;
    }

    // Beobachtet die Werte und erstellt CO2 Wolken, wenn neue Werte hinzugefügt werden
    watch(() => store.state.co2Values, (newValues) => {
      if (newValues.length > 0) {
        const latestValue = newValues[newValues.length - 1];
        store.dispatch('createCloudWithValue', { type: 'co2', value: latestValue.value });
      }
    }, { deep: true });

    // Methode zum Initialisieren des Tutorials
    const initializeTutorial = () => {
      tour.value = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          classes: 'shadow-md bg-purple-dark',
          scrollTo: true
        }
      });

      // Schritt 1: Statusindikator
      tour.value.addStep({
        id: 'status-indicator',
        classes: 'custom-shepherd-step',
        text: `
    <div class="tutorial-status-indicator">
      Das ist der Statusindikator. Er zeigt dir an, ob eine Verbindung zur Sensorbox besteht.
      <br>
      <img class="status-indicator-img" src="images/statusIndicatorAn.png" alt="Verbindung hergestellt">Verbindung hergestellt</img>
      <br>
      <img class="status-indicator-img" src="images/statusIndicatorAus.png" alt="Verbindung verloren">Verbindung verloren</img>
    </div>
    `,
        attachTo: { element: '#statusIndicator', on: 'bottom' },
        buttons: [
          {
            text: 'Weiter 1/5',
            action: tour.value.next
          }
        ],
      });

      // Schritt 2: Gesamte Navbar
      tour.value.addStep({
        id: 'navbar',
        classes: 'custom-shepherd-step',
        text: `
    <div class="tutorial-cloud">
      In der Navigationsleiste erscheinen zwischendurch kleine Wölkchen, die neue CO2-Werte anzeigen.
      <br>
      <img class="status-indicator-img" src="images/clouds.png" alt="Tutorial Cloud"></img>
    </div>
    `,
        attachTo: { element: '.navbar', on: 'bottom' },
        buttons: [
          {
            text: 'Weiter 2/5',
            action: () => {
              if (tour.value) {
                tour.value.next();
                store.commit('SET_CURRENT_TUTORIAL_STEP', 'homepage');
              }
            }
          }
        ],
      });
    };

    // Methode, um das Tutorial neu zu starten
    const restartTutorial = () => {
      store.commit('SET_TUTORIAL_COMPLETED', false);
      store.commit('SET_CURRENT_TUTORIAL_STEP', 'app');
      initializeTutorial();
      if (tour.value) {
        tour.value.start();
      }
    };

    onMounted(() => {
      checkBrowser();
      if (!store.state.tutorialCompleted && store.state.currentTutorialStep === 'app') {
        initializeTutorial();
        if (tour.value) {
          tour.value.start();
        }
      }
    });

    const toggleMenu = () => {
      if (isConnected.value) {
        menuOpen.value = !menuOpen.value;
      }
    };


    const goToDashboard = () => {
      if (isConnected.value) {
        menuOpen.value = false;
        router.push({ name: 'Dashboard' });
      }
    };

    const goToHomePage = () => {
      menuOpen.value = false;
      router.push({ name: 'Homepage' });
    };

    const goToMap = () => {
      menuOpen.value = false;
      router.push({ name: 'MapView' });
    };


    const selectDevice = (device: { deviceId: string; }) => {
      if (device.deviceId !== connectedDeviceId.value) {
        connectToSensor(device);
        showDeviceModal.value = false;
      }
    };

    const connectToSensorBox = () => {
      showModal.value = false;
      if (!isConnected.value) {
        showDeviceModal.value = true;
      } else {
        disconnectFromSensor();
      }
    };

    const scanDevices = () => {
      checkBrowser();
      // Zeigt eine Warnung an, wenn Firefox verwendet wird
      if (isFirefox.value) {
        alert("Bitte beachten Sie, dass der Firefox-Browser nicht unterstützt wird.");
      } else {
        showDeviceModal.value = true;
        scanForDevices();
      }
    };

    const toggleDeviceConnection = (device: { deviceId: any; }) => {
      if (connectedDeviceId.value === device.deviceId) {
        disconnectFromSensor();
      } else if (!isConnected.value) {
        connectToSensor(device);
      }
    };


    watch(isConnected, (newVal) => {
      if (!newVal) {
        goToHomePage();
      }
    });

    return {
      isConnected,
      showModal,
      connectToSensorBox,
      isConnectedIndicator,
      goToDashboard,
      goToHomePage,
      goToMap,
      toggleMenu,
      menuOpen,
      clouds,
      cloudPosition,
      restartTutorial,
      availableDevices,
      showDeviceModal,
      selectDevice,
      scanForDevices,
      scanDevices,
      connectedDeviceId,
      disconnectFromSensor,
      toggleDeviceConnection,
      isFirefox
    };
  },
});
</script>


<style scoped>
#diagramButton {
  top: 0;
  left: 0;
}

/* Responsive Styles */
@media only screen and (max-width: 600px) {
  .navbar-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .navbar-title {
    font-size: 20px;
    margin-bottom: 5px;
  }

  .dropdown-menu {
    width: 100%;
  }

  .modal-content {
    width: 95%;
    margin: 10% auto;
  }

  .modal-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .modal-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media only screen and (min-width: 601px) and (max-width: 900px) {
  .dropdown-menu {
    width: 50%;
  }

  .modal-content {
    width: 70%;
  }
}

@media only screen and (min-width: 901px) and (max-width: 1200px) {
  .dropdown-menu {
    width: 40%;
  }

  .modal-content {
    width: 60%;
  }
}

@media only screen and (min-width: 1201px) {
  .dropdown-menu {
    width: 30%;
  }

  .modal-content {
    width: 50%;
  }
}

/* Styles für Modale und Navbar */
.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
}

.close-button {
  margin-left: auto;
  color: #aaa;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
}

.close-button:hover,
.close-button:focus {
  color: black;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
}

h2 {
  margin: 0;
  flex-grow: 1;
}

/* Navbar Hintergrund und Cloud Animation */
.navbar {
  background-image: linear-gradient(to top, rgba(58, 209, 141, 0.9) 2%, rgb(218, 216, 216) 10%, rgb(83, 140, 204) 60%);
  position: relative;
  overflow: hidden;
}

.cloud {
  background-image: url('/images/clouds.png');
  position: absolute;
  left: 0;
  animation: moveCloud 30s cubic-bezier(.16, .26, .55, .23) infinite;
  width: 30px;
  height: 20px;
  background-size: contain;
  transform: scale(0.8);
}

@keyframes moveCloud {
  0% {
    left: -80%;
  }

  100% {
    left: 100%;
  }
}

/* Anpassung der Cloud an diverse Formate */
@media (min-width: 769px) and (max-width: 1024px) {
  .cloud {
    width: 50px;
  }
}

@media (min-width: 1025px) {
  .cloud {
    top: -5px;
    width: 76px;
    height: 100%;
  }
}

/* Style für die Cloud-Value */
.cloud-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.4rem;
  color: #333;
}

/* Styles für Navbar */
.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.navbar-title {
  color: white;
  text-shadow: 2px 2px 3px rgba(0, 0, 0, 0.2);
  font-size: 24px;
  margin: 0;
  cursor: pointer;
}

.visuallyHidden {
  position: absolute;
  overflow: hidden;
  clip: rect(0 0 0 0);
  height: 1px;
  width: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
}

h1 {
  text-align: center;
}

/* Status indicator positioning */
#statusIndicator {
  margin-left: auto;
  align-self: center;
}
</style>
