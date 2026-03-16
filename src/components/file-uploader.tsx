"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

interface FileUploaderProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

export function FileUploader({ files, onChange, maxFiles = 12 }: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = maxFiles - files.length;
      const newFiles = acceptedFiles.slice(0, remaining).map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      }));
      onChange([...files, ...newFiles]);
    },
    [files, maxFiles, onChange]
  );

  const removeFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file) {
      URL.revokeObjectURL(file.preview);
    }
    onChange(files.filter((f) => f.id !== id));
  };

  const remaining = maxFiles - files.length;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: remaining,
    disabled: files.length >= maxFiles,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="h-4 w-4" />
          Condition Photos
        </CardTitle>
        <CardDescription>
          Upload photos showing the actual item condition ({remaining} remaining)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {files.map((file, index) => (
              <div key={file.id} className="relative group">
                <img
                  src={file.preview}
                  alt={`Upload ${index + 1}`}
                  className="h-24 w-full object-cover rounded border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        )}

        {remaining > 0 && (
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            {isDragActive ? (
              <p className="text-sm text-primary">Drop photos here...</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Drag & drop photos, or click to select
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPEG, PNG, or WebP up to 12 images
                </p>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
