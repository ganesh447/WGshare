import React from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function ModalSheet({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card border-t border-x rounded-t-[28px] w-full max-w-[430px] overflow-y-auto px-5 pb-[100px] pt-4 animate-slide-up flex flex-col"
        style={{ borderBottom: 'none', maxHeight: '90dvh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-9 h-1 bg-muted-foreground/20 rounded-full mx-auto mt-3 mb-5" />
        <h3 className="text-[22px] font-extrabold tracking-tight mb-5">{title}</h3>
        <div className="flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}
