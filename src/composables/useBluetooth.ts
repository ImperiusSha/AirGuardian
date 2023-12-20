import { BleClient, BleDevice, BleService } from '@capacitor-community/bluetooth-le';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const CHARACTERISTICS = [
    '61fac1c0-75c6-4216-a801-9241dea5eac6', //CO2
    '5dc1191f-0350-4799-a4a8-a9e0eb067335', //TEMP_CO2
    '4ad5b788-47a5-483d-8a60-0368ccf4f9cc', //PM10
    'e46685f3-2b2c-4097-a7d2-b1898c95950f', //PM25
    'cac23601-128a-4790-832e-c182f4a02780', //TEMP
    'a58239e5-aa19-4bf0-bd43-786ca3d5a1e3', //PRESS
    '9e638ce2-f60e-4295-bbc9-d6282c2138f0', //HUMID
];

export function useBluetooth() {
    const isConnected = ref(false);
    const availableDevices = ref<BleDevice[]>([]);
    const decoder = new TextDecoder('utf-8');
    const store = useStore();
    const isBluetoothAvailable = ref(false);
    const connectedDeviceId = ref('');

    onMounted(() => {
        isBluetoothAvailable.value = 'bluetooth' in navigator && typeof (navigator as any).bluetooth.requestDevice === 'function';
    });

    const scanForDevices = async () => {
        availableDevices.value = [];
        try {
            await BleClient.initialize();
            await BleClient.requestLEScan({}, (result) => {
                const deviceName = result.device.name || '';
                // Fügt die gefundenen Geräte zur Liste hinzu, wenn sie nicht bereits vorhanden waren
                if (deviceName.toLowerCase().includes('sensor') && !availableDevices.value.some(device => device.deviceId === result.device.deviceId)) {
                    availableDevices.value.push(result.device);
                    console.log('Gefundenes Gerät:', result.device);
                }
            });
        } catch (error) {
            console.error('Fehler beim Scannen:', error);
        }
    };

    const connectToSensor = async (device: { deviceId: string; }) => {
        try {
            if (connectedDeviceId.value && connectedDeviceId.value !== device.deviceId) {
                await disconnectFromSensor();
            }
            await BleClient.stopLEScan();
            await BleClient.connect(device.deviceId);
    
            // Abholen der vorhandenen Services
            const servicesFromDevice = await BleClient.getServices(device.deviceId);
    
            // Nimmt den ersten Service, der nicht zu den generischen gehört ('0000')
            const customService = servicesFromDevice.find(service => !service.uuid.startsWith('0000'));
            if (!customService) {
                throw new Error('Kein Custom Service gefunden.');
            }
    
            // Abonniert die Benachrichtigungen für jede bekannte Charakteristik
            for (const charUuid of CHARACTERISTICS) {
                try {
                    await BleClient.startNotifications(device.deviceId, customService.uuid, charUuid, (notifValue) => {
                        const value = decoder.decode(notifValue.buffer);
                        const mutation = getMutationForCharacteristic(charUuid);
                        if (mutation) {
                            store.commit(mutation, parseFloat(value));
                        } else {
                            console.warn(`Keine Vuex-Mutation zugeordnet für die Charakteristik: ${charUuid}`);
                        }
                    });
                } catch (error) {
                    console.error(`Fehler beim Abonnieren der Charakteristik ${charUuid}:`, error);
                }
            }
    
            isConnected.value = true;
            connectedDeviceId.value = device.deviceId;
        } catch (error) {
            console.error('Verbindung fehlgeschlagen:', error);
            isConnected.value = false;
            connectedDeviceId.value = '';
        }
    };

    const disconnectFromSensor = async () => {
        if (connectedDeviceId.value) {
            await BleClient.disconnect(connectedDeviceId.value);
            isConnected.value = false;
            connectedDeviceId.value = '';
            store.commit('resetSensorValues');
        }
    };

    return { isConnected, connectToSensor, disconnectFromSensor, isBluetoothAvailable, availableDevices, scanForDevices, connectedDeviceId };
}


// Hilfsfunktion, um die Vuex-Mutation auf der Grundlage der Charakteristik-UUID zu bestimmen
function getMutationForCharacteristic(uuid: string): string {
    const mappings: { [key: string]: string } = {
        '61fac1c0-75c6-4216-a801-9241dea5eac6': 'addCo2Value',
        '5dc1191f-0350-4799-a4a8-a9e0eb067335': 'addtempCo2Value',
        '4ad5b788-47a5-483d-8a60-0368ccf4f9cc': 'addPM10Value',
        'e46685f3-2b2c-4097-a7d2-b1898c95950f': 'addPM25Value',
        'cac23601-128a-4790-832e-c182f4a02780': 'addTempValue',
        'a58239e5-aa19-4bf0-bd43-786ca3d5a1e3': 'addPressValue',
        '9e638ce2-f60e-4295-bbc9-d6282c2138f0': 'addHumidValue',
    };
    const mutation = mappings[uuid];
    if (!mutation) {
        throw new Error(`Mutation not found for characteristic UUID: ${uuid}`);
    }
    return mutation;
}