import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import HomePage from './views/HomePage.vue';
import Dashboard from './views/Dashboard.vue';

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Homepage',
        component: HomePage,
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});


export default router;
