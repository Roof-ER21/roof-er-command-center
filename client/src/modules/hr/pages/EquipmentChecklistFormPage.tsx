import { EquipmentSignaturePage } from "./EquipmentSignaturePage";

export function EquipmentChecklistFormPage() {
  return (
    <EquipmentSignaturePage
      title="Equipment Checklist"
      description="Confirm equipment condition before use or return."
      expectedType="checklist"
    />
  );
}
