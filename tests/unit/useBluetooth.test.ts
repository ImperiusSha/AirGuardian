import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBluetooth } from '../../src/composables/useBluetooth';
import { BleClient } from '@capacitor-community/bluetooth-le';
import store from '../../src/store/index'
import { createApp } from 'vue';

// Mock für BLE
vi.mock('@capacitor-community/bluetooth-le', () => ({
    BleClient: {
        initialize: vi.fn(() => Promise.resolve()),
        requestLEScan: vi.fn(() => Promise.resolve()),
        connect: vi.fn(() => Promise.resolve()),
        disconnect: vi.fn(() => Promise.resolve()),
        getServices: vi.fn(() => Promise.resolve()),
        startNotifications: vi.fn(() => Promise.resolve()),
        readRssi: vi.fn(() => Promise.resolve()),
        stopLEScan: vi.fn(() => Promise.resolve()),
    }
}));

describe('useBluetooth', () => {
    let app;

    beforeEach(() => {
        // Erstellen einer Vue-Instanz und hinzufügen des Vuex-Store
        app = createApp({ /* Root-Komponente */ });
        app.use(store);
        // Reseted alle Mocks vor einem Test
        vi.clearAllMocks();
    });

    it('scanForDevices sollte Geräte scannen und die Liste aktualisieren', async () => {
        const { scanForDevices, availableDevices } = useBluetooth();

        await scanForDevices();

        expect(BleClient.requestLEScan).toHaveBeenCalled();
        // Es wurde kein Mock für das Scan-Ergebnis gesetzt, daher eine leere Liste
        expect(availableDevices.value).toEqual([]);
    });

    afterEach(() => {
        // Clear der Vuex-Mutation nach jedem Test
        store.commit('resetSensorValues');
    });
});