"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { login, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const initialState: AuthState = { error: null };

function ConfirmNotice() {
  const params = useSearchParams();
  if (!params.get("confirm")) return null;
  return (
    <p className="mb-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
      Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.
    </p>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Image src="/logo.png" alt="Manicomio Gym" width={1320} height={1283} className="w-40" priority />
      <Card className="w-full max-w-sm neon-border">
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>Accede a tu cuenta del gimnasio.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <ConfirmNotice />
          </Suspense>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Usuario o correo</Label>
              <Input id="email" name="email" type="text" required autoComplete="username" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="underline">
              ¿Olvidaste tu contraseña?
            </Link>{" "}
            (solo si te registraste con correo — si eres socio, pide ayuda a tu instructor)
          </p>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Eres socio nuevo?{" "}
            <Link href="/signup" className="underline">
              Regístrate
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            <Link href="/" className="underline">
              Volver al inicio
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
