<template>
  <div>
    <!-- Beginn der NavBar -->
    <div class="navbar">
      <!-- <div class="cloud"></div> -->
      <div class="navbar-content">
        <input type="checkbox" id="checkbox2" class="checkbox2 visuallyHidden" v-model="menuOpen">
        <h1 class="navbar-title">Air Guardian</h1>
        <ion-button fill="clear" id="statusIndicator" :class="{ 'status-indicator': true, 'is-connected': isConnected }"
          @click="showModal = true"></ion-button>
      </div>
      <div v-for="cloud in clouds" :key="cloud.id" class="cloud" :style="{ 'left': cloudPosition(cloud.id) + '%' }">
        <span class="cloud-value">{{ cloud.value }}</span>
      </div>
    </div>
    <!-- Ende der NavBar -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Verbindung zur Sensorbox</h2>
          <span class="close-button" @click="showModal = false">&times;</span>
        </div>
        <ion-checkbox v-model="autoConnect" @ionChange="toggleAutoConnect">Automatisch</ion-checkbox>
        <div class="modal-footer">
          <ion-button @click="showModal = false">Abbrechen</ion-button>
          <ion-button @click="connectToSensorBox">Verbinden</ion-button>
        </div>
      </div>
    </div>
    <router-view></router-view>
  </div>
</template>


<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { IonButton, IonCheckbox } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useBluetooth } from './composables/useBluetooth';
import useStatusIndicator from './composables/useStatusIndicator';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'App',
  components: {
    IonButton,
    IonCheckbox
  },
  setup() {
    const router = useRouter();
    const { isConnected, connectToSensor, disconnectFromSensor, autoConnect, toggleAutoConnect } = useBluetooth();
    const { isConnectedIndicator } = useStatusIndicator();
    const showModal = ref(false);
    const menuOpen = ref(false);
    const store = useStore();
    const clouds = computed(() => store.getters.clouds);

        // Beispiel für eine Funktion, um die Position der Wolke zu berechnen
        function cloudPosition(id: number) {
      // Hier würde Ihre Logik stehen, um die Position der Wolke basierend auf der ID oder Zeit zu berechnen
      return (id % 100) * 10; // Beispiel: Position basierend auf der ID
    }

    // Beobachten Sie die Werte und erstellen Sie Wolken, wenn neue Werte hinzugefügt werden
    watch(() => store.state.co2Values, (newValues) => {
      if (newValues.length > 0) {
        const latestValue = newValues[newValues.length - 1];
        store.dispatch('createCloudWithValue', { type: 'co2', value: latestValue.value });
      }
    }, { deep: true });

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


    const connectToSensorBox = () => {
      showModal.value = false;
      if (!isConnected.value) {
        connectToSensor();
      } else {
        disconnectFromSensor();
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
      autoConnect,
      toggleAutoConnect,
      isConnectedIndicator,
      goToDashboard,
      goToHomePage,
      goToMap,
      toggleMenu,
      menuOpen,
      clouds,
      cloudPosition
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
    flex-direction: column;
    align-items: flex-start;
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
