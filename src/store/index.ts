// store/index.ts

import { createStore } from 'vuex'

export interface SensorDataPoint {
    timestamp: string;
    location: {
        lat: number;
        lng: number;
    };
    values: {
        co2: number;
        pm10: number;
        pm25: number;
        temp: number;
        humidity: number;
    };
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
        // Begrenzung kann wenn nötig entfernt werden -> benötigt skalierende/zoombare Diagramme
        if (values.length > 10) {
            values.shift();
        }
    }
}


export default createStore({
    // Dient der Datenverwaltung, kann nur von Mutations beeinflusst werden
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
    // Synchrone Methoden, die genau beeinflussen, wie ein State bearbeitet werden soll
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
        ADD_LOCATION_AND_DATA(state, { location, values }) {
            const existingPoint = state.sensorData.find(p => p.location.lat === location.lat && p.location.lng === location.lng);
            if (existingPoint) {
                // Aktualisieren der Werte für den existierenden Standort
                existingPoint.values = values;
            } else {
                // Hinzufügen eines neuen SensorDataPoints
                state.sensorData.push({
                    timestamp: new Date().toISOString(),
                    location,
                    values,
                });
            }
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
    // (Koennen) Asynchrone Aufrufe von (mehreren) Mutations durchführen
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
    // Dienen zum Abrufen der Werte aus dem State
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
        latestCo2Value: (state) => {
            if (state.co2Values.length > 0) {
                return state.co2Values[state.co2Values.length - 1].value;
            }
            return null;
        },
        lastestPM10Value: (state) => {
            if (state.pm10Values.length > 0) {
                return state.pm10Values[state.pm10Values.length - 1].value;
            }
            return null;
        },
        latestPM25Value: (state) => {
            if (state.pm25Values.length > 0) {
                return state.pm25Values[state.pm25Values.length - 1].value;
            }
            return null;
        },
        latestTempValue: (state) => {
            if (state.tempValues.length > 0) {
                return state.tempValues[state.tempValues.length - 1].value;
            }
            return null;
        },
        latestHumidityValue: (state) => {
            if (state.humidValues.length > 0) {
                return state.humidValues[state.humidValues.length - 1].value;
            }
            return null;
        },
    },
    modules: {},
});