/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * AutoSave Service
 *
 * Handles:
 *
 * • Debounced saving
 * • Manual save
 * • Visibility change
 * • Before unload
 * • Prevent duplicate saves
 *
 * ==========================================================
 */

export class AutoSaveService {

    constructor({

        saveFunction,

        delay = 20000

    }) {

        this.saveFunction = saveFunction;

        this.delay = delay;

        this.timer = null;

        this.isSaving = false;

        this.hasChanges = false;

        this.lastSavedData = "";

    }

    /**
     * Mark content as changed.
     */

    markAsChanged(currentData) {

        const serialized =
            JSON.stringify(currentData);

        if (
            serialized === this.lastSavedData
        ) {

            return;

        }

        this.hasChanges = true;

        this.resetTimer(currentData);

    }

    /**
     * Reset debounce timer.
     */

    resetTimer(data) {

        clearTimeout(this.timer);

        this.timer = setTimeout(

            () => {

                this.save(data);

            },

            this.delay

        );

    }

    /**
     * Save immediately.
     */

    async save(data) {

        if (this.isSaving) return;

        if (!this.hasChanges) return;

        this.isSaving = true;

        try {

            await this.saveFunction(data);

            this.lastSavedData =
                JSON.stringify(data);

            this.hasChanges = false;

        }

        catch (error) {

            console.error(

                "Rocket AutoSave",

                error

            );

        }

        finally {

            this.isSaving = false;

        }

    }

    /**
     * Manual save.
     */

    async forceSave(data) {

        clearTimeout(this.timer);

        await this.save(data);

    }

    /**
     * Cancel timer.
     */

    destroy() {

        clearTimeout(this.timer);

    }

}

/**
 * ==========================================================
 * SAVE WHEN USER LEAVES TAB
 * ==========================================================
 */

export const registerVisibilitySave = (

    autosave,

    getCurrentData

) => {

    const handler = async () => {

        if (

            document.visibilityState ===

            "hidden"

        ) {

            await autosave.forceSave(

                getCurrentData()

            );
        }

    };

    document.addEventListener(

        "visibilitychange",

        handler

    );

    return () =>

        document.removeEventListener(

            "visibilitychange",

            handler

        );

};

/**
 * ==========================================================
 * SAVE BEFORE PAGE CLOSE
 * ==========================================================
 */

export const registerBeforeUnload = (

    autosave,

    getCurrentData

) => {

    const handler = () => {

        autosave.forceSave(

            getCurrentData()

        );

    };

    window.addEventListener(

        "beforeunload",

        handler

    );

    return () =>

        window.removeEventListener(

            "beforeunload",

            handler

        );

};

/**
 * ==========================================================
 * MANUAL SAVE
 * ==========================================================
 */

export const manualSave = async (

    autosave,

    getCurrentData

) => {

    await autosave.forceSave(

        getCurrentData()

    );

};

/**
 * ==========================================================
 * AUTOSAVE MANAGER EXPORT
 * ==========================================================
 */

export const AutoSaveManager = {
  AutoSaveService,
  registerVisibilitySave,
  registerBeforeUnload,
  manualSave,
};
