"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authenticate } from "@/lib/actions";
import { useActionState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const [state, dispatch] = useActionState(authenticate, undefined);

  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] animate-fade-in" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px] animate-fade-in" style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="container relative z-10 flex flex-col items-center justify-center min-h-screen lg:grid lg:grid-cols-2 lg:gap-10">
        
        {/* Left Side: Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 p-10 animate-slide-up">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Logo className="h-12 w-12 text-primary" />
              <h1 className="text-5xl font-bold tracking-tighter text-foreground">
                Log<span className="text-primary">Mind</span>
              </h1>
            </div>
            <p className="text-3xl font-light text-muted-foreground text-balance leading-tight">
              Log your work. <br/>
              Let <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent font-semibold">Logmind</span> think.
            </p>
          </div>
          <div className="space-y-4 pt-8">
             <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="h-10 w-10 rounded-lg bg-card border border-border flex items-center justify-center shadow-sm">
                   ✨
                </div>
                <span>AI-Powered Insights</span>
             </div>
             <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="h-10 w-10 rounded-lg bg-card border border-border flex items-center justify-center shadow-sm">
                   🚀
                </div>
                <span>Effortless Logging</span>
             </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-md animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-2">Enter your credentials to access your workspace</p>
            </div>

            <form action={dispatch} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@company.com"
                    required
                    defaultValue={state?.inputs?.email}
                    className="bg-background/50 border-border/50 focus:bg-background transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot?</a>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-background/50 border-border/50 focus:bg-background transition-all"
                  />
                </div>
              </div>

              <LoginButton />
              
              <div className="min-h-[20px]">
                {state?.message && (
                  <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
                    {state.message}
                  </p>
                )}
              </div>
            </form>
            
            <div className="mt-6 text-center text-xs text-muted-foreground">
               By signing in, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <>
          Sign in <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}
