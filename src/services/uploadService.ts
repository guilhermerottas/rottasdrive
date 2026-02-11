import * as tus from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";

export interface UploadOptions {
    file: File;
    bucketName: string;
    fileName: string;
    onProgress: (bytesUploaded: number, bytesTotal: number) => void;
    onSuccess: () => void;
    onError: (error: Error) => void;
}

export const uploadFile = async ({
    file,
    bucketName,
    fileName,
    onProgress,
    onSuccess,
    onError,
}: UploadOptions) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        onError(new Error("User not authenticated"));
        return;
    }

    const upload = new tus.Upload(file, {
        endpoint: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: {
            authorization: `Bearer ${session.access_token}`,
            "x-upsert": "true", // Optional: overwrite if exists
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true, // Important for multiple uploads of same file
        metadata: {
            bucketName: bucketName,
            objectName: fileName,
            contentType: file.type || "application/octet-stream",
            cacheControl: "3600",
        },
        chunkSize: 6 * 1024 * 1024, // 6MB chunks
        onError: (error) => {
            console.error("TUS Upload Error:", error);
            onError(error);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
            onProgress(bytesUploaded, bytesTotal);
        },
        onSuccess: () => {
            onSuccess();
        },
    });

    // Check if there are any previous uploads to resume
    upload.findPreviousUploads().then((previousUploads) => {
        if (previousUploads.length) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
    });

    return upload; // Return the upload instance to allow pausing/aborting
};
