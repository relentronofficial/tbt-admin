"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  BookOpen, 
  Video, 
  Calendar,
  Image as ImageIcon,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Admins", href: "/admins", icon: UserCog },
  { name: "Members", href: "/members", icon: Users },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Webinar", href: "/webinar", icon: Video },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Banner", href: "/banner", icon: ImageIcon },
  { name: "Support", href: "/support", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] bg-[#111] border-r border-[#2a2a2a] flex flex-col fixed inset-y-0 left-0 z-[100] font-sans">
      {/* Sidebar Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#2a2a2a]">
        <div 
          className="w-9 h-9 bg-[#e02020] flex items-center justify-center font-rajdhani font-bold text-[15px] text-white tracking-tighter"
          style={{ clipPath: "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)" }}
        >
          TT
        </div>
        <div className="font-rajdhani text-[13px] font-semibold leading-[1.3] text-[#a0a0a0] tracking-wider">
          <span className="block text-[#f0f0f0] text-[15px]">Tamil Business</span>
          Tribe
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href) ?? false;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 text-[13.5px] font-normal transition-all border-l-2",
                isActive 
                  ? "text-[#e02020] border-[#e02020] bg-[rgba(224,32,32,0.08)]" 
                  : "text-[#a0a0a0] border-transparent hover:bg-[#1f1f1f] hover:text-[#f0f0f0]"
              )}
            >
              <Icon size={16} className={cn("opacity-70", isActive && "opacity-100")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3.5 border-t border-[#2a2a2a] flex items-center gap-2.5 bg-[#111]">
        <div className="w-8 h-8 rounded-full bg-[#1f1f1f] border border-[#333] flex items-center justify-center text-xs font-bold text-[#e02020] uppercase shadow-sm">
          S
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-medium text-[#f0f0f0]">Sakthi</div>
          <div className="text-[11px] text-[#606060] mt-0.5 uppercase tracking-tighter">Master Admin</div>
        </div>
      </div>
    </aside>
  );
}
