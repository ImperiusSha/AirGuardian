import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';

interface BluetoothDevice {
    deviceId: string;
    name?: string;
}

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
    const selectedDevice = ref<BluetoothDevice | null>(null);

    const isMobileDevice = () => {
        const userAgent = navigator.userAgent || navigator.vendor;
        return /android|iphone|ipad|ipod|windows phone/i.test(userAgent);
    };

    const isFirefoxBrowser = () => {
        return /firefox/i.test(navigator.userAgent);
    };

    const scanForDevices = async () => {
        if (isMobileDevice()) {
            await scanForDevicesMobile();
        } else if (!isFirefoxBrowser()) {
            await scanForDevicesBrowser();
        }
    };

    onMounted(async () => {
        isBluetoothAvailable.value = 'bluetooth' in navigator && typeof (navigator as any).bluetooth.requestDevice === 'function';
    });

    // Funktion für das Scannen auf mobilen Geräten
    const scanForDevicesMobile = async () => {
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

    // Funktion für das Scannen in Browsern (außer Firefox)
    const scanForDevicesBrowser = async () => {
        availableDevices.value = [];
        try {
            const device = await (navigator as any).bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['3f55130b-0ef5-4d81-b9d4-618a5ccbf2ac'] // Muss aktuell noch fest definiert werden
            });
            selectedDevice.value = {
                deviceId: device.id,
                name: device.name
            };
            availableDevices.value.push(device);
            console.log('Gefundenes Gerät:', device);
        } catch (error) {
            console.error('Fehler beim Scannen (Browser):', error);
        }
    };


    const MAX_ATTEMPTS = 3;
    const RETRY_INTERVAL = 5000;

    // Funktion zur Überprüfung des Verbindungsstatus
    const checkConnectionStatus = async () => {
        let attempts = 0;

        // Versucht 3x, die Verbindung wiederherzustellen
        while (attempts < MAX_ATTEMPTS && !isConnected.value) {
            try {
                await BleClient.readRssi(connectedDeviceId.value);
                isConnected.value = true;
                store.commit('showNotification', 'Verbindung erfolgreich wiederhergestellt.');
                break; // Verbindung erfolgreich, Schleife beenden
            } catch (error) {
                attempts++;
                if (attempts < MAX_ATTEMPTS) {
                    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
                } else {
                    isConnected.value = false;
                    store.commit('showNotification', 'Verbindung endgültig getrennt.');
                    store.commit('resetSensorValues');
                }
            }
        }
    };

    // Funktion zum Verbinden mit dem Gerät für Web
    const connectToDeviceWeb = async () => {
        try {
            console.log('Anfrage nach einem Bluetooth-Gerät...');
            const device = await (navigator as any).bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['3f55130b-0ef5-4d81-b9d4-618a5ccbf2ac'] // Die Service UUID, muss aktuell fest definiert werden für Web
            });

            console.log('Verbindung zum Gerät herstellen...');
            const server = await device.gatt.connect();
            selectedDevice.value = { deviceId: device.id, name: device.name };
            isConnected.value = true;
            connectedDeviceId.value = device.id;
            // store.commit('showNotification', 'Verbindung erfolgreich hergestellt.');

            console.log('Hole alle Services vom Gerät...');
            const services = await server.getPrimaryServices();

            for (const service of services) {
                console.log(`Arbeite mit Custom Service: ${service.uuid}`);
                const characteristics = await service.getCharacteristics();

                for (const characteristic of characteristics) {
                    if (CHARACTERISTICS.map(c => c.toLowerCase()).includes(characteristic.uuid)) {
                        if (characteristic.properties.notify) {
                            try {
                                await characteristic.startNotifications();
                                characteristic.addEventListener('characteristicvaluechanged', (event: { target: { value: { buffer: AllowSharedBufferSource | undefined; }; }; }) => {
                                    const value = decoder.decode(event.target.value.buffer);
                                    const mutation = getMutationForCharacteristic(characteristic.uuid);
                                    if (mutation) {
                                        console.log(`Empfangener Wert für ${characteristic.uuid}:`, value);
                                        store.commit(mutation, parseFloat(value));
                                    } else {
                                        console.warn(`Keine Vuex-Mutation zugeordnet für die Charakteristik: ${characteristic.uuid}`);
                                    }
                                });
                                console.log(`Benachrichtigungen für ${characteristic.uuid} gestartet.`);
                            } catch (error) {
                                console.error(`Fehler beim Starten der Benachrichtigungen für Charakteristik ${characteristic.uuid}:`, error);
                            }
                        } else {
                            console.log(`Charakteristik ${characteristic.uuid} unterstützt keine Benachrichtigungen.`);
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Verbindung fehlgeschlagen:', error);
            isConnected.value = false;
            connectedDeviceId.value = '';
            store.commit('showNotification', 'Verbindung fehlgeschlagen: ' + error);
        }
    };

    const connectToSensor = async (device: BluetoothDevice) => {
        if (isMobileDevice()) {
            // Mobile Plattform: Verwenden des @capacitor-community/bluetooth-le Plugin
            console.log('connectToSensor aufgerufen mit Gerät:', device.name);
            try {
                console.log('Stoppe BLE-Scan');
                await BleClient.stopLEScan();

                console.log('Verbinden mit Gerät: ' + device.deviceId);
                await BleClient.connect(device.deviceId);

                console.log('Hole Services vom Gerät:', device.deviceId);
                const servicesFromDevice = await BleClient.getServices(device.deviceId);
                console.log('Gefundene Services:', servicesFromDevice);

                // Abfangen aller CustomServices, die nicht zu den Primary-Services gehören
                const customService = servicesFromDevice.find(service => !service.uuid.startsWith('0000'));
                if (!customService) {
                    throw new Error('Kein Custom Service gefunden.');
                }

                // Abonnieren der Characteristics zum erhalt der Daten aus der Sensorbox
                console.log('Abonniere Benachrichtigungen für Charakteristiken');
                for (const charUuid of CHARACTERISTICS) {
                    try {
                        await BleClient.startNotifications(device.deviceId, customService.uuid, charUuid, (notifValue) => {
                            const value = decoder.decode(notifValue.buffer);
                            const mutation = getMutationForCharacteristic(charUuid);
                            if (mutation) {
                                console.log(`Empfangener Wert für ${charUuid}:`, value);
                                store.commit(mutation, parseFloat(value));
                            } else {
                                console.warn(`Keine Vuex-Mutation zugeordnet für die Charakteristik: ${charUuid}`);
                            }
                        });
                    } catch (error) {
                        console.error(`Fehler beim Abonnieren der Charakteristik ${charUuid}:`, error);
                    }
                }

                console.log('Verbindung zum Gerät erfolgreich hergestellt:', device.deviceId);
                isConnected.value = true;
                connectedDeviceId.value = device.deviceId;
                store.commit('showNotification', 'Verbindung erfolgreich hergestellt.');

                console.log('Setze regelmäßige Überprüfung der Verbindung');
                setInterval(checkConnectionStatus, 30000);
            } catch (error) {
                console.error('Verbindung fehlgeschlagen:', error);
                store.commit('showNotification', 'Verbindung fehlgeschlagen: ' + error);
                isConnected.value = false;
                connectedDeviceId.value = '';
            }
        } else {
            // Web Plattform: Verwendet die Web Bluetooth API
            await connectToDeviceWeb();
        }
    };

    const disconnectFromSensor = async () => {
        try {
            if (connectedDeviceId.value) {
                await BleClient.disconnect(connectedDeviceId.value);
                isConnected.value = false;
                connectedDeviceId.value = '';
                store.commit('showNotification', 'Verbindung getrennt.');
                store.commit('resetSensorValues');
            }
        } catch (error) {
            store.commit('showNotification', 'Fehler beim Trennen der Verbindung: ' + error);
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