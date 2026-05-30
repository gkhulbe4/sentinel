import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WalletInput({
  value,
  onChange,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="walletAddr">
        Wallet address {required ? <span className="text-red-500">*</span> : "(optional)"}
      </Label>
      <Input
        id="walletAddr"
        placeholder="So1111…1112"
        spellCheck={false}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
      />
    </div>
  );
}
