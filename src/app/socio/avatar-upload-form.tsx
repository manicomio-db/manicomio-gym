"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadAvatar } from "./actions";

export function AvatarUploadForm({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setPending(true);
    try {
      await uploadAvatar(formData);
      toast.success("Foto actualizada.");
    } catch {
      toast.error("No se pudo subir la foto.");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => inputRef.current?.click()}
      className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/50"
      title="Cambiar foto"
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          Sin foto
        </div>
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-medium uppercase text-white opacity-0 transition-opacity group-hover:opacity-100">
        {pending ? "Subiendo..." : "Cambiar"}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </button>
  );
}
