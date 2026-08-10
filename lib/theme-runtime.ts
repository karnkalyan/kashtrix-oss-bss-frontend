export type ThemeModeTokens = Record<string, string>
export type ThemeTokens = { light: ThemeModeTokens; dark: ThemeModeTokens }

const cssNames: Record<string,string> = {cardForeground:"card-foreground",mutedForeground:"muted-foreground",primaryForeground:"primary-foreground",secondaryForeground:"secondary-foreground",accentForeground:"accent-foreground",destructiveForeground:"destructive-foreground",fontSans:"font-sans",fontHeading:"font-heading",sidebar:"sidebar-background",sidebarForeground:"sidebar-foreground"}

function hexToHsl(hex: string) {
  const normalized=hex.replace("#","")
  if(!/^[0-9a-f]{6}$/i.test(normalized))return hex
  const [r,g,b]=[0,2,4].map(i=>parseInt(normalized.slice(i,i+2),16)/255)
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min
  let h=0
  if(delta){if(max===r)h=((g-b)/delta)%6;else if(max===g)h=(b-r)/delta+2;else h=(r-g)/delta+4;h=Math.round(h*60);if(h<0)h+=360}
  const l=(max+min)/2
  const s=delta===0?0:delta/(1-Math.abs(2*l-1))
  return h+" "+Math.round(s*100)+"% "+Math.round(l*100)+"%"
}

export function applyThemeTokens(tokens: ThemeTokens | ThemeModeTokens, mode: "light"|"dark") {
  const root=document.documentElement
  const nested=(tokens as ThemeTokens)?.light || (tokens as ThemeTokens)?.dark
  const values=nested?(tokens as ThemeTokens)[mode]:(tokens as ThemeModeTokens)
  if(!values)return
  const iconStyle=["colored","theme","monochrome"].includes(values.sidebarIconStyle)?values.sidebarIconStyle:"colored"
  root.dataset.sidebarIcons=iconStyle
  Object.entries(values).forEach(([key,value])=>{
    if(key==="sidebarIconStyle")return
    const css=cssNames[key]||key.replace(/[A-Z]/g,m=>"-"+m.toLowerCase())
    root.style.setProperty("--"+css,value.startsWith("#")?hexToHsl(value):value)
  })
  const setColor=(name:string,value?:string)=>{if(value)root.style.setProperty("--"+name,value.startsWith("#")?hexToHsl(value):value)}
  setColor("popover",values.card)
  setColor("popover-foreground",values.cardForeground||values.foreground)
  setColor("sidebar-border",values.border)
  setColor("sidebar-primary",values.primary)
  setColor("sidebar-primary-foreground",values.primaryForeground)
  setColor("sidebar-accent",values.secondary||values.muted)
  setColor("sidebar-accent-foreground",values.secondaryForeground||values.foreground)
  setColor("sidebar-ring",values.ring||values.primary)
  setColor("border-strong",values.ring||values.border)
  setColor("chart-1",values.primary)
  setColor("chart-2",values.accent)
  setColor("chart-3",values.secondaryForeground||values.primary)
  setColor("chart-4",values.destructive)
  setColor("chart-5",values.mutedForeground)
  if(values.primary)root.style.setProperty("--kashtrix-deep-plum",values.primary)
  if(values.primary)root.style.setProperty("--kashtrix-intelligent-purple",values.primary)
  if(values.mutedForeground)root.style.setProperty("--kashtrix-purple-muted",values.mutedForeground)
  if(values.accent)root.style.setProperty("--kashtrix-ai-magenta",values.accent)
  if(values.border)root.style.setProperty("--kashtrix-mist-lavender",values.border)
  if(values.background)root.style.setProperty("--theme-bg",values.background)
  if(values.foreground)root.style.setProperty("--theme-text",values.foreground)
  if(values.card)root.style.setProperty("--theme-card",values.card)
  if(values.cardForeground)root.style.setProperty("--theme-card-foreground",values.cardForeground)
  if(values.border)root.style.setProperty("--theme-border",values.border)
  if(values.muted)root.style.setProperty("--theme-muted",values.muted)
  if(values.mutedForeground)root.style.setProperty("--theme-muted-foreground",values.mutedForeground)
  if(values.radius)root.style.setProperty("--radius",values.radius)
  if(values.fontSans){root.style.setProperty("--font-sans",values.fontSans);root.style.setProperty("--font-body",values.fontSans)}
  if(values.fontHeading)root.style.setProperty("--font-heading",values.fontHeading)
  document.body.style.backgroundColor=values.background||""
  document.body.style.color=values.foreground||""
}
