import { supabase } from "../../supabaseClient";

/* ==========================================================
   ROCKET ASSESSMENT ENGINE
   Session Service

   Handles:
   - Writing Sessions
   - Draft Management
   - Autosave
   - Submission
   - Session Retrieval
   - History (Part 2)
   - Statistics (Part 3)

   Future Modules:
   - Reading
   - Listening
   - Speaking (Migration)
========================================================== */

const WRITING_TABLE = "writing_sessions";

/* ==========================================================
   SESSION STATUS
========================================================== */

export const SESSION_STATUS = {
    DRAFT: "draft",
    IN_PROGRESS: "in_progress",
    SUBMITTED: "submitted",
    EVALUATING: "evaluating",
    COMPLETED: "evaluated",
    REVIEWED: "reviewed"
};

/* ==========================================================
   STANDARD RESPONSE HELPERS
========================================================== */

const successResponse = (data) => ({
    success: true,
    data,
    error: null
});

const errorResponse = (error) => ({
    success: false,
    data: null,
    error: error?.message || error
});

/* ==========================================================
   LOGGING
========================================================== */

const logError = (location, error) => {
    console.error(
        `[Rocket Session Service] ${location}`,
        error
    );
};

/* ==========================================================
   CREATE WRITING SESSION

   Creates a brand-new CBT writing session.

   Returns:
   {
      success,
      data,
      error
   }
========================================================== */

export const createWritingSession = async ({
    studentId,
    task1QuestionId = null,
    task2QuestionId = null
}) => {

    try {

        const payload = {

            student_id: studentId,

            task1_question_id: task1QuestionId,

            task2_question_id: task2QuestionId,

            status: SESSION_STATUS.DRAFT,

            is_draft: true,

            task1_word_count: 0,

            task2_word_count: 0,

            task1_time_seconds: 0,

            task2_time_seconds: 0,

            total_time_seconds: 0

        };

        const { data, error } = await supabase
            .from(WRITING_TABLE)
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        return successResponse(data);

    } catch (error) {

        logError("createWritingSession()", error);

        return errorResponse(error);

    }

};

/* ==========================================================
   FETCH SESSION

   Used by:

   Resume Draft

   History

   Faculty Review

   AI Evaluation
========================================================== */

export const getWritingSession = async (
    sessionId
) => {

    try {

        const { data, error } = await supabase
            .from(WRITING_TABLE)
            .select("*")
            .eq("id", sessionId)
            .single();

        if (error) throw error;

        return successResponse(data);

    } catch (error) {

        logError("getWritingSession()", error);

        return errorResponse(error);

    }

};

/* ==========================================================
   UPDATE SESSION

   Generic updater.

   Used internally by all other
   helper functions.

   NEVER call Supabase update()
   directly elsewhere in Rocket.
========================================================== */

export const updateWritingSession =
    async (
        sessionId,
        updates = {}
    ) => {

        try {

            const payload = {

                ...updates,

                updated_at: new Date().toISOString(),

                last_saved_at: new Date().toISOString()

            };

            const { data, error } =
                await supabase
                    .from(WRITING_TABLE)
                    .update(payload)
                    .eq("id", sessionId)
                    .select()
                    .single();

            if (error) throw error;

            return successResponse(data);

        } catch (error) {

            logError(
                "updateWritingSession()",
                error
            );

            return errorResponse(error);

        }

    };

/* ==========================================================
   SAVE WRITING DRAFT

   Auto-save student progress.

   Called:
   - Every X seconds
   - Before page unload
   - Manual Save button

========================================================== */

export const saveWritingDraft = async (
    sessionId,
    draftData = {}
) => {

    try {

        return await updateWritingSession(
            sessionId,
            {

                ...draftData,

                status: SESSION_STATUS.IN_PROGRESS,

                is_draft: true

            }
        );

    } catch (error) {

        logError(
            "saveWritingDraft()",
            error
        );

        return errorResponse(error);

    }

};


/* ==========================================================
   RESUME WRITING DRAFT

   Used when student clicks

   Continue Draft

========================================================== */

export const resumeWritingDraft =
    async (
        sessionId
    ) => {

        try {

            const session =
                await getWritingSession(
                    sessionId
                );

            if (!session.success)
                return session;

            if (
                !session.data.is_draft
            ) {

                return errorResponse(
                    "This session has already been submitted."
                );

            }

            return successResponse(
                session.data
            );

        } catch (error) {

            logError(
                "resumeWritingDraft()",
                error
            );

            return errorResponse(error);

        }

};


/* ==========================================================
   GET LATEST DRAFT

   Used by Dashboard

   Shows

   Continue Writing

========================================================== */

export const getLatestWritingDraft =
    async (
        studentId
    ) => {

        try {

            const { data, error } =
                await supabase

                    .from(WRITING_TABLE)

                    .select("*")

                    .eq(
                        "student_id",
                        studentId
                    )

                    .eq(
                        "is_draft",
                        true
                    )

                    .order(
                        "updated_at",
                        {
                            ascending: false
                        }
                    )

                    .limit(1)

                    .maybeSingle();

            if (error)
                throw error;

            return successResponse(
                data
            );

        } catch (error) {

            logError(
                "getLatestWritingDraft()",
                error
            );

            return errorResponse(error);

        }

};


/* ==========================================================
   SUBMIT WRITING SESSION

   Student presses

   Submit Test

========================================================== */

export const submitWritingSession =
    async (
        sessionId
    ) => {

        try {

            return await updateWritingSession(

                sessionId,

                {

                    status:
                        SESSION_STATUS.SUBMITTED,

                    is_draft: false,

                    submitted_at:
                        new Date().toISOString(),

                    completed_at:
                        new Date().toISOString()

                }

            );

        } catch (error) {

            logError(
                "submitWritingSession()",
                error
            );

            return errorResponse(error);

        }

};


/* ==========================================================
   DELETE SESSION

   Usually unused by students.

   Mainly for Faculty/Admin.

========================================================== */

export const deleteWritingSession =
    async (
        sessionId
    ) => {

        try {

            const { error } =
                await supabase

                    .from(WRITING_TABLE)

                    .delete()

                    .eq(
                        "id",
                        sessionId
                    );

            if (error)
                throw error;

            return successResponse(
                true
            );

        } catch (error) {

            logError(
                "deleteWritingSession()",
                error
            );

            return errorResponse(error);

        }

};

/* ==========================================================
   STUDENT HISTORY
========================================================== */

export const getStudentWritingHistory =
async (studentId) => {

    try {

        const { data, error } =
        await supabase

        .from(WRITING_TABLE)

        .select("*")

        .eq(
            "student_id",
            studentId
        )

        .order(
            "created_at",
            {
                ascending:false
            }
        );

        if(error) throw error;

        return successResponse(data);

    }

    catch(error){

        logError(
            "getStudentWritingHistory()",
            error
        );

        return errorResponse(error);

    }

};

/* ==========================================================
   WRITING STATISTICS
========================================================== */

export const getWritingStatistics =
async(studentId)=>{

    try{

        const history =
        await getStudentWritingHistory(
            studentId
        );

        if(!history.success)
            return history;

        const sessions =
        history.data;

        const completed =
        sessions.filter(
            s=>!s.is_draft
        );

        const averageBand =
        completed.length
        ?

        completed.reduce(
            (sum,s)=>
            sum+(Number(s.overall_band)||0),
            0
        )/completed.length

        :0;

        return successResponse({

            totalSessions:
            sessions.length,

            completedSessions:
            completed.length,

            draftSessions:
            sessions.filter(
                s=>s.is_draft
            ).length,

            averageBand:
            Number(
                averageBand.toFixed(2)
            )

        });

    }

    catch(error){

        logError(
            "getWritingStatistics()",
            error
        );

        return errorResponse(error);

    }

};

/* ==========================================================
   WORD COUNT
========================================================== */

export const calculateWordCount =
(text="")=>{

    return text

    .trim()

    .split(/\s+/)

    .filter(Boolean)

    .length;

};

/* ==========================================================
   TIME FORMATTER
========================================================== */

export const secondsToTime =
(seconds)=>{

    const hrs =
    Math.floor(seconds/3600);

    const mins =
    Math.floor(
        (seconds%3600)/60
    );

    const secs =
    seconds%60;

    return{

        hrs,

        mins,

        secs

    };

};

/* ==========================================================
   SESSION SERVICE EXPORT
========================================================== */

export const SessionService={

    createWritingSession,

    getWritingSession,

    updateWritingSession,

    saveWritingDraft,

    resumeWritingDraft,

    getLatestWritingDraft,

    submitWritingSession,

    deleteWritingSession,

    getStudentWritingHistory,

    getWritingStatistics,

    calculateWordCount,

    secondsToTime

};