import { BleClient, BleService } from '@capacitor-community/bluetooth-le';
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';

// Einmalige definition der SERVICE_UUID
const SERVICE_UUID = '7C97BB04-3D69-47A2-83D9-485ECFFB58D1';

const SERVICES = [
    {
        name: 'CO2',
        characteristicUuid: '61fac1c0-75c6-4216-a801-9241dea5eac6',
        storeMutation: 'addCo2Value',
        storeState: 'co2Values',
    },
    {
        name: 'TEMP_CO2',
        characteristicUuid: '5dc1191f-0350-4799-a4a8-a9e0eb067335',
        storeMutation: 'addtempCo2Value',
        storeState: 'temp_co2Values',
    },
    {
        name: 'PM10',
        characteristicUuid: '4ad5b788-47a5-483d-8a60-0368ccf4f9cc',
        storeMutation: 'addPM10Value',
        storeState: 'pm10Values',
    },
    {
        name: 'PM25',
        characteristicUuid: 'e46685f3-2b2c-4097-a7d2-b1898c95950f',
        storeMutation: 'addPM25Value',
        storeState: 'pm25Values',
    },
    {
        name: 'TEMPERATURE',
        characteristicUuid: 'cac23601-128a-4790-832e-c182f4a02780',
        storeMutation: 'addTempValue',
        storeState: 'tempValues',
    },
    {
        name: 'PRESS',
        characteristicUuid: 'a58239e5-aa19-4bf0-bd43-786ca3d5a1e3',
        storeMutation: 'addPressValue',
        storeState: 'pressValues',
    },
    {
        name: 'HUMID',
        characteristicUuid: '9e638ce2-f60e-4295-bbc9-d6282c2138f0',
        storeMutation: 'addHumidValue',
        storeState: 'humidValues',
    },
];

export function useBluetooth() {
    const autoConnect = ref(localStorage.getItem('autoConnect') === 'false');
    const isConnected = ref(false);
    const services = ref<BleService[]>([]);
    const decoder = new TextDecoder('utf-8');
    let dataString = '';
    const store = useStore();
    let deviceId = '';

    const connectToSensor = async () => {
        try {
            await BleClient.initialize();
            const device = await BleClient.requestDevice({
                services: [SERVICE_UUID], // Verwende SERVICE_UUID hier
            });

            await BleClient.connect(device.deviceId);
            services.value = await BleClient.getServices(device.deviceId);

            for (const serviceInfo of SERVICES) {
                const characteristic = serviceInfo.characteristicUuid;
                const serviceUuid = SERVICE_UUID;
                const storeMutation = serviceInfo.storeMutation;
                const storeState = serviceInfo.storeState;

                try {
                    BleClient.startNotifications(device.deviceId, serviceUuid, characteristic, (notifValue) => {
                        dataString = decoder.decode(notifValue.buffer);
                        const value = parseFloat(dataString);
                        store.commit(storeMutation, value);
                        store.commit('removeEmptyAndDuplicate');
                        console.log(`Aktuelle Werte im Vuex-Store (${storeState}): ${store.state[storeState]}`);
                    });
                } catch (error) {
                    console.error(`Fehler beim Starten der ${serviceInfo.name}-Benachrichtigungen:`, error);
                }
            }

            isConnected.value = true;
        } catch (error) {
            console.error('Verbindung fehlgeschlagen:', error);
        }
    };

    const disconnectFromSensor = async () => {
        isConnected.value = false;
        await BleClient.disconnect(deviceId);
    };

    const connectIfAuto = async () => {
        if (autoConnect.value) {
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wartet 1 Sekunde
            await connectToSensor();
        }
    };

    onMounted(connectIfAuto);

    const toggleAutoConnect = () => {
        autoConnect.value = !autoConnect.value;
        localStorage.setItem('autoConnect', autoConnect.value.toString());
        console.log('autoConnect toggled, new value:', autoConnect.value);
    };

    return { isConnected, connectToSensor, disconnectFromSensor, toggleAutoConnect, autoConnect };
}
