"use client";

import { useState, useEffect } from "react";
import { 
  Info, 
  CheckCircle2, 
  Target, 
  Rocket, 
  ChevronDown, 
  Camera, 
  Paperclip, 
  Play, 
  Link as LinkIcon,
  Gem,
  Loader2,
  ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCreateTaskInitiative } from "@/lib/hooks/useTasks";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Zod Schema for Task Initiative
const taskInitiativeSchema = z.object({
  dayNumber: z.string().regex(/^D\d{1,3}$/, "Day number must be in format D01-D90").refine((val) => {
    const num = parseInt(val.substring(1));
    return num >= 1 && num <= 90;
  }, "Day must be between 01 and 90"),
  stepCategory: z.string().min(1, "Step category is required"),
  taskTitle: z.string().min(1, "Task title is required"),
  taskDescription: z.string().min(1, "Task description is required"),
  basePoints: z.coerce.number().min(0).max(1000).default(100),
  proofType: z.string().default("Tick Completion"),
  isMilestone: z.boolean().default(true),
  milestoneLabel: z.string().optional(),
  bonusPoints: z.coerce.number().optional().default(0),
}).refine((data) => {
  if (data.isMilestone && (!data.milestoneLabel || data.milestoneLabel.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Milestone label is required when marked as milestone",
  path: ["milestoneLabel"],
});

type TaskInitiativeInput = z.infer<typeof taskInitiativeSchema>;

const STEP_CATEGORIES = [
  "Step 0 – Onboarding",
  "Step 1 – BMC & Metrics",
  "Step 2 – Reels",
  "Step 3 – Canva",
  "Step 4 – Website",
  "Step 5 – Ecom Ads",
  "Step 6 – Drip Marketing",
  "Step 7&8 – Thinking",
  "Step 9&10 – Automation"
];

const PROOF_TYPES = [
  { label: "Tick Completion", icon: CheckCircle2, color: "text-green-500" },
  { label: "Screenshot", icon: Camera, color: "text-blue-500" },
  { label: "Upload File", icon: Paperclip, color: "text-purple-500" },
  { label: "Video", icon: Play, color: "text-red-500" },
  { label: "Link", icon: LinkIcon, color: "text-amber-500" }
];

export default function CreateTaskInitiativePage() {
  const router = useRouter();
  const createTask = useCreateTaskInitiative();
  const [lastAutosave, setLastAutosave] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<TaskInitiativeInput>({
    resolver: zodResolver(taskInitiativeSchema),
    defaultValues: {
      basePoints: 100,
      proofType: "Tick Completion",
      isMilestone: true,
      bonusPoints: 0
    }
  });

  const isMilestone = watch("isMilestone");
  const selectedProofType = watch("proofType");
  const currentValues = watch();

  // Autosave logic
  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem("task_draft", JSON.stringify(currentValues));
      const now = new Date();
      setLastAutosave(formatTime(now));
    }, 30000);
    return () => clearInterval(timer);
  }, [currentValues]);

  // Load draft
  useEffect(() => {
    const draft = localStorage.getItem("task_draft");
    if (draft) {
       // Optional: prompt user to restore
    }
    setLastAutosave(formatTime(new Date()));
  }, []);

  const onSubmit = async (data: TaskInitiativeInput) => {
    try {
      await createTask.mutateAsync(data);
      toast.success("Task Initiative created successfully");
      localStorage.removeItem("task_draft");
      router.push("/tasks");
    } catch (err: any) {
      toast.error(err.message || "Failed to create task initiative");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-[900px] mx-auto pb-24 font-sans">
        
        {/* PAGE HEADER */}
        <header className="mb-10">
           <h2 className="text-[#666] font-bold text-[13px] tracking-widest uppercase font-rajdhani">Task Manager</h2>
           <nav className="flex items-center gap-2 mt-1 mb-4 text-[11px] font-bold uppercase tracking-widest font-rajdhani">
              <span className="text-[#666]">Dashboard</span>
              <ChevronRight size={12} className="text-[#333]" />
              <span className="text-[#666]">90-Day Tasks</span>
              <ChevronRight size={12} className="text-[#333]" />
              <span className="text-[#d4a853]">Add New Task</span>
           </nav>
           <h1 className="text-white text-[32px] font-extrabold leading-none mb-2 font-rajdhani">Create Task Initiative</h1>
           <p className="text-[#888] text-[15px]">Define a new operational task for the 90-day onboarding sequence.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-[28px]">
          
          {/* SECTION 01: BASIC INFORMATION */}
          <SectionCard icon={Info} title="SECTION 01: BASIC INFORMATION">
             <div className="grid grid-cols-1 md:grid-cols-10 gap-6">
                <div className="md:col-span-4">
                   <Label>Day Number</Label>
                   <Input 
                      placeholder="D01-D90" 
                      {...register("dayNumber")}
                      error={errors.dayNumber?.message}
                   />
                </div>
                <div className="md:col-span-6">
                   <Label>Step Category</Label>
                   <div className="relative">
                      <select 
                        {...register("stepCategory")}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px] h-[48px] px-4 text-white appearance-none outline-none focus:border-[#dc2626] transition-all"
                      >
                         <option value="">Select Category</option>
                         {STEP_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
                   </div>
                   {errors.stepCategory && <p className="text-[12px] text-[#dc2626] mt-1 uppercase font-bold tracking-wider">{errors.stepCategory.message}</p>}
                </div>
             </div>
             
             <div className="mt-6">
                <Label>Task Title</Label>
                <Input 
                   placeholder="Enter high-level objective title" 
                   {...register("taskTitle")}
                   error={errors.taskTitle?.message}
                />
             </div>

             <div className="mt-6">
                <Label>Task Description & Instructions</Label>
                <textarea 
                   {...register("taskDescription")}
                   placeholder="Detailed breakdown of requirements..."
                   className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px] min-h-[160px] p-4 text-white outline-none focus:border-[#dc2626] transition-all resize-y"
                />
                {errors.taskDescription && <p className="text-[12px] text-[#dc2626] mt-1 uppercase font-bold tracking-wider">{errors.taskDescription.message}</p>}
             </div>
          </SectionCard>

          {/* SECTION 02: POINTS & PROOF */}
          <SectionCard icon={CheckCircle2} title="SECTION 02: POINTS & PROOF">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <Label>Base Points (Max)</Label>
                   <div className="relative">
                      <input 
                         type="number"
                         {...register("basePoints")}
                         className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px] h-[48px] px-4 text-white outline-none focus:border-[#dc2626] transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] font-bold text-[12px]">XP</span>
                   </div>
                   {errors.basePoints && <p className="text-[12px] text-[#dc2626] mt-1 uppercase font-bold tracking-wider">{errors.basePoints.message}</p>}
                </div>
                <div>
                   <Label>Proof Type Required</Label>
                   <div className="relative">
                      <select 
                        {...register("proofType")}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px] h-[48px] px-4 pl-10 text-white appearance-none outline-none focus:border-[#dc2626] transition-all"
                      >
                         {PROOF_TYPES.map(pt => <option key={pt.label} value={pt.label}>{pt.label}</option>)}
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
                      {(() => {
                         const pt = PROOF_TYPES.find(p => p.label === selectedProofType);
                         const Icon = pt?.icon || CheckCircle2;
                         return <Icon size={18} className={cn("absolute left-4 top-1/2 -translate-y-1/2", pt?.color || "text-[#555]")} />;
                      })()}
                   </div>
                </div>
             </div>
          </SectionCard>

          {/* SECTION 03: MILESTONE CONFIGURATION */}
          <SectionCard icon={Target} title="SECTION 03: MILESTONE CONFIGURATION">
             <div className="bg-[#161616] border border-[#222] rounded-[8px] p-[16px_20px] flex items-center justify-between mb-6 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-[#dc2626]/10 rounded-full flex items-center justify-center border border-[#dc2626]/20">
                      <Gem size={20} className="text-[#dc2626]" />
                   </div>
                   <div>
                      <h4 className="text-white font-bold text-[15px] leading-tight">Mark as Milestone Day</h4>
                      <p className="text-[#666] text-[13px]">Elevates this task to a critical success milestone</p>
                   </div>
                </div>
                <button 
                   type="button"
                   onClick={() => setValue("isMilestone", !isMilestone)}
                   className={cn(
                     "w-12 h-6 rounded-full relative transition-all duration-300",
                     isMilestone ? "bg-[#dc2626]" : "bg-[#333]"
                   )}
                >
                   <div className={cn(
                     "w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-300",
                     isMilestone ? "right-1" : "left-1"
                   )} />
                </button>
             </div>

             {isMilestone && (
               <div className="grid grid-cols-1 md:grid-cols-10 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="md:col-span-6">
                     <Label>Milestone Label</Label>
                     <Input 
                        placeholder="e.g. Phase 1 Completion" 
                        {...register("milestoneLabel")}
                        error={errors.milestoneLabel?.message}
                     />
                  </div>
                  <div className="md:col-span-4">
                     <Label>Bonus Points</Label>
                     <div className="relative">
                        <input 
                           type="number"
                           {...register("bonusPoints")}
                           placeholder="+50"
                           className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px] h-[48px] px-4 text-white outline-none focus:border-[#dc2626] transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] font-bold text-[12px]">XP</span>
                     </div>
                  </div>
               </div>
             )}
          </SectionCard>

        </form>

        {/* STICKY FOOTER BAR */}
        <footer className="fixed bottom-0 left-[220px] right-0 h-[60px] bg-[#0a0a0a] border-t border-[#1a1a1a] flex items-center justify-between px-8 z-[40]">
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                 <span className="text-[12px] font-bold text-[#666] tracking-wider">READY FOR DEPLOYMENT</span>
              </div>
              <span className="text-[#333]">|</span>
              <span className="text-[11px] text-[#666] font-medium uppercase tracking-widest">
                 Last Autosave: <span className="text-[#888]">{lastAutosave}</span>
              </span>
           </div>

           <div className="flex items-center gap-6">
              <button 
                 type="button"
                 onClick={() => {
                   if (Object.keys(currentValues).some(k => (currentValues as any)[k] !== "")) {
                      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
                         router.back();
                      }
                   } else {
                      router.back();
                   }
                 }}
                 className="text-[12px] font-bold text-[#888] uppercase tracking-[1.5px] hover:text-white transition-colors font-rajdhani"
              >
                 Cancel
              </button>
              <button 
                 onClick={handleSubmit(onSubmit)}
                 disabled={isSubmitting}
                 className="flex items-center gap-2 bg-gradient-to-r from-[#8b1a1a] to-[#dc2626] text-white px-8 py-3 rounded-[8px] font-bold text-[13px] tracking-[2px] uppercase shadow-lg shadow-red-900/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 font-rajdhani"
              >
                 {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                 Create Task
              </button>
           </div>
        </footer>
      </div>
    </DashboardLayout>
  );
}

// HELPER COMPONENTS
function SectionCard({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-[12px] overflow-hidden relative shadow-xl">
       <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#8b1a1a]" />
       <div className="p-8">
          <div className="flex items-center gap-2.5 mb-8">
             <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                <Icon size={16} className="text-[#dc2626]" />
             </div>
             <h3 className="text-white text-[16px] font-bold tracking-widest uppercase font-rajdhani">{title}</h3>
          </div>
          {children}
       </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[#999] text-[11px] font-bold uppercase tracking-[0.08em] mb-2.5 font-rajdhani">
       {children}
    </label>
  );
}

const Input = ({ error, ...props }: any) => (
  <div>
    <input 
       {...props}
       className={cn(
         "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-[8px] h-[48px] px-4 text-white placeholder-[#555] outline-none transition-all",
         error ? "border-[#dc2626]" : "focus:border-[#dc2626]"
       )}
    />
    {error && <p className="text-[12px] text-[#dc2626] mt-1 uppercase font-bold tracking-wider">{error}</p>}
  </div>
);

function formatTime(date: Date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  const strTime = hours + ':' + (minutes < 10 ? '0' + minutes : minutes) + ' ' + ampm;
  return strTime;
}
