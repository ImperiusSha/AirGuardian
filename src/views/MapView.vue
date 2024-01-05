<template>
    <div class="swipe-area" @touchstart="handleTouchStart" @touchend="handleTouchEnd" @click="handleClick"
        @mousedown="handleMouseDown" @mouseup="handleMouseUp">
        <div class="line top-line"></div>
        <div class="line bottom-line"></div>
    </div>
    <div>
        <LeafletMap />
    </div>
</template>

<script lang="ts">
import LeafletMap from '@/components/LeafletMap.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
    setup() {
        const router = useRouter();
        const touchStartX = ref(0);
        const touchEndX = ref(0);
        const isMouseDown = ref(false);
        const mouseXStart = ref(0);
        const mouseXEnd = ref(0);

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX.value = e.touches[0].clientX;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            touchEndX.value = e.changedTouches[0].clientX;
            handleSwipeGesture();
        };

        const handleMouseDown = (e: MouseEvent) => {
            isMouseDown.value = true;
            mouseXStart.value = e.clientX;
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!isMouseDown.value) return;
            isMouseDown.value = false;
            mouseXEnd.value = e.clientX;
            handleSwipeGesture(true); // true für Maus-Event
        };

        const handleSwipeGesture = (isMouseEvent = false) => {
            const minSwipeDistance = 30;
            const start = isMouseEvent ? mouseXStart.value : touchStartX.value;
            const end = isMouseEvent ? mouseXEnd.value : touchEndX.value;
            if (end - start > minSwipeDistance) {
                // Swipe nach rechts
                router.push({ name: 'Homepage' });
            }
        };

        const handleClick = () => {
            router.push({ name: 'Homepage' });

        }

        return {
            handleTouchStart,
            handleTouchEnd,
            handleClick,
            handleMouseDown,
            handleMouseUp
        }
    },
    components: {
        LeafletMap
    }
}
</script>

<style scoped>
.swipe-area {
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 10%;
    background: rgba(0, 0, 0, 0.1);
    z-index: 1000;
}

.line {
    position: absolute;
    width: 40px;
    height: 1px;
    background-color: rgba(255, 255, 255, 0.7);
}

.top-line {
    top: 0;
    left: 0;
    transform: rotate(-45deg);
    transform-origin: top right;
    scale: 2.3;
}

.bottom-line {
    bottom: 0;
    left: 0;
    transform: rotate(45deg);
    transform-origin: bottom right;
    scale: 2.3;
}
</style>
