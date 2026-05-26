import { Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  titulo: string;
  descricao: string;
}

export function UpgradeModal({ open, onClose, titulo, descricao }: UpgradeModalProps) {
  const [, setLocation] = useLocation();
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-2">
          <Lock size={24} className="text-amber-600" />
        </div>
        <DialogHeader>
          <DialogTitle className="text-center">{titulo}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-1">{descricao}</p>
        <DialogFooter className="flex-col gap-2 sm:flex-col mt-2">
          <Button
            className="w-full bg-[#FF6C3A] hover:bg-[#E8542A] text-white"
            onClick={() => { onClose(); setLocation("/planos"); }}
          >
            Ver planos e fazer upgrade
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>Agora não</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
