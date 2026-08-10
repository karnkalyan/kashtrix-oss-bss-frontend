"use client"
import {useEffect,useMemo,useRef,useState} from "react"
import {apiRequest} from "@/lib/api"
import {applyThemeTokens,type ThemeTokens} from "@/lib/theme-runtime"
import {useTheme} from "next-themes"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Textarea} from "@/components/ui/textarea"
import {Badge} from "@/components/ui/badge"
import {Copy,Download,Palette,RotateCcw,Save,Sparkles,Upload} from "lucide-react"
import toast from "react-hot-toast"

type Version={version:number;description?:string}
type ThemeRecord={id:number;name:string;description?:string;tokens:ThemeTokens;status:string;version:number;versions?:Version[]}
type Preset={name:string;description:string;tokens:ThemeTokens}
const editable=["background","foreground","card","cardForeground","muted","mutedForeground","primary","primaryForeground","secondary","secondaryForeground","accent","accentForeground","border","input","ring","destructive","destructiveForeground","sidebar","sidebarForeground"]

export function ThemeEditor(){
  const {resolvedTheme}=useTheme()
  const mode=resolvedTheme==="dark"?"dark":"light"
  const [themes,setThemes]=useState<ThemeRecord[]>([])
  const [presets,setPresets]=useState<Preset[]>([])
  const [selected,setSelected]=useState<ThemeRecord|null>(null)
  const [draft,setDraft]=useState<ThemeTokens|null>(null)
  const [name,setName]=useState("")
  const [description,setDescription]=useState("")
  const [busy,setBusy]=useState(false)
  const savingRef=useRef(false)

  const choose=(theme:ThemeRecord)=>{setSelected(theme);setDraft(structuredClone(theme.tokens));setName(theme.name);setDescription(theme.description||"");apiRequest<any>("/themes/"+theme.id,{suppressToast:true}).then(result=>{if(result.data){setSelected(result.data);setDraft(structuredClone(result.data.tokens));setName(result.data.name);setDescription(result.data.description||"")}}).catch(()=>{})}
  const load=async()=>{const [a,b]=await Promise.all([apiRequest<any>("/themes",{suppressToast:true}),apiRequest<any>("/themes/presets",{suppressToast:true})]);setThemes(a.data||[]);setPresets(b.data||[]);if(!selected&&(a.data||[])[0])choose((a.data||[])[0])}
  useEffect(()=>{
    load().catch(()=>{})
    return ()=>{window.dispatchEvent(new CustomEvent("tenant-theme-changed"))}
  },[])
  useEffect(()=>{if(draft)applyThemeTokens(draft,mode)},[draft,mode])
  const usePreset=(preset:Preset)=>{setSelected(null);setDraft(structuredClone(preset.tokens));setName(preset.name+" Custom");setDescription(preset.description)}
  const setToken=(key:string,value:string)=>setDraft(old=>old?{...old,[mode]:{...old[mode],[key]:value}}:old)
  const setSharedToken=(key:string,value:string)=>setDraft(old=>old?{light:{...old.light,[key]:value},dark:{...old.dark,[key]:value}}:old)
  const setIconStyle=(value:string)=>setDraft(old=>old?{light:{...old.light,sidebarIconStyle:value},dark:{...old.dark,sidebarIconStyle:value}}:old)
  const changed=useMemo(()=>Boolean(draft&&(!selected||JSON.stringify(draft)!==JSON.stringify(selected.tokens)||name!==selected.name||description!==(selected.description||""))),[draft,selected,name,description])
  const save=async()=>{if(savingRef.current)return;if(!draft||!name.trim())return toast.error("Give the theme a name");savingRef.current=true;setBusy(true);try{const response=await apiRequest<any>(selected?"/themes/"+selected.id:"/themes",{method:selected?"PATCH":"POST",body:JSON.stringify({name,description,tokens:draft,changeNote:"Saved in Theme Studio"})});toast.success(response.message||"Theme draft saved");if(response.data)choose(response.data);await load()}finally{savingRef.current=false;setBusy(false)}}
  const publish=async()=>{if(!selected)return toast.error("Save this draft before publishing");setBusy(true);try{await apiRequest("/themes/"+selected.id+"/publish",{method:"POST",body:JSON.stringify({scope:"GLOBAL"})});toast.success("Theme published for this workspace");window.dispatchEvent(new CustomEvent("tenant-theme-changed",{detail:{tokens:draft}}));await load()}finally{setBusy(false)}}
  const rollback=async(version:number)=>{if(!selected)return;await apiRequest("/themes/"+selected.id+"/rollback/"+version,{method:"POST",body:"{}"});toast.success("Restored version "+version+" as a new draft");await load()}
  const duplicate=async()=>{if(!selected)return;await apiRequest("/themes/"+selected.id+"/clone",{method:"POST",body:JSON.stringify({name:selected.name+" Copy "+Date.now().toString().slice(-4)})});toast.success("Theme duplicated");await load()}
  const exportFile=()=>{if(!draft)return;const blob=new Blob([JSON.stringify({name,description,tokens:draft},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=(name||"theme")+".json";a.click();URL.revokeObjectURL(a.href)}
  const importFile=(file?:File)=>{if(!file)return;file.text().then(raw=>{const parsed=JSON.parse(raw);if(!parsed.tokens?.light||!parsed.tokens?.dark)throw new Error("Invalid theme file");setSelected(null);setName(parsed.name||"Imported theme");setDescription(parsed.description||"");setDraft(parsed.tokens)}).catch(e=>toast.error(e.message))}

  return <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
    <aside className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50">
      <div className="mb-4 flex items-center gap-2"><Palette className="h-5 w-5 text-primary"/><div><h3 className="font-semibold">Theme Studio</h3><p className="text-xs text-muted-foreground">Presets and saved themes</p></div></div>
      <div className="space-y-2">{presets.map(p=><button key={p.name} onClick={()=>usePreset(p)} className="w-full rounded-xl bg-muted/60 p-3 text-left transition hover:-translate-y-0.5 hover:bg-muted"><span className="text-sm font-medium">{p.name}</span><span className="mt-1 block text-xs text-muted-foreground">{p.description}</span><span className="mt-2 flex gap-1">{[p.tokens.light.primary,p.tokens.light.accent,p.tokens.light.sidebar].map((c,index)=><i key={`${p.name}-${index}-${c}`} className="h-3 w-3 rounded-full" style={{background:c}}/>)}</span></button>)}</div>
      <div className="my-4 h-px bg-border"/><p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Saved</p>
      {themes.map(t=><button key={t.id} onClick={()=>choose(t)} className={"mb-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm "+(selected?.id===t.id?"bg-primary text-primary-foreground":"hover:bg-muted")}><span className="truncate">{t.name}</span><Badge variant="outline" className="text-[10px]">v{t.version}</Badge></button>)}
    </aside>
    <section className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border/50">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Design tokens</h3><p className="text-sm text-muted-foreground">Editing the {mode} appearance. Switch app mode to edit the other palette.</p></div><Badge className="capitalize">{mode} mode</Badge></div>
      <div className="grid gap-4 md:grid-cols-2"><div><Label>Name</Label><Input value={name} onChange={e=>setName(e.target.value)} className="mt-1"/></div><div><Label>Description</Label><Textarea value={description} onChange={e=>setDescription(e.target.value)} className="mt-1 min-h-10"/></div></div>
      <div className="mt-4 rounded-xl border bg-muted/30 p-4"><Label>Sidebar icon appearance</Label><p className="mt-1 text-xs text-muted-foreground">Colored is the default and gives each operational module a distinct, consistent icon color.</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{[{value:"colored",label:"Colored",colors:["#3b82f6","#14b8a6","#f59e0b"]},{value:"theme",label:"Theme color",colors:[draft?.[mode]?.primary||"#7c3aed"]},{value:"monochrome",label:"Monochrome",colors:[draft?.[mode]?.mutedForeground||"#64748b"]}].map(option=><button type="button" key={option.value} onClick={()=>setIconStyle(option.value)} className={"flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition "+((draft?.[mode]?.sidebarIconStyle||"colored")===option.value?"border-primary bg-primary/10 text-primary":"bg-background hover:bg-muted")}><span>{option.label}</span><span className="flex gap-1">{option.colors.map((color,index)=><i key={index} className="size-3 rounded-full" style={{backgroundColor:color}}/>)}</span></button>)}</div></div>
      {draft&&<div className="mt-4 grid gap-3 rounded-xl border bg-muted/30 p-4 md:grid-cols-3"><div><Label>Interface radius</Label><Input value={draft[mode]?.radius||"0.75rem"} onChange={e=>setSharedToken("radius",e.target.value)} className="mt-1" placeholder="0.75rem"/></div><div><Label>Body font family</Label><Input value={draft[mode]?.fontSans||"Inter, sans-serif"} onChange={e=>setSharedToken("fontSans",e.target.value)} className="mt-1"/></div><div><Label>Heading font family</Label><Input value={draft[mode]?.fontHeading||draft[mode]?.fontSans||"Inter, sans-serif"} onChange={e=>setSharedToken("fontHeading",e.target.value)} className="mt-1"/></div></div>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{draft&&editable.map(key=><label key={key} className="rounded-xl bg-muted/50 p-3"><span className="mb-2 block text-xs font-medium">{key.replace(/[A-Z]/g,m=>" "+m.toLowerCase())}</span><span className="flex items-center gap-2"><input type="color" value={draft[mode]?.[key]||"#000000"} onChange={e=>setToken(key,e.target.value)} className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent"/><Input value={draft[mode]?.[key]||""} onChange={e=>setToken(key,e.target.value)} className="h-9 font-mono text-xs"/></span></label>)}</div>
      <div className="mt-5 flex flex-wrap gap-2"><Button onClick={save} disabled={!changed||busy}><Save className="mr-2 h-4 w-4"/>Save draft</Button><Button onClick={publish} disabled={!selected||busy} variant="secondary"><Sparkles className="mr-2 h-4 w-4"/>Publish globally</Button><Button onClick={duplicate} disabled={!selected} variant="outline"><Copy className="mr-2 h-4 w-4"/>Duplicate</Button><Button onClick={exportFile} variant="outline"><Download className="mr-2 h-4 w-4"/>Export</Button><Button asChild variant="outline"><label><Upload className="mr-2 h-4 w-4"/>Import<input type="file" accept="application/json" className="hidden" onChange={e=>importFile(e.target.files?.[0])}/></label></Button></div>
    </section>
    <aside className="space-y-5">
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/50"><div className="bg-sidebar p-4 text-sidebar-foreground"><p className="font-semibold">Live preview</p><p className="text-xs opacity-70">Navigation surface</p></div><div className="space-y-3 p-4"><div className="rounded-xl bg-primary p-4 text-primary-foreground"><p className="font-semibold">Operational card</p><p className="text-sm opacity-80">1,284 active customers</p></div><div className="rounded-xl bg-muted p-4"><p className="font-medium">Service health</p><div className="mt-3 h-2 rounded-full bg-border"><div className="h-2 w-4/5 rounded-full bg-accent"/></div></div><Button className="w-full">Primary action</Button></div></div>
      {selected?.versions?.length?<div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/50"><h4 className="font-semibold">Version history</h4><div className="mt-3 space-y-2">{selected.versions.slice(0,8).map(v=><div key={v.version} className="flex items-center justify-between rounded-lg bg-muted/50 p-2"><div><p className="text-sm font-medium">Version {v.version}</p><p className="text-xs text-muted-foreground">{v.description||"Saved draft"}</p></div><Button size="icon" variant="ghost" onClick={()=>rollback(v.version)}><RotateCcw className="h-4 w-4"/></Button></div>)}</div></div>:null}
    </aside>
  </div>
}
