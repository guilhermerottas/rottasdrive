import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";
import { useCreateArquivoRecord } from "@/hooks/useArquivos";
import { uploadFile } from "@/services/uploadService";
import { toast } from "sonner";
import * as tus from "tus-js-client";

export interface UploadItem {
    id: string;
    file: File;
    obraId: string;
    pastaId?: string | null;
    descricao?: string | null;
    progress: number;
    status: "pending" | "uploading" | "completed" | "error";
    error?: string;
    createdAt: Date;
    uploadInstance?: tus.Upload;
}

interface UploadContextType {
    uploads: UploadItem[];
    addUploads: (files: File[], obraId: string, pastaId?: string | null, descricoes?: Record<number, string>) => void;
    removeUpload: (id: string) => void;
    clearCompleted: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    minimized: boolean;
    setMinimized: (minimized: boolean) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);

    // Use the new hook for DB insertion
    const createRecordMutation = useCreateArquivoRecord();

    // Ref to track if we are currently processing a specific upload to avoid re-entry
    const isProcessingRef = useRef(false);
    // Ref to hold the current upload ID being processed
    const currentUploadIdRef = useRef<string | null>(null);

    const updateUploadState = useCallback((id: string, updates: Partial<UploadItem>) => {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    }, []);

    const processUpload = useCallback(async (upload: UploadItem) => {
        // If we are already processing this upload or another one, return
        if (isProcessingRef.current) return;

        isProcessingRef.current = true;
        currentUploadIdRef.current = upload.id;

        console.log("Starting upload processing for:", upload.file.name);
        updateUploadState(upload.id, { status: "uploading", progress: 0 });

        const fileName = `${upload.obraId}/${upload.pastaId || "root"}/${Date.now()}_${upload.file.name}`;
        const bucketName = "arquivos";

        try {
            const uploadInstance = await uploadFile({
                file: upload.file,
                bucketName,
                fileName,
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = (bytesUploaded / bytesTotal) * 100;
                    updateUploadState(upload.id, { progress: percentage });
                },
                onSuccess: async () => {
                    console.log("Upload TUS success:", upload.file.name);
                    try {
                        // File uploaded to storage, now create DB record
                        const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${fileName}`;

                        await createRecordMutation.mutateAsync({
                            obraId: upload.obraId,
                            pastaId: upload.pastaId,
                            nome: upload.file.name,
                            arquivoUrl: publicUrl,
                            tipo: upload.file.type,
                            tamanho: upload.file.size,
                            descricao: upload.descricao,
                        });

                        console.log("DB Record created:", upload.file.name);
                        updateUploadState(upload.id, { status: "completed", progress: 100 });
                        toast.success(`${upload.file.name} enviado com sucesso!`);
                    } catch (dbError: any) {
                        console.error("DB Insert Error:", dbError);
                        updateUploadState(upload.id, { status: "error", error: "Erro ao salvar registro" });
                        toast.error(`Erro ao finalizar envio de ${upload.file.name}`);
                    } finally {
                        // Process next
                        isProcessingRef.current = false;
                        currentUploadIdRef.current = null;
                        // Trigger next in queue
                        triggerNext();
                    }
                },
                onError: (error) => {
                    console.error("Upload Error:", error);
                    updateUploadState(upload.id, { status: "error", error: error.message || "Falha no upload" });
                    toast.error(`Erro ao enviar ${upload.file.name}`);
                    // Process next
                    isProcessingRef.current = false;
                    currentUploadIdRef.current = null;
                    triggerNext();
                }
            });

            // Store instance if we want to support pause/cancel later
            if (uploadInstance) {
                updateUploadState(upload.id, { uploadInstance });
            }

        } catch (err: any) {
            console.error("Start Upload Error:", err);
            updateUploadState(upload.id, { status: "error", error: err.message });
            isProcessingRef.current = false;
            currentUploadIdRef.current = null;
            triggerNext();
        }
    }, [createRecordMutation, updateUploadState]);

    // Function to find next pending upload and trigger it
    const triggerNext = useCallback(() => {
        setUploads(currentUploads => {
            const nextPending = currentUploads.find(u => u.status === "pending");
            if (nextPending && !isProcessingRef.current) {
                // Use timeout to break stack and allow state updates
                setTimeout(() => processUpload(nextPending), 100);
            }
            return currentUploads;
        });
    }, [processUpload]);

    // Effect to trigger processing when new uploads are added
    useEffect(() => {
        // Only trigger if not already processing
        if (!isProcessingRef.current) {
            triggerNext();
        }
    }, [uploads.length, triggerNext]);

    const addUploads = useCallback((files: File[], obraId: string, pastaId?: string | null, descricoes?: Record<number, string>) => {
        const newUploads: UploadItem[] = files.map((file, index) => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            obraId,
            pastaId,
            descricao: descricoes?.[index] || null,
            progress: 0,
            status: "pending",
            createdAt: new Date()
        }));

        setUploads(prev => [...prev, ...newUploads]);
        setIsOpen(true);
        setMinimized(false);
    }, []);

    const removeUpload = useCallback((id: string) => {
        setUploads(prev => {
            const upload = prev.find(u => u.id === id);
            if (upload && upload.status === "uploading" && upload.uploadInstance) {
                // Abort upload if running
                try {
                    // @ts-ignore - tus types might be tricky here
                    if (typeof upload.uploadInstance.abort === 'function') {
                        upload.uploadInstance.abort();
                    }
                } catch (e) {
                    console.error("Error aborting upload", e);
                }
            }
            // If we remove the currently processing item, we need to reset the flag
            if (currentUploadIdRef.current === id) {
                isProcessingRef.current = false;
                currentUploadIdRef.current = null;
                // Trigger next in queue (with delay)
                setTimeout(triggerNext, 100);
            }
            return prev.filter(u => u.id !== id);
        });
    }, [triggerNext]);

    const clearCompleted = useCallback(() => {
        setUploads(prev => prev.filter(u => u.status !== "completed"));
    }, []);

    return (
        <UploadContext.Provider value={{
            uploads,
            addUploads,
            removeUpload,
            clearCompleted,
            isOpen,
            setIsOpen,
            minimized,
            setMinimized
        }}>
            {children}
        </UploadContext.Provider>
    );
}

export function useUpload() {
    const context = useContext(UploadContext);
    if (context === undefined) {
        throw new Error("useUpload must be used within a UploadProvider");
    }
    return context;
}
