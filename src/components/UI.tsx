import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'gold';
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-[#800020] text-white hover:bg-[#600018] shadow-md hover:shadow-lg border border-transparent',
    secondary: 'bg-[#F5F5DC] text-[#800020] border border-[#800020]/20 hover:bg-[#E8E8C8] shadow-sm hover:shadow-md',
    gold: 'bg-[#D4AF37] text-white hover:bg-[#C49F27] shadow-md hover:shadow-lg border border-transparent',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg border border-transparent',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg border border-transparent',
  };

  return (
    <button
      className={cn(
        'px-4 py-3 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ className, label, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-bold text-[#800020]">{label}</label>}
      <input
        className={cn(
          'w-full px-4 py-3 rounded-xl border border-[#D4AF37]/30 bg-white focus:bg-[#F5F5DC]/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] placeholder:text-gray-400',
          className
        )}
        {...props}
      />
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ className, label, options, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-bold text-[#800020]">{label}</label>}
      <div className="relative">
        <select
          className={cn(
            'w-full px-4 py-3 rounded-xl border border-[#D4AF37]/30 bg-white focus:bg-[#F5F5DC]/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] appearance-none',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#F5F5DC] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-[#D4AF37]/50 animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[#D4AF37]/20 flex justify-between items-center bg-white/50">
          <h3 className="text-lg font-bold text-[#800020]">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-[#800020] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
