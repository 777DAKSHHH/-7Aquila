import axios from "axios";

/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * Evaluation Service
 *
 * Frontend wrapper
 * for AI evaluation.
 *
 * ==========================================================
 */

const API = axios.create({

    baseURL: import.meta.env.VITE_API_BASE_URL

});

/**
 * Evaluate Writing Session
 */

export const evaluateWritingSession = async (

    sessionId

)=>{

    try{

        const { data } =

        await API.post(

            "/writing/evaluate",

            {

                sessionId

            }

        );

        return{

            success:true,

            data

        };

    }

    catch(error){

        return{

            success:false,

            error:

            error?.response?.data ||

            error.message

        };

    }

};

/**
 * Get Evaluation Result
 */

export const getWritingEvaluation = async (

    sessionId

)=>{

    try{

        const { data } =

        await API.get(

            `/writing/evaluation/${sessionId}`

        );

        return{

            success:true,

            data

        };

    }

    catch(error){

        return{

            success:false,

            error:

            error?.response?.data ||

            error.message

        };

    }

};

/**
 * Teacher Re-evaluation
 */

export const teacherReview = async (

    sessionId,

    teacherBand,

    teacherFeedback

)=>{

    try{

        const { data } =

        await API.post(

            "/writing/review",

            {

                sessionId,

                teacherBand,

                teacherFeedback

            }

        );

        return{

            success:true,

            data

        };

    }

    catch(error){

        return{

            success:false,

            error:

            error?.response?.data ||

            error.message

        };

    }

};

export const EvaluationService={

    evaluateWritingSession,

    getWritingEvaluation,

    teacherReview

};