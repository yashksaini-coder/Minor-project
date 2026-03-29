'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  LayoutDashboard, Users, BedDouble, AlertTriangle, Receipt,
  UtensilsCrossed, BarChart3, DoorOpen, User, UserCheck, Settings,
  Search, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

interface CommandItem {
  label: string;
  href: string;
  icon: React.ElementType;
  group: string;
  keywords?: string;
}

const adminCommands: CommandItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, group: 'Navigation' },
  { label: 'Students', href: '/admin/students', icon: Users, group: 'Navigation', keywords: 'manage approve reject' },
  { label: 'Rooms', href: '/admin/rooms', icon: BedDouble, group: 'Navigation', keywords: 'occupancy beds allocate' },
  { label: 'Complaints', href: '/admin/complaints', icon: AlertTriangle, group: 'Navigation', keywords: 'issues problems' },
  { label: 'Fees', href: '/admin/fees', icon: Receipt, group: 'Navigation', keywords: 'payments billing' },
  { label: 'Mess', href: '/admin/mess', icon: UtensilsCrossed, group: 'Navigation', keywords: 'food menu meals' },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3, group: 'Navigation', keywords: 'analytics export' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, group: 'Navigation', keywords: 'preferences configuration' },
];

const studentCommands: CommandItem[] = [
  { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard, group: 'Navigation' },
  { label: 'My Room', href: '/student/room', icon: BedDouble, group: 'Navigation' },
  { label: 'Fees', href: '/student/fees', icon: Receipt, group: 'Navigation', keywords: 'payments dues' },
  { label: 'Complaints', href: '/student/complaints', icon: AlertTriangle, group: 'Navigation', keywords: 'file issue' },
  { label: 'Mess', href: '/student/mess', icon: UtensilsCrossed, group: 'Navigation', keywords: 'food book meals' },
  { label: 'Gate Pass', href: '/student/gate-pass', icon: DoorOpen, group: 'Navigation', keywords: 'leave outing' },
  { label: 'Profile', href: '/student/profile', icon: User, group: 'Navigation', keywords: 'account settings' },
];

const staffCommands: CommandItem[] = [
  { label: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard, group: 'Navigation' },
  { label: 'Complaints', href: '/staff/complaints', icon: AlertTriangle, group: 'Navigation' },
  { label: 'Visitors', href: '/staff/visitors', icon: UserCheck, group: 'Navigation' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands = useCallback(() => {
    switch (user?.role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
      case 'WARDEN':
        return adminCommands;
      case 'STAFF':
        return staffCommands;
      default:
        return studentCommands;
    }
  }, [user?.role]);

  const runCommand = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const grouped = commands().reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    (acc[cmd.group] ??= []).push(cmd);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 rounded-2xl shadow-2xl border-border/50 max-w-lg">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-item]]:rounded-lg [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4">
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Search pages, actions..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            {Object.entries(grouped).map(([group, items]) => (
              <Command.Group key={group} heading={group} className="text-xs uppercase tracking-wider text-muted-foreground pb-1 pt-2">
                {items.map((item) => (
                  <Command.Item
                    key={item.href}
                    value={`${item.label} ${item.keywords || ''}`}
                    onSelect={() => runCommand(item.href)}
                    className="flex items-center gap-3 cursor-pointer data-[selected=true]:bg-accent/50 transition-colors"
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-data-[selected=true]:opacity-100 text-muted-foreground" />
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
