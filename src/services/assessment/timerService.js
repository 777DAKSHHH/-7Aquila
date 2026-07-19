/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * TIMER SERVICE
 *
 * Handles:
 * - Countdown timer
 * - Pause
 * - Resume
 * - Stop
 * - Reset
 * - Callbacks
 *
 * Used by:
 * Writing
 * Reading
 * Listening
 * Speaking (future)
 * ==========================================================
 */

export class TimerService {

    constructor({

        duration,

        onTick,

        onComplete

    }) {

        this.duration = duration;

        this.remaining = duration;

        this.interval = null;

        this.running = false;

        this.onTick = onTick;

        this.onComplete = onComplete;

    }

    start() {

        if (this.running) return;

        this.running = true;

        this.interval = setInterval(() => {

            this.remaining--;

            this.onTick?.(this.remaining);

            if (this.remaining <= 0) {

                this.stop();

                this.onComplete?.();

            }

        }, 1000);

    }

    pause() {

        if (!this.running) return;

        clearInterval(this.interval);

        this.running = false;

    }

    resume() {

        if (this.running) return;

        this.start();

    }

    stop() {

        clearInterval(this.interval);

        this.running = false;

    }

    reset(seconds = this.duration) {

        this.stop();

        this.remaining = seconds;

    }

    addTime(seconds) {

        this.remaining += seconds;

    }

    subtractTime(seconds) {

        this.remaining = Math.max(

            0,

            this.remaining - seconds

        );

    }

    getRemainingSeconds() {

        return this.remaining;

    }

    getRemainingTime() {

        const hrs = Math.floor(this.remaining / 3600);

        const mins = Math.floor((this.remaining % 3600) / 60);

        const secs = this.remaining % 60;

        return {

            hrs,

            mins,

            secs

        };

    }

    isRunning() {

        return this.running;

    }

}