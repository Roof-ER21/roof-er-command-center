import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Delete, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function PinLoginPage() {
  const [pin, setPin] = useState("");
  const { loginWithPin, isPinLoginPending, pinLoginError } = useAuth();

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin("");
  };

  const handleSubmit = async () => {
    if (pin.length === 4) {
      try {
        await loginWithPin({ pin });
      } catch (error) {
        setPin("");
      }
    }
  };

  // Auto-submit when PIN is complete
  if (pin.length === 4 && !isPinLoginPending) {
    handleSubmit();
  }

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-white">Enter Your PIN</CardTitle>
        <CardDescription className="text-slate-400">
          Enter your 4-digit PIN to access training
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {pinLoginError && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md text-center">
            Invalid PIN. Please try again.
          </div>
        )}

        {/* PIN Display */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "w-14 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all",
                pin.length > i
                  ? "border-red-600 bg-red-600/20 text-red-500"
                  : "border-slate-700 bg-slate-800/50"
              )}
            >
              {pin.length > i ? "•" : ""}
            </div>
          ))}
        </div>

        {/* Loading indicator */}
        {isPinLoginPending && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          {digits.map((digit, i) => {
            if (digit === "") {
              if (i === 9) {
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    className="h-14 text-lg"
                    onClick={handleClear}
                    disabled={isPinLoginPending}
                  >
                    Clear
                  </Button>
                );
              }
              return (
                <Button
                  key={i}
                  variant="ghost"
                  size="icon"
                  className="h-14"
                  onClick={handleDelete}
                  disabled={isPinLoginPending}
                >
                  <Delete className="h-5 w-5" />
                </Button>
              );
            }
            return (
              <Button
                key={i}
                variant="outline"
                className="h-14 text-xl font-semibold bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600"
                onClick={() => handlePinInput(digit)}
                disabled={isPinLoginPending || pin.length >= 4}
              >
                {digit}
              </Button>
            );
          })}
        </div>
      </CardContent>

      <CardFooter>
        <Link
          to="/login"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Sign in with email instead
        </Link>
      </CardFooter>
    </Card>
  );
}
