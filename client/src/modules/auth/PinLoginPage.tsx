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
    <Card>
      <CardHeader className="space-y-1">
        <div className="lg:hidden flex items-center gap-3 mb-4">
          <img src="/logo.png" alt="Roof ER" className="w-12 h-12 rounded-lg object-contain" />
          <div>
            <h1 className="text-lg font-bold">Roof ER</h1>
            <p className="text-xs text-muted-foreground">Training Center</p>
          </div>
        </div>
        <CardTitle className="text-2xl">Enter Your PIN</CardTitle>
        <CardDescription>
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
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border"
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
                className="h-14 text-xl font-semibold"
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
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Sign in with email instead
        </Link>
      </CardFooter>
    </Card>
  );
}
