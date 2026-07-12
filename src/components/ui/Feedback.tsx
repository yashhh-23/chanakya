/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useEffect, useRef, ReactNode, useCallback, memo} from 'react';
import {motion, AnimatePresence} from 'motion/react';
import {X, CheckCircle, AlertTriangle, Info, AlertOctagon} from 'lucide-react';
import {useToast} from '../../contexts/ToastContext';

// ==========================================
// Modal Component (Fade + Scale)
// ==========================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = memo(function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trapping
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus the first input or button
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog Container */}
          <motion.div
            ref={modalRef}
            initial={{opacity: 0, scale: 0.95}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0.95}}
            transition={{duration: 0.15, ease: 'easeOut'}}
            className={`relative w-full ${sizeClasses[size]} bg-bg-surface border border-border-base rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-base">
              <h2 id="modal-title" className="text-base font-semibold font-display text-text-base">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-text-muted hover:bg-border-base/50 transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border-base bg-bg-base/30">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

// ==========================================
// Drawer Component (Slide-In)
// ==========================================
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  position?: 'left' | 'right';
}

export const Drawer = memo(function Drawer({
  isOpen,
  onClose,
  title,
  children,
  footer,
  position = 'right',
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const slideVariants = {
    hidden: {x: position === 'right' ? '100%' : '-100%'},
    visible: {x: 0},
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          <div className={`fixed inset-y-0 ${position === 'right' ? 'right-0' : 'left-0'} flex max-w-full`}>
            <motion.div
              ref={drawerRef}
              variants={slideVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{type: 'tween', duration: 0.25, ease: 'easeInOut'}}
              className="relative w-screen max-w-md bg-bg-surface border-l border-border-base flex flex-col h-full shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-title"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border-base">
                <h2 id="drawer-title" className="text-base font-semibold font-display text-text-base">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-text-muted hover:bg-border-base/50 transition-colors"
                  aria-label="Close drawer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 px-6 py-6 overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="px-6 py-5 border-t border-border-base bg-bg-base/30">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
});

// ==========================================
// Toast Component (individual element)
// ==========================================
interface ToastItemProps {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: (id: string) => void;
}

const ToastItem = memo(function ToastItem({id, title, description, type, onClose}: ToastItemProps) {
  const iconMap = {
    success: <CheckCircle className="text-status-available flex-shrink-0" size={18} />,
    error: <AlertOctagon className="text-status-inshop flex-shrink-0" size={18} />,
    warning: <AlertTriangle className="text-status-ontrip flex-shrink-0" size={18} />,
    info: <Info className="text-status-dispatched flex-shrink-0" size={18} />,
  };

  const borderClasses = {
    success: 'border-l-4 border-l-status-available',
    error: 'border-l-4 border-l-status-inshop',
    warning: 'border-l-4 border-l-status-ontrip',
    info: 'border-l-4 border-l-status-dispatched',
  };

  const handleClose = useCallback(() => {
    onClose(id);
  }, [id, onClose]);

  return (
    <motion.div
      layout
      initial={{opacity: 0, y: 15, scale: 0.95}}
      animate={{opacity: 1, y: 0, scale: 1}}
      exit={{opacity: 0, y: -10, scale: 0.95}}
      transition={{duration: 0.2}}
      className={`w-80 bg-bg-surface border border-border-base rounded-lg p-4 shadow-xl flex gap-3 ${borderClasses[type]} relative pointer-events-auto`}
      role="alert"
    >
      <div className="pt-0.5">{iconMap[type]}</div>
      <div className="flex-1 pr-6">
        <h4 className="text-xs font-semibold text-text-base leading-tight">{title}</h4>
        {description && <p className="text-[11px] text-text-muted mt-1 leading-snug">{description}</p>}
      </div>
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 p-1 text-text-muted hover:text-text-base hover:bg-border-base/50 rounded-md transition-colors"
        aria-label="Dismiss alert"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
});

// ==========================================
// ToastContainer Component
// ==========================================
export const ToastContainer = memo(function ToastContainer() {
  const {toasts, removeToast} = useToast();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            title={toast.title}
            description={toast.description}
            type={toast.type}
            onClose={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});
