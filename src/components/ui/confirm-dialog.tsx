"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    isLoading?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Löschen",
    cancelText = "Abbrechen",
    variant = "danger",
    isLoading = false,
}: ConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-full ${variant === "danger" ? "bg-red-100 text-red-600" :
                            variant === "warning" ? "bg-amber-100 text-amber-600" :
                                "bg-blue-100 text-blue-600"
                            }`}>
                            {variant === "danger" ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    </div>
                    <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={variant === "danger" ? "destructive" : "default"}
                        onClick={() => {
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className={`flex-1 font-bold ${variant === "danger" ? "bg-red-600 hover:bg-red-700 shadow-md shadow-red-200 dark:shadow-none" : ""
                            }`}
                    >
                        {isLoading ? "Wird gelöscht..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
