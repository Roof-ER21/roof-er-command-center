import { EquipmentSignaturePage } from "./EquipmentSignaturePage";

export function SignEquipmentReceiptPage() {
  return (
    <EquipmentSignaturePage
      title="Equipment Receipt"
      description="Acknowledge receipt of issued equipment."
      expectedType="receipt"
    />
  );
}
