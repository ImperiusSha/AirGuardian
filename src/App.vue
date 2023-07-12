<template>
  <div>
    <ion-button fill="clear" id="statusIndicator" :class="{ 'status-indicator': true, 'is-connected': isConnected }" @click="showModal = true"></ion-button>
    <button @click="navigateToDashboard" class="btn btn-primary" id="diagramButton" :disabled="!isConnected">Diagramme</button>
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
    const { isConnected, connectToSensor, disconnectFromSensor, autoConnect, toggleAutoConnect  } = useBluetooth();
    const { isConnectedIndicator } = useStatusIndicator();
    const showModal = ref(false);
    
    const navigateToDashboard = () => {
      if (isConnected.value) {
        router.push('/dashboard');
      }
    };

    // Methode wird aufgerufen, wenn der Button geklickt wird
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
      navigateToDashboard,
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
</style>
