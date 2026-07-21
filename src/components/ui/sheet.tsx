"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Drawer } from "vaul";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";

/**
 * Adaptive dialog: a draggable **bottom sheet** (vaul) on mobile (< md) and a
 * centered **modal** (Radix Dialog) on desktop (≥ md). The compound API mirrors
 * `ui/dialog` so forms migrate with a near drop-in swap. A11y titles are
 * required by both engines — always render `SheetTitle`.
 */
const SheetCtx = React.createContext<{ isMobile: boolean }>({ isMobile: false });
const useSheet = () => React.useContext(SheetCtx);

type RootProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
};

function Sheet({ children, ...props }: RootProps) {
  const isMobile = useIsMobile();
  const Root = isMobile ? Drawer.Root : DialogPrimitive.Root;
  return (
    <SheetCtx.Provider value={{ isMobile }}>
      {/* vaul repositions inputs above the keyboard automatically. */}
      <Root {...props}>{children}</Root>
    </SheetCtx.Provider>
  );
}

function SheetTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  const { isMobile } = useSheet();
  const Trigger = isMobile ? Drawer.Trigger : DialogPrimitive.Trigger;
  return <Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  const { isMobile } = useSheet();
  const Close = isMobile ? Drawer.Close : DialogPrimitive.Close;
  return <Close data-slot="sheet-close" {...props} />;
}

function SheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  const { isMobile } = useSheet();

  if (isMobile) {
    return (
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs" />
        <Drawer.Content
          data-slot="sheet-content"
          className={cn(
            "bg-popover text-popover-foreground fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[94svh] flex-col rounded-t-2xl outline-none",
            className,
          )}
          {...props}
        >
          {/* Grab handle. */}
          <div className="mx-auto mt-2 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    );
  }

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs" />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-popover text-popover-foreground ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-open:zoom-in-95 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 grid max-h-[92svh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl p-4 text-sm ring-1 duration-150 outline-none",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            className="ring-offset-background focus:ring-ring absolute top-3 right-3 rounded-md opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:outline-none"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Fermer</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("bg-popover sticky top-0 z-10 flex flex-col gap-1 pt-2 pb-3", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  const { isMobile } = useSheet();
  const Title = isMobile ? Drawer.Title : DialogPrimitive.Title;
  return (
    <Title
      data-slot="sheet-title"
      className={cn("font-heading text-lg font-semibold", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  const { isMobile } = useSheet();
  const Description = isMobile ? Drawer.Description : DialogPrimitive.Description;
  return (
    <Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

/** Action bar pinned to the bottom of the sheet, above the safe area/keyboard. */
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "bg-popover sticky bottom-0 z-10 mt-2 flex flex-col-reverse gap-2 pt-3 pb-1 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
};
