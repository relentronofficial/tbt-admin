"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Filter, 
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  Mail,
  Phone,
  Calendar,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Users,
  Eye,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  Building2,
  Briefcase,
  Target,
  Trophy,
  MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListMembers, useUpdateMember, useDeleteMember, useGetManagers } from "@/lib/hooks/useMembers";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const MARKETING_CHANNELS = ["SEO", "Paid Ads", "Social Media", "Email", "Referral", "Offline"];

// Expanded Zod Schema for Member Update - ALL FIELDS
const memberUpdateSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  secondName: z.string().optional().or(z.literal("")),
  dob: z.string().optional().or(z.literal("")).nullable(),
  gender: z.string().optional().or(z.literal("")),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  pincode: z.string().optional().or(z.literal("")),
  businessName: z.string().optional().or(z.literal("")),
  businessEstablishedOn: z.string().optional().or(z.literal("")).nullable(),
  productServiceType: z.string().optional().or(z.literal("")),
  instagramLink: z.string().optional().or(z.literal("")),
  annualTurnover: z.string().optional().or(z.literal("")),
  goalAfter90Days: z.string().optional().or(z.literal("")),
  preferredSessionMode: z.string().optional().or(z.literal("")),
  gstNumber: z.string().optional().or(z.literal("")),
  marketingChannels: z.array(z.string()).default([]),
  marketingChannelName: z.string().optional().or(z.literal("")),
  domainHostingDetails: z.string().optional().or(z.literal("")),
  businessAddress: z.string().optional().or(z.literal("")),
  challenge1: z.string().optional().or(z.literal("")),
  challenge2: z.string().optional().or(z.literal("")),
  challenge3: z.string().optional().or(z.literal("")),
  hasSocialMediaManager: z.boolean().default(false),
  socialMediaManagerNote: z.string().optional().or(z.literal("")),
  hasVideoEditing: z.boolean().default(false),
  videoEditingNote: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  membershipPlan: z.string().default("Standard (Annual)"),
  status: z.string().default("Active"),
  verificationStatus: z.string().default("AWAITING KYC"),
  accountManagerId: z.string().optional().or(z.literal("")),
  task: z.string().optional().or(z.literal("")),
});

type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;

export default function MembersListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [viewingMember, setViewingMember] = useState<any | null>(null);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useListMembers({ page, limit, search });
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const { data: managers } = useGetManagers();

  const members = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / (limit || 10));

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting: isUpdating }
  } = useForm<MemberUpdateInput>({
    resolver: zodResolver(memberUpdateSchema)
  });

  const watchChannels = watch("marketingChannels") || [];

  const toggleChannel = (channel: string) => {
    if (watchChannels.includes(channel)) {
      setValue("marketingChannels", watchChannels.filter(c => c !== channel), { shouldDirty: true });
    } else {
      setValue("marketingChannels", [...watchChannels, channel], { shouldDirty: true });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editingMember) {
      reset({
        firstName: editingMember.firstName,
        secondName: editingMember.secondName || "",
        dob: editingMember.dob ? new Date(editingMember.dob).toISOString().split('T')[0] : "",
        gender: editingMember.gender || "",
        email: editingMember.email,
        phone: editingMember.phone || "",
        city: editingMember.city || "",
        state: editingMember.state || "",
        pincode: editingMember.pincode || "",
        businessName: editingMember.businessName || "",
        businessEstablishedOn: editingMember.businessEstablishedOn ? new Date(editingMember.businessEstablishedOn).toISOString().split('T')[0] : "",
        productServiceType: editingMember.productServiceType || "",
        instagramLink: editingMember.instagramLink || "",
        annualTurnover: editingMember.annualTurnover || "",
        goalAfter90Days: editingMember.goalAfter90Days || "",
        preferredSessionMode: editingMember.preferredSessionMode || "",
        gstNumber: editingMember.gstNumber || "",
        marketingChannels: editingMember.marketingChannels || [],
        marketingChannelName: editingMember.marketingChannelName || "",
        domainHostingDetails: editingMember.domainHostingDetails || "",
        businessAddress: editingMember.businessAddress || "",
        challenge1: editingMember.challenge1 || "",
        challenge2: editingMember.challenge2 || "",
        challenge3: editingMember.challenge3 || "",
        hasSocialMediaManager: editingMember.hasSocialMediaManager || false,
        socialMediaManagerNote: editingMember.socialMediaManagerNote || "",
        hasVideoEditing: editingMember.hasVideoEditing || false,
        videoEditingNote: editingMember.videoEditingNote || "",
        notes: editingMember.notes || "",
        status: editingMember.status,
        membershipPlan: editingMember.membershipPlan,
        verificationStatus: editingMember.verificationStatus,
        accountManagerId: editingMember.accountManagerId || "",
        task: editingMember.task || "",
      });
    }
  }, [editingMember, reset]);

  if (isLoading && page === 1 && !search) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-40">
          <Loader2 size={40} className="animate-spin text-[#dc2626]" />
        </div>
      </DashboardLayout>
    );
  }

  const safeFormatDate = (dateStr: any) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return isValid(d) ? format(d, 'dd MMM yyyy') : 'N/A';
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Inactive': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Suspended': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Pending': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getPlanColor = (plan: string) => {
    if (!plan) return 'text-gray-400 border-gray-400/30 bg-gray-400/5';
    const p = plan.toLowerCase();
    if (p.includes('premium')) return 'text-purple-500 border-purple-500/30 bg-purple-500/5';
    if (p.includes('standard')) return 'text-blue-500 border-blue-500/30 bg-blue-500/5';
    return 'text-gray-400 border-gray-400/30 bg-gray-400/5';
  };

  const onUpdateSubmit = async (formData: MemberUpdateInput) => {
    try {
      await updateMember.mutateAsync({ id: editingMember.id, data: formData });
      toast.success("Member updated successfully");
      setEditingMember(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update member");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMember.mutateAsync(id);
      toast.success("Member record purged");
      setDeletingMemberId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to purge record");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 font-sans">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-3 items-start">
            <div className="w-1 bg-[#dc2626] rounded-full min-h-[44px]" />
            <div>
              <h1 className="font-rajdhani text-2xl font-bold tracking-tight text-[#f0f0f0] uppercase">Community Members</h1>
              <p className="text-[12px] text-[#606060] font-medium uppercase tracking-[1px] font-rajdhani">Manage TBT member profiles and business records.</p>
            </div>
          </div>

          <button 
            onClick={() => router.push("/members/add")}
            className="flex items-center gap-2 bg-[#dc2626] text-white px-6 py-2.5 rounded-md font-rajdhani font-bold text-[13px] tracking-[1.5px] uppercase hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] active:scale-95 shrink-0"
          >
            <Plus size={16} strokeWidth={3} />
            Add New Member
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           {[
             { label: 'Total Members', value: total, icon: Users, color: 'text-[#dc2626]' },
             { label: 'Active Now', value: members.filter((m:any) => m.status === 'Active').length, icon: Clock, color: 'text-green-500' },
             { label: 'Premium Plans', value: members.filter((m:any) => (m.membershipPlan || '').includes('Premium')).length, icon: Shield, color: 'text-purple-500' },
             { label: 'Pending KYC', value: members.filter((m:any) => m.verificationStatus === 'AWAITING KYC').length, icon: Filter, color: 'text-amber-500' }
           ].map((stat, i) => (
             <div key={i} className="bg-[#181818] border border-[#2a2a2a] p-4 rounded-xl flex items-center gap-4">
               <div className={cn("p-2.5 rounded-lg bg-[#1a1a1a] border border-[#333]", stat.color)}>
                 <stat.icon size={20} />
               </div>
               <div>
                 <p className="text-[10px] text-[#606060] uppercase font-bold tracking-wider font-rajdhani">{stat.label}</p>
                 <p className="text-xl font-bold text-[#f0f0f0] font-rajdhani">{stat.value}</p>
               </div>
             </div>
           ))}
        </div>

        {/* Table Section */}
        <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl overflow-hidden shadow-2xl relative">
          
          <div className="p-4 border-b border-[#2a2a2a] flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1a1a1a]/50">
            <div className="relative w-full md:w-[400px]">
              <input 
                type="text" 
                placeholder="SEARCH MEMBERS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#141414] border border-[#333] rounded-md py-2.5 pl-10 pr-4 text-[12px] font-rajdhani font-bold tracking-wider outline-none focus:border-[#dc2626] transition-all text-[#f0f0f0] placeholder:text-[#444]"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#141414] border border-[#333] rounded-md text-[11px] font-bold text-[#a0a0a0] font-rajdhani uppercase tracking-widest hover:border-[#606060] transition-all">
                <Filter size={14} /> Filter
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#141414] border border-[#333] rounded-md text-[11px] font-bold text-[#a0a0a0] font-rajdhani uppercase tracking-widest hover:border-[#606060] transition-all">
                <Download size={14} /> Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            {isError ? (
              <div className="text-center py-20 space-y-4">
                <XCircle size={40} className="mx-auto text-[#dc2626] opacity-50" />
                <p className="text-[#dc2626] font-rajdhani font-bold uppercase tracking-widest">Connection Error</p>
              </div>
            ) : members.length === 0 ? (
               <div className="text-center py-20 space-y-4">
                <Users size={40} className="mx-auto text-[#333]" />
                <p className="text-[#606060] font-rajdhani font-bold uppercase tracking-widest">No Members Found</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1a1a1a] border-b border-[#2a2a2a]">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-[2px] text-[#606060] font-bold font-rajdhani">Member Profile</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-[2px] text-[#606060] font-bold font-rajdhani">Member ID</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-[2px] text-[#606060] font-bold font-rajdhani text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-[2px] text-[#606060] font-bold font-rajdhani">Plan</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-[2px] text-[#606060] font-bold font-rajdhani text-right">Joined Date</th>
                    <th className="px-6 py-4 w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {members.map((member: any) => (
                    <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors relative">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#1f1f1f] border border-[#333] flex-shrink-0 overflow-hidden relative group-hover:border-[#dc2626]/30 transition-colors">
                            {member.profilePhotoUrl ? (
                              <img src={member.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#333]">
                                <User size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[13.5px] font-bold text-[#f0f0f0] group-hover:text-[#dc2626] transition-colors">
                              {member.firstName} {member.secondName}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                               <Mail size={10} className="text-[#444]" />
                               <p className="text-[11px] text-[#606060] truncate max-w-[150px]">{member.email}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-rajdhani font-bold text-[12px] tracking-[1px] text-[#a0a0a0] bg-[#1a1a1a] px-2 py-1 rounded border border-[#333]">
                          {member.memberId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider font-rajdhani",
                          getStatusColor(member.status || 'Active')
                        )}>
                          {member.status === 'Active' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                          {member.status || 'Active'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded border text-[11px] font-bold font-rajdhani tracking-wider uppercase",
                          getPlanColor(member.membershipPlan || '')
                        )}>
                          {member.membershipPlan || 'Standard'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-[11px] text-[#f0f0f0] font-medium font-rajdhani">
                          {safeFormatDate(member.createdAt)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === member.id ? null : member.id);
                            }}
                            className="text-[#444] hover:text-white p-1 rounded hover:bg-[#2a2a2a] transition-all"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuId === member.id && (
                            <div 
                              ref={menuRef}
                              className="absolute right-0 mt-2 w-48 bg-[#141414] border border-[#2a2a2a] rounded-lg shadow-2xl z-[100] py-1 overflow-hidden"
                            >
                              <button 
                                onClick={() => {
                                    setViewingMember(member);
                                    setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2a] transition-colors font-bold uppercase tracking-wider font-rajdhani"
                              >
                                <Eye size={14} className="text-blue-500" /> View Member
                              </button>
                              <button 
                                onClick={() => {
                                    setEditingMember(member);
                                    setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-[#a0a0a0] hover:text-white hover:bg-[#2a2a2a] transition-colors font-bold uppercase tracking-wider font-rajdhani"
                              >
                                <Pencil size={14} className="text-green-500" /> Edit Member
                              </button>
                              <button 
                                onClick={() => {
                                    setDeletingMemberId(member.id);
                                    setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] text-[#a0a0a0] hover:text-red-500 hover:bg-red-500/10 transition-colors font-bold uppercase tracking-wider font-rajdhani"
                              >
                                <Trash2 size={14} className="text-red-500" /> Delete Member
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!isLoading && members.length > 0 && (
            <div className="px-6 py-4 border-t border-[#2a2a2a] bg-[#1a1a1a]/30 flex items-center justify-between">
              <p className="text-[11px] text-[#606060] font-medium uppercase tracking-[1px] font-rajdhani">
                Showing <span className="text-[#a0a0a0] font-bold">{(page-1)*limit + 1}</span> to <span className="text-[#a0a0a0] font-bold">{Math.min(page*limit, total)}</span> of <span className="text-[#a0a0a0] font-bold">{total}</span> members
              </p>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setPage(p => Math.max(1, p-1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center bg-[#141414] border border-[#333] rounded text-[#606060] hover:text-white disabled:opacity-20 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p+1))}
                  disabled={page === totalPages || totalPages === 0}
                  className="w-8 h-8 flex items-center justify-center bg-[#141414] border border-[#333] rounded text-[#606060] hover:text-white disabled:opacity-20 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW MODAL - ALL FIELDS */}
      {viewingMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <Eye className="text-blue-500" size={20} />
                <h3 className="font-rajdhani text-xl font-bold uppercase tracking-widest">Complete Member Dossier</h3>
              </div>
              <button onClick={() => setViewingMember(null)} className="text-[#606060] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto font-sans">
              <div className="space-y-10">
                
                <div className="flex items-center gap-8 bg-[#1a1a1a] p-6 rounded-2xl border border-[#2a2a2a]">
                  <div className="w-28 h-28 rounded-2xl bg-[#0a0a0a] border border-[#333] overflow-hidden shadow-xl">
                    {viewingMember.profilePhotoUrl ? (
                      <img src={viewingMember.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#222]">
                        <User size={50} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight leading-none mb-3">
                      {viewingMember.firstName} {viewingMember.secondName}
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      <span className="font-rajdhani font-bold text-[12px] tracking-[1.5px] text-[#a0a0a0] bg-[#0a0a0a] px-3 py-1 rounded border border-[#333] uppercase">
                        {viewingMember.memberId}
                      </span>
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider font-rajdhani",
                        getStatusColor(viewingMember.status)
                      )}>
                        {viewingMember.status}
                      </div>
                      <div className={cn(
                        "inline-flex items-center px-3 py-1 rounded border text-[11px] font-bold font-rajdhani tracking-wider uppercase",
                        getPlanColor(viewingMember.membershipPlan)
                      )}>
                        {viewingMember.membershipPlan || 'Standard'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <section>
                    <h4 className="flex items-center gap-2 text-[#dc2626] font-rajdhani font-bold text-[13px] uppercase tracking-[2px] mb-5">
                      <User size={16} /> Identity & Context
                    </h4>
                    <div className="space-y-4 bg-[#0a0a0a]/30 p-5 rounded-xl border border-[#1f1f1f]">
                      <InfoItem label="Email Address" value={viewingMember.email} />
                      <InfoItem label="Phone Contact" value={viewingMember.phone || 'N/A'} />
                      <InfoItem label="Date of Birth" value={safeFormatDate(viewingMember.dob)} />
                      <InfoItem label="Gender" value={viewingMember.gender || 'N/A'} />
                      <InfoItem label="Location" value={`${viewingMember.city || ''}${viewingMember.state ? `, ${viewingMember.state}` : ''} ${viewingMember.pincode || ''}` || 'N/A'} />
                      <InfoItem label="Address" value={viewingMember.businessAddress || 'N/A'} />
                    </div>
                  </section>

                  <section>
                    <h4 className="flex items-center gap-2 text-[#dc2626] font-rajdhani font-bold text-[13px] uppercase tracking-[2px] mb-5">
                      <Building2 size={16} /> Business Profile
                    </h4>
                    <div className="space-y-4 bg-[#0a0a0a]/30 p-5 rounded-xl border border-[#1f1f1f]">
                      <InfoItem label="Enterprise Name" value={viewingMember.businessName || 'N/A'} />
                      <InfoItem label="Industry Segment" value={viewingMember.productServiceType || 'N/A'} />
                      <InfoItem label="Established" value={safeFormatDate(viewingMember.businessEstablishedOn)} />
                      <InfoItem label="Annual Turnover" value={viewingMember.annualTurnover || 'N/A'} />
                      <InfoItem label="GST Identifier" value={viewingMember.gstNumber || 'N/A'} />
                      <InfoItem label="Instagram" value={viewingMember.instagramLink ? `@${viewingMember.instagramLink}` : 'N/A'} />
                    </div>
                  </section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <section>
                    <h4 className="flex items-center gap-2 text-[#dc2626] font-rajdhani font-bold text-[13px] uppercase tracking-[2px] mb-5">
                      <AlertCircle size={16} /> Challenges & Strategy
                    </h4>
                    <div className="space-y-4 bg-[#0a0a0a]/30 p-5 rounded-xl border border-[#1f1f1f]">
                      <InfoItem label="Challenge 1" value={viewingMember.challenge1 || 'None'} />
                      <InfoItem label="Challenge 2" value={viewingMember.challenge2 || 'None'} />
                      <InfoItem label="Challenge 3" value={viewingMember.challenge3 || 'None'} />
                      <InfoItem label="90-Day Goal" value={viewingMember.goalAfter90Days || 'N/A'} />
                      <InfoItem label="Preferred Session" value={viewingMember.preferredSessionMode || 'N/A'} />
                    </div>
                  </section>

                  <section>
                    <h4 className="flex items-center gap-2 text-[#dc2626] font-rajdhani font-bold text-[13px] uppercase tracking-[2px] mb-5">
                      <Target size={16} /> Marketing & Assets
                    </h4>
                    <div className="space-y-4 bg-[#0a0a0a]/30 p-5 rounded-xl border border-[#1f1f1f]">
                      <InfoItem label="Marketing Channels" value={viewingMember.marketingChannels?.join(", ") || 'None'} />
                      <InfoItem label="Secondary Channel" value={viewingMember.marketingChannelName || 'N/A'} />
                      <InfoItem label="Domain/Hosting" value={viewingMember.domainHostingDetails || 'N/A'} />
                      <InfoItem label="SMM Support" value={viewingMember.hasSocialMediaManager ? 'Yes' : 'No'} />
                      <InfoItem label="Video Editing" value={viewingMember.hasVideoEditing ? 'Yes' : 'No'} />
                    </div>
                  </section>
                </div>

                <section>
                   <h4 className="flex items-center gap-2 text-[#dc2626] font-rajdhani font-bold text-[13px] uppercase tracking-[2px] mb-5">
                      <Shield size={16} /> System Control
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-[#0a0a0a]/30 p-5 rounded-xl border border-[#1f1f1f]">
                       <InfoItem label="Verification" value={viewingMember.verificationStatus} />
                       <InfoItem label="Account Manager" value={viewingMember.accountManager?.name || 'Unassigned'} />
                       <InfoItem label="Active Task" value={viewingMember.task || 'None'} />
                    </div>
                </section>

                {viewingMember.notes && (
                  <section className="pt-4 border-t border-[#2a2a2a]">
                    <label className="block text-[10px] text-[#555] font-bold uppercase tracking-widest mb-2 font-rajdhani">Administrative Observations</label>
                    <p className="text-[13px] text-[#a0a0a0] leading-relaxed italic">&quot;{viewingMember.notes}&quot;</p>
                  </section>
                )}
              </div>
            </div>
            <div className="px-8 py-6 border-t border-[#2a2a2a] bg-[#1a1a1a] flex justify-end">
              <button 
                onClick={() => setViewingMember(null)}
                className="bg-[#333] hover:bg-[#444] text-white px-8 py-2.5 rounded-md font-rajdhani font-bold text-[12px] uppercase tracking-widest transition-all"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL - ALL FIELDS */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1a1a1a]">
              <div className="flex items-center gap-3">
                <Pencil className="text-green-500" size={20} />
                <h3 className="font-rajdhani text-xl font-bold uppercase tracking-widest">Modify Member Parameters</h3>
              </div>
              <button onClick={() => setEditingMember(null)} className="text-[#606060] hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onUpdateSubmit)}>
              <div className="p-8 max-h-[75vh] overflow-y-auto font-sans space-y-10">
                
                <section>
                  <h4 className="text-[11px] font-bold text-[#444] uppercase tracking-[3px] mb-6 border-b border-[#1f1f1f] pb-2">01. Identity Core</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">First Name</label>
                      <input {...register("firstName")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Second Name</label>
                      <input {...register("secondName")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Email Link</label>
                      <input {...register("email")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Phone Contact</label>
                      <input {...register("phone")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Birth Date</label>
                      <input type="date" {...register("dob")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm color-scheme-dark" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Gender</label>
                      <select {...register("gender")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm appearance-none">
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[11px] font-bold text-[#444] uppercase tracking-[3px] mb-6 border-b border-[#1f1f1f] pb-2">02. Enterprise Profile</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Legal Business Name</label>
                      <input {...register("businessName")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Establishment Date</label>
                      <input type="date" {...register("businessEstablishedOn")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm color-scheme-dark" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Industry Segment</label>
                      <select {...register("productServiceType")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm appearance-none">
                        <option value="">Select...</option>
                        <option value="Product-based">Product-based</option>
                        <option value="Service-based">Service-based</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Annual Turnover</label>
                      <select {...register("annualTurnover")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm appearance-none">
                        <option value="">Select...</option>
                        <option value="Under 10L">Under 10L</option>
                        <option value="10L - 25L">10L - 25L</option>
                        <option value="25L - 50L">25L - 50L</option>
                        <option value="50L - 1Cr">50L - 1Cr</option>
                        <option value="1Cr - 5Cr">1Cr - 5Cr</option>
                        <option value="5Cr+">5Cr+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">GST Identifier</label>
                      <input {...register("gstNumber")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm" />
                    </div>
                    <div className="col-span-2">
                       <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Business Address</label>
                       <textarea {...register("businessAddress")} rows={2} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm resize-none" />
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[11px] font-bold text-[#444] uppercase tracking-[3px] mb-6 border-b border-[#1f1f1f] pb-2">03. Challenges & Strategy</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                       <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Challenge 1</label>
                       <input {...register("challenge1")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm" />
                    </div>
                    <div className="col-span-2">
                       <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Challenge 2</label>
                       <input {...register("challenge2")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm" />
                    </div>
                    <div className="col-span-2">
                       <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">90-Day Objective</label>
                       <input {...register("goalAfter90Days")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm" />
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[11px] font-bold text-[#444] uppercase tracking-[3px] mb-6 border-b border-[#1f1f1f] pb-2">04. Operational Status</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">System Status</label>
                      <select {...register("status")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm appearance-none">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Account Manager</label>
                      <select {...register("accountManagerId")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm appearance-none">
                        <option value="">Unassigned</option>
                        {managers?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Verification Level</label>
                      <select {...register("verificationStatus")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm appearance-none">
                        <option value="AWAITING KYC">Awaiting KYC</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#606060] uppercase tracking-widest mb-2 font-rajdhani">Membership Tier</label>
                      <select {...register("membershipPlan")} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-11 px-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm appearance-none">
                        <option value="Standard (Monthly)">Standard (Monthly)</option>
                        <option value="Standard (Annual)">Standard (Annual)</option>
                        <option value="Premium (Monthly)">Premium (Monthly)</option>
                        <option value="Premium (Annual)">Premium (Annual)</option>
                      </select>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[11px] font-bold text-[#444] uppercase tracking-[3px] mb-6 border-b border-[#1f1f1f] pb-2">05. Internal Logs</h4>
                  <textarea {...register("notes")} rows={4} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-white outline-none focus:border-[#dc2626] transition-all text-sm resize-none" placeholder="Enter administrative observations..." />
                </section>
              </div>
              <div className="px-8 py-6 border-t border-[#2a2a2a] bg-[#1a1a1a] flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-8 py-2.5 rounded-md font-rajdhani font-bold text-[12px] text-[#606060] hover:text-white uppercase tracking-widest transition-all"
                >
                  Abort Update
                </button>
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="bg-[#dc2626] hover:bg-red-700 text-white px-10 py-2.5 rounded-md font-rajdhani font-bold text-[12px] uppercase tracking-[2px] transition-all shadow-xl flex items-center gap-2 active:scale-95"
                >
                  {isUpdating && <Loader2 size={16} className="animate-spin" />}
                  Finalize Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingMemberId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#2a2a2a] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <h3 className="font-rajdhani text-xl font-bold uppercase tracking-widest mb-2 text-[#f0f0f0]">Authorize Deletion?</h3>
              <p className="text-[#606060] text-sm leading-relaxed mb-8">
                This action is permanent. All member data will be purged from the system.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDelete(deletingMemberId)}
                  className="w-full bg-[#dc2626] hover:bg-red-700 text-white py-3 rounded-lg font-rajdhani font-bold text-[13px] uppercase tracking-[2px] transition-all shadow-lg active:scale-95"
                >
                  Confirm Purge
                </button>
                <button 
                  onClick={() => setDeletingMemberId(null)}
                  className="w-full bg-[#1a1a1a] border border-[#333] hover:border-[#444] text-[#a0a0a0] hover:text-white py-3 rounded-lg font-rajdhani font-bold text-[13px] uppercase tracking-[2px] transition-all"
                >
                  Abort Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function InfoItem({ label, value, valueClassName = "text-white" }: { label: string; value: string | React.ReactNode; valueClassName?: string }) {
  return (
    <div>
      <label className="block text-[10px] text-[#555] font-bold uppercase tracking-widest mb-1 font-rajdhani">{label}</label>
      <div className={cn("text-[14px] font-medium tracking-tight", valueClassName)}>{value}</div>
    </div>
  );
}
