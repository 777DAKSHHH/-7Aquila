import { supabase } from "../../supabaseClient";

/* ==========================================================
   ROCKET ASSESSMENT ENGINE

   STORAGE SERVICE

   Central Storage Gateway

   Handles

   • Writing Images
   • Speaking Audio
   • Reading Assets
   • Listening Audio
   • User Images

========================================================== */

const STORAGE_BUCKET = "rocket-assets";

/* ==========================================================
   STORAGE FOLDERS

   Never hardcode folder names
   anywhere else.

========================================================== */

export const STORAGE_PATHS = {

    WRITING_TASK1: "writing/task1",

    WRITING_TASK2: "writing/task2",

    SPEAKING_AUDIO: "speaking/audio",

    READING: "reading",

    LISTENING: "listening",

    PROFILE: "profile"

};

/* ==========================================================
   STANDARD RESPONSE
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
   PUBLIC URL
========================================================== */

export const getPublicUrl = (path) => {

    if (!path)
        return null;

    const { data } =
        supabase.storage

        .from(STORAGE_BUCKET)

        .getPublicUrl(path);

    return data.publicUrl;

};

/* ==========================================================
   FILE EXISTS

   Future use

========================================================== */

export const getFileInfo = async (
    path
) => {

    try {

        const folder =
            path.substring(
                0,
                path.lastIndexOf("/")
            );

        const file =
            path.substring(
                path.lastIndexOf("/") + 1
            );

        const { data, error } =
            await supabase.storage

            .from(STORAGE_BUCKET)

            .list(folder);

        if (error)
            throw error;

        const found =
            data.find(
                f => f.name === file
            );

        return successResponse(found);

    }

    catch (error) {

        console.error(error);

        return errorResponse(error);

    }

};

/* ==========================================================
   WRITING IMAGE URL

========================================================== */

export const getWritingTask1Image = (
    imagePath
) => {

    return getPublicUrl(
        imagePath
    );

};

/* ==========================================================
   TASK 2

========================================================== */

export const getWritingTask2Image = (
    imagePath
) => {

    return getPublicUrl(
        imagePath
    );

};

/* ==========================================================
   SPEAKING AUDIO URL

========================================================== */

export const getSpeakingAudio = (
    audioPath
) => {

    return getPublicUrl(
        audioPath
    );

};

/* ==========================================================
   UPLOAD FILE

========================================================== */

export const uploadFile =
async (

    folder,

    fileName,

    file

)=>{

    try{

        const fullPath =

        `${folder}/${fileName}`;

        const { data, error } =

        await supabase.storage

        .from(STORAGE_BUCKET)

        .upload(

            fullPath,

            file,

            {

                upsert:true

            }

        );

        if(error)
            throw error;

        return successResponse(data);

    }

    catch(error){

        console.error(error);

        return errorResponse(error);

    }

};

/* ==========================================================
   DELETE FILE

========================================================== */

export const deleteFile =
async(path)=>{

    try{

        const { error } =

        await supabase.storage

        .from(STORAGE_BUCKET)

        .remove([path]);

        if(error)
            throw error;

        return successResponse(true);

    }

    catch(error){

        console.error(error);

        return errorResponse(error);

    }

};

/* ==========================================================
   STORAGE SERVICE
========================================================== */

export const StorageService={

    getPublicUrl,

    getFileInfo,

    getWritingTask1Image,

    getWritingTask2Image,

    getSpeakingAudio,

    uploadFile,

    deleteFile

};