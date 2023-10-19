<template>
  <div>
    <!-- Beginn der NavBar -->
    <div class="navbar">
      <div class="navbar-content">
        <input type="checkbox" id="checkbox2" class="checkbox2 visuallyHidden" v-model="menuOpen">
        <label :class="{ 'hamburger-disabled': !isConnected }" for="checkbox2">
          <div class="hamburger hamburger2">
            <span class="bar bar1"></span>
            <span class="bar bar2"></span>
            <span class="bar bar3"></span>
            <span class="bar bar4"></span>
          </div>
        </label>
        <h1 class="navbar-title">AirGuardian</h1>
        <ion-button fill="clear" id="statusIndicator" :class="{ 'status-indicator': true, 'is-connected': isConnected }"
          @click="showModal = true"></ion-button>
      </div>
      <div v-if="menuOpen" class="dropdown-menu">
        <ion-button @click="goToHomePage">Startseite</ion-button>
        <ion-button @click="goToDashboard">Dashboard</ion-button>
      </div>
    </div>
    <!-- Ende der NavBar -->
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <span class="close-button" @click="showModal = false">&times;</span>
        <h2>Verbindung zur Sensorbox</h2>
        <ion-checkbox v-model="autoConnect" @ionChange="toggleAutoConnect">Automatisch</ion-checkbox>
        <div>
          <ion-button @click="showModal = false">Abbrechen</ion-button>
          <ion-button @click="connectToSensorBox">Verbinden</ion-button>
        </div>
      </div>
    </div>
    <router-view></router-view>
  </div>
</template>


<script lang="ts">
import { defineComponent, ref } from 'vue';
import { IonButton, IonCheckbox } from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useBluetooth } from './composables/useBluetooth';
import useStatusIndicator from './composables/useStatusIndicator';

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

    const toggleMenu = () => {
      if (isConnected.value) {
        menuOpen.value = !menuOpen.value;
      }
    };


    const goToDashboard = () => {
      if (isConnected.value) {
        router.push({ name: 'Dashboard' });
      }
    };

    const goToHomePage = () => {
      router.push({ name: 'Homepage' });
    }; 

    const connectToSensorBox = () => {
      showModal.value = false;
      if (!isConnected.value) {
        connectToSensor();
      } else {
        disconnectFromSensor();
      }
    };

    return {
      isConnected,
      showModal,
      connectToSensorBox,
      autoConnect,
      toggleAutoConnect,
      isConnectedIndicator,
      goToDashboard,
      goToHomePage,
      toggleMenu,
      menuOpen
    };
  },
});
</script>


<style>
#diagramButton {
  top: 0;
  left: 0;
}
</style>

<style scoped>
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
  background-color: rgb(0, 0, 0);
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
}

.close-button {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close-button:hover,
.close-button:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

.navbar {
  background-color: #1E88E5;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.navbar-title {
  color: white;
  font-size: 24px;
  margin: 0;
  cursor: pointer;
}

.bar {
  width: 25px;
  height: 3px;
  background-color: white;
}

/* Allgemeine Styling-Anpassungen für das Dropdown-Menü */
.dropdown-menu {
  display: block;
  background-color: #1E88E5;
  position: absolute;
  top: 100%;
  left: 0;
  border-radius: 0px;
  z-index: 1001;
  width: 30%;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  border-top: 3px solid #1E88E5;
}

/* Styling für die Buttons innerhalb des Dropdown-Menüs */
.dropdown-menu ion-button {
  width: 100%;
  justify-content: flex-start;
  padding: 10px 20px;
  background-color: #BBDEFB;
  color: white;
  border: none;
  text-align: left;
  transition: background-color 0.3s ease;
}

/* Hover-Effekt für die Buttons */
.dropdown-menu ion-button:hover {
  background-color: #90CAF9;
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

.container {
  width: 70%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
}

.hamburger {
  margin: 0 auto;
  width: 30px;
  height: 30px;
  position: relative;
  margin-right: 15px;
}

.hamburger-disabled {
  opacity: 0.25;
  pointer-events: none;
}

.hamburger .bar {
  padding: 0;
  width: 30px;
  height: 4px;
  background-color: #ddd;
  display: block;
  border-radius: 4px;
  transition: all 0.4s ease-in-out;
  position: absolute;
}

.bar1 {
  top: 0;
}

.bar2,
.bar3 {
  top: 13.5px;
}

.bar3 {
  right: 0;
}

.bar4 {
  bottom: 0;
}

.checkbox2:checked+label>.hamburger2>.bar1 {
  transform: translateX(40px);
  background-color: transparent;
}

.checkbox2:checked+label>.hamburger2>.bar2 {
  transform: rotate(45deg);
}

.checkbox2:checked+label>.hamburger2>.bar3 {
  transform: rotate(-45deg);
}

.checkbox2:checked+label>.hamburger2>.bar4 {
  transform: translateX(-40px);
  background-color: transparent;
}

#statusIndicator {
  margin-left: auto;
  align-self: center;
}</style>
