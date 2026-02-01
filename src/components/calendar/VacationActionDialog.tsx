/**
 * VacationActionDialog component
 * Dialog for approving or rejecting vacation requests from calendar
 * Available for HR and ADMINISTRATOR roles only
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { VacationRequestViewModel } from "@/types";
import { Loader2, CheckCircle, XCircle, Calendar, User } from "lucide-react";

interface VacationActionDialogProps {
  vacation: VacationRequestViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const VacationActionDialog: React.FC<VacationActionDialogProps> = ({
  vacation,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!vacation) return null;

  const handleApprove = async () => {
    setIsApproving(true);
    setError(null);

    try {
      const response = await fetch(`/api/vacation-requests/${vacation.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledgeThresholdWarning: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Nie udało się zatwierdzić wniosku");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError("Podaj przyczynę odrzucenia");
      return;
    }

    setIsRejecting(true);
    setError(null);

    try {
      const response = await fetch(`/api/vacation-requests/${vacation.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Nie udało się odrzucić wniosku");
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setIsRejecting(false);
    }
  };

  const resetForm = () => {
    setShowRejectForm(false);
    setRejectReason("");
    setError(null);
  };

  const handleClose = () => {
    if (!isApproving && !isRejecting) {
      onOpenChange(false);
      resetForm();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      SUBMITTED: "Oczekujący",
      APPROVED: "Zatwierdzony",
      REJECTED: "Odrzucony",
      CANCELLED: "Anulowany",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      SUBMITTED: "text-yellow-600",
      APPROVED: "text-green-600",
      REJECTED: "text-red-600",
      CANCELLED: "text-gray-600",
    };
    return colors[status as keyof typeof colors] || "text-gray-600";
  };

  const canTakeAction = vacation.status === "SUBMITTED";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Szczegóły wniosku urlopowego</DialogTitle>
          <DialogDescription>
            {canTakeAction ? "Możesz zatwierdzić lub odrzucić ten wniosek" : "Ten wniosek nie może być już edytowany"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User info */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {vacation.user.firstName} {vacation.user.lastName}
            </span>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({vacation.businessDaysCount} {vacation.businessDaysCount === 1 ? "dzień" : "dni"})
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className={`font-medium ${getStatusColor(vacation.status)}`}>{getStatusLabel(vacation.status)}</span>
          </div>

          {/* Error message */}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

          {/* Reject form */}
          {showRejectForm && (
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Przyczyna odrzucenia *</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                placeholder="Podaj przyczynę odrzucenia wniosku..."
                rows={4}
                disabled={isRejecting}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {!showRejectForm ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isApproving || isRejecting}>
                Zamknij
              </Button>
              {canTakeAction && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectForm(true)}
                    disabled={isApproving || isRejecting}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Odrzuć
                  </Button>
                  <Button onClick={handleApprove} disabled={isApproving || isRejecting}>
                    {isApproving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Zatwierdzanie...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Zatwierdź
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason("");
                  setError(null);
                }}
                disabled={isRejecting}
              >
                Anuluj
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isRejecting || !rejectReason.trim()}>
                {isRejecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Odrzucanie...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Potwierdź odrzucenie
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
