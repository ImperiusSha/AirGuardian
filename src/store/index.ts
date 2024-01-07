// store/index.ts

import { createStore } from 'vuex'

interface SensorDataPoint {
    timestamp: string;
    location: {
        lat: number;
        lng: number;
    };
    value?: number;
}

interface Cloud {
    type: string;
    value: number;
    id: number;
}

interface Notification {
    message: string;
    timestamp: string;
}

// Funktion, um Werte zu einem bestimmten Array hinzuzufügen und zu begrenzen
function addToValues(state: any, key: string, value: number) {
    const values = state[key];
    if (values.length === 0 || values[values.length - 1].value !== value) {
        values.push({
            timestamp: new Date().toISOString(),
            value: value,
        });
        if (values.length > 10) {
            values.shift();
        }
    }
}


export default createStore({
    state: {
        co2Values: [] as { timestamp: string, value: number }[],
        temp_co2Values: [] as { timestamp: string, value: number }[],
        pm10Values: [] as { timestamp: string, value: number }[],
        pm25Values: [] as { timestamp: string, value: number }[],
        tempValues: [] as { timestamp: string, value: number }[],
        pressValues: [] as { timestamp: string, value: number }[],
        humidValues: [] as { timestamp: string, value: number }[],
        sensorData: [] as SensorDataPoint[],
        isDataEverLoaded: false,
        clouds: [] as Cloud[],
        tutorialCompleted: false,
        currentTutorialStep: 'app',
        notifications: [] as Notification[],
    },
    mutations: {
        addCo2Value(state, value: number) {
            addToValues(state, 'co2Values', value);
            state.isDataEverLoaded = true;
        },
        addtempCo2Value(state, value: number) {
            addToValues(state, 'temp_co2Values', value);
            state.isDataEverLoaded = true;
        },
        addPM10Value(state, value: number) {
            addToValues(state, 'pm10Values', value);
            state.isDataEverLoaded = true;
        },
        addPM25Value(state, value: number) {
            addToValues(state, 'pm25Values', value);
            state.isDataEverLoaded = true;
        },
        addTempValue(state, value: number) {
            addToValues(state, 'tempValues', value);
            state.isDataEverLoaded = true;
        },
        addPressValue(state, value: number) {
            addToValues(state, 'pressValues', value);
            state.isDataEverLoaded = true;
        },
        addHumidValue(state, value: number) {
            addToValues(state, 'humidValues', value);
            state.isDataEverLoaded = true;
        },
        // Loeschen vorhandener Werte bei Verbindungstrennung
        resetSensorValues(state) {
            state.co2Values = [];
            state.temp_co2Values = [];
            state.pm10Values = [];
            state.pm25Values = [];
            state.tempValues = [];
            state.pressValues = [];
            state.humidValues = [];
            state.notifications = [];
        },
        // Entfernt doppelt Einträge durch die Verwendung von new Set()
        // Filtert leere Werte durch die Verwendung von filter()
        removeEmptyAndDuplicate(state) {
            const keys = [
                'co2Values',
                'temp_co2Values',
                'pm10Values',
                'pm25Values',
                'tempValues',
                'pressValues',
                'humidValues',
            ];
            keys.forEach((key) => {
                // @ts-ignore
                state[key] = [...new Set(state[key])].filter(
                    (value) => value !== null && value !== undefined && value.toString() !== ''
                );
            });
        },
        //Benachrichtigung über Verbindungsherstellung bzw. -trennung
        showNotification(state, message) {
            console.log("Vor der Aktualisierung:", state.notifications);
            const newNotification = {
                message: message,
                timestamp: new Date().toISOString(),
            };
            state.notifications.push(newNotification);
            console.log("Nach der Aktualisierung:", state.notifications);
        },
        SET_SENSOR_DATA(state, data) {
            state.sensorData = data;
        },
        ADD_LOCATION_AND_DATA(state, payload) {
            state.sensorData.push(payload);
        },
        CREATE_CLOUD_WITH_VALUE(state, payload: Cloud) {
            if (!state.clouds.length || state.clouds[state.clouds.length - 1].value !== payload.value) {
                state.clouds.push(payload);
            }
        },
        SET_TUTORIAL_COMPLETED(state, completed) {
            state.tutorialCompleted = completed;
        },
        SET_CURRENT_TUTORIAL_STEP(state, step) {
            state.currentTutorialStep = step;
        },
    },
    actions: {
        addLocationAndData({ commit }, payload) {
            commit('ADD_LOCATION_AND_DATA', payload);
        },
        createCloudWithValue({ commit }, payload) {
            commit('CREATE_CLOUD_WITH_VALUE', payload);
        },
        startTutorial({ commit }) {
            commit('SET_TUTORIAL_COMPLETED', false);
            commit('SET_CURRENT_TUTORIAL_STEP', 'app');
        },
    },
    getters: {
        sensorData: (state) => state.sensorData,
        clouds: (state) => state.clouds,
        notifications: (state) => state.notifications,
        latestNotification: state => {
            if (state.notifications.length > 0) {
                return state.notifications[state.notifications.length - 1];
            }
            return null;
        },
    },
    modules: {},
});