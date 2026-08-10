"use client"

import { useState, useEffect, useRef, Fragment } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  Plus, PlusCircle, Edit2, Trash2, Copy, Zap, Wifi,
  AlertCircle, Server, Eye, EyeOff,
  RefreshCw, Terminal, Network, HardDrive,
  Cpu, Shield, Download, Upload,
  Settings, Search, Filter, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, ArrowUpDown, MoreVertical,
  MapPin, Activity, BarChart, ShieldCheck, Key,
  PanelTop, Layers, Thermometer, Clock, Calendar,
  Save, X, Users, Building, Globe, Router,
  Database, Lock, TestTube, MemoryStick,
  ChevronDown, ChevronUp, Settings2, Wifi as WifiIcon,
  Network as NetworkIcon, Key as KeyIcon, Globe as GlobeIcon,
  Shield as ShieldIcon, Cpu as CpuIcon, MapPin as MapPinIcon,
  Cloud, Database as DatabaseIcon, DownloadCloud,
  UploadCloud, Bell, BellRing, Activity as ActivityIcon,
  Power, PowerOff, Cog, ServerCog, NetworkNodes,
  HardHat, Cable, Radio, Satellite, Bluetooth,
  Monitor, Smartphone, Router as RouterIcon, Cctv,
  Plug, Battery, BatteryCharging, Sun, Moon,
  ThermometerSun, Wind, Droplets, CloudRain,
  CloudSnow, CloudLightning, CloudSun, CloudMoon,
  WifiOff, Signal, SignalHigh, SignalMedium, SignalLow,
  Navigation, Compass, Map, Route, Landmark,
  Home, Building2, Factory, Warehouse, Store,
  Bank, Hotel, School, Hospital, Church,
  Castle, Tent, TreePine, Mountain, Waves,
  Ship, Plane, Train, Bus, Car,
  Bike, Truck, Forklift, Tractor, Ambulance,
  FireExtinguisher, FirstAid, ShieldAlert, ShieldCheck as ShieldCheckIcon,
  ShieldOff, ShieldQuestion, ShieldX, ShieldPlus,
  ShieldMinus, KeyRound, KeySquare, LockKeyhole,
  LockOpen, Unlock, Fingerprint, Scan,
  QrCode, Barcode, SmartphoneNfc, Nfc,
  BluetoothConnected, BluetoothSearching, Wifi as WifiSignal,
  RadioTower, SatelliteDish, Antenna, TowerControl,
  Broadcast, Telescope, Radar, Satellite as SatelliteDishIcon,
  Earth, Globe2, Map as MapIcon, Navigation2,
  Compass as CompassIcon, MapPin as MapPinIcon2,
  Pin, PinOff, Flag, Navigation as NavigationIcon,
  Route as RouteIcon, Locate, LocateFixed, LocateOff,
  NavigationOff, MapPinned, MapPinOff, MapPinCheck,
  MapPinX, MapPinPlus, MapPinMinus, MapPinEdit,
  Play, Pause, StopCircle, ScanFace, CableCar,
  Terminal as TerminalIcon, Shell, Command, GitBranch,
  GitCommit, GitPullRequest, GitMerge, GitFork,
  CloudUpload, CloudDownload, RefreshCcw,
  Satellite as SatelliteIcon, Navigation as NavigationIcon2,
  Download as DownloadIcon, Upload as UploadIcon,
  Wifi as WifiIcon2, Signal as SignalIcon,
  BarChart3, Gauge, Thermometer as ThermometerIcon,
  BatteryFull, BatteryLow, BatteryMedium,
  BatteryWarning, Router as RouterIcon2,
  Ethernet, Cable as CableIcon, HardDrive as HardDriveIcon,
  MemoryStick as MemoryStickIcon, Cpu as CpuIcon2,
  Database as DatabaseIcon2, Server as ServerIcon,
  Globe as GlobeIcon2, MapPin as MapPinIcon3,
  Layers as LayersIcon, PanelTop as PanelTopIcon,
  Network as NetworkIcon2, Activity as ActivityIcon2,
  Power as PowerIcon, DatabaseBackup, TerminalSquare,
  TestTubeDiagonal, TestTube2, Cpu as CpuIcon3,
  HardDrive as HardDriveIcon2, ServerCrash, ServerOff,
  ServerCog as ServerCogIcon, Network as NetworkIcon3,
  Wifi as WifiIcon3, Signal as SignalIcon2,
  RefreshCw as RefreshCwIcon, Check, X as XIcon,
  AlertTriangle, Info, ExternalLink, Copy as CopyIcon,
  Download as DownloadIcon2, Upload as UploadIcon2,
  Settings as SettingsIcon, Code, FileCode, FileText,
  Json, Cpu as CpuIcon4, MemoryStick as MemoryStickIcon2,
  HardDrive as HardDriveIcon3, Database as DatabaseIcon3,
  Shield as ShieldIcon2, Key as KeyIcon2, Lock as LockIcon,
  Terminal as TerminalIcon2, Command as CommandIcon,
  ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon,
  ChevronUp as ChevronUpIcon, ChevronDown as ChevronDownIcon,
  MoreHorizontal, Loader2, Circle, CircleCheck,
  CircleX, CircleAlert, CircleHelp, CircleDashed,
  Square, SquareCheck, SquareX, SquareAlert,
  Triangle, TriangleAlert, OctagonAlert, Hexagon,
  Pentagon, Octagon, Nonagon, Decagon,
  Ellipsis, Menu, Grid, List, Layout,
  Columns, Rows, Sidebar, SidebarClose,
  SidebarOpen, PanelLeft, PanelRight, PanelTop as PanelTopIcon2,
  PanelBottom, LayoutGrid, LayoutList, LayoutTemplate,
  LayoutDashboard, LayoutPanelLeft, LayoutPanelTop,
  File, FileText as FileTextIcon, FileCode as FileCodeIcon,
  FileJson, FileInput, FileOutput, FileSpreadsheet,
  FileArchive, FileImage, FileVideo, FileAudio,
  FileType, FileSignature, FileSearch, FileDiff,
  FileSymlink, FileMinus, FilePlus, FileX,
  Folder, FolderOpen, FolderPlus, FolderMinus,
  FolderX, FolderTree, FolderInput, FolderOutput,
  FolderSearch, FolderSymlink, FolderGit, FolderGit2,
  Book, BookOpen, Bookmark, BookmarkCheck,
  BookmarkMinus, BookmarkPlus, BookmarkX, BookKey,
  BookLock, BookOpenCheck, BookOpenText, BookTemplate,
  Notebook, NotebookPen, NotebookTabs, NotebookText,
  Calendar as CalendarIcon, CalendarDays, CalendarCheck,
  CalendarClock, CalendarHeart, CalendarMinus,
  CalendarOff, CalendarPlus, CalendarRange,
  CalendarSearch, CalendarX, Clock as ClockIcon,
  Clock1, Clock10, Clock11, Clock12,
  Clock2, Clock3, Clock4, Clock5,
  Clock6, Clock7, Clock8, Clock9,
  Timer, TimerOff, TimerReset, AlarmClock,
  AlarmClockCheck, AlarmClockMinus, AlarmClockOff,
  AlarmClockPlus, Hourglass, History,
  // SSH Testing icons
  PlugZap, Plug as PlugIcon, Zap as ZapIcon,
  Power as PowerIcon2, Flashlight, FlashlightOff,
  Battery as BatteryIcon, BatteryCharging as BatteryChargingIcon,
  BatteryFull as BatteryFullIcon, BatteryLow as BatteryLowIcon,
  BatteryMedium as BatteryMediumIcon, BatteryWarning as BatteryWarningIcon,
  BatteryEmpty, Cloud as CloudIcon, CloudOff,
  CloudDrizzle, CloudFog, CloudHail, CloudLightning as CloudLightningIcon,
  CloudMoon as CloudMoonIcon, CloudRain as CloudRainIcon,
  CloudSnow as CloudSnowIcon, CloudSun as CloudSunIcon,
  Cloudy, Haze, Hurricane, Moon as MoonIcon,
  MoonStar, Snowflake, Sun as SunIcon, SunDim,
  SunMedium, SunSnow, Tornado, Umbrella,
  Wind as WindIcon, Waves as WavesIcon, Droplet,
  Droplets as DropletsIcon, Thermometer as ThermometerIcon2,
  ThermometerSnowflake, ThermometerSun as ThermometerSunIcon,
  Compass as CompassIcon2, Globe as GlobeIcon3,
  Map as MapIcon2, Navigation as NavigationIcon3,
  Mountain as MountainIcon, TreePine as TreePineIcon,
  Factory as FactoryIcon, Home as HomeIcon,
  Building2 as Building2Icon, Hotel as HotelIcon,
  School as SchoolIcon, Hospital as HospitalIcon,
  Church as ChurchIcon, Castle as CastleIcon,
  Tent as TentIcon, Ship as ShipIcon, Plane as PlaneIcon,
  Train as TrainIcon, Bus as BusIcon, Car as CarIcon,
  Bike as BikeIcon, Truck as TruckIcon, Forklift as ForkliftIcon,
  Tractor as TractorIcon, Ambulance as AmbulanceIcon,
  FireExtinguisher as FireExtinguisherIcon, FirstAid as FirstAidIcon,
  Shield as ShieldIcon3, ShieldAlert as ShieldAlertIcon,
  ShieldCheck as ShieldCheckIcon2, ShieldOff as ShieldOffIcon,
  ShieldQuestion as ShieldQuestionIcon, ShieldX as ShieldXIcon,
  ShieldPlus as ShieldPlusIcon, ShieldMinus as ShieldMinusIcon,
  Key as KeyIcon3, KeyRound as KeyRoundIcon, KeySquare as KeySquareIcon,
  Lock as LockIcon2, LockKeyhole as LockKeyholeIcon,
  LockOpen as LockOpenIcon, Unlock as UnlockIcon,
  Fingerprint as FingerprintIcon, Scan as ScanIcon,
  QrCode as QrCodeIcon, Barcode as BarcodeIcon,
  SmartphoneNfc as SmartphoneNfcIcon, Nfc as NfcIcon,
  BluetoothConnected as BluetoothConnectedIcon, BluetoothSearching as BluetoothSearchingIcon,
  Wifi as WifiIcon4, RadioTower as RadioTowerIcon,
  SatelliteDish as SatelliteDishIcon2, Antenna as AntennaIcon,
  TowerControl as TowerControlIcon, Broadcast as BroadcastIcon,
  Telescope as TelescopeIcon, Radar as RadarIcon,
  Satellite as SatelliteIcon2, Earth as EarthIcon,
  Globe2 as Globe2Icon, Map as MapIcon3,
  Navigation2 as Navigation2Icon, Compass as CompassIcon3,
  MapPin as MapPinIcon4, Pin as PinIcon, PinOff as PinOffIcon,
  Flag as FlagIcon, Navigation as NavigationIcon4,
  Route as RouteIcon2, Locate as LocateIcon, LocateFixed as LocateFixedIcon,
  LocateOff as LocateOffIcon, NavigationOff as NavigationOffIcon,
  MapPinned as MapPinnedIcon, MapPinOff as MapPinOffIcon,
  MapPinCheck as MapPinCheckIcon, MapPinX as MapPinXIcon,
  MapPinPlus as MapPinPlusIcon, MapPinMinus as MapPinMinusIcon,
  MapPinEdit as MapPinEditIcon, Play as PlayIcon,
  Pause as PauseIcon, StopCircle as StopCircleIcon,
  ScanFace as ScanFaceIcon, CableCar as CableCarIcon,
  Terminal as TerminalIcon3, Shell as ShellIcon,
  Command as CommandIcon2, GitBranch as GitBranchIcon,
  GitCommit as GitCommitIcon, GitPullRequest as GitPullRequestIcon,
  GitMerge as GitMergeIcon, GitFork as GitForkIcon,
  CloudUpload as CloudUploadIcon, CloudDownload as CloudDownloadIcon,
  RefreshCcw as RefreshCcwIcon, Satellite as SatelliteIcon3,
  Navigation as NavigationIcon5, Download as DownloadIcon3,
  Upload as UploadIcon3, Wifi as WifiIcon5,
  Signal as SignalIcon3, BarChart3 as BarChart3Icon,
  Gauge as GaugeIcon, Thermometer as ThermometerIcon3,
  BatteryFull as BatteryFullIcon2, BatteryLow as BatteryLowIcon2,
  BatteryMedium as BatteryMediumIcon2, BatteryWarning as BatteryWarningIcon2,
  Router as RouterIcon3, Ethernet as EthernetIcon,
  Cable as CableIcon2, HardDrive as HardDriveIcon4,
  MemoryStick as MemoryStickIcon3, Cpu as CpuIcon5,
  Database as DatabaseIcon4, Server as ServerIcon2,
  Globe as GlobeIcon4, MapPin as MapPinIcon5,
  Layers as LayersIcon2, PanelTop as PanelTopIcon3,
  Network as NetworkIcon4, Activity as ActivityIcon3,
  Power as PowerIcon3, DatabaseBackup as DatabaseBackupIcon,
  TerminalSquare as TerminalSquareIcon, TestTubeDiagonal as TestTubeDiagonalIcon,
  TestTube2 as TestTube2Icon, Cpu as CpuIcon6,
  HardDrive as HardDriveIcon5, ServerCrash as ServerCrashIcon,
  ServerOff as ServerOffIcon, ServerCog as ServerCogIcon2,
  Network as NetworkIcon5, Wifi as WifiIcon6,
  Signal as SignalIcon4, RefreshCw as RefreshCwIcon2,
  Check as CheckIcon, X as XIcon2, AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon, ExternalLink as ExternalLinkIcon,
  Copy as CopyIcon2, Download as DownloadIcon4,
  Upload as UploadIcon4, Settings as SettingsIcon2,
  Code as CodeIcon, FileCode as FileCodeIcon2,
  FileText as FileTextIcon2, Json as JsonIcon,
  Cpu as CpuIcon7, MemoryStick as MemoryStickIcon4,
  HardDrive as HardDriveIcon6, Database as DatabaseIcon5,
  Shield as ShieldIcon4, Key as KeyIcon4, Lock as LockIcon3,
  Terminal as TerminalIcon4, Command as CommandIcon3,
  ChevronRight as ChevronRightIcon2, ChevronLeft as ChevronLeftIcon2,
  ChevronUp as ChevronUpIcon2, ChevronDown as ChevronDownIcon2,
  MoreHorizontal as MoreHorizontalIcon, Loader2 as Loader2Icon,
  Circle as CircleIcon, CircleCheck as CircleCheckIcon,
  CircleX as CircleXIcon, CircleAlert as CircleAlertIcon,
  CircleHelp as CircleHelpIcon, CircleDashed as CircleDashedIcon,
  Square as SquareIcon, SquareCheck as SquareCheckIcon,
  SquareX as SquareXIcon, SquareAlert as SquareAlertIcon,
  Triangle as TriangleIcon, TriangleAlert as TriangleAlertIcon,
  OctagonAlert as OctagonAlertIcon, Hexagon as HexagonIcon,
  Pentagon as PentagonIcon, Octagon as OctagonIcon,
  Nonagon as NonagonIcon, Decagon as DecagonIcon,
  Ellipsis as EllipsisIcon, Menu as MenuIcon,
  Grid as GridIcon, List as ListIcon, Layout as LayoutIcon,
  Columns as ColumnsIcon, Rows as RowsIcon, Sidebar as SidebarIcon,
  SidebarClose as SidebarCloseIcon, SidebarOpen as SidebarOpenIcon,
  PanelLeft as PanelLeftIcon, PanelRight as PanelRightIcon,
  PanelTop as PanelTopIcon4, PanelBottom as PanelBottomIcon,
  LayoutGrid as LayoutGridIcon, LayoutList as LayoutListIcon,
  LayoutTemplate as LayoutTemplateIcon, LayoutDashboard as LayoutDashboardIcon,
  LayoutPanelLeft as LayoutPanelLeftIcon, LayoutPanelTop as LayoutPanelTopIcon,
  File as FileIcon, FileText as FileTextIcon3, FileCode as FileCodeIcon3,
  FileJson as FileJsonIcon, FileInput as FileInputIcon,
  FileOutput as FileOutputIcon, FileSpreadsheet as FileSpreadsheetIcon,
  FileArchive as FileArchiveIcon, FileImage as FileImageIcon,
  FileVideo as FileVideoIcon, FileAudio as FileAudioIcon,
  FileType as FileTypeIcon, FileSignature as FileSignatureIcon,
  FileSearch as FileSearchIcon, FileDiff as FileDiffIcon,
  FileSymlink as FileSymlinkIcon, FileMinus as FileMinusIcon,
  FilePlus as FilePlusIcon, FileX as FileXIcon,
  Folder as FolderIcon, FolderOpen as FolderOpenIcon,
  FolderPlus as FolderPlusIcon, FolderMinus as FolderMinusIcon,
  FolderX as FolderXIcon, FolderTree as FolderTreeIcon,
  FolderInput as FolderInputIcon, FolderOutput as FolderOutputIcon,
  FolderSearch as FolderSearchIcon, FolderSymlink as FolderSymlinkIcon,
  FolderGit as FolderGitIcon, FolderGit2 as FolderGit2Icon,
  Book as BookIcon, BookOpen as BookOpenIcon,
  Bookmark as BookmarkIcon, BookmarkCheck as BookmarkCheckIcon,
  BookmarkMinus as BookmarkMinusIcon, BookmarkPlus as BookmarkPlusIcon,
  BookmarkX as BookmarkXIcon, BookKey as BookKeyIcon,
  BookLock as BookLockIcon, BookOpenCheck as BookOpenCheckIcon,
  BookOpenText as BookOpenTextIcon, BookTemplate as BookTemplateIcon,
  Notebook as NotebookIcon, NotebookPen as NotebookPenIcon,
  NotebookTabs as NotebookTabsIcon, NotebookText as NotebookTextIcon,
  Calendar as CalendarIcon2, CalendarDays as CalendarDaysIcon,
  CalendarCheck as CalendarCheckIcon, CalendarClock as CalendarClockIcon,
  CalendarHeart as CalendarHeartIcon, CalendarMinus as CalendarMinusIcon,
  CalendarOff as CalendarOffIcon, CalendarPlus as CalendarPlusIcon,
  CalendarRange as CalendarRangeIcon, CalendarSearch as CalendarSearchIcon,
  CalendarX as CalendarXIcon, Clock as ClockIcon2,
  Clock1 as Clock1Icon, Clock10 as Clock10Icon,
  Clock11 as Clock11Icon, Clock12 as Clock12Icon,
  Clock2 as Clock2Icon, Clock3 as Clock3Icon,
  Clock4 as Clock4Icon, Clock5 as Clock5Icon,
  Clock6 as Clock6Icon, Clock7 as Clock7Icon,
  Clock8 as Clock8Icon, Clock9 as Clock9Icon,
  Timer as TimerIcon, TimerOff as TimerOffIcon,
  TimerReset as TimerResetIcon, AlarmClock as AlarmClockIcon,
  AlarmClockCheck as AlarmClockCheckIcon, AlarmClockMinus as AlarmClockMinusIcon,
  AlarmClockOff as AlarmClockOffIcon, AlarmClockPlus as AlarmClockPlusIcon,
  Hourglass as HourglassIcon, History as HistoryIcon,
  PlugZap as PlugZapIcon, Plug as PlugIcon2,
  Zap as ZapIcon2, Power as PowerIcon4,
  Flashlight as FlashlightIcon, FlashlightOff as FlashlightOffIcon,
  Battery as BatteryIcon2, BatteryCharging as BatteryChargingIcon2,
  BatteryFull as BatteryFullIcon3, BatteryLow as BatteryLowIcon3,
  BatteryMedium as BatteryMediumIcon3, BatteryWarning as BatteryWarningIcon3,
  BatteryEmpty as BatteryEmptyIcon, Cloud as CloudIcon2,
  CloudOff as CloudOffIcon, CloudDrizzle as CloudDrizzleIcon,
  CloudFog as CloudFogIcon, CloudHail as CloudHailIcon,
  CloudLightning as CloudLightningIcon2, CloudMoon as CloudMoonIcon2,
  CloudRain as CloudRainIcon2, CloudSnow as CloudSnowIcon2,
  CloudSun as CloudSunIcon2, Cloudy as CloudyIcon,
  Haze as HazeIcon, Hurricane as HurricaneIcon,
  Moon as MoonIcon2, MoonStar as MoonStarIcon,
  Snowflake as SnowflakeIcon, Sun as SunIcon2,
  SunDim as SunDimIcon, SunMedium as SunMediumIcon,
  SunSnow as SunSnowIcon, Tornado as TornadoIcon,
  Umbrella as UmbrellaIcon, Wind as WindIcon2,
  Waves as WavesIcon2, Droplet as DropletIcon,
  Droplets as DropletsIcon2, Thermometer as ThermometerIcon4,
  ThermometerSnowflake as ThermometerSnowflakeIcon,
  ThermometerSun as ThermometerSunIcon2, Compass as CompassIcon4,
  Globe as GlobeIcon5, Map as MapIcon4,
  Navigation as NavigationIcon6, Mountain as MountainIcon2,
  TreePine as TreePineIcon2, Factory as FactoryIcon2,
  Home as HomeIcon2, Building2 as Building2Icon2,
  Hotel as HotelIcon2, School as SchoolIcon2,
  Hospital as HospitalIcon2, Church as ChurchIcon2,
  Castle as CastleIcon2, Tent as TentIcon2,
  Ship as ShipIcon2, Plane as PlaneIcon2,
  Train as TrainIcon2, Bus as BusIcon2,
  Car as CarIcon2, Bike as BikeIcon2,
  Truck as TruckIcon2, Forklift as ForkliftIcon2,
  Tractor as TractorIcon2, Ambulance as AmbulanceIcon2,
  FireExtinguisher as FireExtinguisherIcon2, FirstAid as FirstAidIcon2,
  Shield as ShieldIcon5, ShieldAlert as ShieldAlertIcon2,
  ShieldCheck as ShieldCheckIcon3, ShieldOff as ShieldOffIcon2,
  ShieldQuestion as ShieldQuestionIcon2, ShieldX as ShieldXIcon2,
  ShieldPlus as ShieldPlusIcon2, ShieldMinus as ShieldMinusIcon2,
  Key as KeyIcon5, KeyRound as KeyRoundIcon2,
  KeySquare as KeySquareIcon2, Lock as LockIcon4,
  LockKeyhole as LockKeyholeIcon2, LockOpen as LockOpenIcon2,
  Unlock as UnlockIcon2, Fingerprint as FingerprintIcon2,
  Scan as ScanIcon2, QrCode as QrCodeIcon2,
  Barcode as BarcodeIcon2, SmartphoneNfc as SmartphoneNfcIcon2,
  Nfc as NfcIcon2, BluetoothConnected as BluetoothConnectedIcon2,
  BluetoothSearching as BluetoothSearchingIcon2, Wifi as WifiIcon7,
  RadioTower as RadioTowerIcon2, SatelliteDish as SatelliteDishIcon3,
  Antenna as AntennaIcon2, TowerControl as TowerControlIcon2,
  Broadcast as BroadcastIcon2, Telescope as TelescopeIcon2,
  Radar as RadarIcon2, Satellite as SatelliteIcon4,
  Earth as EarthIcon2, Globe2 as Globe2Icon2,
  Map as MapIcon5, Navigation2 as Navigation2Icon2,
  Compass as CompassIcon5, MapPin as MapPinIcon6,
  Pin as PinIcon2, PinOff as PinOffIcon2,
  Flag as FlagIcon2, Navigation as NavigationIcon7,
  Route as RouteIcon3, Locate as LocateIcon2,
  LocateFixed as LocateFixedIcon2, LocateOff as LocateOffIcon2,
  NavigationOff as NavigationOffIcon2, MapPinned as MapPinnedIcon2,
  MapPinOff as MapPinOffIcon2, MapPinCheck as MapPinCheckIcon2,
  MapPinX as MapPinXIcon2, MapPinPlus as MapPinPlusIcon2,
  MapPinMinus as MapPinMinusIcon2, MapPinEdit as MapPinEditIcon2,
  Play as PlayIcon2, Pause as PauseIcon2,
  StopCircle as StopCircleIcon2, ScanFace as ScanFaceIcon2,
  CableCar as CableCarIcon2, Terminal as TerminalIcon5,
  Shell as ShellIcon2, Command as CommandIcon4,
  GitBranch as GitBranchIcon2, GitCommit as GitCommitIcon2,
  GitPullRequest as GitPullRequestIcon2, GitMerge as GitMergeIcon2,
  GitFork as GitForkIcon2, CloudUpload as CloudUploadIcon2,
  CloudDownload as CloudDownloadIcon2, RefreshCcw as RefreshCcwIcon3,
  Satellite as SatelliteIcon5, Navigation as NavigationIcon8,
  Download as DownloadIcon5, Upload as UploadIcon5,
  Wifi as WifiIcon8, Signal as SignalIcon5,
  BarChart3 as BarChart3Icon2, Gauge as GaugeIcon2,
  Thermometer as ThermometerIcon5, BatteryFull as BatteryFullIcon4,
  BatteryLow as BatteryLowIcon4, BatteryMedium as BatteryMediumIcon4,
  BatteryWarning as BatteryWarningIcon4, Router as RouterIcon4,
  Ethernet as EthernetIcon2, Cable as CableIcon3,
  HardDrive as HardDriveIcon7, MemoryStick as MemoryStickIcon5,
  Cpu as CpuIcon8, Database as DatabaseIcon6,
  Server as ServerIcon3, Globe as GlobeIcon6,
  MapPin as MapPinIcon7, Layers as LayersIcon3,
  PanelTop as PanelTopIcon5, Network as NetworkIcon6,
  Activity as ActivityIcon4,
  Split, Cable as FiberIcon
} from "lucide-react"
import { toast } from "react-hot-toast"
import { apiRequest } from "@/lib/api"
import { motion } from "framer-motion"
import { useConfirmToast } from "@/hooks/use-confirm-toast"
import { OLTTerminal } from "@/components/fiber/olt-terminal"
import { OLTManagementSummary, OLTModernAnalytics, OLTModernOverview, OLTSelectedDeviceBanner } from "@/components/fiber/olt-management-modern"
import { SplitterDetailsModern } from "@/components/fiber/splitter-details-modern"
import { useAuth } from "@/contexts/AuthContext"

interface ServiceBoard {
  id: string
  slot: number
  type: "GPON" | "EPON" | "XG-PON" | "10G-EPON" | "COMBO"
  portCount: number
  usedPorts: number
  availablePorts: number
  status: "active" | "inactive" | "faulty"
  temperature?: number
  powerConsumption?: number
  firmwareVersion?: string
  serialNumber?: string
}

interface ONT {
  id: string
  ontId: string
  serialNumber: string
  vendor: string
  model: string
  status: "online" | "offline" | "lost" | "dying-gasp"
  distance: number // in meters
  rxPower: number // in dBm
  txPower: number // in dBm
  temperature?: number
  uptime: string // in seconds or formatted string
  lastOnline: string
  serviceState: "active" | "inactive" | "blocked"
  servicePort: string
  vlan?: number
  macAddress: string
  ipAddress?: string
  description?: string
  capabilities: string[]
  rawData?: any
  lastSync: string
  ontDetails?: {
    id: string
    ontId: string
    fsp: string
    serialNumber: string
    description: string
    controlFlag: string
    runState: string
    configState: string
    matchState: string
    isolationState: string
    distance: number
    batteryState: string
    lastUpTime: string
    lastDownTime: string
    lastDownCause: string
    lastDyingGaspTime: string
    onlineDuration: string
    systemUptime: string
    lineProfileId: string
    lineProfileName: string
    serviceProfileId: string
    serviceProfileName: string
    mappingMode: string
    qosMode: string
    tr069: string
    protectSide: string
    tconts: any[]
    gems: any[]
    vlanTranslations: any[]
    servicePorts: any[]
    opticalDiagnostics: any
    createdAt: string
    updatedAt: string
    lastSync: string
  }
}
type Transport = "ssh" | "telnet";

interface OLT {
  id: string
  name: string
  ipAddress: string
  model: string
  vendor: string
  serialNumber: string
  firmwareVersion: string
  status: "online" | "offline" | "maintenance"
  lastSeen: string
  totalPorts: number
  usedPorts: number
  availablePorts: number
  totalSubscribers: number
  activeSubscribers: number
  serviceBoards: ServiceBoard[]
  defaultTransport: Transport
  sshConfig: {
    host: string
    port: number
    username: string
    password: string
    enablePassword: string
    sshKey?: string
  }
  telnetConfig: {
    enabled: boolean
    port: number
  }
  management: {
    snmpEnabled: boolean
    snmpCommunity: string
    snmpVersion: "v2c" | "v3"
    webInterface: boolean
    webPort: number
    webSSL: boolean
    apiEnabled: boolean
    apiPort: number
  }
  location: {
    region: string
    site: string
    rack: number
    position: number
    latitude?: number
    longitude?: number
    notes?: string
  }
  capabilities: string[]
  createdAt: string
  updatedAt: string
  lastBackup?: string
  backupSchedule?: "daily" | "weekly" | "monthly" | "none"
  autoProvisioning: boolean
  redundancy: boolean
  powerSupply: number
  cooling: "active" | "passive"
  notes?: string
}

interface OLTStats {
  total: number
  active: number
  inactive: number
  oltsWithCustomers: number
  portStatistics: {
    total: number
    used: number
    available: number
    usagePercentage: number
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface Splitter {
  id: string
  name: string
  splitterId: string
  splitRatio: string
  ratio: number
  splitterType: "PLC" | "FBT" | "COUPLER"
  portCount: number
  usedPorts: number
  availablePorts: number
  location: {
    site: string
    latitude?: number
    longitude?: number
    description?: string
  }
  upstreamFiber: {
    coreColor: string
    connectedTo: "service-board" | "olt" | "splitter"
    connectionId?: string
    port?: string
  }
  isMaster: boolean
  masterSplitterId?: string
  connectedServiceBoard?: {
    oltId: string
    oltName: string
    boardSlot: number
    boardPort: string
  }
  status: "active" | "inactive" | "maintenance"
  notes?: string
  totalCustomers?: number
  slaveCount?: number
  createdAt: string
  updatedAt: string
}

// Vendor options
const VENDOR_OPTIONS = [
  { value: "Huawei", label: "Huawei" },
  { value: "ZTE", label: "ZTE" },
  { value: "Nokia", label: "Nokia" },
  { value: "FiberHome", label: "FiberHome" },
  { value: "MikroTik", label: "MikroTik" },
  { value: "Cisco", label: "Cisco" },
  { value: "BDCOM", label: "BDCOM" }
]


const TRANSPORT_OPTIONS: { value: Transport; label: string }[] = [
  { value: "ssh", label: "SSH" },
  { value: "telnet", label: "Telnet" }
];

// Board type options
const BOARD_TYPE_OPTIONS = [
  { value: "GPON", label: "GPON" },
  { value: "EPON", label: "EPON" },
  { value: "XG-PON", label: "XG-PON" },
  { value: "10G-EPON", label: "10G-EPON" },
  { value: "COMBO", label: "COMBO" }
]

// Model options by vendor
const MODEL_OPTIONS: Record<string, string[]> = {
  "Huawei": ["MA5800-X17", "MA5800-X15", "MA5800-X7", "MA5600T", "MA5603T"],
  "ZTE": ["C600", "C300", "C220"],
  "Nokia": ["7360 ISAM FX", "7368 ISAM ONT"],
  "FiberHome": ["AN5516-01", "AN5516-02"],
  "MikroTik": ["CCR2004", "CCR1036"],
  "Cisco": ["ASR 9000", "ASR 1000"]
}

// Splitter types
const SPLITTER_TYPES = [
  { value: "1:2", label: "1:2" },
  { value: "1:4", label: "1:4" },
  { value: "1:8", label: "1:8" },
  { value: "1:16", label: "1:16" },
  { value: "1:32", label: "1:32" },
  { value: "1:64", label: "1:64" },
  { value: "2:2", label: "2:2" },
  { value: "2:4", label: "2:4" },
  { value: "2:8", label: "2:8" },
  { value: "2:16", label: "2:16" },
  { value: "2:32", label: "2:32" },
  { value: "2:64", label: "2:64" },
  { value: "4:4", label: "4:4" },
  { value: "4:8", label: "4:8" },
  { value: "4:16", label: "4:16" },
  { value: "4:32", label: "4:32" },
  { value: "4:64", label: "4:64" },
  { value: "8:8", label: "8:8" },
  { value: "8:16", label: "8:16" },
  { value: "8:32", label: "8:32" },
  { value: "8:64", label: "8:64" }
]

// Splitter technology types
const SPLITTER_TECH_TYPES = [
  { value: "PLC", label: "PLC (Planar Lightwave Circuit)" },
  { value: "FBT", label: "FBT (Fused Biconical Taper)" },
  { value: "COUPLER", label: "Optical Coupler (Asymmetric)" }
]

const COUPLER_TYPES = [
  "1:99", "2:98", "5:95", "10:90", "15:85", "20:80", "25:75",
  "30:70", "35:65", "40:60", "45:55", "50:50",
].map((value) => ({ value, label: value }))

// Fiber core colors
const FIBER_CORE_COLORS = [
  "Blue", "Orange", "Green", "Brown", "Slate", "White", "Red", "Black",
  "Yellow", "Violet", "Rose", "Aqua"
]

// Update types
type UpdateType = "basic" | "ssh" | "telnet" | "snmp" | "web" | "api" | "location" | "service-boards" | "advanced" | "status"

export function OLTDetailed() {
  const { user } = useAuth()
  const roleName = typeof user?.role === "string" ? user.role : user?.role?.name
  const isAdministrator = ["administrator", "admin", "isp_admin", "super admin", "super_admin"].includes(String(roleName || "").toLowerCase())
  // State management
  const [olts, setOlts] = useState<OLT[]>([])
  const [showTerminal, setShowTerminal] = useState(false)
  const [selectedOLT, setSelectedOLT] = useState<OLT | null>(null)
  const [selectedONT, setSelectedONT] = useState<ONT | null>(null)
  const [onts, setOnts] = useState<ONT[]>([])
  const [splitters, setSplitters] = useState<Splitter[]>([])
  const [oltStats, setOltStats] = useState<OLTStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [ontSyncing, setOntSyncing] = useState<Record<string, boolean>>({});
  const [syncDetailsLoading, setSyncDetailsLoading] = useState<Record<string, boolean>>({});
  const [fetchingONTs, setFetchingONTs] = useState<Record<string, boolean>>({});
  const [syncingAllDetails, setSyncingAllDetails] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("overview")
  const [oltFilter, setOltFilter] = useState<string>("all")


  // SSH Testing states
  const [testingSSH, setTestingSSH] = useState<Record<string, boolean>>({})
  const [sshTestResults, setSshTestResults] = useState<Record<string, any>>({})

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showSSHDialog, setShowSSHDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showTerminalDialog, setShowTerminalDialog] = useState(false)
  const [xtermModalOlt, setXtermModalOlt] = useState<OLT | null>(null)
  const [showONTDetails, setShowONTDetails] = useState(false)
  const [showSSHTestDialog, setShowSSHTestDialog] = useState(false)
  const [showAddSplitterDialog, setShowAddSplitterDialog] = useState(false)
  const [showSplitterDetails, setShowSplitterDetails] = useState(false)
  const [updateType, setUpdateType] = useState<UpdateType>("basic")
  const [oltOwnerType, setOltOwnerType] = useState<"none" | "branch" | "reseller">("none")
  const [oltOwnerId, setOltOwnerId] = useState("")
  const [oltBranches, setOltBranches] = useState<Array<{ id: number; name: string; code: string }>>([])
  const [oltResellers, setOltResellers] = useState<Array<{ id: number; name: string; code: string }>>([])

  useEffect(() => {
    if (!isAdministrator) return
    const loadOwners = async () => {
      try {
        const [branchResponse, resellerResponse] = await Promise.all([
          apiRequest<any>("/branches", { suppressToast: true }),
          apiRequest<{ success: boolean; data: Array<{ id: number; name: string; code: string }> }>("/resellers?limit=100", { suppressToast: true })
        ])
        setOltBranches(Array.isArray(branchResponse) ? branchResponse : branchResponse?.data || [])
        setOltResellers(resellerResponse?.data || [])
      } catch {
        setOltBranches([])
        setOltResellers([])
      }
    }
    void loadOwners()
  }, [isAdministrator])

  // Search and filter
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [vendorFilter, setVendorFilter] = useState<string>("all")
  const [splitterStatusFilter, setSplitterStatusFilter] = useState<string>("all")

  // Terminal
  const [terminalOutput, setTerminalOutput] = useState<string>("")
  const [terminalInput, setTerminalInput] = useState("")
  const [terminalConnected, setTerminalConnected] = useState(false)
  const terminalOutputRef = useRef<HTMLDivElement>(null)





  // ONT Search and Pagination - Default 10 per page
  const [ontSearch, setOntSearch] = useState("")
  const [ontStatusFilter, setOntStatusFilter] = useState("all")
  const [ontPagination, setOntPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Splitter Pagination - Default 10 per page
  const [splitterPagination, setSplitterPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Connected splitters client-side page
  const [connectedSplittersPage, setConnectedSplittersPage] = useState(1)
  const [connectedSplitterSearchQuery, setConnectedSplitterSearchQuery] = useState("")

  // Main splitters tab client-side states
  const [splitterSearchQuery, setSplitterSearchQuery] = useState("")
  const [splitterPage, setSplitterPage] = useState(1)

  // OLT Pagination - Default 10 per page
  const [oltPagination, setOltPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Form states for different update types
  const [basicForm, setBasicForm] = useState({
    name: "",
    ipAddress: "",
    model: "",
    vendor: "Huawei",
    serialNumber: "",
    firmwareVersion: "",
    status: "online" as "online" | "offline" | "maintenance",
    transport: "ssh" as "ssh" | "telnet"
  })

  const [sshForm, setSshForm] = useState({
    host: "",
    port: 22,
    username: "admin",
    password: "",
    enablePassword: "",
    sshKey: ""
  })

  const [telnetForm, setTelnetForm] = useState({
    enabled: false,
    port: 23
  })

  const [snmpForm, setSnmpForm] = useState({
    enabled: true,
    community: "public",
    version: "v2c" as "v2c" | "v3"
  })

  const [webForm, setWebForm] = useState({
    enabled: true,
    port: 80,
    ssl: false
  })

  const [apiForm, setApiForm] = useState({
    enabled: false,
    port: 8080
  })

  const [locationForm, setLocationForm] = useState({
    region: "",
    site: "",
    rack: 1,
    position: 1,
    latitude: 0,
    longitude: 0,
    notes: ""
  })

  const [advancedForm, setAdvancedForm] = useState({
    autoProvisioning: false,
    redundancy: false,
    powerSupply: 1,
    cooling: "active" as "active" | "passive",
    backupSchedule: "none" as "daily" | "weekly" | "monthly" | "none",
    notes: ""
  })

  const [serviceBoardsForm, setServiceBoardsForm] = useState<Array<{
    slot: number
    type: string
    portCount: number
    usedPorts: number
    status: string
  }>>([])

  // Splitter Form
  const [splitterForm, setSplitterForm] = useState({
    name: "",
    splitterId: "",
    splitRatio: "1:8" as string,
    ratio: 8,
    splitterType: "PLC" as "PLC" | "FBT" | "COUPLER",
    portCount: 8,
    usedPorts: 0,
    availablePorts: 8,
    location: {
      site: "",
      latitude: 0,
      longitude: 0,
      description: ""
    },
    upstreamFiber: {
      coreColor: "Blue",
      connectedTo: "service-board" as "service-board" | "olt" | "splitter",
      connectionId: "",
      port: ""
    },
    isMaster: false,
    masterSplitterId: "",
    connectedServiceBoard: undefined as {
      oltId: string
      oltName: string
      boardSlot: number
      boardPort: string
    } | undefined,
    status: "active" as "active" | "inactive" | "maintenance",
    notes: ""
  })

  const [splitterTypeFilter, setSplitterTypeFilter] = useState<string>("all")


  // Selected splitter for details
  const [selectedSplitter, setSelectedSplitter] = useState<Splitter | null>(null)

  // Password visibility
  const [showPassword, setShowPassword] = useState(false)
  const [showEnablePassword, setShowEnablePassword] = useState(false)

  // Theme detection
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Use confirm toast hook
  const { confirm } = useConfirmToast()

  // Master splitters and available ports
  const [masterSplitters, setMasterSplitters] = useState<Array<{
    id: string;
    name: string;
    splitterId: string;
    splitRatio: string;
    availablePorts: number;
  }>>([])

  const [availablePorts, setAvailablePorts] = useState<Array<{
    boardSlot: number;
    boardPort: string;
    boardType: string;
    status: string;
  }>>([])


  const [showMapDialog, setShowMapDialog] = useState(false)
  const [mapLocation, setMapLocation] = useState<{
    latitude: number
    longitude: number
    name: string
    site: string
  } | null>(null)

  // Track which master splitters are expanded to show slaves
  const [expandedMasters, setExpandedMasters] = useState<Set<string>>(new Set())


  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"))
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setIsDarkMode(document.documentElement.classList.contains("dark"))
        }
      })
    })
    observer.observe(document.documentElement, { attributes: true })
    return () => observer.disconnect()
  }, [])

  // Reset connected splitters page on Selected OLT, Search Query or Type Filter change
  useEffect(() => {
    setConnectedSplittersPage(1);
  }, [selectedOLT, connectedSplitterSearchQuery, splitterTypeFilter]);

  // Reset main splitters page on search query, OLT filter, or type filter change
  useEffect(() => {
    setSplitterPage(1);
  }, [splitterSearchQuery, oltFilter, splitterTypeFilter]);

  // Fetch data on component mount
  useEffect(() => {
    fetchOLTs()
    fetchOltStats()
    fetchSplitters(1, "", "all") // Add the parameters
    fetchMasterSplitters() // Add this
    fetchAllSplitters() // Add this
  }, [])

  // Fetch OLTs with pagination
  const fetchOLTs = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      })

      if (searchQuery) params.append('search', searchQuery)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (vendorFilter !== 'all') params.append('vendor', vendorFilter)

      const response = await apiRequest<{
        success: boolean;
        data: OLT[];
        pagination: PaginationInfo
      }>(`/olt?${params.toString()}`)

      if (response.success) {
        setOlts(response.data || [])
        setOltPagination(response.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        })

        if (response.data?.length > 0 && !selectedOLT) {
          setSelectedOLT(response.data[0])
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch OLTs:", error)
      toast.error("Failed to load OLTs")
    } finally {
      setLoading(false)
    }
  }

  const fetchOltStats = async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: OLTStats }>("/olt/stats")
      if (response.success) {
        setOltStats(response.data || null)
      }
    } catch (error: any) {
      console.error("Failed to fetch OLT stats:", error)
    }
  }


  const findRootOltForSplitter = (
    splitter: Splitter,
    allSplitters: Splitter[],
    visited: Set<string> = new Set()
  ): string | null => {
    // 1. Direct OLT connection via service board
    if (splitter.connectedServiceBoard?.oltId) {
      return String(splitter.connectedServiceBoard.oltId);
    }

    // 2. Direct OLT connection via olt relation or oltId field
    const directOltId = (splitter as any).oltId || (splitter as any).olt?.id;
    if (directOltId) {
      return String(directOltId);
    }

    // Cycle detection: if we've already visited this splitter, stop
    if (visited.has(splitter.splitterId)) {
      console.warn(`Circular splitter reference detected at splitterId: ${splitter.splitterId}`);
      return null;
    }
    visited.add(splitter.splitterId);

    // If splitter has a master splitter, and it is not self-referential, recursively find the root OLT
    if (splitter.masterSplitterId && splitter.masterSplitterId !== splitter.splitterId) {
      const masterSplitter = allSplitters.find(s => s.splitterId === splitter.masterSplitterId);
      if (masterSplitter) {
        return findRootOltForSplitter(masterSplitter, allSplitters, visited);
      }
    }

    return null;
  };

  // Helper function to get the full connection path for a splitter
  const getConnectionPath = (
    splitter: Splitter,
    allSplitters: Splitter[],
    visited: Set<string> = new Set()
  ): string[] => {
    const path: string[] = [];

    // Cycle detection: if we've already visited this splitter, stop
    if (visited.has(splitter.splitterId)) {
      console.warn(`Circular splitter reference detected at splitterId: ${splitter.splitterId}`);
      path.push("→ Circular reference detected");
      return path;
    }
    visited.add(splitter.splitterId);

    // Add current splitter
    path.push(`${splitter.name} (${splitter.splitterId})`);

    // If connected to OLT, add OLT
    if (splitter.connectedServiceBoard?.oltName) {
      path.push(`→ ${splitter.connectedServiceBoard.oltName}`);
      return path;
    }

    const directOlt = (splitter as any).olt || (splitter as any).oltId;
    if (directOlt) {
      const directOltName = typeof directOlt === 'object' ? directOlt.name : `OLT (${directOlt})`;
      path.push(`→ ${directOltName}`);
      return path;
    }

    // If connected to parent splitter, recursively build path
    if (splitter.masterSplitterId) {
      const parentSplitter = allSplitters.find(s => s.splitterId === splitter.masterSplitterId);
      if (parentSplitter) {
        const parentPath = getConnectionPath(parentSplitter, allSplitters, visited);
        return [...path, ...parentPath.slice(1)]; // Skip the parent's own name in path
      }
    }

    // If no connection, show as standalone
    path.push("→ Not connected");
    return path;
  };

  // Helper function to get connected OLT name
  const getConnectedOltName = (splitter: Splitter, allSplitters: Splitter[]): string => {
    const rootOltId = findRootOltForSplitter(splitter, allSplitters);
    if (rootOltId) {
      const olt = olts.find(o => String(o.id) === String(rootOltId));
      return olt?.name || "Unknown OLT";
    }
    return "Not connected";
  };

  // Helper function to get connection type with details
  const getConnectionDetails = (splitter: Splitter): { type: string; details: string } => {
    if (splitter.connectedServiceBoard) {
      return {
        type: "OLT",
        details: `${splitter.connectedServiceBoard.oltName} (Port: ${splitter.connectedServiceBoard.boardPort})`
      };
    }

    if (splitter.masterSplitterId) {
      return {
        type: "Parent Splitter",
        details: splitter.masterSplitterId
      };
    }

    return {
      type: "Not connected",
      details: "No upstream connection"
    };
  };

  // Fetch Splitters with pagination
  const fetchSplitters = async (page = 1, search = "", oltId = "", type = "all") => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      })

      if (search) params.append('search', search)

      const response = await apiRequest<{
        success: boolean;
        data: Splitter[];
        pagination: PaginationInfo
      }>(`/splitters?${params.toString()}`)

      if (response.success) {
        let filteredSplitters = response.data || [];

        // Apply OLT filter
        if (oltId && oltId !== 'all') {
          filteredSplitters = filteredSplitters.filter(splitter => {
            const rootOltId = findRootOltForSplitter(splitter, response.data || []);
            return String(rootOltId) === String(oltId);
          });
        }

        // Apply splitter type filter
        if (type && type !== 'all') {
          filteredSplitters = filteredSplitters.filter(splitter => {
            if (type === 'master') return splitter.isMaster;
            if (type === 'slave') return !splitter.isMaster;
            return true;
          });
        }

        setSplitters(filteredSplitters)
        setSplitterPagination({
          page: response.pagination?.page || 1,
          limit: response.pagination?.limit || 10,
          total: filteredSplitters.length,
          totalPages: Math.ceil(filteredSplitters.length / (response.pagination?.limit || 10)),
          hasNextPage: false,
          hasPreviousPage: false
        })
      }
    } catch (error: any) {
      console.error("Failed to fetch splitters:", error)
      toast.error("Failed to load splitters")
    }
  }

  // Helper function to extract ONTs from different response structures
  const extractOntsFromResponse = (response: any): ONT[] => {
    if (!response.success) return [];

    // Case 1: Data is directly an array
    if (Array.isArray(response.data)) {
      return response.data;
    }

    // Case 2: Data has 'onts' property
    if (response.data && typeof response.data === 'object' && 'onts' in response.data) {
      return response.data.onts || [];
    }

    // Case 3: Data is an object with ONTs in another property
    if (response.data && typeof response.data === 'object') {
      // Try to find any array property that looks like ONTs
      for (const key in response.data) {
        if (Array.isArray(response.data[key]) && response.data[key].length > 0) {
          const firstItem = response.data[key][0];
          // Check if it has ONT-like properties
          if (firstItem && (firstItem.serialNumber || firstItem.ontId)) {
            return response.data[key];
          }
        }
      }
    }

    return [];
  };


  interface VLANForm {
    vlanId: string;
    name: string;
    description: string;
    type: string;
    gemIndex: number;
  }

  interface ServiceBoardPort {
    id: number;
    boardId: number;
    portNumber: number;
    status: string;
    board?: ServiceBoard;
  }

  interface ServiceBoard {
    id: number;
    slot: number;
    type: string;
    status: string;
    ports: ServiceBoardPort[];
  }

  // In your component

  const [selectedPorts, setSelectedPorts] = useState<number[]>([]);
  const [serviceBoards, setServiceBoards] = useState<ServiceBoard[]>([]);
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>('all');
  const [showAllPorts, setShowAllPorts] = useState<boolean>(false);
  const [portMappings, setPortMappings] = useState<Record<number, any[]>>({});


  const [showVLANDialog, setShowVLANDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [selectedVLAN, setSelectedVLAN] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [vlanForm, setVlanForm] = useState({
    vlanId: '',
    name: '',
    description: '',
    type: 'standard' as 'standard' | 'voice' | 'management' | 'data',
    priority: 0,
    status: 'active' as 'active' | 'inactive',
    gemIndex: 0,
  });
  const [profileForm, setProfileForm] = useState({
    profileId: '',
    name: '',
    description: '',
    type: 'line' as 'line' | 'service',
    upstreamBandwidth: '',
    downstreamBandwidth: '',
    services: [] as string[],
    vlans: [] as string[],
    assignedOnts: [] as string[]
  });

  // VLAN and Profile data states
  const [vlans, setVlans] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadFiles, setLoadFiles] = useState<any[]>([]);
  const [loadFileForm, setLoadFileForm] = useState({ tftpHost: '', filename: '' });
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);


  const fetchVLANs = async () => {
    try {
      if (!selectedOLT) return;
      const response = await apiRequest<{ success: boolean; data: any[] }>(
        `/olt/${selectedOLT.id}/vlans`
      );
      if (response.success) {
        setVlans(response.data || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch VLANs:", error);
      toast.error("Failed to load VLANs");
    }
  };

  const fetchProfiles = async () => {
    try {
      if (!selectedOLT) return;
      const response = await apiRequest<{ success: boolean; data: any[] }>(
        `/olt/${selectedOLT.id}/profiles`
      );
      if (response.success) {
        setProfiles(response.data || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch profiles:", error);
      toast.error("Failed to load profiles");
    }
  };

  const fetchLoadFiles = async () => {
    if (!selectedOLT) return;
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>(`/olt/${selectedOLT.id}/load-files`);
      if (response.success) setLoadFiles(response.data || []);
    } catch (error: any) { toast.error(error.message || "Failed to load ONT files"); }
  };

  const addLoadFile = async () => {
    if (!selectedOLT || !loadFileForm.tftpHost.trim() || !loadFileForm.filename.trim()) return toast.error("TFTP server and filename are required");
    try {
      await apiRequest(`/olt/${selectedOLT.id}/load-files`, { method: 'POST', body: JSON.stringify(loadFileForm) });
      setLoadFileForm({ tftpHost: '', filename: '' });
      await fetchLoadFiles();
      toast.success("ONT load file added");
    } catch (error: any) { toast.error(error.message || "Failed to add load file"); }
  };

  const removeLoadFile = async (id: string) => {
    if (!selectedOLT) return;
    try {
      await apiRequest(`/olt/${selectedOLT.id}/load-files/${id}`, { method: 'DELETE' });
      setLoadFiles(current => current.filter(file => file.id !== id));
      toast.success("ONT load file removed");
    } catch (error: any) { toast.error(error.message || "Failed to remove load file"); }
  };

  const transferLoadFile = async (file: any) => {
    if (!selectedOLT) return;
    setLoadingFileId(file.id);
    try {
      const response = await apiRequest<{ success: boolean; data: { file?: { found: boolean; filename: string; size_bytes?: number } } }>(`/device/${selectedOLT.id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action: 'loadFileFromTftp', params: { tftp_host: file.tftpHost, filename: file.filename } }),
        headers: { 'Content-Type': 'application/json' }
      });
      const verifiedFile = response.data?.file;
      if (!verifiedFile?.found) {
        toast.error(`${file.filename.toLowerCase()} was not found on the OLT after transfer`);
        return;
      }
      toast.success(`${verifiedFile.filename} verified on OLT (${verifiedFile.size_bytes ?? 0} bytes)`);
    } catch (error: any) { toast.error(error.message || "Failed to load file to OLT"); }
    finally { setLoadingFileId(null); }
  };

  const createVLAN = async (vlanData: any) => {
    try {
      if (!selectedOLT) return;
      const response = await apiRequest<{ success: boolean; data: any }>(
        `/olt/${selectedOLT.id}/vlans`,
        {
          method: 'POST',
          body: JSON.stringify(vlanData)
        }
      );
      return response.success ? response.data : null;
    } catch (error: any) {
      console.error("Failed to create VLAN:", error);
      throw error;
    }
  };

  const updateVLAN = async (vlanId: string, vlanData: any) => {
    try {
      if (!selectedOLT) return;
      const response = await apiRequest<{ success: boolean; data: any }>(
        `/olt/${selectedOLT.id}/vlans/${vlanId}`,
        {
          method: 'PUT',
          body: JSON.stringify(vlanData)
        }
      );
      return response.success ? response.data : null;
    } catch (error: any) {
      console.error("Failed to update VLAN:", error);
      throw error;
    }
  };

  const deleteVLAN = async (vlanId: string) => {
    try {
      if (!selectedOLT) return;
      const response = await apiRequest<{ success: boolean }>(
        `/olt/${selectedOLT.id}/vlans/${vlanId}`,
        { method: 'DELETE' }
      );
      if (response.success) {
        setVlans(vlans.filter(v => v.id !== vlanId));
        toast.success("VLAN deleted successfully");
      }
      return response.success;
    } catch (error: any) {
      console.error("Failed to delete VLAN:", error);
      toast.error("Failed to delete VLAN");
      throw error;
    }
  };

  const createProfile = async (profileData: any) => {
    try {
      if (!selectedOLT) return;
      const response = await apiRequest<{ success: boolean; data: any }>(
        `/olt/${selectedOLT.id}/profiles`,
        {
          method: 'POST',
          body: JSON.stringify(profileData)
        }
      );
      return response.success ? response.data : null;
    } catch (error: any) {
      console.error("Failed to create profile:", error);
      throw error;
    }
  };

  const updateProfile = async (profileId: string, profileData: any) => {
    try {
      if (!selectedOLT) return;
      const response = await apiRequest<{ success: boolean; data: any }>(
        `/olt/${selectedOLT.id}/profiles/${profileId}`,
        {
          method: 'PUT',
          body: JSON.stringify(profileData)
        }
      );
      return response.success ? response.data : null;
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  };

  const deleteProfile = async (profileId: string) => {
    try {
      if (!selectedOLT) return;
      const response = await apiRequest<{ success: boolean }>(
        `/olt/${selectedOLT.id}/profiles/${profileId}`,
        { method: 'DELETE' }
      );
      if (response.success) {
        setProfiles(profiles.filter(p => p.id !== profileId));
        toast.success("Profile deleted successfully");
      }
      return response.success;
    } catch (error: any) {
      console.error("Failed to delete profile:", error);
      toast.error("Failed to delete profile");
      throw error;
    }
  };
  useEffect(() => {
    if (selectedOLT && activeTab === "details") {
      fetchVLANs();
      fetchProfiles();
      fetchLoadFiles();
    }
  }, [selectedOLT, activeTab]);


  // Add these functions in your component
  useEffect(() => {
    if (selectedVLAN) {
      setVlanForm({
        vlanId: selectedVLAN.vlanId?.toString() || '',
        name: selectedVLAN.name || '',
        description: selectedVLAN.description || '',
        type: selectedVLAN.type || 'standard',
        priority: selectedVLAN.priority || 0,
        status: selectedVLAN.status || 'active',
        gemIndex: selectedVLAN.gemIndex || '',
      });
    }
  }, [selectedVLAN]);

  useEffect(() => {
    if (selectedProfile?.id) {
      setProfileForm({
        profileId: selectedProfile.profileId || '',
        name: selectedProfile.name || '',
        description: selectedProfile.description || '',
        type: selectedProfile.type || 'line',
        upstreamBandwidth: selectedProfile.upstreamBandwidth || '',
        downstreamBandwidth: selectedProfile.downstreamBandwidth || '',
        services: selectedProfile.services || [],
        vlans: selectedProfile.vlans || [],
        assignedOnts: selectedProfile.assignedOnts || []
      });
    } else if (selectedProfile?.type) {
      // New profile with type set
      setProfileForm({
        ...profileForm,
        type: selectedProfile.type
      });
    }
  }, [selectedProfile]);



  // Fetch ONTs for selected OLT with pagination - Default 10 per page
  const fetchONTs = async (oltId: string, page = 1, search = "", status = "all") => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      })

      if (search) params.append('search', search)
      if (status !== 'all') params.append('status', status)

      const response = await apiRequest<{
        success: boolean;
        data: any;  // Use any type to handle both structures
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        ontDetailsCount?: number;
        count?: number;
      }>(`/olt/${oltId}/onts?${params.toString()}`)

      if (response.success) {
        let ontData: ONT[] = [];

        // Handle both response structures
        if (Array.isArray(response.data)) {
          // Direct array structure
          ontData = response.data;
        } else if (response.data && typeof response.data === 'object' && 'onts' in response.data) {
          // Nested structure with 'onts' property
          ontData = response.data.onts || [];
        }

        setOnts(ontData)

        // Handle pagination from different response structures
        const total = response.total || response.count || ontData.length;
        const currentPage = response.page || page;
        const limit = response.limit || 10;
        const totalPages = response.totalPages || Math.ceil(total / limit);

        setOntPagination({
          page: currentPage,
          limit: limit,
          total: total,
          totalPages: totalPages,
          hasNextPage: currentPage < totalPages,
          hasPreviousPage: currentPage > 1
        })
      } else {
        // Set empty array if no data
        setOnts([])
      }
    } catch (error: any) {
      console.error("Failed to fetch ONTs:", error)
      toast.error("Failed to load ONT data")
      // Set empty array on error
      setOnts([])
    }
  }

  // Selecting the first OLT happens asynchronously after the component mounts.
  // Load its saved ONTs immediately instead of waiting for a manual refresh.
  useEffect(() => {
    if (!selectedOLT?.id) {
      setOnts([])
      return
    }
    void fetchONTs(String(selectedOLT.id), 1, "", "all")
  }, [selectedOLT?.id])

  const refreshONTList = async (oltId: string, notify = true) => {
    setRefreshing(true)
    let liveSyncError: any = null
    try {
      try {
        await apiRequest(`/olt/${oltId}/onts/sync-basic`, { method: "POST" })
      } catch (error) {
        liveSyncError = error
        console.error("Live ONT refresh failed; loading saved data:", error)
      }
      await fetchONTs(oltId, 1, ontSearch, ontStatusFilter)
      await Promise.all([fetchOLTs(oltPagination.page), fetchOltStats()])
      if (notify) {
        if (liveSyncError) toast.error(liveSyncError?.message || "Loaded saved ONTs, but live OLT synchronization failed")
        else toast.success("ONT inventory updated from the OLT")
      }
    } finally {
      setRefreshing(false)
    }
  }

  // Sync ONTs from OLT via SSH
  const syncONTs = async (oltId: string) => {
    try {
      // Use syncing state for this operation
      setSyncing(prev => ({ ...prev, [oltId]: true }))

      const response = await apiRequest<{
        success: boolean;
        data: any;  // Use any type
        message: string
      }>(
        `/olt/${oltId}/onts/sync`,
        { method: "POST" }
      )

      if (response.success) {
        // Extract ONTs
        let ontData: ONT[] = [];
        if (Array.isArray(response.data)) {
          ontData = response.data;
        } else if (response.data && typeof response.data === 'object' && 'onts' in response.data) {
          ontData = response.data.onts || [];
        }

        setOnts(ontData)
        toast.success(response.message || "ONT data synced successfully")

        // Refresh ONT list with current pagination
        await fetchONTs(oltId, ontPagination.page, ontSearch, ontStatusFilter)
        // Refresh OLT data
        await fetchOLTs(oltPagination.page)
      }
    } catch (error: any) {
      console.error("Failed to sync ONTs:", error)
      toast.error(error.message || "Failed to sync ONT data")
    } finally {
      setSyncing(prev => ({ ...prev, [oltId]: false }))
    }
  }

  // Test SSH connection
  const testSSHConnection = async (olt: OLT) => {
    try {
      setTestingSSH(prev => ({ ...prev, [olt.id]: true }))

      const response = await apiRequest<{
        success: boolean;
        message: string;
        output?: string
      }>(
        `/olt/${olt.id}/test-ssh`,
        { method: "POST" }
      )

      setSshTestResults(prev => ({
        ...prev,
        [olt.id]: response
      }))

      if (response.success) {
        toast.success("connection successful")
        setShowSSHTestDialog(true)
      } else {
        toast.error(response.error || "connection failed")
      }
    } catch (error: any) {
      console.error("Failed to test:", error)
      toast.error(error.message || "Failed to test connection")
    } finally {
      setTestingSSH(prev => ({ ...prev, [olt.id]: false }))
    }
  }

  // Connect to OLT terminal via WebSockets and xterm
  const connectToTerminal = (olt: OLT) => {
    setSelectedOLT(olt)
    setXtermModalOlt(olt)
  }

  // Send terminal command via SSH using executeBatchCommands
  const sendTerminalCommand = async (command: string) => {
    if (!selectedOLT || !command.trim()) return

    try {
      // Add command to output
      setTerminalOutput(prev => prev + `\n$ ${command}\n`)
      setTerminalInput("")

      const response = await apiRequest<{
        success: boolean;
        output: string;
      }>(
        `/olt/${selectedOLT.id}/execute-batch`,
        {
          method: "POST",
          body: JSON.stringify({ commands: [command] })
        }
      )

      if (response.success) {
        setTerminalOutput(prev => prev + response.output + "\n")
      } else {
        setTerminalOutput(prev => prev + `Error: ${response.error}\n\n$ `)
      }

      // Scroll to bottom
      setTimeout(() => {
        if (terminalOutputRef.current) {
          terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight
        }
      }, 100)

    } catch (error: any) {
      console.error("Failed to send command:", error)
      setTerminalOutput(prev => prev + `Error: ${error.message || "Failed to execute command"}\n\n$ `)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      await fetchOLTs(oltPagination.page)
      await fetchOltStats()
      if (selectedOLT) {
        await refreshONTList(String(selectedOLT.id), false)
      }
      await fetchSplitters(splitterPagination.page)
      toast.success("Data refreshed")
    } catch (error: any) {
      console.error("Refresh failed:", error)
    } finally {
      setRefreshing(false)
    }
  }

  // Delete OLT
  const handleDeleteOLT = async (olt: OLT) => {
    const isConfirmed = await confirm({
      title: "Delete OLT",
      message: `Are you sure you want to delete OLT "${olt.name}"? This action cannot be undone.`,
      type: "danger",
      confirmText: "Delete",
      cancelText: "Cancel"
    })

    if (!isConfirmed) return

    try {
      setLoading(true)
      const response = await apiRequest<{ success: boolean; message: string }>(
        `/olt/${olt.id}`,
        { method: 'DELETE' }
      )

      if (response.success) {
        setOlts(olts.filter(o => o.id !== olt.id))
        if (selectedOLT?.id === olt.id) {
          setSelectedOLT(null)
          setOnts([])
        }
        toast.success(response.message || "OLT deleted successfully")
      }
    } catch (error: any) {
      console.error("Delete error:", error)
      toast.error(error.message || "Failed to delete OLT")
    } finally {
      setLoading(false)
    }
  }

  // Fetch master splitters
  const fetchMasterSplitters = async () => {
    try {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/splitters/masters')
      if (response.success) {
        setMasterSplitters(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch master splitters:', error)
    }
  }

  // Fetch available service ports for OLT
  const fetchAvailablePorts = async (oltId: string) => {
    try {
      // First get the OLT details with service boards
      const oltResponse = await apiRequest<{ success: boolean; data: OLT }>(`/olt/${oltId}`);

      if (oltResponse.success && oltResponse.data) {
        const olt = oltResponse.data;

        // Generate all possible ports from service boards
        const allPorts: Array<{
          boardSlot: number;
          boardPort: string;
          boardType: string;
          status: string;
        }> = [];

        olt.serviceBoards.forEach(board => {
          for (let i = 0; i <= board.portCount; i++) {
            const port = `0/${board.slot}/${i}`;
            allPorts.push({
              boardSlot: board.slot,
              boardPort: port,
              boardType: board.type,
              status: 'available'
            });
          }
        });

        // Now fetch all splitters to check which ports are used
        const allSplittersResponse = await apiRequest<{
          success: boolean;
          data: Splitter[];
        }>('/splitters');

        if (allSplittersResponse.success) {
          const usedPorts = new Set<string>();

          allSplittersResponse.data.forEach(s => {
            if (s.connectedServiceBoard &&
              s.connectedServiceBoard.oltId === oltId &&
              (!selectedSplitter || s.id !== selectedSplitter.id)) {
              usedPorts.add(s.connectedServiceBoard.boardPort);
            }
          });

          // Update port status based on usage
          const availablePortsWithStatus = allPorts.map(port => ({
            ...port,
            status: usedPorts.has(port.boardPort) ? 'used' : 'available'
          }));

          setAvailablePorts(availablePortsWithStatus);
        }
      }
    } catch (error) {
      console.error('Failed to fetch available ports:', error);
      setAvailablePorts([]);
    }
  };

  const validateSplitterForm = () => {
    const errors: string[] = [];

    if (!splitterForm.name.trim()) {
      errors.push("Splitter name is required");
    }

    if (splitterForm.usedPorts > splitterForm.portCount) {
      errors.push(`Used ports (${splitterForm.usedPorts}) cannot exceed total ports (${splitterForm.portCount})`);
    }

    if (!splitterForm.isMaster && splitterForm.masterSplitterId) {
      // Check if master splitter has available ports
      const master = masterSplitters.find(m => m.splitterId === splitterForm.masterSplitterId);
      if (master && master.availablePorts <= 0) {
        errors.push("Selected master splitter has no available ports");
      }
    }

    return errors;
  };

  const getSlotFromPort = (port: string) => {
    if (!port) return 0;
    const parts = port.split('/');
    return parts.length >= 2 ? parseInt(parts[1]) : 0;
  };


  const [allSplitters, setAllSplitters] = useState<Splitter[]>([]);
  const [parentSplitters, setParentSplitters] = useState<Array<{
    id: string;
    name: string;
    splitterId: string;
    availablePorts: number;
    isMaster: boolean;
    splitRatio: string;
    connectedServiceBoard?: {
      oltId: string;
      oltName: string;
      boardSlot: number;
      boardPort: string;
    };
  }>>([]);

  // Add this function to fetch all splitters for hierarchy
  const fetchAllSplitters = async () => {
    try {
      const response = await apiRequest<{
        success: boolean;
        data: Splitter[];
      }>('/splitters?limit=1000');

      if (response.success) {
        setAllSplitters(response.data || []);
        // Build parent splitters list
        const parents = response.data
          .filter(s => s.isMaster || s.availablePorts > 0)
          .map(s => ({
            id: s.id,
            name: s.name,
            splitterId: s.splitterId,
            availablePorts: s.availablePorts,
            isMaster: s.isMaster
          }));
        setParentSplitters(parents);
      }
    } catch (error) {
      console.error('Failed to fetch all splitters:', error);
    }
  };


  // Add this function
  const fetchAllSplittersForHierarchy = async () => {
    try {
      // Fetch all splitters without pagination
      const response = await apiRequest<{
        success: boolean;
        data: Splitter[];
      }>('/splitters?limit=1000');

      if (response.success) {
        const allSplittersData = response.data || [];
        setAllSplitters(allSplittersData);

        // Build parent splitters list with both id and splitterId
        const parentSplittersData = allSplittersData
          .filter(s =>
            s.availablePorts > 0 && // Has available ports
            (!selectedSplitter || s.id !== selectedSplitter.id) // Not the current splitter
          )
          .map(s => ({
            id: s.id, // Keep database id for selection
            splitterId: s.splitterId, // Store splitterId for backend
            name: s.name,
            availablePorts: s.availablePorts,
            isMaster: s.isMaster,
            splitRatio: s.splitRatio,
            connectedServiceBoard: s.connectedServiceBoard
          }));

        setParentSplitters(parentSplittersData);
      }
    } catch (error) {
      console.error('Failed to fetch all splitters:', error);
      toast.error('Failed to load splitter hierarchy data');
    }
  };

  // Handle add/update splitter
  const handleSplitRatioChange = (value: string) => {
    const parts = value.split(':');
    if (parts.length === 2) {
      const inputCount = parts[0] ? parseInt(parts[0]) : 1;
      const outputCount = parseInt(parts[1]) || 8;

      // Calculate total ports based on split ratio format
      // For formats like "1:8", "2:8", "4:8", etc.
      // Coupler ratios describe the percentage split, not the physical port count.
      const totalPorts = splitterForm.splitterType === "COUPLER" ? 2 : outputCount;

      setSplitterForm({
        ...splitterForm,
        splitRatio: value as any,
        ratio: outputCount,
        portCount: totalPorts,
        availablePorts: totalPorts - splitterForm.usedPorts
      });
    }
  };

  // Also add the handleMasterSlaveToggle function if missing
  const handleMasterSlaveToggle = (checked: boolean) => {
    if (checked) {
      // Becoming master: clear parent, enable OLT connection
      setSplitterForm({
        ...splitterForm,
        isMaster: true,
        masterSplitterId: "",
        upstreamFiber: {
          ...splitterForm.upstreamFiber,
          connectedTo: "service-board",
          connectionId: ""
        }
      });
      // Clear available ports until OLT is selected
      setAvailablePorts([]);
    } else {
      // Becoming slave: disable OLT connection, enable parent selection
      setSplitterForm({
        ...splitterForm,
        isMaster: false,
        masterSplitterId: "",
        connectedServiceBoard: undefined,
        upstreamFiber: {
          ...splitterForm.upstreamFiber,
          connectedTo: "splitter",
          connectionId: ""
        }
      });
      setAvailablePorts([]);

      // Refresh parent splitters list
      fetchAllSplittersForHierarchy();
    }
  };

  // And here's the complete handleAddSplitter function again for reference:
  const handleAddSplitter = async () => {
    try {
      // Validate form
      const errors: string[] = [];

      // Basic validations
      if (!splitterForm.name.trim()) {
        errors.push("Splitter name is required");
      }

      if (splitterForm.usedPorts > splitterForm.portCount) {
        errors.push(`Used ports (${splitterForm.usedPorts}) cannot exceed total ports (${splitterForm.portCount})`);
      }

      // Check for slave splitter rules
      if (!splitterForm.isMaster) {
        // Slave splitter: Must connect to a parent splitter
        if (!splitterForm.masterSplitterId) {
          errors.push("Slave splitters must be connected to a parent splitter");
        } else {
          // Check if parent splitter exists in our local list
          const parentSplitter = parentSplitters.find(s => s.id === splitterForm.masterSplitterId);
          if (!parentSplitter) {
            errors.push("Selected parent splitter was not found. Please refresh the list.");
          } else if (parentSplitter.availablePorts <= 0) {
            errors.push("Selected parent splitter has no available ports");
          }

          // For slave splitters, ensure no OLT connection
          if (splitterForm.connectedServiceBoard) {
            setSplitterForm(prev => ({
              ...prev,
              connectedServiceBoard: undefined
            }));
          }
        }
      } else {
        // Master splitter: Must connect to OLT, cannot have parent
        if (splitterForm.masterSplitterId) {
          errors.push("Master splitters cannot have a parent splitter");
        }

        if (!splitterForm.connectedServiceBoard?.oltId) {
          errors.push("Master splitters must be connected to an OLT service port");
        } else if (!splitterForm.connectedServiceBoard.boardPort) {
          errors.push("Please select a service port");
        } else {
          // Check if service port is available
          const selectedPort = availablePorts.find(
            p => p.boardPort === splitterForm.connectedServiceBoard?.boardPort
          );

          if (!selectedPort) {
            errors.push("Selected service port not found");
          } else if (selectedPort.status === 'used' &&
            !(selectedSplitter?.connectedServiceBoard?.boardPort === selectedPort.boardPort)) {
            errors.push("The selected service port is already in use by another splitter");
          }
        }
      }

      if (errors.length > 0) {
        errors.forEach(error => toast.error(error));
        return;
      }

      // Prepare the payload based on splitter type
      const payload: any = {
        name: splitterForm.name,
        splitterId: splitterForm.splitterId,
        splitRatio: splitterForm.splitRatio,
        splitterType: splitterForm.splitterType,
        portCount: splitterForm.portCount,
        usedPorts: splitterForm.usedPorts,
        availablePorts: splitterForm.availablePorts,
        isMaster: splitterForm.isMaster,
        location: splitterForm.location,
        upstreamFiber: {
          coreColor: splitterForm.upstreamFiber.coreColor,
          connectedTo: splitterForm.isMaster ? "service-board" : "splitter",
          connectionId: splitterForm.isMaster
            ? (splitterForm.connectedServiceBoard?.oltId || "")
            : "", // For splitter connection, connectionId will be set below
          port: splitterForm.isMaster
            ? (splitterForm.connectedServiceBoard?.boardPort || "")
            : splitterForm.upstreamFiber.port || ""
        },
        status: splitterForm.status,
        notes: splitterForm.notes || ""
      };

      // Set masterSplitterId and connectedServiceBoard based on type
      if (splitterForm.isMaster) {
        // Master splitter: Connect to OLT
        payload.masterSplitterId = null;
        if (splitterForm.connectedServiceBoard) {
          payload.connectedServiceBoard = {
            oltId: splitterForm.connectedServiceBoard.oltId,
            oltName: splitterForm.connectedServiceBoard.oltName,
            boardSlot: splitterForm.connectedServiceBoard.boardSlot,
            boardPort: splitterForm.connectedServiceBoard.boardPort
          };
        }
      } else {
        // Slave splitter: Connect to parent splitter
        // Get the splitterId from the selected parent splitter
        const selectedParent = parentSplitters.find(p => p.id === splitterForm.masterSplitterId);
        if (!selectedParent) {
          toast.error("Selected parent splitter not found. Please refresh and try again.");
          return;
        }

        // Use the parent's splitterId (not database id)
        payload.masterSplitterId = selectedParent.splitterId;
        payload.connectedServiceBoard = null;

        // Also update upstreamFiber connectionId with the parent's splitterId
        payload.upstreamFiber.connectionId = selectedParent.splitterId;
      }

      console.log('Sending splitter payload:', JSON.stringify(payload, null, 2));

      const url = selectedSplitter ? `/splitters/${selectedSplitter.id}` : '/splitters';
      const method = selectedSplitter ? 'PUT' : 'POST';

      const response = await apiRequest<{ success: boolean; data: any; message: string }>(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.success) {
        setShowAddSplitterDialog(false);
        toast.success(response.message || "Splitter saved successfully");

        // Reset form
        setSplitterForm({
          name: "",
          splitterId: "",
          splitRatio: "1:8",
          ratio: 8,
          splitterType: "PLC",
          portCount: 8,
          usedPorts: 0,
          availablePorts: 8,
          location: {
            site: "",
            latitude: 0,
            longitude: 0,
            description: ""
          },
          upstreamFiber: {
            coreColor: "Blue",
            connectedTo: "service-board",
            connectionId: "",
            port: ""
          },
          isMaster: false,
          masterSplitterId: "",
          connectedServiceBoard: undefined,
          status: "active",
          notes: ""
        });
        setSelectedSplitter(null);
        setAvailablePorts([]);

        // Refresh splitters list
        await fetchSplitters(splitterPagination.page);
        await fetchAllSplittersForHierarchy();
      }
    } catch (error: any) {
      console.error("Failed to save splitter:", error);

      // Handle specific error messages
      if (error.message?.includes("Master splitter not found")) {
        toast.error("The parent splitter was not found. It may have been deleted or the splitterId is incorrect.");
        // Refresh all data
        await fetchAllSplittersForHierarchy();
        await fetchSplitters(splitterPagination.page);
      } else if (error.message?.includes("Port is already in use")) {
        toast.error(error.message);
        // Refresh available ports
        if (splitterForm.connectedServiceBoard?.oltId) {
          await fetchAvailablePorts(splitterForm.connectedServiceBoard.oltId);
        }
      } else {
        toast.error(error.message || "Failed to save splitter");
      }
    }
  };

  // Load forms with selected OLT data
  const loadForms = (olt: OLT) => {
    setBasicForm({
      name: olt.name,
      ipAddress: olt.ipAddress,
      model: olt.model,
      vendor: olt.vendor,
      serialNumber: olt.serialNumber || "",
      firmwareVersion: olt.firmwareVersion || "",
      status: olt.status,
      transport: olt.defaultTransport
    })

    setSshForm({
      host: olt.sshConfig?.host || olt.ipAddress,
      port: olt.sshConfig?.port || 22,
      username: olt.sshConfig?.username || "admin",
      password: olt.sshConfig?.password || "",
      enablePassword: olt.sshConfig?.enablePassword || "",
      sshKey: olt.sshConfig?.sshKey || ""
    })

    setTelnetForm({
      enabled: olt.telnetConfig?.enabled || false,
      port: olt.telnetConfig?.port || 23
    })

    setSnmpForm({
      enabled: olt.management?.snmpEnabled || false,
      community: olt.management?.snmpCommunity || "public",
      version: olt.management?.snmpVersion || "v2c"
    })

    setWebForm({
      enabled: olt.management?.webInterface || false,
      port: olt.management?.webPort || 80,
      ssl: olt.management?.webSSL || false
    })

    setApiForm({
      enabled: olt.management?.apiEnabled || false,
      port: olt.management?.apiPort || 8080
    })

    setLocationForm({
      region: olt.location?.region || "",
      site: olt.location?.site || "",
      rack: olt.location?.rack || 1,
      position: olt.location?.position || 1,
      latitude: olt.location?.latitude || 0,
      longitude: olt.location?.longitude || 0,
      notes: olt.location?.notes || ""
    })

    setAdvancedForm({
      autoProvisioning: olt.autoProvisioning || false,
      redundancy: olt.redundancy || false,
      powerSupply: olt.powerSupply || 1,
      cooling: olt.cooling || "active",
      backupSchedule: olt.backupSchedule || "none",
      notes: olt.notes || ""
    })

    setServiceBoardsForm(
      olt.serviceBoards?.map(board => ({
        slot: board.slot,
        type: board.type,
        portCount: board.portCount,
        usedPorts: board.usedPorts,
        status: board.status
      })) || []
    )
  }

  const openSplitterEditor = async (splitter: Splitter) => {
    setShowSplitterDetails(false)
    setSelectedSplitter(splitter)
    const ratioValue = parseInt(splitter.splitRatio.split(':')[1]) || 8
    let parentSplitterId = ""
    if (splitter.masterSplitterId) {
      const parent = allSplitters.find(item => item.splitterId === splitter.masterSplitterId)
      if (parent) parentSplitterId = parent.id
    }

    setSplitterForm({
      name: splitter.name,
      splitterId: splitter.splitterId,
      splitRatio: splitter.splitRatio as any,
                    splitterType: splitter.splitterType as "PLC" | "FBT" | "COUPLER",
      portCount: splitter.portCount,
      usedPorts: splitter.usedPorts,
      availablePorts: splitter.availablePorts,
      location: {
        site: splitter.location.site || "",
        latitude: splitter.location.latitude ?? 0,
        longitude: splitter.location.longitude ?? 0,
        description: splitter.location.description || ""
      },
      upstreamFiber: {
        coreColor: splitter.upstreamFiber.coreColor,
        connectedTo: splitter.upstreamFiber.connectedTo,
        connectionId: splitter.upstreamFiber.connectionId || "",
        port: splitter.upstreamFiber.port || ""
      },
      isMaster: splitter.isMaster,
      masterSplitterId: parentSplitterId,
      connectedServiceBoard: splitter.connectedServiceBoard,
      status: splitter.status,
      notes: splitter.notes || "",
      ratio: ratioValue
    })

    await fetchAllSplittersForHierarchy()
    if (splitter.isMaster && splitter.connectedServiceBoard?.oltId) {
      await fetchAvailablePorts(splitter.connectedServiceBoard.oltId)
    } else {
      setAvailablePorts([])
    }
    setShowAddSplitterDialog(true)
  }

  const openNewSplitterDialog = async () => {
    setSelectedSplitter(null)
    setSplitterForm({
      name: "",
      splitterId: "",
      splitRatio: "1:8",
      ratio: 8,
      splitterType: "PLC",
      portCount: 8,
      usedPorts: 0,
      availablePorts: 8,
      isMaster: false,
      masterSplitterId: "",
      location: { site: "", latitude: 0, longitude: 0, description: "" },
      upstreamFiber: { coreColor: "Blue", connectedTo: "service-board", connectionId: "", port: "" },
      connectedServiceBoard: undefined,
      status: "active",
      notes: ""
    })
    setAvailablePorts([])
    await fetchAllSplittersForHierarchy()
    setShowAddSplitterDialog(true)
  }

  const openSplitterMap = (splitter: Splitter) => {
    if (!splitter.location.latitude || !splitter.location.longitude) {
      toast.error("No location coordinates available for this splitter")
      return
    }
    setMapLocation({
      latitude: splitter.location.latitude,
      longitude: splitter.location.longitude,
      name: splitter.name,
      site: splitter.location.site || "Splitter Location"
    })
    setShowMapDialog(true)
  }

  const copySplitterDetails = async (splitter: Splitter) => {
    const connectionPath = getConnectionPath(splitter, allSplitters)
    const coordinates = splitter.location.latitude && splitter.location.longitude
      ? `Coordinates: ${splitter.location.latitude.toFixed(6)}, ${splitter.location.longitude.toFixed(6)}`
      : ""
    const text = [
      `Splitter Details - ${splitter.name} (${splitter.splitterId})`,
      "",
      `Type: ${splitter.splitterType}`,
      `Ratio: ${splitter.splitRatio}`,
      `Status: ${splitter.status}`,
      `Role: ${splitter.isMaster ? "Master" : "Slave"}`,
      `Ports: ${splitter.usedPorts}/${splitter.portCount} (${splitter.availablePorts} available)`,
      "",
      `Connection Path: ${connectionPath.join(" → ")}`,
      `Location: ${splitter.location.site || "Not specified"}`,
      coordinates,
      `Updated: ${formatDate(splitter.updatedAt)}`
    ].filter(Boolean).join("\n")

    await navigator.clipboard.writeText(text)
    toast.success("Splitter details copied to clipboard")
  }

  const handleOLTSelection = (value: string) => {
    if (value) {
      fetchAvailablePorts(value);
      const selectedOLT = olts.find(o => String(o.id) === String(value));
      setSplitterForm(prev => ({
        ...prev,
        connectedServiceBoard: {
          oltId: value,
          oltName: selectedOLT?.name || "",
          boardSlot: 1,
          boardPort: "0/1/1"
        }
      }));
    } else {
      setSplitterForm(prev => ({
        ...prev,
        connectedServiceBoard: undefined
      }));
      setAvailablePorts([]);
    }
  };

  // Update specific sections
  const handleUpdateBasic = async () => {
    if (!selectedOLT) return

    try {
      const payload = {
        name: basicForm.name,
        ipAddress: basicForm.ipAddress,
        model: basicForm.model,
        vendor: basicForm.vendor,
        serialNumber: basicForm.serialNumber,
        firmwareVersion: basicForm.firmwareVersion,
        status: basicForm.status,
        defaultTransport: basicForm.transport
      }

      const response = await apiRequest<{ success: boolean; data: OLT; message: string }>(`/olt/${selectedOLT.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      if (response.success) {
        setOlts(olts.map(olt => olt.id === selectedOLT.id ? response.data : olt))
        setSelectedOLT(response.data)
        setShowUpdateDialog(false)
        toast.success("Basic information updated successfully")
      }
    } catch (error: any) {
      console.error("Failed to update basic info:", error)
      toast.error(error.message || "Failed to update basic information")
    }
  }

  const handleUpdateSSH = async () => {
    if (!selectedOLT) return

    try {
      const payload = {
        sshConfig: {
          host: sshForm.host,
          port: sshForm.port,
          username: sshForm.username,
          password: sshForm.password,
          enablePassword: sshForm.enablePassword,
          sshKey: sshForm.sshKey
        }
      }

      const response = await apiRequest<{ success: boolean; data: OLT; message: string }>(`/olt/${selectedOLT.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      if (response.success) {
        setOlts(olts.map(olt => olt.id === selectedOLT.id ? response.data : olt))
        setSelectedOLT(response.data)
        setShowUpdateDialog(false)
        toast.success("SSH configuration updated successfully")
      }
    } catch (error: any) {
      console.error("Failed to update SSH config:", error)
      toast.error(error.message || "Failed to update SSH configuration")
    }
  }

  const handleUpdateTelnet = async () => {
    if (!selectedOLT) return

    try {
      const payload = {
        telnetConfig: {
          enabled: telnetForm.enabled,
          port: telnetForm.port
        }
      }

      const response = await apiRequest<{ success: boolean; data: OLT; message: string }>(`/olt/${selectedOLT.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      if (response.success) {
        setOlts(olts.map(olt => olt.id === selectedOLT.id ? response.data : olt))
        setSelectedOLT(response.data)
        setShowUpdateDialog(false)
        toast.success("Telnet configuration updated successfully")
      }
    } catch (error: any) {
      console.error("Failed to update Telnet config:", error)
      toast.error(error.message || "Failed to update Telnet configuration")
    }
  }

  const handleUpdateSNMP = async () => {
    if (!selectedOLT) return

    try {
      const payload = {
        management: {
          snmpEnabled: snmpForm.enabled,
          snmpCommunity: snmpForm.community,
          snmpVersion: snmpForm.version
        }
      }

      const response = await apiRequest<{ success: boolean; data: OLT; message: string }>(`/olt/${selectedOLT.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      if (response.success) {
        setOlts(olts.map(olt => olt.id === selectedOLT.id ? response.data : olt))
        setSelectedOLT(response.data)
        setShowUpdateDialog(false)
        toast.success("SNMP configuration updated successfully")
      }
    } catch (error: any) {
      console.error("Failed to update SNMP config:", error)
      toast.error(error.message || "Failed to update SNMP configuration")
    }
  }

  const handleUpdateWeb = async () => {
    if (!selectedOLT) return

    try {
      const payload = {
        management: {
          webInterface: webForm.enabled,
          webPort: webForm.port,
          webSSL: webForm.ssl
        }
      }

      const response = await apiRequest<{ success: boolean; data: OLT; message: string }>(`/olt/${selectedOLT.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      if (response.success) {
        setOlts(olts.map(olt => olt.id === selectedOLT.id ? response.data : olt))
        setSelectedOLT(response.data)
        setShowUpdateDialog(false)
        toast.success("Web interface configuration updated successfully")
      }
    } catch (error: any) {
      console.error("Failed to update Web interface:", error)
      toast.error(error.message || "Failed to update Web interface configuration")
    }
  }

  const handleUpdateAPI = async () => {
    if (!selectedOLT) return

    try {
      const payload = {
        management: {
          apiEnabled: apiForm.enabled,
          apiPort: apiForm.port
        }
      }

      const response = await apiRequest<{ success: boolean; data: OLT; message: string }>(`/olt/${selectedOLT.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      if (response.success) {
        setOlts(olts.map(olt => olt.id === selectedOLT.id ? response.data : olt))
        setSelectedOLT(response.data)
        setShowUpdateDialog(false)
        toast.success("API configuration updated successfully")
      }
    } catch (error: any) {
      console.error("Failed to update API config:", error)
      toast.error(error.message || "Failed to update API configuration")
    }
  }

  const handleUpdateLocation = async () => {
    if (!selectedOLT) return

    try {
      const payload = {
        location: locationForm
      }

      const response = await apiRequest<{ success: boolean; data: OLT; message: string }>(`/olt/${selectedOLT.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      if (response.success) {
        setOlts(olts.map(olt => olt.id === selectedOLT.id ? response.data : olt))
        setSelectedOLT(response.data)
        setShowUpdateDialog(false)
        toast.success("Location information updated successfully")
      }
    } catch (error: any) {
      console.error("Failed to update location:", error)
      toast.error(error.message || "Failed to update location information")
    }
  }

  const handleUpdateAdvanced = async () => {
    if (!selectedOLT) return

    try {
      const payload = {
        autoProvisioning: advancedForm.autoProvisioning,
        redundancy: advancedForm.redundancy,
        powerSupply: advancedForm.powerSupply,
        cooling: advancedForm.cooling,
        backupSchedule: advancedForm.backupSchedule,
        notes: advancedForm.notes
      }

      const response = await apiRequest<{ success: boolean; data: OLT; message: string }>(`/olt/${selectedOLT.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      if (response.success) {
        setOlts(olts.map(olt => olt.id === selectedOLT.id ? response.data : olt))
        setSelectedOLT(response.data)
        setShowUpdateDialog(false)
        toast.success("Advanced settings updated successfully")
      }
    } catch (error: any) {
      console.error("Failed to update advanced settings:", error)
      toast.error(error.message || "Failed to update advanced settings")
    }
  }

  const handleUpdateServiceBoards = async () => {
    if (!selectedOLT) return

    try {
      const payload = {
        serviceBoards: serviceBoardsForm
      }

      const response = await apiRequest<{ success: boolean; data: OLT; message: string }>(`/olt/${selectedOLT.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      if (response.success) {
        setOlts(olts.map(olt => olt.id === selectedOLT.id ? response.data : olt))
        setSelectedOLT(response.data)
        setShowUpdateDialog(false)
        toast.success("Service boards updated successfully")
      }
    } catch (error: any) {
      console.error("Failed to update service boards:", error)
      toast.error(error.message || "Failed to update service boards")
    }
  }

  const handleUpdateStatus = async (status: "online" | "offline" | "maintenance") => {
    if (!selectedOLT) return

    try {
      const response = await apiRequest<{ success: boolean; data: OLT; message: string }>(`/olt/${selectedOLT.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      })

      if (response.success) {
        setOlts(olts.map(olt => olt.id === selectedOLT.id ? response.data : olt))
        setSelectedOLT(response.data)
        toast.success(`OLT status updated to ${status}`)
      }
    } catch (error: any) {
      console.error("Failed to update status:", error)
      toast.error(error.message || "Failed to update status")
    }
  }

  // Open update dialog with specific type
  const openUpdateDialog = (type: UpdateType, olt: OLT) => {
    setSelectedOLT(olt)
    loadForms(olt)
    setUpdateType(type)
    setShowUpdateDialog(true)
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "offline": return "bg-red-500/10 text-red-500 border-red-500/20"
      case "maintenance": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getONTStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "offline": return "bg-red-500/10 text-red-500 border-red-500/20"
      case "lost": return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "dying-gasp": return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getBoardStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "inactive": return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      case "faulty": return "bg-red-500/10 text-red-500 border-red-500/20"
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getSplitterStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-500 border-green-500/20"
      case "inactive": return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      case "maintenance": return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatUptime = (uptime: string) => {
    if (!uptime) return "N/A"
    return uptime
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOLTs(1)
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setVendorFilter("all")
    fetchOLTs(1)
  }

  const handlePageChange = (page: number) => {
    fetchOLTs(page)
  }

  // Handle terminal input key press
  const handleTerminalKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && terminalInput.trim()) {
      sendTerminalCommand(terminalInput.trim())
    }
  }

  // Stat Cards Component
  const OLTStatCard = ({
    title,
    value,
    change,
    icon: Icon,
    gradientFrom = "#10B981",
    gradientTo = "#3B82F6"
  }: {
    title: string
    value: string | number
    change?: string
    icon: React.ElementType
    gradientFrom?: string
    gradientTo?: string
  }) => {
    return (
      <Card className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} rounded-xl overflow-hidden relative`}>
        <div
          className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${gradientFrom} 0%, transparent 70%)`,
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle, ${gradientFrom} 0%, transparent 70%)`,
          }}
        />

        <CardContent className="p-6 relative z-10">
          <div className="flex flex-row items-center justify-between pb-2">
            <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>{title}</p>
            <div
              className="rounded-full p-2 flex items-center justify-center"
              style={{
                background: gradientFrom,
              }}
              aria-hidden="true"
            >
              <Icon className="h-4 w-4 text-white drop-shadow-md" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{value}</div>
            {change && (
              <p className={`text-xs font-medium mt-1 ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {change}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const ONTTable = ({ onts, showActions = true, onRowClick }: {
    onts: ONT[],
    showActions?: boolean,
    onRowClick?: (ont: ONT) => void
  }) => {
    const [syncingDetails, setSyncingDetails] = useState<Record<string, boolean>>({});

    const syncONTDetails = async (oltId: string, ont: ONT) => {
      try {
        setSyncingDetails(prev => ({ ...prev, [ont.id]: true }));

        const response = await apiRequest<{
          success: boolean;
          message: string;
          data: any;
        }>(`/olt/${oltId}/onts/${ont.ontId}/sync-details`, {
          method: "POST"
        });

        if (response.success) {
          toast.success(`ONT ${ont.serialNumber} details synced successfully`);

          // Refresh ONT list if we're in the details tab
          if (selectedOLT) {
            await fetchONTs(selectedOLT.id, ontPagination.page, ontSearch, ontStatusFilter);
          }
        } else {
          toast.error(response.error || "Failed to sync ONT details");
        }
      } catch (error: any) {
        console.error("Failed to sync ONT details:", error);
        toast.error(error.message || "Failed to sync ONT details");
      } finally {
        setSyncingDetails(prev => ({ ...prev, [ont.id]: false }));
      }
    };

    return (
      <div className="rounded-md border border-gray-200 dark:border-gray-800 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Distance</TableHead>
              <TableHead>RX Power</TableHead>
              <TableHead>TX Power</TableHead>
              <TableHead>Service Port</TableHead>
              <TableHead>ONT ID</TableHead>
              <TableHead>Uptime</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Last Synced</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {onts.map((ont) => (
              <TableRow
                key={ont.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowClick?.(ont)}
              >
                <TableCell>
                  <div className="font-mono text-sm">{ont.serialNumber}</div>
                </TableCell>
                <TableCell>
                  <Badge className={getONTStatusColor(ont.status)}>
                    {ont.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ont.distance ? (
                    <div className="flex items-center gap-1">
                      <Navigation className="h-3 w-3 text-blue-500" />
                      <span>{(ont.distance / 1000).toFixed(2)} km</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {ont.rxPower ? (
                    <div className={`flex items-center gap-1 ${ont.rxPower > -20 ? 'text-red-600' :
                      ont.rxPower > -25 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                      <Download className="h-3 w-3" />
                      {ont.rxPower.toFixed(2)} dBm
                    </div>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  {ont.txPower ? (
                    <div className={`flex items-center gap-1 ${ont.txPower > 5 ? 'text-red-600' :
                      ont.txPower > 3 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                      <Upload className="h-3 w-3" />
                      {ont.txPower.toFixed(2)} dBm
                    </div>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                    {ont.servicePort}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{ont.ontId}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatUptime(ont.uptime)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm max-w-xs truncate" title={ont.description}>
                    {ont.description || "No description"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(ont.lastSync)}
                  </div>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedONT(ont);
                          setShowONTDetails(true);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (selectedOLT) {
                            await syncONTDetails(selectedOLT.id, ont);
                          }
                        }}
                        disabled={syncingDetails[ont.id]}
                        title="Sync Detailed Info"
                        className="hover:bg-blue-50 hover:text-blue-600"
                      >
                        {syncingDetails[ont.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (loading && olts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500">Loading OLTs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="olt-management-ui space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Activity className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">OLT Management</h1>
              <p className="text-xs text-muted-foreground">Complete OLT details, optical inventory, splitters, ports, and live operations</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {(activeTab === "splitters" || isAdministrator) && (
            <Button
              size="sm"
              onClick={() => activeTab === "splitters" ? openNewSplitterDialog() : setShowAddDialog(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              {activeTab === "splitters" ? "Add Splitter" : "Add OLT"}
            </Button>
          )}
        </div>
      </div>

      <OLTManagementSummary olts={olts} stats={oltStats} />
      {activeTab !== "overview" && <OLTSelectedDeviceBanner
        olt={selectedOLT}
        onDetails={() => setActiveTab("details")}
        onTerminal={() => selectedOLT && connectToTerminal(selectedOLT)}
      />}

      {/* Legacy stat cards retained for compatibility with existing state. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden"
      >
        <OLTStatCard
          title="Total OLTs"
          value={oltStats?.total || 0}
          change={`${oltStats?.active || 0} Active`}
          icon={Server}
          gradientFrom="#10B981"
          gradientTo="#3B82F6"
        />
        <OLTStatCard
          title="Active OLTs"
          value={oltStats?.active || 0}
          change={`${oltStats?.inactive || 0} Inactive`}
          icon={CheckCircle}
          gradientFrom="#3B82F6"
          gradientTo="#10B981"
        />
        <OLTStatCard
          title="Total Ports"
          value={oltStats?.portStatistics?.total || 0}
          change={`${oltStats?.portStatistics?.used || 0} Used`}
          icon={Wifi}
          gradientFrom="#F59E0B"
          gradientTo="#EF4444"
        />
        <OLTStatCard
          title="Port Usage"
          value={`${oltStats?.portStatistics?.usagePercentage?.toFixed(1) || 0}%`}
          change={`${oltStats?.portStatistics?.available || 0} Available`}
          icon={BarChart3}
          gradientFrom="#EF4444"
          gradientTo="#EC4899"
        />
      </motion.div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="olt-primary-tabs grid h-12 w-full grid-cols-3 rounded-xl border border-border bg-card px-2 shadow-sm md:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="olts">OLT List</TabsTrigger>
          <TabsTrigger value="onts">ONT List</TabsTrigger>
          <TabsTrigger value="splitters">Splitters</TabsTrigger>
          <TabsTrigger value="details">OLT Details</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="olt-tab-panel olt-overview-panel space-y-6">
          <OLTModernOverview
            olts={olts}
            stats={oltStats}
            selectedOlt={selectedOLT}
            onSelect={(olt) => setSelectedOLT(olt as OLT)}
            onOpenDetails={(olt) => { setSelectedOLT(olt as OLT); setActiveTab("details") }}
            onOpenOnts={(olt) => { setSelectedOLT(olt as OLT); fetchONTs(String(olt.id), 1, "", "all"); setActiveTab("onts") }}
            onOpenSplitters={(olt) => { setSelectedOLT(olt as OLT); setActiveTab("splitters") }}
            onTerminal={(olt) => connectToTerminal(olt as OLT)}
          />
          {/* OLT Status Dashboard */}
          <Card className={`hidden ${isDarkMode ? "bg-gradient-to-br from-[#0f172a] to-[#1e293b]" : "bg-gradient-to-br from-white to-gray-50"} border-0 rounded-2xl shadow-xl overflow-hidden relative`}>
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5" />

            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400/20 rounded-full"
                  initial={{
                    x: Math.random() * 100 + '%',
                    y: Math.random() * 100 + '%',
                  }}
                  animate={{
                    y: [null, '-100px', '100px'],
                    x: [null, `${Math.random() * 50 - 25}px`],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            <CardHeader className="pb-4 relative z-10">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} flex items-center gap-3`}>
                    <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                      <Server className="h-6 w-6 text-white" />
                    </div>
                    OLT Network Dashboard
                  </CardTitle>
                  <CardDescription className={`${isDarkMode ? "text-slate-300" : "text-gray-600"} mt-2 flex items-center gap-2`}>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span>Active Network Monitoring</span>
                    </div>
                    <span className="text-blue-400">•</span>
                    <span>Real-time Status</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${isDarkMode ? "bg-blue-900/30 border-blue-700 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-700"} backdrop-blur-sm`}>
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3 w-3 animate-pulse" />
                      <span>{olts.filter(o => o.status === 'online').length}/{olts.length} Active</span>
                    </div>
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`${isDarkMode ? "hover:bg-white/10" : "hover:bg-gray-100"} transition-all duration-300`}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative z-10">
              {olts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full opacity-20 animate-pulse" />
                    <Server className="h-24 w-24 mx-auto text-gray-400 relative z-10" />
                  </div>
                  <p className="text-xl font-semibold text-gray-500 mb-2">No OLTs Configured</p>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Start by adding your first Optical Line Terminal to monitor network performance and manage ONTs
                  </p>
                  {isAdministrator && <Button
                    size="lg"
                    onClick={() => setShowAddDialog(true)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add First OLT
                  </Button>}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-white"} border ${isDarkMode ? "border-slate-700" : "border-gray-200"} backdrop-blur-sm`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Server className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total OLTs</p>
                          <p className="text-2xl font-bold">{olts.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-white"} border ${isDarkMode ? "border-slate-700" : "border-gray-200"} backdrop-blur-sm`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Online</p>
                          <p className="text-2xl font-bold text-green-500">
                            {olts.filter(o => o.status === 'online').length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-white"} border ${isDarkMode ? "border-slate-700" : "border-gray-200"} backdrop-blur-sm`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                          <Activity className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">In Maintenance</p>
                          <p className="text-2xl font-bold text-amber-500">
                            {olts.filter(o => o.status === 'maintenance').length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-white"} border ${isDarkMode ? "border-slate-700" : "border-gray-200"} backdrop-blur-sm`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Wifi className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Avg Port Usage</p>
                          <p className="text-2xl font-bold text-purple-500">
                            {(() => {
                              const totalUsage = olts.reduce((sum, olt) => {
                                return sum + (olt.usedPorts / olt.totalPorts);
                              }, 0);
                              return Math.round((totalUsage / olts.length) * 100) || 0;
                            })()}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OLT Status Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {olts.map((olt, index) => (
                      <motion.div
                        key={olt.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        className={`rounded-xl overflow-hidden border ${isDarkMode ? "border-slate-700" : "border-gray-200"} hover:shadow-lg transition-all duration-300 cursor-pointer`}
                        onClick={() => {
                          setSelectedOLT(olt);
                          setActiveTab("details");
                        }}
                      >
                        {/* Status Indicator Bar */}
                        <div className={`h-1 ${olt.status === 'online' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          olt.status === 'offline' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                            'bg-gradient-to-r from-amber-500 to-orange-500'
                          }`} />

                        <div className={`p-5 ${isDarkMode ? "bg-slate-800/50" : "bg-white"}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${olt.status === 'online' ? 'bg-green-500/10' :
                                  olt.status === 'offline' ? 'bg-red-500/10' :
                                    'bg-amber-500/10'
                                  }`}>
                                  <Server className={`h-5 w-5 ${olt.status === 'online' ? 'text-green-500' :
                                    olt.status === 'offline' ? 'text-red-500' :
                                      'text-amber-500'
                                    }`} />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-lg">{olt.name}</h3>
                                  <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <Globe className="h-3 w-3" />
                                    {olt.ipAddress}
                                    <span className="text-gray-400">•</span>
                                    <span>{olt.vendor} {olt.model}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 mb-3">
                                <Badge className={`${olt.status === 'online' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                  olt.status === 'offline' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                  }`}>
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${olt.status === 'online' ? 'bg-green-500 animate-pulse' :
                                      olt.status === 'offline' ? 'bg-red-500' :
                                        'bg-amber-500'
                                      }`} />
                                    {olt.status.charAt(0).toUpperCase() + olt.status.slice(1)}
                                  </div>
                                </Badge>

                                <Badge variant="outline" className={`${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-gray-50 border-gray-200"}`}>
                                  <HardDrive className="h-3 w-3 mr-1" />
                                  {olt.serviceBoards?.length || 0} Boards
                                </Badge>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {Math.round((olt.usedPorts / olt.totalPorts) * 100)}%
                              </div>
                              <p className="text-xs text-gray-500">Port Usage</p>
                            </div>
                          </div>

                          {/* Progress Bar with Details */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">
                                Ports: <span className="font-medium">{olt.usedPorts}/{olt.totalPorts}</span>
                                <span className="text-gray-400 ml-2">
                                  ({olt.availablePorts} available)
                                </span>
                              </span>
                              <span className="font-medium">
                                {olt.totalSubscribers?.toLocaleString() || 0} subscribers / {olt.activeSubscribers || 0} active
                              </span>
                            </div>

                            <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-gray-200"}`}>
                              <motion.div
                                className="h-full rounded-full"
                                style={{
                                  background: olt.status === 'online'
                                    ? 'linear-gradient(90deg, #10B981 0%, #3B82F6 100%)'
                                    : olt.status === 'offline'
                                      ? 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
                                      : 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                                  boxShadow: `0 0 8px ${olt.status === 'online' ? '#10B98180' :
                                    olt.status === 'offline' ? '#EF444480' :
                                      '#F59E0B80'
                                    }`,
                                  width: `${(olt.usedPorts / olt.totalPorts) * 100}%`,
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(olt.usedPorts / olt.totalPorts) * 100}%` }}
                                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                              />
                            </div>

                            <div className="flex justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Last seen: {formatDate(olt.lastSeen)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {olt.activeSubscribers || 0} active
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOLT(olt);
                                fetchONTs(olt.id, 1, '', 'all');
                                setActiveTab("onts");
                              }}
                            >
                              <Wifi className="h-4 w-4 mr-2" />
                              View ONTs
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOLT(olt);
                                setActiveTab("splitters");
                              }}
                            >
                              <Split className="h-4 w-4 mr-2" />
                              Splitters
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                testSSHConnection(olt);
                              }}
                              disabled={testingSSH[olt.id]}
                            >
                              {testingSSH[olt.id] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Terminal className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Health Summary */}
                  {olts.length > 0 && (
                    <div className={`p-5 rounded-xl ${isDarkMode ? "bg-slate-800/50" : "bg-gray-50"} border ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                          Network Health Summary
                        </h4>
                        <Badge variant="outline" className={`${olts.every(o => o.status === 'online')
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                          {olts.every(o => o.status === 'online') ? 'All Systems Operational' : 'Issues Detected'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Overall Uptime</p>
                          <p className="text-xl font-bold">99.8%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Avg Response Time</p>
                          <p className="text-xl font-bold">24ms</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Bandwidth Usage</p>
                          <p className="text-xl font-bold">42%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-500">Last Incident</p>
                          <p className="text-xl font-bold">2 days ago</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="olts" className="space-y-6">
          <Card className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} rounded-xl overflow-hidden relative`}>
            <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #10B981 0%, transparent 70%)` }} />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #10B981 0%, transparent 70%)` }} />

            <CardHeader className={`pb-2 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} border-b relative z-10`}>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>OLT Devices</CardTitle>
                  <CardDescription className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
                    Manage your Optical Line Terminals
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 relative z-10">
              {/* Search and Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search OLTs by name, IP, or model..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button type="submit" variant="default">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </form>
                </div>

                <div className="flex gap-2">
                  <div className="w-40">
                    <SearchableSelect
                      options={[
                        { value: "all", label: "All Status" },
                        { value: "online", label: "Online" },
                        { value: "offline", label: "Offline" },
                        { value: "maintenance", label: "Maintenance" }
                      ]}
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                      placeholder="Status"
                    />
                  </div>

                  <div className="w-40">
                    <SearchableSelect
                      options={[
                        { value: "all", label: "All Vendors" },
                        ...VENDOR_OPTIONS.map(vendor => ({
                          value: vendor.value,
                          label: vendor.label
                        }))
                      ]}
                      value={vendorFilter}
                      onValueChange={setVendorFilter}
                      placeholder="Vendor"
                    />
                  </div>

                  {isAdministrator && <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>}
                </div>
              </div>

              {olts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p>No OLTs found</p>
                  <p className="text-sm text-gray-500 mt-1">Add your first OLT to get started</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowAddDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add OLT
                  </Button>
                </div>
              ) : (
                <>
                  <div className="rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>OLT Name</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ports</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {olts.map((olt) => (
                          <TableRow
                            key={olt.id}
                            className={selectedOLT?.id === olt.id ? "bg-blue-50 dark:bg-blue-900/10" : ""}
                          >
                            <TableCell>
                              <div className="font-medium">{olt.name}</div>
                              <div className="text-sm text-gray-500">{olt.serialNumber || 'No serial'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-sm">{olt.ipAddress}</div>
                            </TableCell>
                            <TableCell>{olt.model}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                {olt.vendor}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(olt.status)}>
                                {olt.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {/* Fixed: Use olt.usedPorts instead of showing 0 */}
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{olt.usedPorts} / {olt.totalPorts}</span>
                                  <span className="text-xs text-gray-500">({olt.availablePorts} available)</span>
                                </div>
                                {/* Progress bar showing actual usage */}
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${(olt.usedPorts / olt.totalPorts) > 0.8 ? 'bg-red-500' :
                                      (olt.usedPorts / olt.totalPorts) > 0.5 ? 'bg-amber-500' : 'bg-green-500'
                                      }`}
                                    style={{
                                      width: `${Math.min((olt.usedPorts / olt.totalPorts) * 100, 100)}%`
                                    }}
                                  />
                                </div>
                                {/* Show usage percentage */}
                                <div className="text-xs text-gray-500">
                                  {Math.round((olt.usedPorts / olt.totalPorts) * 100)}% used
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedOLT(olt)
                                    setActiveTab("details")
                                  }}
                                  className="h-8 w-8"
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedOLT(olt)
                                    testSSHConnection(olt)
                                  }}
                                  className="h-8 w-8"
                                  title="Test SSH Connection"
                                  disabled={testingSSH[olt.id]}
                                >
                                  {testingSSH[olt.id] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Terminal className="h-4 w-4" />
                                  )}
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openUpdateDialog("basic", olt)}
                                  className="h-8 w-8"
                                  title="Edit Basic Info"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteOLT(olt)}
                                  className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-red-100"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>

                                {/* Quick Actions Dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openUpdateDialog("ssh", olt)}>
                                      <Terminal className="h-4 w-4 mr-2" />
                                      Update SSH
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openUpdateDialog("telnet", olt)}>
                                      <Terminal className="h-4 w-4 mr-2" />
                                      Update Telnet
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openUpdateDialog("snmp", olt)}>
                                      <Network className="h-4 w-4 mr-2" />
                                      Update SNMP
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openUpdateDialog("web", olt)}>
                                      <Globe className="h-4 w-4 mr-2" />
                                      Update Web Interface
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openUpdateDialog("api", olt)}>
                                      <Cpu className="h-4 w-4 mr-2" />
                                      Update API
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openUpdateDialog("location", olt)}>
                                      <MapPin className="h-4 w-4 mr-2" />
                                      Update Location
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openUpdateDialog("service-boards", olt)}>
                                      <HardDrive className="h-4 w-4 mr-2" />
                                      Update Service Boards
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openUpdateDialog("advanced", olt)}>
                                      <Settings className="h-4 w-4 mr-2" />
                                      Advanced Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openUpdateDialog("status", olt)}>
                                      <Activity className="h-4 w-4 mr-2" />
                                      Change Status
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {oltPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500">
                        Showing {(oltPagination.page - 1) * oltPagination.limit + 1} to {Math.min(oltPagination.page * oltPagination.limit, oltPagination.total)} of {oltPagination.total} OLTs
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(oltPagination.page - 1)}
                          disabled={!oltPagination.hasPreviousPage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Page {oltPagination.page} of {oltPagination.totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(oltPagination.page + 1)}
                          disabled={!oltPagination.hasNextPage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onts" className="space-y-6">
          <Card className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} rounded-xl overflow-hidden relative`}>
            <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #3B82F6 0%, transparent 70%)` }} />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #3B82F6 0%, transparent 70%)` }} />

            <CardHeader className={`pb-2 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} border-b relative z-10`}>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>ONT Devices</CardTitle>
                  <CardDescription className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
                    Manage Optical Network Terminals with detailed metrics
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <Badge variant="outline" className="text-xs">
                        <RefreshCw className="h-3 w-3 mr-1" /> Refresh: Local DB
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                        <Wifi className="h-3 w-3 mr-1" /> Fetch: Basic Info
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                        <Database className="h-3 w-3 mr-1" /> Sync: Full Details
                      </Badge>
                    </div>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <SearchableSelect
                    options={olts.map(olt => ({
                      value: olt.id,
                      label: `${olt.name} (${olt.ipAddress})`
                    }))}
                    value={selectedOLT?.id || ""}
                    onValueChange={(value) => {
                      const olt = olts.find(o => String(o.id) === String(value))
                      if (olt) {
                        setSelectedOLT(olt)
                      }
                    }}
                    placeholder="Select OLT"
                    emptyMessage="No OLTs available"
                  />
                  {selectedOLT && (
                    <div className="flex items-center gap-2">
                      {/* Refresh from the device, persist it, then reload the list. */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refreshONTList(String(selectedOLT.id))}
                        disabled={refreshing}
                        title="Synchronize ONTs from the OLT and reload the list"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh List
                      </Button>

                      {/* Sync with OLT All - Uses syncing state */}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => syncONTs(selectedOLT.id)}
                        disabled={syncing[selectedOLT.id]}
                      >
                        <RefreshCcw className={`h-4 w-4 mr-2 ${syncing[selectedOLT.id] ? 'animate-spin' : ''}`} />
                        {syncing[selectedOLT.id] ? 'Syncing...' : 'Sync from OLT'}
                      </Button>

                      {/* Sync Basic ONT Info - Fast - Uses fetchingONTs state */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            setFetchingONTs(prev => ({ ...prev, [selectedOLT.id]: true }));

                            const response = await apiRequest<{
                              success: boolean;
                              message: string;
                              data: any;
                            }>(`/olt/${selectedOLT.id}/onts/sync-basic`, {
                              method: "POST"
                            });

                            if (response.success) {
                              toast.success(response.message || "Basic ONT info synced");
                              // Refresh the list
                              await fetchONTs(selectedOLT.id, ontPagination.page, ontSearch, ontStatusFilter);
                            } else {
                              toast.error(response.error || "Failed to sync basic ONT info");
                            }
                          } catch (error: any) {
                            console.error("Failed to sync basic ONT info:", error);
                            toast.error(error.message || "Failed to sync basic ONT info");
                          } finally {
                            setFetchingONTs(prev => ({ ...prev, [selectedOLT.id]: false }));
                          }
                        }}
                        disabled={fetchingONTs[selectedOLT.id]}
                        title="Fetch basic ONT info from OLT (Fast)"
                        className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 hover:text-blue-700 border-blue-500/20"
                      >
                        {fetchingONTs[selectedOLT.id] ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Wifi className="h-4 w-4 mr-2" />
                        )}
                        Fetch ONTs
                      </Button>

                      {/* Sync All Details - Uses syncingAllDetails state */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            setSyncingAllDetails(prev => ({ ...prev, [selectedOLT.id]: true }));

                            const response = await apiRequest<{
                              success: boolean;
                              message: string;
                              data: any;
                            }>(`/olt/${selectedOLT.id}/onts/sync-all-details`, {
                              method: "POST"
                            });

                            if (response.success) {
                              toast.success(response.message || "All ONT details synced");
                              // Refresh the list
                              await fetchONTs(selectedOLT.id, ontPagination.page, ontSearch, ontStatusFilter);
                            } else {
                              toast.error(response.error || "Failed to sync all ONT details");
                            }
                          } catch (error: any) {
                            console.error("Failed to sync all ONT details:", error);
                            toast.error(error.message || "Failed to sync all ONT details");
                          } finally {
                            setSyncingAllDetails(prev => ({ ...prev, [selectedOLT.id]: false }));
                          }
                        }}
                        disabled={syncingAllDetails[selectedOLT.id]}
                        title="Fetch detailed info for all ONTs (Slow)"
                        className="bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20"
                      >
                        {syncingAllDetails[selectedOLT.id] ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Database className="h-4 w-4 mr-2" />
                        )}
                        Sync All Details
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 relative z-10">
              {!selectedOLT ? (
                <div className="text-center py-8">
                  <Router className="h-12 w-12 mx-auto text-gray-400" />
                  <p className="text-gray-500 mt-2">Select an OLT to view ONTs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search and Filter Bar */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search ONTs by serial, description, or port..."
                          value={ontSearch}
                          onChange={(e) => setOntSearch(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && fetchONTs(selectedOLT.id, 1, ontSearch, ontStatusFilter)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-40">
                        <SearchableSelect
                          options={[
                            { value: "all", label: "All Status" },
                            { value: "online", label: "Online" },
                            { value: "offline", label: "Offline" }
                          ]}
                          value={ontStatusFilter}
                          onValueChange={(value) => {
                            setOntStatusFilter(value);
                            fetchONTs(selectedOLT.id, 1, ontSearch, value);
                          }}
                          placeholder="Status"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setOntSearch("");
                          setOntStatusFilter("all");
                          fetchONTs(selectedOLT.id, 1, "", "all");
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>

                  {onts.length === 0 ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchONTs(selectedOLT.id, ontPagination.page, ontSearch, ontStatusFilter)}
                        title="Refresh from database"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh List
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          try {
                            setFetchingONTs(prev => ({ ...prev, [selectedOLT.id]: true }));
                            const response = await apiRequest<{
                              success: boolean;
                              message: string;
                              data: any;
                            }>(`/olt/${selectedOLT.id}/onts/sync-basic`, {
                              method: "POST"
                            });

                            if (response.success) {
                              toast.success(response.message || "Basic ONT info synced");
                              await fetchONTs(selectedOLT.id, ontPagination.page, ontSearch, ontStatusFilter);
                            }
                          } finally {
                            setFetchingONTs(prev => ({ ...prev, [selectedOLT.id]: false }));
                          }
                        }}
                        disabled={fetchingONTs[selectedOLT.id]}
                        title="Fetch basic ONT info from OLT (Fast)"
                      >
                        {fetchingONTs[selectedOLT.id] ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Wifi className="h-4 w-4 mr-2" />
                        )}
                        Fetch ONTs
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            setSyncingAllDetails(prev => ({ ...prev, [selectedOLT.id]: true }));
                            const response = await apiRequest<{
                              success: boolean;
                              message: string;
                              data: any;
                            }>(`/olt/${selectedOLT.id}/onts/sync-all-details`, {
                              method: "POST"
                            });

                            if (response.success) {
                              toast.success(response.message || "All ONT details synced");
                              await fetchONTs(selectedOLT.id, ontPagination.page, ontSearch, ontStatusFilter);
                            }
                          } finally {
                            setSyncingAllDetails(prev => ({ ...prev, [selectedOLT.id]: false }));
                          }
                        }}
                        disabled={syncingAllDetails[selectedOLT.id]}
                        title="Fetch detailed info for all ONTs (Slow)"
                        className="bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20"
                      >
                        {syncingAllDetails[selectedOLT.id] ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Database className="h-4 w-4 mr-2" />
                        )}
                        Sync All Details
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* ONT Table */}
                      <ONTTable
                        onts={onts}
                        showActions={true}
                        onRowClick={(ont) => {
                          setSelectedONT(ont);
                          setShowONTDetails(true);
                        }}
                      />

                      {/* Pagination */}
                      {ontPagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-gray-500">
                            Showing {(ontPagination.page - 1) * ontPagination.limit + 1} to {Math.min(ontPagination.page * ontPagination.limit, ontPagination.total)} of {ontPagination.total} ONTs
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchONTs(selectedOLT.id, ontPagination.page - 1, ontSearch, ontStatusFilter)}
                              disabled={!ontPagination.hasPreviousPage}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                              Page {ontPagination.page} of {ontPagination.totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchONTs(selectedOLT.id, ontPagination.page + 1, ontSearch, ontStatusFilter)}
                              disabled={!ontPagination.hasNextPage}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* ONT Statistics */}
                      {/* ONT Statistics */}
                      <div className="grid grid-cols-4 gap-4 mt-6">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <p className="text-sm text-gray-500">Total ONTs</p>
                          <p className="text-2xl font-bold">{ontPagination.total}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <p className="text-sm text-gray-500">Online</p>
                          <p className="text-2xl font-bold text-green-600">
                            {/* Add safety check for onts array */}
                            {Array.isArray(onts) ? onts.filter(o => o.status === 'online').length : 0}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <p className="text-sm text-gray-500">Offline</p>
                          <p className="text-2xl font-bold text-red-600">
                            {Array.isArray(onts) ? onts.filter(o => o.status === 'offline').length : 0}
                          </p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <p className="text-sm text-gray-500">Avg RX Power</p>
                          <p className="text-2xl font-bold">
                            {(() => {
                              if (!Array.isArray(onts)) return 'N/A';
                              const onlineOnts = onts.filter(o => o.status === 'online' && o.rxPower);
                              if (onlineOnts.length === 0) return 'N/A';
                              const avg = onlineOnts.reduce((sum, o) => sum + (o.rxPower || 0), 0) / onlineOnts.length;
                              return avg.toFixed(2) + ' dBm';
                            })()}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="splitters" className="space-y-6">
          <Card className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} rounded-xl overflow-hidden relative`}>
            <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #8B5CF6 0%, transparent 70%)` }} />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #8B5CF6 0%, transparent 70%)` }} />

            <CardHeader className={`pb-2 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} border-b relative z-10`}>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>Fiber Splitters</CardTitle>
                  <CardDescription className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
                    Manage optical splitters and their hierarchy connections
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={async () => {
                    setSelectedSplitter(null);
                    setSplitterForm({
                      name: "",
                      splitterId: "",
                      splitRatio: "1:8",
                      ratio: 8,
                      splitterType: "PLC",
                      portCount: 8,
                      usedPorts: 0,
                      availablePorts: 8,
                      isMaster: false,
                      masterSplitterId: "",
                      location: {
                        site: "",
                        latitude: 0,
                        longitude: 0,
                        description: ""
                      },
                      upstreamFiber: {
                        coreColor: "Blue",
                        connectedTo: "service-board",
                        connectionId: "",
                        port: ""
                      },
                      connectedServiceBoard: undefined,
                      status: "active",
                      notes: ""
                    });
                    setAvailablePorts([]);
                    await fetchAllSplittersForHierarchy();
                    setShowAddSplitterDialog(true);
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Splitter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 relative z-10">
              {/* Search and Filter Bar */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search splitters by name, splitterId, site, or OLT..."
                      className="pl-10"
                      value={splitterSearchQuery}
                      onChange={(e) => setSplitterSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* OLT Filter Dropdown */}
                  <div className="w-56">
                    <SearchableSelect
                      options={[
                        { value: "all", label: "📡 All OLTs" },
                        ...(() => {
                          // Collect all OLTs that have splitters connected (directly or through hierarchy)
                          const oltSet = new Set<string>();
                          const oltMap = new window.Map<string, { name: string, ip: string, splitterCount: number }>();

                          // Initialize with OLTs from the olts list
                          olts.forEach(olt => {
                            oltSet.add(olt.id);
                            oltMap.set(olt.id, {
                              name: olt.name,
                              ip: olt.ipAddress,
                              splitterCount: 0
                            });
                          });

                          // Count splitters connected to each OLT
                          allSplitters.forEach(splitter => {
                            const rootOltId = findRootOltForSplitter(splitter, allSplitters);
                            if (rootOltId) {
                              const oltInfo = oltMap.get(rootOltId);
                              if (oltInfo) {
                                oltMap.set(rootOltId, {
                                  ...oltInfo,
                                  splitterCount: oltInfo.splitterCount + 1
                                });
                              }
                            }
                          });

                          return Array.from(oltSet).map(oltId => {
                            const oltInfo = oltMap.get(oltId);
                            const splitterCount = oltInfo?.splitterCount || 0;
                            return {
                              value: oltId,
                              label: `${oltInfo?.name} (${oltInfo?.ip}) - ${splitterCount} splitter${splitterCount !== 1 ? 's' : ''}`
                            };
                          });
                        })()
                      ]}
                      value={oltFilter}
                      onValueChange={(value) => {
                        setOltFilter(value)
                      }}
                      placeholder="🔍 Filter by OLT"
                      emptyMessage="No OLTs available"
                    />
                  </div>

                  {/* Splitter Type Filter */}
                  <div className="w-40">
                    <SearchableSelect
                      options={[
                        { value: "all", label: "All Types" },
                        { value: "master", label: "Master Only" },
                        { value: "slave", label: "Slave Only" }
                      ]}
                      value={splitterTypeFilter}
                      onValueChange={(value) => {
                        setSplitterTypeFilter(value)
                      }}
                      placeholder="Filter by type"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSplitterSearchQuery("")
                      setOltFilter("all")
                      setSplitterTypeFilter("all")
                      setSplitterPage(1)
                    }}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    title="Refresh splitters"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Splitters</p>
                  <p className="text-xl font-bold">{allSplitters.length}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-500">Master Splitters</p>
                  <p className="text-xl font-bold text-purple-600">
                    {allSplitters.filter(s => s.isMaster).length}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-500">Slave Splitters</p>
                  <p className="text-xl font-bold text-blue-600">
                    {allSplitters.filter(s => !s.isMaster).length}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-500">Connected to OLT</p>
                  <p className="text-xl font-bold text-green-600">
                    {allSplitters.filter(s => findRootOltForSplitter(s, allSplitters)).length}
                  </p>
                </div>
              </div>

              {(() => {
                const filteredAllSplitters = allSplitters.filter(splitter => {
                  // 1. Search filter
                  if (splitterSearchQuery) {
                    const q = splitterSearchQuery.toLowerCase();
                    const nameMatch = splitter.name?.toLowerCase().includes(q);
                    const idMatch = splitter.splitterId?.toLowerCase().includes(q);
                    const siteMatch = splitter.location?.site?.toLowerCase().includes(q);
                    const notesMatch = splitter.notes?.toLowerCase().includes(q);
                    if (!nameMatch && !idMatch && !siteMatch && !notesMatch) return false;
                  }
                  // 2. OLT filter
                  if (oltFilter && oltFilter !== 'all') {
                    const rootOltId = findRootOltForSplitter(splitter, allSplitters);
                    if (String(rootOltId) !== String(oltFilter)) return false;
                  }
                  // 3. Type filter
                  if (splitterTypeFilter && splitterTypeFilter !== 'all') {
                    if (splitterTypeFilter === 'master' && !splitter.isMaster) return false;
                    if (splitterTypeFilter === 'slave' && splitter.isMaster) return false;
                  }
                  return true;
                });

                // Exclude child slaves if their parent is also present in the list (to avoid double listing when parent is expanded)
                const displayAllSplitters = filteredAllSplitters.filter(splitter => {
                  if (splitterTypeFilter === 'all' && !splitter.isMaster && splitter.masterSplitterId) {
                    const hasParentInList = filteredAllSplitters.some(
                      s => s.isMaster && s.splitterId === splitter.masterSplitterId
                    );
                    if (hasParentInList) return false;
                  }
                  return true;
                });

                const itemsPerPage = 10;
                const totalPages = Math.ceil(displayAllSplitters.length / itemsPerPage);
                const startIndex = (splitterPage - 1) * itemsPerPage;
                const paginatedAllSplitters = displayAllSplitters.slice(startIndex, startIndex + itemsPerPage);

                if (allSplitters.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Split className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="text-gray-500 mt-2">No splitters configured</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setShowAddSplitterDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Splitter
                      </Button>
                    </div>
                  );
                }

                if (displayAllSplitters.length === 0) {
                  return (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Split className="h-12 w-12 mx-auto text-gray-300" />
                      <p className="text-gray-500 mt-2">No splitters match the filters</p>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Splitter Name</TableHead>
                            <TableHead>Splitter ID</TableHead>
                            <TableHead>Type/Ratio</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Port Usage</TableHead>
                            <TableHead>Connected To</TableHead>
                            <TableHead>Ultimate OLT</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedAllSplitters.map((splitter) => {
                            const connectionDetails = getConnectionDetails(splitter);
                            const connectionPath = getConnectionPath(splitter, allSplitters);
                            const ultimateOlt = getConnectedOltName(splitter, allSplitters);

                          return (
                            <Fragment key={splitter.id}>
                            <TableRow className="hover:bg-muted/50">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {splitter.isMaster && (splitter.slaveCount ?? 0) > 0 && (
                                    <button
                                      onClick={() => {
                                        setExpandedMasters(prev => {
                                          const next = new Set(prev);
                                          if (next.has(splitter.id)) {
                                            next.delete(splitter.id);
                                          } else {
                                            next.add(splitter.id);
                                          }
                                          return next;
                                        });
                                      }}
                                      className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                      title={expandedMasters.has(splitter.id) ? "Collapse slaves" : `Show ${splitter.slaveCount ?? 0} slave(s)`}
                                    >
                                      <ChevronDown className={`h-4 w-4 text-purple-500 transition-transform ${expandedMasters.has(splitter.id) ? 'rotate-180' : ''}`} />
                                    </button>
                                  )}
                                  <div className="font-medium">{splitter.name}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-mono text-sm">{splitter.splitterId}</div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                    {splitter.splitterType}
                                  </Badge>
                                  <div className="text-xs text-gray-500">
                                    Ratio: {splitter.splitRatio}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {splitter.isMaster ? (
                                  <div className="space-y-1">
                                    <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                                      Master
                                    </Badge>
                                    {(splitter.slaveCount ?? 0) > 0 && (
                                      <div className="text-xs text-gray-500">
                                        {splitter.slaveCount} slave{splitter.slaveCount !== 1 ? 's' : ''}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
                                      Slave
                                    </Badge>
                                    {splitter.masterSplitterId && (
                                      <div className="text-xs text-gray-500">
                                        Parent: {splitter.masterSplitterId}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Used: {splitter.usedPorts}</span>
                                    <span>Total: {splitter.portCount}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                      className="bg-green-500 h-1.5 rounded-full"
                                      style={{ width: `${(splitter.usedPorts / splitter.portCount) * 100}%` }}
                                    />
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Available: {splitter.availablePorts}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    {splitter.connectedServiceBoard ? (
                                      <Server className="h-3 w-3 text-green-500" />
                                    ) : splitter.masterSplitterId ? (
                                      <Split className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <XCircle className="h-3 w-3 text-gray-400" />
                                    )}
                                    <span className="text-sm font-medium">{connectionDetails.type}</span>
                                  </div>
                                  <div className="text-xs text-gray-500 truncate" title={connectionDetails.details}>
                                    {connectionDetails.details}
                                  </div>
                                  {/* Show connection path */}
                                  {connectionPath.length > 2 && (
                                    <div className="text-xs text-gray-400 mt-1 truncate" title={connectionPath.join(' → ')}>
                                      Path: {connectionPath.slice(0, 3).join(' → ')}
                                      {connectionPath.length > 3 && '...'}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="text-sm font-medium">
                                    {ultimateOlt !== "Not connected" ? (
                                      <div className="flex items-center gap-2">
                                        <Server className="h-3 w-3 text-green-500" />
                                        <span>{ultimateOlt}</span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">{ultimateOlt}</span>
                                    )}
                                  </div>
                                  {/* Show OLT IP if available */}
                                  {ultimateOlt !== "Not connected" && (
                                    (() => {
                                      const rootOltId = findRootOltForSplitter(splitter, splitters);
                                      const olt = olts.find(o => String(o.id) === String(rootOltId));
                                      return olt?.ipAddress ? (
                                        <div className="text-xs text-gray-500 font-mono">
                                          {olt.ipAddress}
                                        </div>
                                      ) : null;
                                    })()
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {splitter.location.site || "No site"}
                                </div>
                                {(splitter.location.latitude || splitter.location.longitude) && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <MapPin className="h-3 w-3" />
                                    <span>
                                      {splitter.location.latitude?.toFixed(4)}, {splitter.location.longitude?.toFixed(4)}
                                    </span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge className={getSplitterStatusColor(splitter.status)}>
                                  {splitter.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {/* View Button */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedSplitter(splitter);
                                      setShowSplitterDetails(true);
                                    }}
                                    className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  {/* Edit Button */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                      setSelectedSplitter(splitter);
                                      const ratioValue = parseInt(splitter.splitRatio.split(':')[1]) || 8;

                                      let parentSplitterId = "";
                                      if (splitter.masterSplitterId) {
                                        const parent = allSplitters.find(s => s.splitterId === splitter.masterSplitterId);
                                        if (parent) {
                                          parentSplitterId = parent.id;
                                        }
                                      }

                                      setSplitterForm({
                                        name: splitter.name,
                                        splitterId: splitter.splitterId,
                                        splitRatio: splitter.splitRatio as any,
                                          splitterType: splitter.splitterType as "PLC" | "FBT" | "COUPLER",
                                        portCount: splitter.portCount,
                                        usedPorts: splitter.usedPorts,
                                        availablePorts: splitter.availablePorts,
                                        location: {
                                          site: splitter.location.site || "",
                                          latitude: splitter.location.latitude ?? 0,
                                          longitude: splitter.location.longitude ?? 0,
                                          description: splitter.location.description || ""
                                        },
                                        upstreamFiber: {
                                          coreColor: splitter.upstreamFiber.coreColor,
                                          connectedTo: splitter.upstreamFiber.connectedTo,
                                          connectionId: splitter.upstreamFiber.connectionId || "",
                                          port: splitter.upstreamFiber.port || ""
                                        },
                                        isMaster: splitter.isMaster,
                                        masterSplitterId: parentSplitterId,
                                        connectedServiceBoard: splitter.connectedServiceBoard,
                                        status: splitter.status,
                                        notes: splitter.notes || "",
                                        ratio: ratioValue
                                      });

                                      await fetchAllSplittersForHierarchy();

                                      if (splitter.isMaster && splitter.connectedServiceBoard?.oltId) {
                                        await fetchAvailablePorts(splitter.connectedServiceBoard.oltId);
                                      } else {
                                        setAvailablePorts([]);
                                      }

                                      setShowAddSplitterDialog(true);
                                    }}
                                    className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                                    title="Edit Splitter"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>

                                  {/* Add Slave Button (Only for Master splitters) */}
                                  {splitter.isMaster && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={async () => {
                                        setSelectedSplitter(null);
                                        await fetchAllSplittersForHierarchy();
                                        setSplitterForm({
                                          name: "",
                                          splitterId: "",
                                          splitRatio: "1:8",
                                          ratio: 8,
                                          splitterType: "PLC",
                                          portCount: 8,
                                          usedPorts: 0,
                                          availablePorts: 8,
                                          isMaster: false,
                                          masterSplitterId: splitter.id,
                                          location: {
                                            site: splitter.location.site || "",
                                            latitude: splitter.location.latitude ?? 0,
                                            longitude: splitter.location.longitude ?? 0,
                                            description: ""
                                          },
                                          upstreamFiber: {
                                            coreColor: "Blue",
                                            connectedTo: "splitter",
                                            connectionId: splitter.id,
                                            port: ""
                                          },
                                          connectedServiceBoard: undefined,
                                          status: "active",
                                          notes: ""
                                        });
                                        setAvailablePorts([]);
                                        setShowAddSplitterDialog(true);
                                      }}
                                      className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                                      title="Add Slave Splitter"
                                    >
                                      <PlusCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      if (splitter.location.latitude && splitter.location.longitude) {
                                        setMapLocation({
                                          latitude: splitter.location.latitude,
                                          longitude: splitter.location.longitude,
                                          name: splitter.name,
                                          site: splitter.location.site || 'Splitter Location'
                                        })
                                        setShowMapDialog(true)
                                      } else {
                                        toast.error('No location coordinates available for this splitter')
                                      }
                                    }}
                                    className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                    title="View on Map"
                                    disabled={!splitter.location.latitude || !splitter.location.longitude}  // Make sure this uses splitter, not selectedSplitter
                                  >
                                    <MapPin className="h-4 w-4" />
                                  </Button>

                                  {/* Delete Button */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={async () => {
                                      const isConfirmed = await confirm({
                                        title: "Delete Splitter",
                                        message: `Are you sure you want to delete splitter "${splitter.name}" (${splitter.splitterId})? This action cannot be undone.`,
                                        type: "danger",
                                        confirmText: "Delete",
                                        cancelText: "Cancel"
                                      })

                                      if (isConfirmed) {
                                        try {
                                          await apiRequest(`/splitters/${splitter.id}`, {
                                            method: 'DELETE'
                                          })
                                          toast.success("Splitter deleted successfully")
                                          await fetchSplitters(splitterPagination.page, "", oltFilter)
                                        } catch (error: any) {
                                          toast.error(error.message || "Failed to delete splitter")
                                        }
                                      }
                                    }}
                                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                    title="Delete Splitter"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Expanded slave rows under this master */}
                            {splitter.isMaster && expandedMasters.has(splitter.id) && (() => {
                              const slaves = allSplitters.filter(s => s.masterSplitterId === splitter.splitterId);
                              if (slaves.length === 0) return null;
                              return slaves.map(slave => (
                                <TableRow key={`slave-${slave.id}`} className="bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 dark:hover:bg-purple-900/30">
                                  <TableCell>
                                    <div className="flex items-center gap-2 pl-6">
                                      <div className="w-4 h-4 border-l-2 border-b-2 border-purple-300 dark:border-purple-600 rounded-bl-sm" />
                                      <div className="font-medium text-sm">{slave.name}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-mono text-sm">{slave.splitterId}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                                        {slave.splitterType}
                                      </Badge>
                                      <div className="text-xs text-gray-500">Ratio: {slave.splitRatio}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                      Slave
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1 max-w-[150px]">
                                      <div className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
                                        <span>Used: {slave.usedPorts}</span>
                                        <span>Total: {slave.portCount}</span>
                                      </div>
                                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div
                                          className="bg-green-500 h-1.5 rounded-full"
                                          style={{ width: `${(slave.usedPorts / slave.portCount) * 100}%` }}
                                        />
                                      </div>
                                      <div className="text-xs text-gray-500 font-medium">
                                        Available: {slave.availablePorts}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-xs text-purple-600 dark:text-purple-400">
                                      ↑ {splitter.name}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                     <div className="space-y-1">
                                       <div className="text-sm font-medium">
                                         {(() => {
                                           const ultimateOlt = getConnectedOltName(slave, allSplitters);
                                           return ultimateOlt !== "Not connected" ? (
                                             <div className="flex items-center gap-2">
                                               <Server className="h-3 w-3 text-green-500" />
                                               <span>{ultimateOlt}</span>
                                             </div>
                                           ) : (
                                             <span className="text-gray-400">{ultimateOlt}</span>
                                           );
                                         })()}
                                       </div>
                                       {(() => {
                                         const ultimateOlt = getConnectedOltName(slave, allSplitters);
                                         if (ultimateOlt !== "Not connected") {
                                           const rootOltId = findRootOltForSplitter(slave, allSplitters);
                                           const olt = olts.find(o => String(o.id) === String(rootOltId));
                                           return olt?.ipAddress ? (
                                             <div className="text-xs text-gray-500 font-mono">
                                               {olt.ipAddress}
                                             </div>
                                           ) : null;
                                         }
                                         return null;
                                       })()}
                                     </div>
                                   </TableCell>
                                  <TableCell>
                                    <div className="text-sm">{slave.location?.site || '—'}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={slave.status === 'active' ? 'default' : 'secondary'}
                                      className={slave.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}>
                                      {slave.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setSelectedSplitter(slave);
                                          setShowSplitterDetails(true);
                                        }}
                                        className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
                                        title="View Details"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={async () => {
                                          setSelectedSplitter(slave);
                                          const ratioValue = parseInt(slave.splitRatio.split(':')[1]) || 8;

                                          let parentSplitterId = "";
                                          if (slave.masterSplitterId) {
                                            const parent = allSplitters.find(s => s.splitterId === slave.masterSplitterId);
                                            if (parent) {
                                              parentSplitterId = parent.id;
                                            }
                                          }

                                          setSplitterForm({
                                            name: slave.name,
                                            splitterId: slave.splitterId,
                                            splitRatio: slave.splitRatio as any,
                                            splitterType: slave.splitterType as "PLC" | "FBT" | "COUPLER",
                                            portCount: slave.portCount,
                                            usedPorts: slave.usedPorts,
                                            availablePorts: slave.availablePorts,
                                            location: {
                                              site: slave.location?.site || "",
                                              latitude: slave.location?.latitude ?? 0,
                                              longitude: slave.location?.longitude ?? 0,
                                              description: slave.location?.description || ""
                                            },
                                            upstreamFiber: {
                                              coreColor: slave.upstreamFiber?.coreColor || "Blue",
                                              connectedTo: slave.upstreamFiber?.connectedTo || "splitter",
                                              connectionId: slave.upstreamFiber?.connectionId || "",
                                              port: slave.upstreamFiber?.port || ""
                                            },
                                            isMaster: slave.isMaster,
                                            masterSplitterId: parentSplitterId,
                                            connectedServiceBoard: slave.connectedServiceBoard,
                                            status: slave.status,
                                            notes: slave.notes || "",
                                            ratio: ratioValue
                                          });

                                          await fetchAllSplittersForHierarchy();
                                          setAvailablePorts([]);
                                          setShowAddSplitterDialog(true);
                                        }}
                                        className="h-7 w-7 hover:bg-green-50 hover:text-green-600"
                                        title="Edit Splitter"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          if (slave.location?.latitude && slave.location?.longitude) {
                                            setMapLocation({
                                              latitude: slave.location.latitude,
                                              longitude: slave.location.longitude,
                                              name: slave.name,
                                              site: slave.location.site || 'Splitter Location'
                                            })
                                            setShowMapDialog(true)
                                          } else {
                                            toast.error('No location coordinates available for this splitter')
                                          }
                                        }}
                                        className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
                                        title="View on Map"
                                        disabled={!slave.location?.latitude || !slave.location?.longitude}
                                      >
                                        <MapPin className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={async () => {
                                          const isConfirmed = await confirm({
                                            title: "Delete Splitter",
                                            message: `Are you sure you want to delete splitter "${slave.name}" (${slave.splitterId})? This action cannot be undone.`,
                                            type: "danger",
                                            confirmText: "Delete",
                                            cancelText: "Cancel"
                                          })

                                          if (isConfirmed) {
                                            try {
                                              await apiRequest(`/splitters/${slave.id}`, {
                                                method: 'DELETE'
                                              })
                                              toast.success("Splitter deleted successfully")
                                              await fetchSplitters(splitterPagination.page, "", oltFilter)
                                            } catch (error: any) {
                                              toast.error(error.message || "Failed to delete splitter")
                                            }
                                          }
                                        }}
                                        className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                                        title="Delete Splitter"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ));
                            })()}
                            </Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {displayAllSplitters.length > 10 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500">
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, displayAllSplitters.length)} of {displayAllSplitters.length} splitters
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSplitterPage((prev) => Math.max(prev - 1, 1))}
                          disabled={splitterPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Page {splitterPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSplitterPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={splitterPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="details" className="space-y-6">
          {selectedOLT ? (
            <>
              {/* Quick Actions Bar */}
              <Card className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} rounded-xl`}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog("basic", selectedOLT)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Basic Info
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog("ssh", selectedOLT)}
                    >
                      <Terminal className="h-4 w-4 mr-2" />
                      SSH Config
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog("telnet", selectedOLT)}
                    >
                      <Terminal className="h-4 w-4 mr-2" />
                      Telnet
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog("snmp", selectedOLT)}
                    >
                      <Network className="h-4 w-4 mr-2" />
                      SNMP
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog("web", selectedOLT)}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Web Interface
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog("api", selectedOLT)}
                    >
                      <Cpu className="h-4 w-4 mr-2" />
                      API
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog("location", selectedOLT)}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog("service-boards", selectedOLT)}
                    >
                      <HardDrive className="h-4 w-4 mr-2" />
                      Service Boards
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUpdateDialog("advanced", selectedOLT)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Advanced
                    </Button>

                    {/* SSH Testing Button */}
                    <Button
                      variant={sshTestResults[selectedOLT.id]?.success ? "default" : "outline"}
                      size="sm"
                      onClick={() => testSSHConnection(selectedOLT)}
                      disabled={testingSSH[selectedOLT.id]}
                    >
                      {testingSSH[selectedOLT.id] ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Terminal className="h-4 w-4 mr-2" />
                      )}
                      Test Connection
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => connectToTerminal(selectedOLT)}
                    >
                      <Terminal className="h-4 w-4 mr-2" />
                      SSH Terminal
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncONTs(selectedOLT.id)}
                      disabled={syncing[selectedOLT.id]}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncing[selectedOLT.id] ? 'animate-spin' : ''}`} />
                      Sync ONTs
                    </Button>

                    <SearchableSelect
                      options={[
                        { value: "online", label: "Set Online" },
                        { value: "offline", label: "Set Offline" },
                        { value: "maintenance", label: "Set Maintenance" }
                      ]}
                      value=""
                      onValueChange={(value) => handleUpdateStatus(value as "online" | "offline" | "maintenance")}
                      placeholder="Change Status"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* OLT Details Card */}
              <Card className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} rounded-xl overflow-hidden relative`}>
                <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #3B82F6 0%, transparent 70%)` }} />
                <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #3B82F6 0%, transparent 70%)` }} />

                <CardHeader className={`pb-2 ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} border-b relative z-10`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className={isDarkMode ? "text-white" : "text-gray-900"}>{selectedOLT.name}</CardTitle>
                      <CardDescription className={isDarkMode ? "text-slate-400" : "text-gray-500"}>
                        {selectedOLT.model} • {selectedOLT.vendor} • {selectedOLT.ipAddress}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(selectedOLT.status)}>
                      {selectedOLT.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 relative z-10">
                  <Tabs defaultValue="basic">
                    <TabsList className="flex flex-wrap md:grid md:grid-cols-10 h-auto w-full gap-1 p-1 bg-muted">
                      <TabsTrigger value="basic">Basic</TabsTrigger>
                      <TabsTrigger value="networking">Networking</TabsTrigger>
                      <TabsTrigger value="management">Management</TabsTrigger>
                      <TabsTrigger value="hardware">Hardware</TabsTrigger>
                      <TabsTrigger value="location">Location</TabsTrigger>
                      <TabsTrigger value="onts">ONTs</TabsTrigger>
                      <TabsTrigger value="splitters">Splitters</TabsTrigger>
                      <TabsTrigger value="vlans">VLANs</TabsTrigger>
                      <TabsTrigger value="profiles">Profiles</TabsTrigger>
                      <TabsTrigger value="load-files">ONT Files</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6 pt-6">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">IP Address</Label>
                          <p className="font-mono">{selectedOLT.ipAddress}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Vendor</Label>
                          <p>{selectedOLT.vendor}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Model</Label>
                          <p>{selectedOLT.model}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Serial Number</Label>
                          <p className="font-mono">{selectedOLT.serialNumber || 'Not specified'}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Firmware Version</Label>
                          <p>{selectedOLT.firmwareVersion || 'Unknown'}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Last Seen</Label>
                          <p>{formatDate(selectedOLT.lastSeen)}</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-semibold mb-4">Port Statistics</h3>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <p className="text-sm text-gray-500">Total Ports</p>
                            <p className="text-2xl font-bold">{selectedOLT.totalPorts}</p>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <p className="text-sm text-gray-500">Used Ports</p>
                            <p className="text-2xl font-bold text-emerald-600">{selectedOLT.usedPorts}</p>
                          </div>
                          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <p className="text-sm text-gray-500">Available Ports</p>
                            <p className="text-2xl font-bold">{selectedOLT.availablePorts}</p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="networking" className="pt-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">SSH Configuration</h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Host</Label>
                              <p className="font-mono">{selectedOLT.sshConfig?.host || selectedOLT.ipAddress}</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Port</Label>
                              <p>{selectedOLT.sshConfig?.port || 22}</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Username</Label>
                              <p>{selectedOLT.sshConfig?.username || 'admin'}</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Password</Label>
                              <p className="font-mono">••••••••</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Enable Password</Label>
                              <p className="font-mono">••••••••</p>
                            </div>
                          </div>

                          {/* SSH Test Results */}
                          {sshTestResults[selectedOLT.id] && (
                            <div className="mt-4">
                              <Alert className={sshTestResults[selectedOLT.id].success ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <strong>{sshTestResults[selectedOLT.id].success ? "Connection Successful" : "Connection Failed"}</strong>
                                  <p className="mt-1 text-sm">{sshTestResults[selectedOLT.id].message}</p>
                                  {sshTestResults[selectedOLT.id].output && (
                                    <pre className="mt-2 text-xs bg-black/10 dark:bg-white/10 p-2 rounded overflow-auto">
                                      {sshTestResults[selectedOLT.id].output}
                                    </pre>
                                  )}
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Telnet Configuration</h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Status</Label>
                              <Badge variant="outline" className={selectedOLT.telnetConfig?.enabled ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
                                {selectedOLT.telnetConfig?.enabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Port</Label>
                              <p>{selectedOLT.telnetConfig?.port || 23}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="management" className="pt-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">SNMP Configuration</h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Status</Label>
                              <Badge variant="outline" className={selectedOLT.management?.snmpEnabled ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
                                {selectedOLT.management?.snmpEnabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Community</Label>
                              <p>{selectedOLT.management?.snmpCommunity || 'public'}</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Version</Label>
                              <Badge variant="outline">
                                {selectedOLT.management?.snmpVersion || 'v2c'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Web Interface</h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Status</Label>
                              <Badge variant="outline" className={selectedOLT.management?.webInterface ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
                                {selectedOLT.management?.webInterface ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Port</Label>
                              <p>{selectedOLT.management?.webPort || 80}</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">SSL</Label>
                              <Badge variant="outline" className={selectedOLT.management?.webSSL ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
                                {selectedOLT.management?.webSSL ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Status</Label>
                              <Badge variant="outline" className={selectedOLT.management?.apiEnabled ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
                                {selectedOLT.management?.apiEnabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Port</Label>
                              <p>{selectedOLT.management?.apiPort || 8080}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="hardware" className="pt-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">Service Boards</h3>
                          {(!selectedOLT.serviceBoards || selectedOLT.serviceBoards.length === 0) ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                              <PanelTop className="h-12 w-12 mx-auto text-gray-300" />
                              <p className="text-gray-500 mt-2">No service boards configured</p>
                            </div>
                          ) : (
                            <div className="grid gap-4">
                              {selectedOLT.serviceBoards.map((board) => (
                                <div key={board.id || board.slot} className="p-4 border rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-3">
                                        <HardDrive className="h-5 w-5 text-blue-500" />
                                        <h4 className="font-semibold">Slot {board.slot} - {board.type}</h4>
                                        <Badge className={getBoardStatusColor(board.status)}>
                                          {board.status}
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-500">
                                        Ports: {board.usedPorts}/{board.portCount} • Available: {board.availablePorts}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-2xl font-bold text-emerald-600">
                                        {board.portCount > 0 ? Math.round((board.usedPorts / board.portCount) * 100) : 0}%
                                      </div>
                                      <p className="text-xs text-gray-500">Utilization</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-lg font-semibold mb-4">Advanced Features</h3>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Auto Provisioning</Label>
                              <Badge variant="outline" className={selectedOLT.autoProvisioning ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
                                {selectedOLT.autoProvisioning ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Redundancy</Label>
                              <Badge variant="outline" className={selectedOLT.redundancy ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}>
                                {selectedOLT.redundancy ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Power Supply</Label>
                              <p>{selectedOLT.powerSupply} units</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Cooling</Label>
                              <Badge variant="outline" className="capitalize">
                                {selectedOLT.cooling}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Backup Schedule</Label>
                              <Badge variant="outline" className="capitalize">
                                {selectedOLT.backupSchedule || 'none'}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Last Backup</Label>
                              <p>{selectedOLT.lastBackup ? formatDate(selectedOLT.lastBackup) : 'Never'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="location" className="pt-6">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Region</Label>
                          <p>{selectedOLT.location?.region || 'Not specified'}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Site</Label>
                          <p>{selectedOLT.location?.site || 'Not specified'}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Rack</Label>
                          <p>Rack #{selectedOLT.location?.rack || 1}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-500">Position</Label>
                          <p>U{selectedOLT.location?.position || 1}</p>
                        </div>
                        {(selectedOLT.location?.latitude || selectedOLT.location?.longitude) && (
                          <>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Latitude</Label>
                              <p>{selectedOLT.location?.latitude || 'Not specified'}</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm text-gray-500">Longitude</Label>
                              <p>{selectedOLT.location?.longitude || 'Not specified'}</p>
                            </div>
                          </>
                        )}
                      </div>
                      {selectedOLT.location?.notes && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          <Label className="text-sm text-gray-500">Location Notes</Label>
                          <p className="mt-1 whitespace-pre-wrap">{selectedOLT.location.notes}</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="onts" className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">ONT Devices</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => refreshONTList(String(selectedOLT.id))}
                              disabled={refreshing}
                              title="Synchronize ONTs from the OLT and reload the list"
                            >
                              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                              Refresh List
                            </Button>

                            {/* Sync with OLT All - Uses syncing state */}
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => syncONTs(selectedOLT.id)}
                              disabled={syncing[selectedOLT.id]}
                            >
                              <RefreshCcw className={`h-4 w-4 mr-2 ${syncing[selectedOLT.id] ? 'animate-spin' : ''}`} />
                              {syncing[selectedOLT.id] ? 'Syncing...' : 'Sync from OLT'}
                            </Button>

                            {/* Sync Basic ONT Info - Fast - Uses fetchingONTs state */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  setFetchingONTs(prev => ({ ...prev, [selectedOLT.id]: true }));

                                  const response = await apiRequest<{
                                    success: boolean;
                                    message: string;
                                    data: any;
                                  }>(`/olt/${selectedOLT.id}/onts/sync-basic`, {
                                    method: "POST"
                                  });

                                  if (response.success) {
                                    toast.success(response.message || "Basic ONT info synced");
                                    // Refresh the list
                                    await fetchONTs(selectedOLT.id, ontPagination.page, ontSearch, ontStatusFilter);
                                  } else {
                                    toast.error(response.error || "Failed to sync basic ONT info");
                                  }
                                } catch (error: any) {
                                  console.error("Failed to sync basic ONT info:", error);
                                  toast.error(error.message || "Failed to sync basic ONT info");
                                } finally {
                                  setFetchingONTs(prev => ({ ...prev, [selectedOLT.id]: false }));
                                }
                              }}
                              disabled={fetchingONTs[selectedOLT.id]}
                              title="Fetch basic ONT info from OLT (Fast)"
                              className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 hover:text-blue-700 border-blue-500/20"
                            >
                              {fetchingONTs[selectedOLT.id] ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Wifi className="h-4 w-4 mr-2" />
                              )}
                              Fetch ONTs
                            </Button>

                            {/* Sync All Details - Uses syncingAllDetails state */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  setSyncingAllDetails(prev => ({ ...prev, [selectedOLT.id]: true }));

                                  const response = await apiRequest<{
                                    success: boolean;
                                    message: string;
                                    data: any;
                                  }>(`/olt/${selectedOLT.id}/onts/sync-all-details`, {
                                    method: "POST"
                                  });

                                  if (response.success) {
                                    toast.success(response.message || "All ONT details synced");
                                    // Refresh the list
                                    await fetchONTs(selectedOLT.id, ontPagination.page, ontSearch, ontStatusFilter);
                                  } else {
                                    toast.error(response.error || "Failed to sync all ONT details");
                                  }
                                } catch (error: any) {
                                  console.error("Failed to sync all ONT details:", error);
                                  toast.error(error.message || "Failed to sync all ONT details");
                                } finally {
                                  setSyncingAllDetails(prev => ({ ...prev, [selectedOLT.id]: false }));
                                }
                              }}
                              disabled={syncingAllDetails[selectedOLT.id]}
                              title="Fetch detailed info for all ONTs (Slow)"
                              className="bg-green-500/10 text-green-600 hover:bg-green-500/20 hover:text-green-700 border-green-500/20"
                            >
                              {syncingAllDetails[selectedOLT.id] ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Database className="h-4 w-4 mr-2" />
                              )}
                              Sync All Details
                            </Button>
                          </div>
                        </div>

                        {onts.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <Wifi className="h-12 w-12 mx-auto text-gray-300" />
                            <p className="text-gray-500 mt-2">No ONTs found</p>
                            <p className="text-sm text-gray-500">Sync from OLT to get ONT data</p>
                          </div>
                        ) : (
                          <>
                            {/* ONT Table in Details Tab */}
                            <ONTTable
                              onts={onts} // Show first 10 in details tab
                              showActions={true}
                              onRowClick={(ont) => {
                                setSelectedONT(ont)
                                setShowONTDetails(true)
                              }}
                            />

                            {ontPagination.totalPages > 1 && (
                              <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                  Showing {(ontPagination.page - 1) * ontPagination.limit + 1} to {Math.min(ontPagination.page * ontPagination.limit, ontPagination.total)} of {ontPagination.total} ONTs
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => fetchONTs(selectedOLT.id, ontPagination.page - 1, ontSearch, ontStatusFilter)} disabled={!ontPagination.hasPreviousPage}>
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <span className="text-sm">Page {ontPagination.page} of {ontPagination.totalPages}</span>
                                  <Button variant="outline" size="sm" onClick={() => fetchONTs(selectedOLT.id, ontPagination.page + 1, ontSearch, ontStatusFilter)} disabled={!ontPagination.hasNextPage}>
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* ONT Statistics */}
                            <div className="grid grid-cols-4 gap-4 mt-6">
                              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <p className="text-sm text-gray-500">Total ONTs</p>
                                <p className="text-2xl font-bold">{ontPagination.total}</p>
                              </div>
                              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <p className="text-sm text-gray-500">Online</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {(() => {
                                    if (!Array.isArray(onts) || onts.length === 0) return 0;
                                    return onts.filter(o => o.status === 'online').length;
                                  })()}
                                </p>
                              </div>
                              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <p className="text-sm text-gray-500">Offline</p>
                                <p className="text-2xl font-bold text-red-600">
                                  {(() => {
                                    if (!Array.isArray(onts) || onts.length === 0) return 0;
                                    return onts.filter(o => o.status === 'offline').length;
                                  })()}
                                </p>
                              </div>
                              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <p className="text-sm text-gray-500">Avg RX Power</p>
                                <p className="text-2xl font-bold">
                                  {(() => {
                                    if (!Array.isArray(onts) || onts.length === 0) return 'N/A';
                                    const onlineOnts = onts.filter(o => o.status === 'online' && o.rxPower);
                                    if (onlineOnts.length === 0) return 'N/A';
                                    const avg = onlineOnts.reduce((sum, o) => sum + (o.rxPower || 0), 0) / onlineOnts.length;
                                    return avg.toFixed(2) + ' dBm';
                                  })()}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="splitters" className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold">Connected Splitters</h3>
                            <p className="text-sm text-gray-500">
                              Splitters connected to {selectedOLT?.name} directly or through hierarchy
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowAddSplitterDialog(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Splitter
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchSplitters(1, "", selectedOLT?.id)}
                              title="Refresh splitters"
                            >
                              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-1">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search splitters by name, splitterId, or site..."
                                className="pl-10"
                                value={connectedSplitterSearchQuery}
                                onChange={(e) => setConnectedSplitterSearchQuery(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {/* Splitter Type Filter */}
                            <div className="w-40">
                              <SearchableSelect
                                options={[
                                  { value: "all", label: "All Types" },
                                  { value: "master", label: "Master Only" },
                                  { value: "slave", label: "Slave Only" }
                                ]}
                                value={splitterTypeFilter}
                                onValueChange={(value) => {
                                  setSplitterTypeFilter(value)
                                }}
                                placeholder="Filter by type"
                              />
                            </div>

                            <Button
                              variant="outline"
                              onClick={() => {
                                setConnectedSplitterSearchQuery("")
                                setSplitterTypeFilter("all")
                              }}
                              className="flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Clear
                            </Button>
                          </div>
                        </div>

                        {/* Filter splitters connected to this OLT */}
                        {(() => {
                          // Get all splitters connected to this OLT (directly or through hierarchy)
                          const connectedSplitters = allSplitters.filter(splitter => {
                            const rootOltId = findRootOltForSplitter(splitter, allSplitters);
                            return String(rootOltId) === String(selectedOLT?.id);
                          });

                          // Apply search filter
                          const searchedSplitters = connectedSplitters.filter(splitter => {
                            if (!connectedSplitterSearchQuery) return true;
                            const q = connectedSplitterSearchQuery.toLowerCase();
                            const nameMatch = splitter.name?.toLowerCase().includes(q);
                            const idMatch = splitter.splitterId?.toLowerCase().includes(q);
                            const siteMatch = splitter.location?.site?.toLowerCase().includes(q);
                            const notesMatch = splitter.notes?.toLowerCase().includes(q);
                            return nameMatch || idMatch || siteMatch || notesMatch;
                          });

                          // Apply splitter type filter
                          const filteredSplitters = searchedSplitters.filter(splitter => {
                            if (splitterTypeFilter === 'all') return true;
                            if (splitterTypeFilter === 'master') return splitter.isMaster;
                            if (splitterTypeFilter === 'slave') return !splitter.isMaster;
                            return true;
                          });

                          // Exclude child slaves if their parent is also present in the list (to avoid double listing when parent is expanded)
                          const displaySplitters = filteredSplitters.filter(splitter => {
                            if (splitterTypeFilter === 'all' && !splitter.isMaster && splitter.masterSplitterId) {
                              const hasParentInList = filteredSplitters.some(
                                s => s.isMaster && s.splitterId === splitter.masterSplitterId
                              );
                              if (hasParentInList) return false;
                            }
                            return true;
                          });

                          const itemsPerPage = 10;
                          const totalPages = Math.ceil(displaySplitters.length / itemsPerPage);
                          const startIndex = (connectedSplittersPage - 1) * itemsPerPage;
                          const paginatedSplitters = displaySplitters.slice(startIndex, startIndex + itemsPerPage);

                          if (displaySplitters.length === 0) {
                            return (
                              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                <Split className="h-12 w-12 mx-auto text-gray-300" />
                                <p className="text-gray-500 mt-2">No splitters connected to this OLT match your search/filter</p>
                              </div>
                            );
                          }

                          return (
                            <>
                              {/* Stats Summary */}
                              <div className="grid grid-cols-4 gap-3 mb-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                  <p className="text-sm text-gray-500">Total Splitters</p>
                                  <p className="text-xl font-bold">{connectedSplitters.length}</p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                  <p className="text-sm text-gray-500">Master Splitters</p>
                                  <p className="text-xl font-bold text-purple-600">
                                    {connectedSplitters.filter(s => s.isMaster).length}
                                  </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                  <p className="text-sm text-gray-500">Slave Splitters</p>
                                  <p className="text-xl font-bold text-blue-600">
                                    {connectedSplitters.filter(s => !s.isMaster).length}
                                  </p>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                  <p className="text-sm text-gray-500">Direct Connections</p>
                                  <p className="text-xl font-bold text-green-600">
                                    {connectedSplitters.filter(s => {
                                      const directOltId = s.connectedServiceBoard?.oltId || (s as any).oltId || (s as any).olt?.id;
                                      return String(directOltId) === String(selectedOLT?.id);
                                    }).length}
                                  </p>
                                </div>
                              </div>

                              {/* Splitter Table */}
                              <div className="rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Splitter Name</TableHead>
                                      <TableHead>Splitter ID</TableHead>
                                      <TableHead>Type/Ratio</TableHead>
                                      <TableHead>Role</TableHead>
                                      <TableHead>Port Usage</TableHead>
                                      <TableHead>Connected To</TableHead>
                                      <TableHead>Ultimate OLT</TableHead>
                                      <TableHead>Location</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {paginatedSplitters.map((splitter) => {
                                      const connectionDetails = getConnectionDetails(splitter);
                                      const connectionPath = getConnectionPath(splitter, allSplitters);
                                      const ultimateOlt = getConnectedOltName(splitter, allSplitters);

                                      return (
                                        <Fragment key={splitter.id}>
                                        <TableRow className="hover:bg-muted/50">
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              {splitter.isMaster && (splitter.slaveCount ?? 0) > 0 && (
                                                <button
                                                  onClick={() => {
                                                    setExpandedMasters(prev => {
                                                      const next = new Set(prev);
                                                      if (next.has(splitter.id)) {
                                                        next.delete(splitter.id);
                                                      } else {
                                                        next.add(splitter.id);
                                                      }
                                                      return next;
                                                    });
                                                  }}
                                                  className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                  title={expandedMasters.has(splitter.id) ? "Collapse slaves" : `Show ${splitter.slaveCount ?? 0} slave(s)`}
                                                >
                                                  <ChevronDown className={`h-4 w-4 text-purple-500 transition-transform ${expandedMasters.has(splitter.id) ? 'rotate-180' : ''}`} />
                                                </button>
                                              )}
                                              <div className="font-medium">{splitter.name}</div>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="font-mono text-sm">{splitter.splitterId}</div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="space-y-1">
                                              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                {splitter.splitterType}
                                              </Badge>
                                              <div className="text-xs text-gray-500">
                                                Ratio: {splitter.splitRatio}
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            {splitter.isMaster ? (
                                              <div className="space-y-1">
                                                <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                                                  Master
                                                </Badge>
                                                {(splitter.slaveCount ?? 0) > 0 && (
                                                  <div className="text-xs text-gray-500">
                                                    {splitter.slaveCount} slave{splitter.slaveCount !== 1 ? 's' : ''}
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <div className="space-y-1">
                                                <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
                                                  Slave
                                                </Badge>
                                                {splitter.masterSplitterId && (
                                                  <div className="text-xs text-gray-500">
                                                    Parent: {splitter.masterSplitterId}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <div className="space-y-1">
                                              <div className="flex items-center justify-between text-sm">
                                                <span>Used: {splitter.usedPorts}</span>
                                                <span>Total: {splitter.portCount}</span>
                                              </div>
                                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                <div
                                                  className="bg-green-500 h-1.5 rounded-full"
                                                  style={{ width: `${(splitter.usedPorts / splitter.portCount) * 100}%` }}
                                                />
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                Available: {splitter.availablePorts}
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                {splitter.connectedServiceBoard ? (
                                                  <Server className="h-3 w-3 text-green-500" />
                                                ) : splitter.masterSplitterId ? (
                                                  <Split className="h-3 w-3 text-blue-500" />
                                                ) : (
                                                  <XCircle className="h-3 w-3 text-gray-400" />
                                                )}
                                                <span className="text-sm font-medium">{connectionDetails.type}</span>
                                              </div>
                                              <div className="text-xs text-gray-500 truncate" title={connectionDetails.details}>
                                                {connectionDetails.details}
                                              </div>
                                              {connectionPath.length > 2 && (
                                                <div className="text-xs text-gray-400 mt-1 truncate" title={connectionPath.join(' → ')}>
                                                  Path: {connectionPath.slice(0, 3).join(' → ')}
                                                  {connectionPath.length > 3 && '...'}
                                                </div>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="space-y-1">
                                              <div className="text-sm font-medium">
                                                {ultimateOlt !== "Not connected" ? (
                                                  <div className="flex items-center gap-2">
                                                    <Server className="h-3 w-3 text-green-500" />
                                                    <span>{ultimateOlt}</span>
                                                  </div>
                                                ) : (
                                                  <span className="text-gray-400">{ultimateOlt}</span>
                                                )}
                                              </div>
                                              {/* Show OLT IP if available */}
                                              {ultimateOlt !== "Not connected" && (
                                                (() => {
                                                  const rootOltId = findRootOltForSplitter(splitter, allSplitters);
                                                  const olt = olts.find(o => String(o.id) === String(rootOltId));
                                                  return olt?.ipAddress ? (
                                                    <div className="text-xs text-gray-500 font-mono">
                                                      {olt.ipAddress}
                                                    </div>
                                                  ) : null;
                                                })()
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="text-sm">
                                              {splitter.location.site || "No site"}
                                            </div>
                                            {(splitter.location.latitude || splitter.location.longitude) && (
                                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <MapPin className="h-3 w-3" />
                                                <span>
                                                  {splitter.location.latitude?.toFixed(4)}, {splitter.location.longitude?.toFixed(4)}
                                                </span>
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            <Badge className={getSplitterStatusColor(splitter.status)}>
                                              {splitter.status}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                              {/* View Button */}
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                  setSelectedSplitter(splitter);
                                                  setShowSplitterDetails(true);
                                                }}
                                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                                title="View Details"
                                              >
                                                <Eye className="h-4 w-4" />
                                              </Button>

                                              {/* Edit Button */}
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={async () => {
                                                  setSelectedSplitter(splitter);
                                                  const ratioValue = parseInt(splitter.splitRatio.split(':')[1]) || 8;

                                                  let parentSplitterId = "";
                                                  if (splitter.masterSplitterId) {
                                                    const parent = allSplitters.find(s => s.splitterId === splitter.masterSplitterId);
                                                    if (parent) {
                                                      parentSplitterId = parent.id;
                                                    }
                                                  }

                                                  setSplitterForm({
                                                    name: splitter.name,
                                                    splitterId: splitter.splitterId,
                                                    splitRatio: splitter.splitRatio as any,
                                                    splitterType: splitter.splitterType as "PLC" | "FBT" | "COUPLER",
                                                    portCount: splitter.portCount,
                                                    usedPorts: splitter.usedPorts,
                                                    availablePorts: splitter.availablePorts,
                                                   location: {
                                          site: splitter.location.site || "",
                                          latitude: splitter.location.latitude ?? 0,
                                          longitude: splitter.location.longitude ?? 0,
                                          description: splitter.location.description || ""
                                        },
                                                   upstreamFiber: {
                                          coreColor: splitter.upstreamFiber.coreColor,
                                          connectedTo: splitter.upstreamFiber.connectedTo,
                                          connectionId: splitter.upstreamFiber.connectionId || "",
                                          port: splitter.upstreamFiber.port || ""
                                        },
                                                    isMaster: splitter.isMaster,
                                                    masterSplitterId: parentSplitterId,
                                                    connectedServiceBoard: splitter.connectedServiceBoard,
                                                    status: splitter.status,
                                                    notes: splitter.notes || "",
                                                    ratio: ratioValue
                                                  });

                                                  await fetchAllSplittersForHierarchy();

                                                  if (splitter.isMaster && splitter.connectedServiceBoard?.oltId) {
                                                    await fetchAvailablePorts(splitter.connectedServiceBoard.oltId);
                                                  } else {
                                                    setAvailablePorts([]);
                                                  }

                                                  setShowAddSplitterDialog(true);
                                                }}
                                                className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                                                title="Edit Splitter"
                                              >
                                                <Edit2 className="h-4 w-4" />
                                              </Button>

                                              {/* Add Slave Button (Only for Master splitters) */}
                                              {splitter.isMaster && (
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={async () => {
                                                    setSelectedSplitter(null);
                                                    await fetchAllSplittersForHierarchy();
                                                    setSplitterForm({
                                                      name: "",
                                                      splitterId: "",
                                                      splitRatio: "1:8",
                                                      ratio: 8,
                                                      splitterType: "PLC",
                                                      portCount: 8,
                                                      usedPorts: 0,
                                                      availablePorts: 8,
                                                      isMaster: false,
                                                      masterSplitterId: splitter.id,
                                                      location: {
                                                        site: splitter.location.site || "",
                                                        latitude: splitter.location.latitude ?? 0,
                                                        longitude: splitter.location.longitude ?? 0,
                                                        description: ""
                                                      },
                                                      upstreamFiber: {
                                                        coreColor: "Blue",
                                                        connectedTo: "splitter",
                                                        connectionId: splitter.id,
                                                        port: ""
                                                      },
                                                      connectedServiceBoard: undefined,
                                                      status: "active",
                                                      notes: ""
                                                    });
                                                    setAvailablePorts([]);
                                                    setShowAddSplitterDialog(true);
                                                  }}
                                                  className="h-8 w-8 hover:bg-purple-50 hover:text-purple-600"
                                                  title="Add Slave Splitter"
                                                >
                                                  <PlusCircle className="h-4 w-4" />
                                                </Button>
                                              )}

                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                  if (splitter.location.latitude && splitter.location.longitude) {
                                                    setMapLocation({
                                                      latitude: splitter.location.latitude,
                                                      longitude: splitter.location.longitude,
                                                      name: splitter.name,
                                                      site: splitter.location.site || 'Splitter Location'
                                                    })
                                                    setShowMapDialog(true)
                                                  } else {
                                                    toast.error('No location coordinates available for this splitter')
                                                  }
                                                }}
                                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                                                title="View on Map"
                                                disabled={!splitter.location.latitude || !splitter.location.longitude}
                                              >
                                                <MapPin className="h-4 w-4" />
                                              </Button>

                                              {/* Delete Button */}
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={async () => {
                                                  const isConfirmed = await confirm({
                                                    title: "Delete Splitter",
                                                    message: `Are you sure you want to delete splitter "${splitter.name}" (${splitter.splitterId})? This action cannot be undone.`,
                                                    type: "danger",
                                                    confirmText: "Delete",
                                                    cancelText: "Cancel"
                                                  })

                                                  if (isConfirmed) {
                                                    try {
                                                      await apiRequest(`/splitters/${splitter.id}`, {
                                                        method: 'DELETE'
                                                      })
                                                      toast.success("Splitter deleted successfully")
                                                      await fetchSplitters(splitterPagination.page, "", oltFilter)
                                                    } catch (error: any) {
                                                      toast.error(error.message || "Failed to delete splitter")
                                                    }
                                                  }
                                                }}
                                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                                title="Delete Splitter"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>

                                        {/* Expanded slave rows under this master */}
                                        {splitter.isMaster && expandedMasters.has(splitter.id) && (() => {
                                          const slaves = allSplitters.filter(s => s.masterSplitterId === splitter.splitterId);
                                          if (slaves.length === 0) return null;
                                          return slaves.map(slave => (
                                            <TableRow key={`slave-${slave.id}`} className="bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 dark:hover:bg-purple-900/30">
                                              <TableCell>
                                                <div className="flex items-center gap-2 pl-6">
                                                  <div className="w-4 h-4 border-l-2 border-b-2 border-purple-300 dark:border-purple-600 rounded-bl-sm" />
                                                  <div className="font-medium text-sm">{slave.name}</div>
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="font-mono text-sm">{slave.splitterId}</div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="space-y-1">
                                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">
                                                    {slave.splitterType}
                                                  </Badge>
                                                  <div className="text-xs text-gray-500">Ratio: {slave.splitRatio}</div>
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                  Slave
                                                </Badge>
                                              </TableCell>
                                              <TableCell>
                                                <div className="space-y-1 max-w-[150px]">
                                                  <div className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
                                                    <span>Used: {slave.usedPorts}</span>
                                                    <span>Total: {slave.portCount}</span>
                                                  </div>
                                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                    <div
                                                      className="bg-green-500 h-1.5 rounded-full"
                                                      style={{ width: `${(slave.usedPorts / slave.portCount) * 100}%` }}
                                                    />
                                                  </div>
                                                  <div className="text-xs text-gray-500 font-medium">
                                                    Available: {slave.availablePorts}
                                                  </div>
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="text-xs text-purple-600 dark:text-purple-400">
                                                  ↑ {splitter.name}
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="space-y-1">
                                                  <div className="text-sm font-medium">
                                                    {(() => {
                                                      const ultimateOlt = getConnectedOltName(slave, allSplitters);
                                                      return ultimateOlt !== "Not connected" ? (
                                                        <div className="flex items-center gap-2">
                                                          <Server className="h-3 w-3 text-green-500" />
                                                          <span>{ultimateOlt}</span>
                                                        </div>
                                                      ) : (
                                                        <span className="text-gray-400">{ultimateOlt}</span>
                                                      );
                                                    })()}
                                                  </div>
                                                  {(() => {
                                                    const ultimateOlt = getConnectedOltName(slave, allSplitters);
                                                    if (ultimateOlt !== "Not connected") {
                                                      const rootOltId = findRootOltForSplitter(slave, allSplitters);
                                                      const olt = olts.find(o => String(o.id) === String(rootOltId));
                                                      return olt?.ipAddress ? (
                                                        <div className="text-xs text-gray-500 font-mono">
                                                          {olt.ipAddress}
                                                        </div>
                                                      ) : null;
                                                    }
                                                    return null;
                                                  })()}
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="text-sm">{slave.location?.site || '—'}</div>
                                              </TableCell>
                                              <TableCell>
                                                <Badge variant={slave.status === 'active' ? 'default' : 'secondary'}
                                                  className={slave.status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}>
                                                  {slave.status}
                                                </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                      setSelectedSplitter(slave);
                                                      setShowSplitterDetails(true);
                                                    }}
                                                    className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
                                                    title="View Details"
                                                  >
                                                    <Eye className="h-3.5 w-3.5" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={async () => {
                                                      setSelectedSplitter(slave);
                                                      const ratioValue = parseInt(slave.splitRatio.split(':')[1]) || 8;

                                                      let parentSplitterId = "";
                                                      if (slave.masterSplitterId) {
                                                        const parent = allSplitters.find(s => s.splitterId === slave.masterSplitterId);
                                                        if (parent) {
                                                          parentSplitterId = parent.id;
                                                        }
                                                      }

                                                      setSplitterForm({
                                                        name: slave.name,
                                                        splitterId: slave.splitterId,
                                                        splitRatio: slave.splitRatio as any,
                                                        splitterType: slave.splitterType as "PLC" | "FBT" | "COUPLER",
                                                        portCount: slave.portCount,
                                                        usedPorts: slave.usedPorts,
                                                        availablePorts: slave.availablePorts,
                                                        location: {
                                                          site: slave.location?.site || "",
                                                          latitude: slave.location?.latitude ?? 0,
                                                          longitude: slave.location?.longitude ?? 0,
                                                          description: slave.location?.description || ""
                                                        },
                                                        upstreamFiber: {
                                                          coreColor: slave.upstreamFiber?.coreColor || "Blue",
                                                          connectedTo: slave.upstreamFiber?.connectedTo || "splitter",
                                                          connectionId: slave.upstreamFiber?.connectionId || "",
                                                          port: slave.upstreamFiber?.port || ""
                                                        },
                                                        isMaster: slave.isMaster,
                                                        masterSplitterId: parentSplitterId,
                                                        connectedServiceBoard: slave.connectedServiceBoard,
                                                        status: slave.status,
                                                        notes: slave.notes || "",
                                                        ratio: ratioValue
                                                      });

                                                      await fetchAllSplittersForHierarchy();
                                                      setAvailablePorts([]);
                                                      setShowAddSplitterDialog(true);
                                                    }}
                                                    className="h-7 w-7 hover:bg-green-50 hover:text-green-600"
                                                    title="Edit Splitter"
                                                  >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                      if (slave.location?.latitude && slave.location?.longitude) {
                                                        setMapLocation({
                                                          latitude: slave.location.latitude,
                                                          longitude: slave.location.longitude,
                                                          name: slave.name,
                                                          site: slave.location.site || 'Splitter Location'
                                                        })
                                                        setShowMapDialog(true)
                                                      } else {
                                                        toast.error('No location coordinates available for this splitter')
                                                      }
                                                    }}
                                                    className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600"
                                                    title="View on Map"
                                                    disabled={!slave.location?.latitude || !slave.location?.longitude}
                                                  >
                                                    <MapPin className="h-3.5 w-3.5" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={async () => {
                                                      const isConfirmed = await confirm({
                                                        title: "Delete Splitter",
                                                        message: `Are you sure you want to delete splitter "${slave.name}" (${slave.splitterId})? This action cannot be undone.`,
                                                        type: "danger",
                                                        confirmText: "Delete",
                                                        cancelText: "Cancel"
                                                      })

                                                      if (isConfirmed) {
                                                        try {
                                                          await apiRequest(`/splitters/${slave.id}`, {
                                                            method: 'DELETE'
                                                          })
                                                          toast.success("Splitter deleted successfully")
                                                          await fetchSplitters(splitterPagination.page, "", oltFilter)
                                                        } catch (error: any) {
                                                          toast.error(error.message || "Failed to delete splitter")
                                                        }
                                                      }
                                                    }}
                                                    className="h-7 w-7 hover:bg-red-50 hover:text-red-600"
                                                    title="Delete Splitter"
                                                  >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                  </Button>
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          ));
                                        })()}
                                        </Fragment>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>

                              {/* Pagination */}
                              {displaySplitters.length > 10 && (
                                <div className="flex items-center justify-between mt-6">
                                  <div className="text-sm text-gray-500">
                                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, displaySplitters.length)} of {displaySplitters.length} splitters
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setConnectedSplittersPage((prev) => Math.max(prev - 1, 1))}
                                      disabled={connectedSplittersPage === 1}
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm">
                                      Page {connectedSplittersPage} of {totalPages}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setConnectedSplittersPage((prev) => Math.min(prev + 1, totalPages))}
                                      disabled={connectedSplittersPage === totalPages}
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </TabsContent>
                    <TabsContent value="vlans" className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold">VLAN Configuration</h3>
                            <p className="text-sm text-gray-500">
                              Configure VLANs and assign them to service ports
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedVLAN(null);
                              setShowVLANDialog(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add VLAN
                          </Button>
                        </div>

                        {/* VLANs Table */}
                        {vlans.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <Layers className="h-12 w-12 mx-auto text-gray-300" />
                            <p className="text-gray-500 mt-2">No VLANs configured</p>
                            <p className="text-sm text-gray-500">Click "Add VLAN" to configure VLANs</p>
                          </div>
                        ) : (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>VLAN ID</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>GEM Index</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Priority</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {vlans.map((vlan: any) => (
                                  <TableRow key={vlan.id}>
                                    <TableCell className="font-mono">VLAN {vlan.vlanId}</TableCell>
                                    <TableCell>{vlan.name}</TableCell>
                                    <TableCell>{vlan.gemIndex}</TableCell>
                                    <TableCell className="max-w-xs truncate">{vlan.description || '-'}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                        {vlan.type || 'Standard'}
                                      </Badge>
                                    </TableCell>

                                    <TableCell>
                                      <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                                        {vlan.priority || 0}
                                      </Badge>
                                    </TableCell>

                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            setSelectedVLAN(vlan);
                                            setShowVLANDialog(true);
                                          }}
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={async () => {
                                            const isConfirmed = await confirm({
                                              title: "Delete VLAN",
                                              message: `Are you sure you want to delete VLAN ${vlan.vlanId}?`,
                                              type: "danger",
                                              confirmText: "Delete",
                                              cancelText: "Cancel"
                                            })

                                            if (isConfirmed) {
                                              await deleteVLAN(vlan.id);
                                            }
                                          }}
                                          className="hover:bg-red-50 hover:text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {/* VLAN Statistics */}
                        <div className="grid grid-cols-4 gap-4 mt-6">
                          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <p className="text-sm text-gray-500">Total VLANs</p>
                            <p className="text-xl font-bold">{vlans.length}</p>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <p className="text-sm text-gray-500">Active</p>
                            <p className="text-xl font-bold text-green-600">
                              {vlans.filter((v: any) => v.status === 'active').length}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <p className="text-sm text-gray-500">Standard</p>
                            <p className="text-xl font-bold text-blue-600">
                              {vlans.filter((v: any) => v.type === 'standard' || !v.type).length}
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <p className="text-sm text-gray-500">Voice</p>
                            <p className="text-xl font-bold text-purple-600">
                              {vlans.filter((v: any) => v.type === 'voice').length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="load-files" className="pt-6">
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-lg font-semibold">ONT Configuration Files</h3>
                          <p className="text-sm text-gray-500">Store TFTP sources and transfer configuration files to this OLT.</p>
                        </div>
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                          <div className="space-y-1"><Label>TFTP server IP</Label><Input placeholder="10.10.100.6" value={loadFileForm.tftpHost} onChange={e => setLoadFileForm(v => ({ ...v, tftpHost: e.target.value }))} /></div>
                          <div className="space-y-1"><Label>Filename</Label><Input placeholder="NokiaFinal.bin" value={loadFileForm.filename} onChange={e => setLoadFileForm(v => ({ ...v, filename: e.target.value }))} /></div>
                          <Button className="self-end" onClick={addLoadFile}><Plus className="mr-2 h-4 w-4" />Add file</Button>
                        </div>
                        {loadFiles.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">No ONT load files configured.</div> : (
                          <Table><TableHeader><TableRow><TableHead>TFTP server</TableHead><TableHead>Filename</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>{loadFiles.map(file => <TableRow key={file.id}><TableCell className="font-mono">{file.tftpHost}</TableCell><TableCell className="font-mono">{file.filename}</TableCell><TableCell><div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" disabled={loadingFileId === file.id} onClick={() => transferLoadFile(file)}>{loadingFileId === file.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}Load to OLT</Button>
                              <Button size="icon" variant="ghost" onClick={() => removeLoadFile(file.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div></TableCell></TableRow>)}</TableBody></Table>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="profiles" className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold">Profile Configuration</h3>
                            <p className="text-sm text-gray-500">
                              Configure Line and Service Profiles
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedProfile({ type: 'line' });
                                setShowProfileDialog(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Line Profile
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedProfile({ type: 'service' });
                                setShowProfileDialog(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Service Profile
                            </Button>
                          </div>
                        </div>

                        {/* Tabs for Line and Service Profiles */}
                        <Tabs defaultValue="line" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="line">Line Profiles</TabsTrigger>
                            <TabsTrigger value="service">Service Profiles</TabsTrigger>
                          </TabsList>

                          <TabsContent value="line" className="space-y-4 pt-4">
                            {(() => {
                              const lineProfiles = profiles.filter((p: any) => p.type === 'line');
                              return lineProfiles.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                  <Settings2 className="h-12 w-12 mx-auto text-gray-300" />
                                  <p className="text-gray-500 mt-2">No Line Profiles configured</p>
                                  <p className="text-sm text-gray-500">Click "Add Line Profile" to get started</p>
                                </div>
                              ) : (
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Profile ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Bandwidth</TableHead>
                                        <TableHead>Assigned ONTs</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {lineProfiles.map((profile: any) => (
                                        <TableRow key={profile.id}>
                                          <TableCell className="font-mono">{profile.profileId}</TableCell>
                                          <TableCell className="font-medium">{profile.name}</TableCell>
                                          <TableCell>{profile.description || '-'}</TableCell>
                                          <TableCell>
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <Upload className="h-3 w-3 text-blue-500" />
                                                <span className="text-xs">{profile.upstreamBandwidth || 'N/A'}</span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <Download className="h-3 w-3 text-green-500" />
                                                <span className="text-xs">{profile.downstreamBandwidth || 'N/A'}</span>
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell>{profile.assignedOnts?.length || 0}</TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                  setSelectedProfile(profile);
                                                  setShowProfileDialog(true);
                                                }}
                                              >
                                                <Edit2 className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={async () => {
                                                  const isConfirmed = await confirm({
                                                    title: "Delete Profile",
                                                    message: `Are you sure you want to delete profile "${profile.name}"?`,
                                                    type: "danger",
                                                    confirmText: "Delete",
                                                    cancelText: "Cancel"
                                                  })

                                                  if (isConfirmed) {
                                                    await deleteProfile(profile.id);
                                                  }
                                                }}
                                                className="hover:bg-red-50 hover:text-red-600"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              );
                            })()}
                          </TabsContent>

                          <TabsContent value="service" className="space-y-4 pt-4">
                            {(() => {
                              const serviceProfiles = profiles.filter((p: any) => p.type === 'service');
                              return serviceProfiles.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                  <Settings2 className="h-12 w-12 mx-auto text-gray-300" />
                                  <p className="text-gray-500 mt-2">No Service Profiles configured</p>
                                  <p className="text-sm text-gray-500">Click "Add Service Profile" to get started</p>
                                </div>
                              ) : (
                                <div className="rounded-md border">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Profile ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Services</TableHead>
                                        <TableHead>VLANs</TableHead>
                                        <TableHead>Assigned ONTs</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {serviceProfiles.map((profile: any) => (
                                        <TableRow key={profile.id}>
                                          <TableCell className="font-mono">{profile.profileId}</TableCell>
                                          <TableCell className="font-medium">{profile.name}</TableCell>
                                          <TableCell>{profile.description || '-'}</TableCell>
                                          <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                              {profile.services?.slice(0, 3).map((service: string, idx: number) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                  {service}
                                                </Badge>
                                              ))}
                                              {profile.services?.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                  +{profile.services.length - 3} more
                                                </Badge>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                              {profile.vlans?.slice(0, 3).map((vlan: string, idx: number) => (
                                                <Badge key={idx} variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                  VLAN {vlan}
                                                </Badge>
                                              ))}
                                              {profile.vlans?.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                  +{profile.vlans.length - 3} more
                                                </Badge>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell>{profile.assignedOnts?.length || 0}</TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                  setSelectedProfile(profile);
                                                  setShowProfileDialog(true);
                                                }}
                                              >
                                                <Edit2 className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={async () => {
                                                  const isConfirmed = await confirm({
                                                    title: "Delete Profile",
                                                    message: `Are you sure you want to delete profile "${profile.name}"?`,
                                                    type: "danger",
                                                    confirmText: "Delete",
                                                    cancelText: "Cancel"
                                                  })

                                                  if (isConfirmed) {
                                                    await deleteProfile(profile.id);
                                                  }
                                                }}
                                                className="hover:bg-red-50 hover:text-red-600"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              );
                            })()}
                          </TabsContent>
                        </Tabs>
                      </div>
                    </TabsContent>




                  </Tabs>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className={`${isDarkMode ? "bg-[#0f172a]" : "bg-white"} ${isDarkMode ? "border-[#1e293b]" : "border-gray-200"} rounded-xl overflow-hidden relative`}>
              <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #3B82F6 0%, transparent 70%)` }} />
              <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-20" style={{ background: `radial-gradient(circle, #3B82F6 0%, transparent 70%)` }} />

              <CardContent className="pt-6 relative z-10">
                <div className="text-center py-8 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Server className="h-8 w-8 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Select an OLT</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Select an OLT from the list to view its details
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="analytics" className="olt-tab-panel olt-analytics-panel space-y-6">
          <OLTModernAnalytics olts={olts} />
        </TabsContent>
      </Tabs>

      {/* SSH Test Result Dialog */}
      <Dialog open={showSSHTestDialog} onOpenChange={setShowSSHTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test Connection  Results</DialogTitle>
            <DialogDescription>
              Test connection  results for {selectedOLT?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedOLT && sshTestResults[selectedOLT.id] && (
            <div className="space-y-4">
              <Alert className={sshTestResults[selectedOLT.id].success ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}>
                <div className="flex items-center gap-2">
                  {sshTestResults[selectedOLT.id].success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <AlertDescription>
                    <strong>{sshTestResults[selectedOLT.id].success ? "Connection Successful" : "Connection Failed"}</strong>
                    <p className="mt-1">{sshTestResults[selectedOLT.id].message}</p>
                  </AlertDescription>
                </div>
              </Alert>

              {sshTestResults[selectedOLT.id].output && (
                <div className="space-y-2">
                  <Label>Command Output</Label>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-[300px]">
                    {sshTestResults[selectedOLT.id].output}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowSSHTestDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      <Dialog open={showVLANDialog} onOpenChange={setShowVLANDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedVLAN ? 'Edit VLAN' : 'Add New VLAN'}</DialogTitle>
            <DialogDescription>
              {selectedVLAN ? 'Update VLAN configuration' : 'Configure a new VLAN'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vlan-id">VLAN ID *</Label>
                <Input
                  id="vlan-id"
                  type="number"
                  min="1"
                  max="4094"
                  value={vlanForm.vlanId}
                  onChange={(e) => setVlanForm({ ...vlanForm, vlanId: e.target.value })}
                  placeholder="100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vlan-name">VLAN Name *</Label>
                <Input
                  id="vlan-name"
                  value={vlanForm.name}
                  onChange={(e) => setVlanForm({ ...vlanForm, name: e.target.value })}
                  placeholder="Data_VLAN"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gem-index">GEM Index *</Label>
                <Input
                  id="gem-index"
                  type="number"
                  min="0"
                  value={vlanForm.gemIndex}
                  onChange={(e) => setVlanForm({ ...vlanForm, gemIndex: parseInt(e.target.value) || 0 })}
                  placeholder="1000"
                  required
                />
                <p className="text-xs text-gray-500">Unique GEM port index for this VLAN</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vlan-type">VLAN Type</Label>
                <SearchableSelect
                  options={[
                    { value: 'standard', label: 'Standard' },
                    { value: 'voice', label: 'Voice' },
                    { value: 'management', label: 'Management' },
                    { value: 'data', label: 'Data' },
                    { value: 'iptv', label: 'IPTV' }
                  ]}
                  value={vlanForm.type}
                  onValueChange={(value) => setVlanForm({ ...vlanForm, type: value as any })}
                  placeholder="Select VLAN type"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vlan-description">Description</Label>
              <Textarea
                id="vlan-description"
                value={vlanForm.description}
                onChange={(e) => setVlanForm({ ...vlanForm, description: e.target.value })}
                placeholder="Enter VLAN description..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex justify-between items-center w-full">
              <div className="text-sm text-gray-500">
                {selectedPorts.length > 0 && `Selected ${selectedPorts.length} port(s)`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowVLANDialog(false);
                    setSelectedVLAN(null);
                    setVlanForm({
                      vlanId: '',
                      name: '',
                      description: '',
                      type: 'standard',
                      gemIndex: 0
                    });
                    setSelectedPorts([]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={async () => {
                  if (!vlanForm.vlanId || !vlanForm.name || vlanForm.gemIndex === undefined) {
                    toast.error('VLAN ID, Name, and GEM Index are required');
                    return;
                  }

                  try {
                    let result;
                    const vlanData = {
                      ...vlanForm,
                      portIds: selectedPorts // Send selected port IDs
                    };

                    if (selectedVLAN) {
                      result = await updateVLAN(selectedVLAN.id, vlanData);
                    } else {
                      result = await createVLAN(vlanData);
                    }

                    if (result) {
                      setShowVLANDialog(false);
                      setSelectedVLAN(null);
                      setVlanForm({
                        vlanId: '',
                        name: '',
                        description: '',
                        type: 'standard',
                        gemIndex: 0
                      });
                      setSelectedPorts([]);
                      toast.success(`VLAN ${selectedVLAN ? 'updated' : 'created'} successfully`);
                      fetchVLANs();
                    }
                  } catch (error: any) {
                    toast.error(error.message || `Failed to ${selectedVLAN ? 'update' : 'create'} VLAN`);
                  }
                }}>
                  <Save className="h-4 w-4 mr-2" />
                  {selectedVLAN ? 'Update VLAN' : 'Create VLAN'}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProfile?.id ? 'Edit Profile' : `Add New ${profileForm.type === 'line' ? 'Line' : 'Service'} Profile`}
            </DialogTitle>
            <DialogDescription>
              {selectedProfile?.id ? 'Update profile configuration' : `Configure a new ${profileForm.type === 'line' ? 'line' : 'service'} profile`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-id">Profile ID *</Label>
                <Input
                  id="profile-id"
                  value={profileForm.profileId}
                  onChange={(e) => setProfileForm({ ...profileForm, profileId: e.target.value })}
                  placeholder="PROFILE_001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-name">Profile Name *</Label>
                <Input
                  id="profile-name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="High_Speed_Profile"
                  required
                />
              </div>
              {profileForm.type === 'line' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="upstream-bandwidth">Upstream Bandwidth</Label>
                    <Input
                      id="upstream-bandwidth"
                      value={profileForm.upstreamBandwidth}
                      onChange={(e) => setProfileForm({ ...profileForm, upstreamBandwidth: e.target.value })}
                      placeholder="e.g., 100M"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="downstream-bandwidth">Downstream Bandwidth</Label>
                    <Input
                      id="downstream-bandwidth"
                      value={profileForm.downstreamBandwidth}
                      onChange={(e) => setProfileForm({ ...profileForm, downstreamBandwidth: e.target.value })}
                      placeholder="e.g., 1G"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-description">Description</Label>
              <Textarea
                id="profile-description"
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                placeholder="Enter profile description..."
                rows={2}
              />
            </div>

            {profileForm.type === 'service' && (
              <>
                <div className="space-y-2">
                  <Label>Services</Label>
                  <div className="flex flex-wrap gap-2">
                    {['internet', 'voice', 'iptv', 'management'].map((service) => (
                      <Badge
                        key={service}
                        variant={profileForm.services.includes(service) ? "default" : "outline"}
                        className="cursor-pointer capitalize"
                        onClick={() => {
                          const newServices = profileForm.services.includes(service)
                            ? profileForm.services.filter(s => s !== service)
                            : [...profileForm.services, service];
                          setProfileForm({ ...profileForm, services: newServices });
                        }}
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-vlans">VLANs (comma-separated)</Label>
                  <Input
                    id="profile-vlans"
                    value={profileForm.vlans.join(', ')}
                    onChange={(e) => setProfileForm({
                      ...profileForm,
                      vlans: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                    })}
                    placeholder="e.g., 100, 101, 102"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowProfileDialog(false);
                setSelectedProfile(null);
                setProfileForm({
                  profileId: '',
                  name: '',
                  description: '',
                  type: 'line',
                  upstreamBandwidth: '',
                  downstreamBandwidth: '',
                  services: [],
                  vlans: [],
                  assignedOnts: []
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!profileForm.profileId || !profileForm.name) {
                toast.error('Profile ID and Name are required');
                return;
              }

              try {
                let result;
                if (selectedProfile?.id) {
                  result = await updateProfile(selectedProfile.id, profileForm);
                } else {
                  result = await createProfile(profileForm);
                }

                if (result) {
                  setShowProfileDialog(false);
                  setSelectedProfile(null);
                  setProfileForm({
                    profileId: '',
                    name: '',
                    description: '',
                    type: 'line',
                    upstreamBandwidth: '',
                    downstreamBandwidth: '',
                    services: [],
                    vlans: [],
                    assignedOnts: []
                  });
                  toast.success(`Profile ${selectedProfile?.id ? 'updated' : 'created'} successfully`);
                  fetchProfiles();
                }
              } catch (error: any) {
                toast.error(error.message || `Failed to ${selectedProfile?.id ? 'update' : 'create'} profile`);
              }
            }}>
              <Save className="h-4 w-4 mr-2" />
              {selectedProfile?.id ? 'Update Profile' : 'Create Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Google Map Dialog - Alternative without API key */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Location Map - {mapLocation?.name}
            </DialogTitle>
            <DialogDescription>
              {mapLocation?.site || 'Splitter Location'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col p-6 pt-0 gap-4 overflow-hidden">
            {/* Map Preview - Takes majority of space */}
            <div className="flex-1 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 shadow-lg">
              {mapLocation && (
                <div className="h-full w-full relative">
                  {/* Google Maps iframe without API key */}
                  <iframe
                    src={`https://maps.google.com/maps?q=${mapLocation.latitude},${mapLocation.longitude}&z=15&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map for ${mapLocation.name}`}
                    className="absolute inset-0"
                  />

                  {/* Map overlay with coordinates */}
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="font-semibold text-sm">{mapLocation.name}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <div className="font-mono bg-gray-100 dark:bg-gray-800 p-1.5 rounded">
                        {mapLocation.latitude.toFixed(6)}, {mapLocation.longitude.toFixed(6)}
                      </div>
                      {mapLocation.site && (
                        <div className="truncate">
                          📍 {mapLocation.site}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Information and Actions Panel */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column - Location Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Location Details
                  </h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name:</span>
                      <span className="font-medium">{mapLocation?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Site:</span>
                      <span>{mapLocation?.site || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Latitude:</span>
                      <span className="font-mono text-xs">{mapLocation?.latitude?.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Longitude:</span>
                      <span className="font-mono text-xs">{mapLocation?.longitude?.toFixed(6)}</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-2 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (mapLocation) {
                          navigator.clipboard.writeText(`${mapLocation.latitude}, ${mapLocation.longitude}`)
                          toast.success('Coordinates copied to clipboard')
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Coordinates
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (mapLocation) {
                          const text = `${mapLocation.name}\n${mapLocation.site || ''}\nCoordinates: ${mapLocation.latitude}, ${mapLocation.longitude}\nGoogle Maps: https://maps.google.com/?q=${mapLocation.latitude},${mapLocation.longitude}`
                          navigator.clipboard.writeText(text)
                          toast.success('All details copied to clipboard')
                        }
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Copy All Details
                    </Button>
                  </div>
                </div>

                {/* Right Column - Navigation Actions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-green-500" />
                    Navigation Options
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (mapLocation) {
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${mapLocation.latitude},${mapLocation.longitude}`,
                            '_blank'
                          )
                        }
                      }}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Google Maps
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        if (mapLocation) {
                          window.open(
                            `https://www.openstreetmap.org/?mlat=${mapLocation.latitude}&mlon=${mapLocation.longitude}&zoom=15&layers=H`,
                            '_blank'
                          )
                        }
                      }}
                    >
                      <Map className="h-4 w-4 mr-2" />
                      OpenStreetMap
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full col-span-2"
                      onClick={() => {
                        if (mapLocation) {
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${mapLocation.latitude},${mapLocation.longitude}&travelmode=driving`,
                            '_blank'
                          )
                        }
                      }}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                  </div>

                  {/* Alternative Maps */}
                  <div className="pt-2">
                    <h5 className="text-xs font-medium text-gray-500 mb-2">Alternative Map Services</h5>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          if (mapLocation) {
                            window.open(
                              `https://www.bing.com/maps?q=${mapLocation.latitude},${mapLocation.longitude}`,
                              '_blank'
                            )
                          }
                        }}
                      >
                        Bing Maps
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          if (mapLocation) {
                            window.open(
                              `https://wego.here.com/?map=${mapLocation.latitude},${mapLocation.longitude},15,satellite`,
                              '_blank'
                            )
                          }
                        }}
                      >
                        HERE WeGo
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          if (mapLocation) {
                            window.open(
                              `https://earth.google.com/web/search/${mapLocation.latitude},${mapLocation.longitude}`,
                              '_blank'
                            )
                          }
                        }}
                      >
                        Google Earth
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0">
            <div className="flex justify-between w-full">
              <div className="text-sm text-gray-500">
                Map data © Google, OpenStreetMap
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (mapLocation && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const userLat = position.coords.latitude;
                          const userLon = position.coords.longitude;
                          window.open(
                            `https://www.google.com/maps/dir/${userLat},${userLon}/${mapLocation.latitude},${mapLocation.longitude}`,
                            '_blank'
                          )
                        },
                        () => {
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${mapLocation.latitude},${mapLocation.longitude}`,
                            '_blank'
                          )
                        }
                      )
                    }
                  }}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Directions from My Location
                </Button>
                <Button onClick={() => setShowMapDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>





      {/* Terminal Dialog */}
      <Dialog open={showTerminalDialog} onOpenChange={setShowTerminalDialog} className="max-w-6xl">
        <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>Terminal - {selectedOLT?.name}</DialogTitle>
                <DialogDescription>
                  Connected via SSH to {selectedOLT?.sshConfig?.host || selectedOLT?.ipAddress}:{selectedOLT?.sshConfig?.port}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={terminalConnected ? "default" : "outline"} className={terminalConnected ? "bg-green-500" : ""}>
                  {terminalConnected ? "Connected" : "Disconnected"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTerminalConnected(false)
                    setTerminalOutput("")
                    setShowTerminalDialog(false)
                  }}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div
              ref={terminalOutputRef}
              className={`flex-1 font-mono text-sm overflow-y-auto p-4 rounded-lg ${isDarkMode
                ? "bg-black text-green-400"
                : "bg-gray-900 text-green-300"
                }`}
              style={{
                fontFamily: "'Courier New', monospace",
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {terminalOutput || "Connecting to terminal..."}
            </div>

            <div className="mt-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyPress={handleTerminalKeyPress}
                  placeholder="Type command and press Enter..."
                  className="font-mono"
                  disabled={!terminalConnected}
                />
                <Button
                  onClick={() => terminalInput.trim() && sendTerminalCommand(terminalInput.trim())}
                  disabled={!terminalConnected || !terminalInput.trim()}
                >
                  Send
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Press Enter to send command. Common commands: display version, display board, display ont info
              </p>
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const commands = [
                      'display version',
                      'display board',
                      'display cpu-usage',
                      'display memory-usage'
                    ];
                    commands.forEach((cmd, i) => {
                      setTimeout(() => {
                        setTerminalInput(cmd);
                        setTimeout(() => {
                          sendTerminalCommand(cmd);
                        }, 100);
                      }, i * 500);
                    });
                  }}
                  disabled={!terminalConnected}
                >
                  Run Diagnostics
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTerminalOutput("");
                  }}
                >
                  Clear Output
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ONT Details Dialog */}
      <Dialog open={showONTDetails} onOpenChange={setShowONTDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>ONT Details</span>
              {selectedONT?.ontDetails && (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Database className="h-3 w-3 mr-1" />
                  Detailed Info Available
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Detailed information for ONT {selectedONT?.ontId}
              {selectedONT?.lastSync && (
                <span className="ml-2 text-xs text-gray-500">
                  Last synced: {formatDate(selectedONT.lastSync)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedONT && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">ONT ID</Label>
                  <p className="font-medium">{selectedONT.ontId}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Serial Number</Label>
                  <p className="font-mono">{selectedONT.serialNumber}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Status</Label>
                  <Badge className={getONTStatusColor(selectedONT.status)}>
                    {selectedONT.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Service Port</Label>
                  <p className="font-mono">{selectedONT.servicePort}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Vendor</Label>
                  <p>{selectedONT.vendor}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Model</Label>
                  <p>{selectedONT.model || 'Unknown'}</p>
                </div>

              </div>

              {/* Optical Information */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Optical Information</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">RX Power</Label>
                    <div className={`flex items-center gap-2 ${selectedONT.rxPower ?
                      selectedONT.rxPower > -20 ? 'text-red-600' :
                        selectedONT.rxPower > -25 ? 'text-orange-600' :
                          'text-green-600' : 'text-gray-500'}`}>
                      <Download className="h-4 w-4" />
                      <span className="text-lg font-semibold">
                        {selectedONT.rxPower ? `${selectedONT.rxPower.toFixed(2)} dBm` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">TX Power</Label>
                    <div className={`flex items-center gap-2 ${selectedONT.txPower ?
                      selectedONT.txPower > 5 ? 'text-red-600' :
                        selectedONT.txPower > 3 ? 'text-orange-600' :
                          'text-green-600' : 'text-gray-500'}`}>
                      <Upload className="h-4 w-4" />
                      <span className="text-lg font-semibold">
                        {selectedONT.txPower ? `${selectedONT.txPower.toFixed(2)} dBm` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">Temperature</Label>
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-orange-500" />
                      <span className="text-lg font-semibold">
                        {selectedONT.temperature ? `${selectedONT.temperature}°C` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">Distance</Label>
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-blue-500" />
                      <span className="text-lg font-semibold">
                        {selectedONT.distance ? `${(selectedONT.distance / 1000).toFixed(2)} km` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">Uptime</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-500" />
                      <span className="text-lg font-semibold">
                        {formatUptime(selectedONT.uptime)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-500">Last Online</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span className="text-lg font-semibold">
                        {formatDate(selectedONT.lastOnline)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ONT Details from ontDetails */}
              {selectedONT.ontDetails && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Detailed Configuration</h3>
                    <Tabs defaultValue="profiles">
                      <TabsList className="grid grid-cols-4">
                        <TabsTrigger value="profiles">Profiles</TabsTrigger>
                        <TabsTrigger value="tconts">TCONTs</TabsTrigger>
                        <TabsTrigger value="gems">GEMs</TabsTrigger>
                        <TabsTrigger value="services">Service Ports</TabsTrigger>
                      </TabsList>

                      <TabsContent value="profiles" className="space-y-4 pt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-500">Line Profile</Label>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{selectedONT.ontDetails.lineProfileName}</span>
                              <Badge variant="outline">ID: {selectedONT.ontDetails.lineProfileId}</Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-500">Service Profile</Label>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{selectedONT.ontDetails.serviceProfileName}</span>
                              <Badge variant="outline">ID: {selectedONT.ontDetails.serviceProfileId}</Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-500">Mapping Mode</Label>
                            <Badge variant="outline">{selectedONT.ontDetails.mappingMode}</Badge>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-500">QoS Mode</Label>
                            <Badge variant="outline">{selectedONT.ontDetails.qosMode}</Badge>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="tconts" className="pt-4">
                        {selectedONT.ontDetails.tconts && Array.isArray(selectedONT.ontDetails.tconts) && (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>TCONT ID</TableHead>
                                  <TableHead>DBA Profile</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedONT.ontDetails.tconts.map((tcont, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{tcont.id}</TableCell>
                                    <TableCell>{tcont.dba_profile}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="gems" className="pt-4">
                        {selectedONT.ontDetails.gems && Array.isArray(selectedONT.ontDetails.gems) && (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>GEM Index</TableHead>
                                  <TableHead>VLAN</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedONT.ontDetails.gems.map((gem, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{gem.gem_index}</TableCell>
                                    <TableCell>{gem.vlan}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="services" className="pt-4">
                        {selectedONT.ontDetails.servicePorts && Array.isArray(selectedONT.ontDetails.servicePorts) && (
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Index</TableHead>
                                  <TableHead>State</TableHead>
                                  <TableHead>VLAN</TableHead>
                                  <TableHead>Flow Type</TableHead>
                                  <TableHead>GEM Index</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedONT.ontDetails.servicePorts.map((service, index) => (
                                  <TableRow key={index}>
                                    <TableCell>{service.index}</TableCell>
                                    <TableCell>
                                      <Badge className={service.state === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                                        {service.state}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{service.vlan}</TableCell>
                                    <TableCell>{service.flow_type}</TableCell>
                                    <TableCell>{service.gem_index}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </>
              )}

              {/* Raw Data */}
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Raw Data</h3>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-[300px]">
                  {JSON.stringify(selectedONT.rawData, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex justify-between w-full items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (selectedOLT && selectedONT) {
                    try {
                      // toast.loading(`Syncing details for ${selectedONT.serialNumber}...`);
                      const response = await apiRequest<{
                        success: boolean;
                        message: string;
                        data: any;
                      }>(`/olt/${selectedOLT.id}/onts/${selectedONT.ontId}/sync-details`, {
                        method: "POST"
                      });

                      if (response.success) {
                        toast.success(`ONT ${selectedONT.serialNumber} details synced`);
                        // Refresh ONT data
                        if (selectedOLT) {
                          await fetchONTs(selectedOLT.id, ontPagination.page, ontSearch, ontStatusFilter);
                        }
                        // Close and reopen to show updated data
                        setShowONTDetails(false);
                        setTimeout(() => {
                          setShowONTDetails(true);
                        }, 100);
                      } else {
                        toast.error(response.error || "Failed to sync ONT details");
                      }
                    } catch (error: any) {
                      console.error("Failed to sync ONT details:", error);
                      toast.error(error.message || "Failed to sync ONT details");
                    }
                  }
                }}
                disabled={!selectedOLT || !selectedONT}
                className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 hover:text-blue-700 border-blue-500/20"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Sync Details
              </Button>
              <Button onClick={() => setShowONTDetails(false)}>
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Splitter Dialog */}
      <Dialog open={showAddSplitterDialog} onOpenChange={setShowAddSplitterDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSplitter ? "Edit Splitter" : "Add New Splitter"}</DialogTitle>
            <DialogDescription>
              Configure optical splitter details and connections
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="splitter-name">Splitter Name *</Label>
                <Input
                  id="splitter-name"
                  value={splitterForm.name}
                  onChange={(e) => setSplitterForm({ ...splitterForm, name: e.target.value })}
                  placeholder="Splitter-01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="splitter-id">Splitter ID</Label>
                <Input
                  id="splitter-id"
                  value={splitterForm.splitterId}
                  onChange={(e) => setSplitterForm({ ...splitterForm, splitterId: e.target.value })}
                  placeholder="SPL-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="splitter-type">Split Ratio</Label>
                <SearchableSelect
                  options={(splitterForm.splitterType === "COUPLER" ? COUPLER_TYPES : SPLITTER_TYPES).map(type => ({
                    value: type.value,
                    label: type.label
                  }))}
                  value={splitterForm.splitRatio}
                  onValueChange={(value) => handleSplitRatioChange(String(value))}
                  placeholder="Select split ratio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="splitter-tech">Technology</Label>
                <SearchableSelect
                  options={SPLITTER_TECH_TYPES.map(type => ({
                    value: type.value,
                    label: type.label
                  }))}
                  value={splitterForm.splitterType}
                  onValueChange={(value) => {
                    const technology = String(value) as "PLC" | "FBT" | "COUPLER"
                    const isCoupler = technology === "COUPLER"
                    setSplitterForm({
                      ...splitterForm,
                      splitterType: technology,
                      splitRatio: isCoupler ? "5:95" : "1:8",
                      ratio: isCoupler ? 95 : 8,
                      portCount: isCoupler ? 2 : 8,
                      usedPorts: Math.min(splitterForm.usedPorts, isCoupler ? 2 : 8),
                      availablePorts: Math.max(0, (isCoupler ? 2 : 8) - splitterForm.usedPorts),
                    })
                  }}
                  placeholder="Select technology"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="used-ports">Used Ports</Label>
                <Input
                  id="used-ports"
                  type="number"
                  min="0"
                  max={splitterForm.portCount}
                  value={splitterForm.usedPorts}
                  onChange={(e) => {
                    const used = parseInt(e.target.value) || 0
                    const available = splitterForm.portCount - used
                    setSplitterForm({
                      ...splitterForm,
                      usedPorts: used,
                      availablePorts: available
                    })
                  }}
                />
                <div className="text-xs text-gray-500">
                  Available: {splitterForm.availablePorts} / Total: {splitterForm.portCount}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="splitter-status">Status</Label>
                <SearchableSelect
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "maintenance", label: "Maintenance" }
                  ]}
                  value={splitterForm.status}
                  onValueChange={(value) => setSplitterForm({
                    ...splitterForm,
                    status: value as "active" | "inactive" | "maintenance"
                  })}
                  placeholder="Select status"
                />
              </div>
            </div>

            <Separator />

            {/* Master/Slave Configuration */}
            <div>
              <h4 className="font-medium mb-2">Master/Slave Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="is-master">Splitter Role</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-master"
                      checked={splitterForm.isMaster}
                      onCheckedChange={handleMasterSlaveToggle}
                    />
                    <Label htmlFor="is-master">
                      {splitterForm.isMaster ? "Master Splitter" : "Slave Splitter"}
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {splitterForm.isMaster
                      ? "Master splitters connect directly to OLT service ports"
                      : "Slave splitters must connect to parent splitters (master or other slaves)"
                    }
                  </p>
                </div>

                {!splitterForm.isMaster && (
                  <div className="space-y-2">
                    <Label htmlFor="parent-splitter">Parent Splitter *</Label>
                    <SearchableSelect
                      options={parentSplitters.map(splitter => ({
                        value: splitter.id,
                        label: `${splitter.name} (${splitter.splitterId}) - ${splitter.isMaster ? 'Master' : 'Slave'} - Ratio: ${splitter.splitRatio} - Available: ${splitter.availablePorts}`
                      }))}
                      value={splitterForm.masterSplitterId}
                      onValueChange={(value) => {
                        const selectedParent = parentSplitters.find(s => s.id === value);

                        if (value) {
                          // Connecting to parent splitter, clear OLT connection
                          setSplitterForm({
                            ...splitterForm,
                            masterSplitterId: value,
                            connectedServiceBoard: undefined,
                            upstreamFiber: {
                              ...splitterForm.upstreamFiber,
                              connectedTo: "splitter",
                              connectionId: value
                            }
                          });
                          setAvailablePorts([]);
                        } else {
                          // No parent selected (shouldn't happen for slaves)
                          setSplitterForm({
                            ...splitterForm,
                            masterSplitterId: "",
                            upstreamFiber: {
                              ...splitterForm.upstreamFiber,
                              connectedTo: "splitter",
                              connectionId: ""
                            }
                          });
                        }
                      }}
                      placeholder="Select parent splitter"
                      emptyMessage="No splitters with available ports"
                    />
                    {!splitterForm.masterSplitterId && (
                      <p className="text-xs text-red-500">
                        Slave splitters must be connected to a parent splitter
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* OLT Connection */}
            {splitterForm.isMaster && (
              <div>
                <h4 className="font-medium mb-2">OLT Connection *</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="olt-select">Connected OLT</Label>
                    <SearchableSelect
                      options={olts.map(olt => ({
                        value: olt.id,
                        label: `${olt.name} (${olt.ipAddress})`
                      }))}
                      value={splitterForm.connectedServiceBoard?.oltId || ""}
                      onValueChange={(value) => {
                        if (value) {
                          fetchAvailablePorts(value as string)
                          const olt = olts.find(o => String(o.id) === String(value))
                          setSplitterForm({
                            ...splitterForm,
                            connectedServiceBoard: {
                              oltId: value as string,
                              oltName: olt?.name || "",
                              boardSlot: 1,
                              boardPort: "0/1/1"
                            }
                          })
                        } else {
                          setSplitterForm({
                            ...splitterForm,
                            connectedServiceBoard: undefined
                          })
                          setAvailablePorts([])
                        }
                      }}
                      placeholder="Select OLT"
                      emptyMessage="No OLTs available"
                    />
                  </div>
                  {splitterForm.connectedServiceBoard?.oltId && (
                    <div className="space-y-2">
                      <Label htmlFor="board-port">Service Port *</Label>
                      <div className="space-y-2">
                        <SearchableSelect
                          options={availablePorts.map((port) => ({
                            value: port.boardPort,
                            label: `Port ${port.boardPort} (Slot ${port.boardSlot}, ${port.boardType}) - ${port.status === "used" ? "⚠️ In Use" : "✓ Available"
                              }`
                          }))}
                          value={splitterForm.connectedServiceBoard?.boardPort || ""}
                          onValueChange={(value) => {
                            const selectedPort = availablePorts.find(p => p.boardPort === value);
                            if (selectedPort) {
                              setSplitterForm({
                                ...splitterForm,
                                connectedServiceBoard: {
                                  ...splitterForm.connectedServiceBoard!,
                                  boardPort: value as string,
                                  boardSlot: selectedPort.boardSlot
                                }
                              });
                            }
                          }}
                          placeholder="Select service port"
                          emptyMessage="No ports available"
                        />

                        {(() => {
                          const selectedPort = availablePorts.find(
                            p => p.boardPort === splitterForm.connectedServiceBoard?.boardPort
                          );
                          if (selectedPort?.status === 'used' &&
                            selectedSplitter?.connectedServiceBoard?.boardPort !== selectedPort.boardPort) {
                            return (
                              <Alert variant="destructive" className="mt-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  This port is already in use by another splitter.
                                </AlertDescription>
                              </Alert>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                {!splitterForm.connectedServiceBoard?.oltId && (
                  <p className="text-xs text-red-500 mt-2">
                    Master splitters must be connected to an OLT service port
                  </p>
                )}
              </div>
            )}


            <Separator />

            {/* Upstream Fiber Configuration */}
            <div>
              <h4 className="font-medium mb-2">Upstream Fiber Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fiber-color">Fiber Core Color</Label>
                  <SearchableSelect
                    options={FIBER_CORE_COLORS.map(color => ({
                      value: color,
                      label: color,
                      icon: (
                        <div
                          className="w-3 h-3 rounded-full border mr-2"
                          style={{ backgroundColor: color.toLowerCase() }}
                        />
                      )
                    }))}
                    value={splitterForm.upstreamFiber.coreColor}
                    onValueChange={(value) => setSplitterForm({
                      ...splitterForm,
                      upstreamFiber: { ...splitterForm.upstreamFiber, coreColor: value as string }
                    })}
                    placeholder="Select fiber color"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="connected-to">Connected To</Label>
                  <SearchableSelect
                    options={[
                      { value: "service-board", label: "Service Board" },
                      { value: "olt", label: "OLT" },
                      { value: "splitter", label: "Splitter" }
                    ]}
                    value={splitterForm.upstreamFiber.connectedTo}
                    onValueChange={(value) => setSplitterForm({
                      ...splitterForm,
                      upstreamFiber: { ...splitterForm.upstreamFiber, connectedTo: value as "service-board" | "olt" | "splitter" }
                    })}
                    placeholder="Select connection type"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Information */}
            <div>
              <h4 className="font-medium mb-2">Location Information</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input
                    id="site-name"
                    value={splitterForm.location.site}
                    onChange={(e) => setSplitterForm({
                      ...splitterForm,
                      location: { ...splitterForm.location, site: e.target.value }
                    })}
                    placeholder="Enter site name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={splitterForm.location.latitude}
                    onChange={(e) => setSplitterForm({
                      ...splitterForm,
                      location: { ...splitterForm.location, latitude: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="0.000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={splitterForm.location.longitude}
                    onChange={(e) => setSplitterForm({
                      ...splitterForm,
                      location: { ...splitterForm.location, longitude: parseFloat(e.target.value) || 0 }
                    })}
                    placeholder="0.000000"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="location-description">Location Description</Label>
                <Textarea
                  id="location-description"
                  value={splitterForm.location.description}
                  onChange={(e) => setSplitterForm({
                    ...splitterForm,
                    location: { ...splitterForm.location, description: e.target.value }
                  })}
                  placeholder="Enter location description..."
                  rows={2}
                />
              </div>
            </div>

            {/* Location Preview and Map Button */}
            {(splitterForm.location.latitude || splitterForm.location.longitude) && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Coordinates Preview</Label>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Latitude</Label>
                        <div className="p-2 bg-white dark:bg-gray-800 rounded text-sm font-mono border">
                          {splitterForm.location.latitude.toFixed(6)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Longitude</Label>
                        <div className="p-2 bg-white dark:bg-gray-800 rounded text-sm font-mono border">
                          {splitterForm.location.longitude.toFixed(6)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          if (splitterForm.location.latitude && splitterForm.location.longitude) {
                            setMapLocation({
                              latitude: splitterForm.location.latitude,
                              longitude: splitterForm.location.longitude,
                              name: splitterForm.name || 'New Splitter',
                              site: splitterForm.location.site || 'Splitter Location'
                            })
                            setShowMapDialog(true)
                          } else {
                            toast.error('Please enter valid latitude and longitude coordinates')
                          }
                        }}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Preview on Map
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-gray-500">Quick Actions</Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          // Get current location
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (position) => {
                                setSplitterForm({
                                  ...splitterForm,
                                  location: {
                                    ...splitterForm.location,
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude
                                  }
                                })
                                toast.success('Current location obtained')
                              },
                              (error) => {
                                toast.error('Unable to get current location')
                                console.error('Geolocation error:', error)
                              }
                            )
                          } else {
                            toast.error('Geolocation is not supported by your browser')
                          }
                        }}
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Use Current Location
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          if (splitterForm.location.latitude && splitterForm.location.longitude) {
                            const text = `${splitterForm.location.latitude}, ${splitterForm.location.longitude}`
                            navigator.clipboard.writeText(text)
                            toast.success('Coordinates copied to clipboard')
                          }
                        }}
                        disabled={!splitterForm.location.latitude || !splitterForm.location.longitude}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Coordinates
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="splitter-notes">Notes</Label>
              <Textarea
                id="splitter-notes"
                value={splitterForm.notes}
                onChange={(e) => setSplitterForm({ ...splitterForm, notes: e.target.value })}
                placeholder="Enter any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddSplitterDialog(false)
                setSelectedSplitter(null)
                setSplitterForm({
                  name: "",
                  splitterId: "",
                  splitRatio: "1:8",
                  ratio: 8,
                  splitterType: "PLC",
                  portCount: 8,
                  usedPorts: 0,
                  availablePorts: 8,
                  isMaster: false,
                  masterSplitterId: "",
                  location: {
                    site: "",
                    latitude: 0,
                    longitude: 0,
                    description: ""
                  },
                  upstreamFiber: {
                    coreColor: "Blue",
                    connectedTo: "service-board",
                    connectionId: "",
                    port: ""
                  },
                  connectedServiceBoard: undefined,
                  status: "active",
                  notes: ""
                })
                setAvailablePorts([])
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSplitter} disabled={!splitterForm.name}>
              <Save className="h-4 w-4 mr-2" />
              {selectedSplitter ? "Update Splitter" : "Add Splitter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Splitter Details Dialog */}
      <Dialog open={showSplitterDetails} onOpenChange={setShowSplitterDetails}>
        {selectedSplitter && (
          <DialogContent className="max-h-[94vh] max-w-5xl gap-0 overflow-y-auto p-0 z-[120] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
            <SplitterDetailsModern
              splitter={selectedSplitter}
              splitters={allSplitters}
              olts={olts}
              onEdit={() => openSplitterEditor(selectedSplitter)}
              onMap={() => openSplitterMap(selectedSplitter)}
              onCopy={() => copySplitterDetails(selectedSplitter)}
              onClose={() => setShowSplitterDetails(false)}
            />
          </DialogContent>
        )}
      </Dialog>

      {/* Update OLT Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {updateType === "basic" && "Update Basic Information"}
              {updateType === "ssh" && "Update SSH Configuration"}
              {updateType === "telnet" && "Update Telnet Configuration"}
              {updateType === "snmp" && "Update SNMP Configuration"}
              {updateType === "web" && "Update Web Interface"}
              {updateType === "api" && "Update API Configuration"}
              {updateType === "location" && "Update Location Information"}
              {updateType === "service-boards" && "Update Service Boards"}
              {updateType === "advanced" && "Update Advanced Settings"}
              {updateType === "status" && "Change OLT Status"}
            </DialogTitle>
            <DialogDescription>
              Update configuration for {selectedOLT?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {updateType === "basic" && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="update-name">OLT Name *</Label>
                    <Input
                      id="update-name"
                      value={basicForm.name}
                      onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
                      placeholder="OLT-DC-01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-ip">IP Address *</Label>
                    <Input
                      id="update-ip"
                      value={basicForm.ipAddress}
                      onChange={(e) => setBasicForm({ ...basicForm, ipAddress: e.target.value })}
                      placeholder="192.168.1.100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-vendor">Vendor</Label>
                    <SearchableSelect
                      options={VENDOR_OPTIONS.map((vendor) => ({
                        value: vendor.value,
                        label: vendor.label
                      }))}
                      value={basicForm.vendor}
                      onValueChange={(value) => setBasicForm({ ...basicForm, vendor: value as string })}
                      placeholder="Select vendor"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="update-vendor">Default Transport</Label>
                    <SearchableSelect
                      options={TRANSPORT_OPTIONS}
                      value={basicForm.transport}
                      onValueChange={(value: Transport) =>
                        setBasicForm({ ...basicForm, transport: value })
                      } placeholder="Select transport"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="update-model">Model</Label>
                    <Input
                      id="update-model"
                      value={basicForm.model}
                      onChange={(e) => setBasicForm({ ...basicForm, model: e.target.value })}
                      placeholder="Enter model"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-serial">Serial Number</Label>
                    <Input
                      id="update-serial"
                      value={basicForm.serialNumber}
                      onChange={(e) => setBasicForm({ ...basicForm, serialNumber: e.target.value })}
                      placeholder="Enter serial number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-firmware">Firmware Version</Label>
                    <Input
                      id="update-firmware"
                      value={basicForm.firmwareVersion}
                      onChange={(e) => setBasicForm({ ...basicForm, firmwareVersion: e.target.value })}
                      placeholder="Enter firmware version"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="update-status">Status</Label>
                    <SearchableSelect
                      options={[
                        { value: "online", label: "Online" },
                        { value: "offline", label: "Offline" },
                        { value: "maintenance", label: "Maintenance" }
                      ]}
                      value={basicForm.status}
                      onValueChange={(value) => setBasicForm({ ...basicForm, status: value as "online" | "offline" | "maintenance" })}
                      placeholder="Select status"
                    />
                  </div>
                </div>
              </div>
            )}

            {updateType === "ssh" && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ssh-host">SSH Host</Label>
                    <Input
                      id="ssh-host"
                      value={sshForm.host}
                      onChange={(e) => setSshForm({ ...sshForm, host: e.target.value })}
                      placeholder="Enter SSH host (e.g., 10.64.0.105)"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Note: This can be different from the OLT IP address
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssh-port">SSH Port</Label>
                    <Input
                      id="ssh-port"
                      type="number"
                      value={sshForm.port}
                      onChange={(e) => setSshForm({ ...sshForm, port: parseInt(e.target.value) || 22 })}
                      placeholder="22"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssh-username">SSH Username</Label>
                    <Input
                      id="ssh-username"
                      value={sshForm.username}
                      onChange={(e) => setSshForm({ ...sshForm, username: e.target.value })}
                      placeholder="admin"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssh-password">SSH Password</Label>
                    <div className="relative">
                      <Input
                        id="ssh-password"
                        type={showPassword ? "text" : "password"}
                        value={sshForm.password}
                        onChange={(e) => setSshForm({ ...sshForm, password: e.target.value })}
                        placeholder="••••••••"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssh-enable">Enable Password</Label>
                    <div className="relative">
                      <Input
                        id="ssh-enable"
                        type={showEnablePassword ? "text" : "password"}
                        value={sshForm.enablePassword}
                        onChange={(e) => setSshForm({ ...sshForm, enablePassword: e.target.value })}
                        placeholder="••••••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowEnablePassword(!showEnablePassword)}
                      >
                        {showEnablePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ssh-key">SSH Key (Optional)</Label>
                    <Textarea
                      id="ssh-key"
                      value={sshForm.sshKey}
                      onChange={(e) => setSshForm({ ...sshForm, sshKey: e.target.value })}
                      placeholder="Paste SSH private key here"
                      rows={3}
                    />
                  </div>
                </div>
                <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertDescription>
                    SSH credentials are used for terminal access and ONT synchronization.
                    The SSH Host can be different from the OLT IP address if needed.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {updateType === "telnet" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="telnet-enabled">Enable Telnet</Label>
                  <Switch
                    id="telnet-enabled"
                    checked={telnetForm.enabled}
                    onCheckedChange={(checked) => setTelnetForm({ ...telnetForm, enabled: checked })}
                  />
                </div>
                {telnetForm.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="telnet-port">Telnet Port</Label>
                    <Input
                      id="telnet-port"
                      type="number"
                      value={telnetForm.port}
                      onChange={(e) => setTelnetForm({ ...telnetForm, port: parseInt(e.target.value) || 23 })}
                      placeholder="23"
                    />
                  </div>
                )}
              </div>
            )}

            {updateType === "snmp" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="snmp-enabled">Enable SNMP</Label>
                  <Switch
                    id="snmp-enabled"
                    checked={snmpForm.enabled}
                    onCheckedChange={(checked) => setSnmpForm({ ...snmpForm, enabled: checked })}
                  />
                </div>
                {snmpForm.enabled && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="snmp-community">SNMP Community</Label>
                      <Input
                        id="snmp-community"
                        value={snmpForm.community}
                        onChange={(e) => setSnmpForm({ ...snmpForm, community: e.target.value })}
                        placeholder="public"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="snmp-version">SNMP Version</Label>
                      <SearchableSelect
                        options={[
                          { value: "v2c", label: "SNMP v2c" },
                          { value: "v3", label: "SNMP v3" }
                        ]}
                        value={snmpForm.version}
                        onValueChange={(value) => setSnmpForm({ ...snmpForm, version: value as "v2c" | "v3" })}
                        placeholder="Select SNMP version"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {updateType === "web" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="web-enabled">Enable Web Interface</Label>
                  <Switch
                    id="web-enabled"
                    checked={webForm.enabled}
                    onCheckedChange={(checked) => setWebForm({ ...webForm, enabled: checked })}
                  />
                </div>
                {webForm.enabled && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="web-port">Web Port</Label>
                      <Input
                        id="web-port"
                        type="number"
                        value={webForm.port}
                        onChange={(e) => setWebForm({ ...webForm, port: parseInt(e.target.value) || 80 })}
                        placeholder="80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="web-ssl">Enable SSL/TLS</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="web-ssl"
                          checked={webForm.ssl}
                          onCheckedChange={(checked) => setWebForm({ ...webForm, ssl: checked })}
                        />
                        <Label htmlFor="web-ssl">{webForm.ssl ? "HTTPS" : "HTTP"}</Label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {updateType === "api" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="api-enabled">Enable API</Label>
                  <Switch
                    id="api-enabled"
                    checked={apiForm.enabled}
                    onCheckedChange={(checked) => setApiForm({ ...apiForm, enabled: checked })}
                  />
                </div>
                {apiForm.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="api-port">API Port</Label>
                    <Input
                      id="api-port"
                      type="number"
                      value={apiForm.port}
                      onChange={(e) => setApiForm({ ...apiForm, port: parseInt(e.target.value) || 8080 })}
                      placeholder="8080"
                    />
                  </div>
                )}
              </div>
            )}

            {updateType === "location" && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location-region">Region</Label>
                    <Input
                      id="location-region"
                      value={locationForm.region}
                      onChange={(e) => setLocationForm({ ...locationForm, region: e.target.value })}
                      placeholder="Enter region"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-site">Site</Label>
                    <Input
                      id="location-site"
                      value={locationForm.site}
                      onChange={(e) => setLocationForm({ ...locationForm, site: e.target.value })}
                      placeholder="Enter site name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-rack">Rack Number</Label>
                    <Input
                      id="location-rack"
                      type="number"
                      value={locationForm.rack}
                      onChange={(e) => setLocationForm({ ...locationForm, rack: parseInt(e.target.value) || 1 })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-position">Position (U)</Label>
                    <Input
                      id="location-position"
                      type="number"
                      value={locationForm.position}
                      onChange={(e) => setLocationForm({ ...locationForm, position: parseInt(e.target.value) || 1 })}
                      placeholder="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-latitude">Latitude</Label>
                    <Input
                      id="location-latitude"
                      type="number"
                      step="0.000001"
                      value={locationForm.latitude}
                      onChange={(e) => setLocationForm({ ...locationForm, latitude: parseFloat(e.target.value) || 0 })}
                      placeholder="0.000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-longitude">Longitude</Label>
                    <Input
                      id="location-longitude"
                      type="number"
                      step="0.000001"
                      value={locationForm.longitude}
                      onChange={(e) => setLocationForm({ ...locationForm, longitude: parseFloat(e.target.value) || 0 })}
                      placeholder="0.000000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location-notes">Location Notes</Label>
                  <Textarea
                    id="location-notes"
                    value={locationForm.notes}
                    onChange={(e) => setLocationForm({ ...locationForm, notes: e.target.value })}
                    placeholder="Enter location notes..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            {updateType === "service-boards" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Service Boards</Label>
                    <p className="text-sm text-gray-500">Add or modify service boards. Slots can be any number from 1-16.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Find the next available slot
                      const usedSlots = serviceBoardsForm.map(b => b.slot);
                      let nextSlot = 1;
                      while (usedSlots.includes(nextSlot)) {
                        nextSlot++;
                      }
                      if (nextSlot > 16) nextSlot = 1; // Wrap around

                      setServiceBoardsForm([
                        ...serviceBoardsForm,
                        {
                          slot: nextSlot,
                          type: "GPON",
                          portCount: 8,
                          usedPorts: 0,
                          status: "active"
                        }
                      ])
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Board
                  </Button>
                </div>
                {serviceBoardsForm.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <PanelTop className="h-12 w-12 mx-auto text-gray-300" />
                    <p className="text-gray-500 mt-2">No service boards configured</p>
                    <p className="text-sm text-gray-500">Click "Add Board" to add a service board</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {serviceBoardsForm.map((board, index) => (
                      <div key={index} className="p-3 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <HardDrive className="h-5 w-5 text-blue-500" />
                            <h4 className="font-semibold">Board {board.slot}</h4>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newBoards = [...serviceBoardsForm]
                              newBoards.splice(index, 1)
                              setServiceBoardsForm(newBoards)
                            }}
                            className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Slot Number</Label>
                            <Input
                              type="number"
                              min="0"
                              max="16"
                              value={board.slot}
                              onChange={(e) => {
                                const newBoards = [...serviceBoardsForm]
                                const newSlot = parseInt(e.target.value) || 0
                                // Check for duplicate slots
                                if (newBoards.some((b, i) => i !== index && b.slot === newSlot)) {
                                  toast.error(`Slot ${newSlot} is already in use`)
                                  return
                                }
                                newBoards[index].slot = newSlot
                                setServiceBoardsForm(newBoards)
                              }}
                            />
                            <p className="text-xs text-gray-500">Unique slot number (1-16)</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Type</Label>
                            <SearchableSelect
                              options={BOARD_TYPE_OPTIONS.map((type) => ({
                                value: type.value,
                                label: type.label
                              }))}
                              value={board.type}
                              onValueChange={(value) => {
                                const newBoards = [...serviceBoardsForm]
                                newBoards[index].type = value as string
                                setServiceBoardsForm(newBoards)
                              }}
                              placeholder="Select board type"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Port Count</Label>
                            <Input
                              type="number"
                              value={board.portCount}
                              onChange={(e) => {
                                const newBoards = [...serviceBoardsForm]
                                newBoards[index].portCount = parseInt(e.target.value) || 8
                                setServiceBoardsForm(newBoards)
                              }}
                              min="1"
                              max="64"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Used Ports</Label>
                            <Input
                              type="number"
                              value={board.usedPorts}
                              onChange={(e) => {
                                const newBoards = [...serviceBoardsForm]
                                newBoards[index].usedPorts = parseInt(e.target.value) || 0
                                setServiceBoardsForm(newBoards)
                              }}
                              min="0"
                              max={board.portCount}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Status</Label>
                            <SearchableSelect
                              options={[
                                { value: "active", label: "Active" },
                                { value: "inactive", label: "Inactive" },
                                { value: "faulty", label: "Faulty" }
                              ]}
                              value={board.status}
                              onValueChange={(value) => {
                                const newBoards = [...serviceBoardsForm]
                                newBoards[index].status = value as string
                                setServiceBoardsForm(newBoards)
                              }}
                              placeholder="Select status"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {updateType === "advanced" && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="auto-provisioning">Auto Provisioning</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-provisioning"
                        checked={advancedForm.autoProvisioning}
                        onCheckedChange={(checked) => setAdvancedForm({ ...advancedForm, autoProvisioning: checked })}
                      />
                      <Label htmlFor="auto-provisioning">
                        {advancedForm.autoProvisioning ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redundancy">Redundancy</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="redundancy"
                        checked={advancedForm.redundancy}
                        onCheckedChange={(checked) => setAdvancedForm({ ...advancedForm, redundancy: checked })}
                      />
                      <Label htmlFor="redundancy">
                        {advancedForm.redundancy ? "Enabled" : "Disabled"}
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="power-supply">Power Supply Units</Label>
                    <Input
                      id="power-supply"
                      type="number"
                      value={advancedForm.powerSupply}
                      onChange={(e) => setAdvancedForm({ ...advancedForm, powerSupply: parseInt(e.target.value) || 1 })}
                      min="1"
                      max="4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cooling">Cooling</Label>
                    <SearchableSelect
                      options={[
                        { value: "active", label: "Active" },
                        { value: "passive", label: "Passive" }
                      ]}
                      value={advancedForm.cooling}
                      onValueChange={(value) => setAdvancedForm({ ...advancedForm, cooling: value as "active" | "passive" })}
                      placeholder="Select cooling type"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backup-schedule">Backup Schedule</Label>
                    <SearchableSelect
                      options={[
                        { value: "none", label: "No Backup" },
                        { value: "daily", label: "Daily" },
                        { value: "weekly", label: "Weekly" },
                        { value: "monthly", label: "Monthly" }
                      ]}
                      value={advancedForm.backupSchedule}
                      onValueChange={(value) => setAdvancedForm({ ...advancedForm, backupSchedule: value as "daily" | "weekly" | "monthly" | "none" })}
                      placeholder="Select backup schedule"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advanced-notes">Notes</Label>
                  <Textarea
                    id="advanced-notes"
                    value={advancedForm.notes}
                    onChange={(e) => setAdvancedForm({ ...advancedForm, notes: e.target.value })}
                    placeholder="Enter additional notes..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {updateType === "status" && (
              <div className="space-y-4">
                <div className="grid gap-3">
                  <Button
                    variant={selectedOLT?.status === "online" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus("online")}
                    className="justify-start"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span>Set Online</span>
                    </div>
                  </Button>
                  <Button
                    variant={selectedOLT?.status === "offline" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus("offline")}
                    className="justify-start"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span>Set Offline</span>
                    </div>
                  </Button>
                  <Button
                    variant={selectedOLT?.status === "maintenance" ? "default" : "outline"}
                    onClick={() => handleUpdateStatus("maintenance")}
                    className="justify-start"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span>Set Maintenance</span>
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              switch (updateType) {
                case "basic":
                  handleUpdateBasic()
                  break
                case "ssh":
                  handleUpdateSSH()
                  break
                case "telnet":
                  handleUpdateTelnet()
                  break
                case "snmp":
                  handleUpdateSNMP()
                  break
                case "web":
                  handleUpdateWeb()
                  break
                case "api":
                  handleUpdateAPI()
                  break
                case "location":
                  handleUpdateLocation()
                  break
                case "service-boards":
                  handleUpdateServiceBoards()
                  break
                case "advanced":
                  handleUpdateAdvanced()
                  break
                case "status":
                  setShowUpdateDialog(false)
                  break
              }
            }}>
              <Save className="h-4 w-4 mr-2" />
              Update {updateType === "status" ? "Status" : "Configuration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add OLT Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New OLT</DialogTitle>
            <DialogDescription>
              Configure a new Optical Line Terminal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-name">OLT Name *</Label>
                <Input
                  id="add-name"
                  placeholder="OLT-DC-01"
                  value={basicForm.name}
                  onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-ip">IP Address *</Label>
                <Input
                  id="add-ip"
                  placeholder="192.168.1.100"
                  value={basicForm.ipAddress}
                  onChange={(e) => setBasicForm({ ...basicForm, ipAddress: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-vendor">Vendor</Label>
                <SearchableSelect
                  options={VENDOR_OPTIONS.map((vendor) => ({
                    value: vendor.value,
                    label: vendor.label
                  }))}
                  value={basicForm.vendor}
                  onValueChange={(value) => setBasicForm({ ...basicForm, vendor: value as string })}
                  placeholder="Select vendor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-model">Model</Label>
                <Input
                  id="add-model"
                  placeholder="Enter model"
                  value={basicForm.model}
                  onChange={(e) => setBasicForm({ ...basicForm, model: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Assignment</Label>
                <SearchableSelect
                  options={[
                    { value: "none", label: "Main ISP / Unassigned" },
                    { value: "branch", label: "Branch or Sub-branch" },
                    { value: "reseller", label: "Reseller" }
                  ]}
                  value={oltOwnerType}
                  onValueChange={(value) => {
                    setOltOwnerType(String(value) as "none" | "branch" | "reseller")
                    setOltOwnerId("")
                  }}
                  placeholder="Choose assignment type"
                />
              </div>
              {oltOwnerType !== "none" && (
                <div className="space-y-2">
                  <Label>{oltOwnerType === "branch" ? "Branch / Sub-branch" : "Reseller"}</Label>
                  <SearchableSelect
                    options={(oltOwnerType === "branch" ? oltBranches : oltResellers).map(owner => ({
                      value: String(owner.id),
                      label: `${owner.name} (${owner.code})`
                    }))}
                    value={oltOwnerId}
                    onValueChange={(value) => setOltOwnerId(String(value))}
                    placeholder={`Choose ${oltOwnerType}`}
                  />
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">SSH Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="add-ssh-host">SSH Host</Label>
                  <Input
                    id="add-ssh-host"
                    placeholder="Same as IP or different host"
                    value={sshForm.host}
                    onChange={(e) => setSshForm({ ...sshForm, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-ssh-port">SSH Port</Label>
                  <Input
                    id="add-ssh-port"
                    type="number"
                    placeholder="22"
                    value={sshForm.port}
                    onChange={(e) => setSshForm({ ...sshForm, port: parseInt(e.target.value) || 22 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-ssh-username">SSH Username</Label>
                  <Input
                    id="add-ssh-username"
                    placeholder="admin"
                    value={sshForm.username}
                    onChange={(e) => setSshForm({ ...sshForm, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-ssh-password">SSH Password</Label>
                  <Input
                    id="add-ssh-password"
                    type="password"
                    placeholder="••••••••"
                    value={sshForm.password}
                    onChange={(e) => setSshForm({ ...sshForm, password: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={async () => {
              try {
                // Create OLT with basic info and SSH config
                const payload = {
                  name: basicForm.name,
                  ipAddress: basicForm.ipAddress,
                  model: basicForm.model,
                  vendor: basicForm.vendor,
                  status: basicForm.status,
                  branchId: oltOwnerType === "branch" && oltOwnerId ? Number(oltOwnerId) : null,
                  resellerId: oltOwnerType === "reseller" && oltOwnerId ? Number(oltOwnerId) : null,
                  sshConfig: {
                    host: sshForm.host || basicForm.ipAddress,
                    port: sshForm.port,
                    username: sshForm.username,
                    password: sshForm.password,
                    enablePassword: sshForm.enablePassword
                  }
                };

                const response = await apiRequest<{ success: boolean; data: OLT; message: string }>('/olt', {
                  method: 'POST',
                  body: JSON.stringify(payload)
                });

                if (response.success) {
                  setShowAddDialog(false)
                  setOltOwnerType("none")
                  setOltOwnerId("")
                  toast.success("OLT added successfully")
                  // Refresh the list
                  await fetchOLTs(oltPagination.page)
                  // Set as selected
                  setSelectedOLT(response.data)
                }
              } catch (error: any) {
                console.error("Failed to add OLT:", error)
                toast.error(error.message || "Failed to add OLT")
              }
            }}>
              Add OLT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {xtermModalOlt && (
        <OLTTerminal
          olt={xtermModalOlt}
          isOpen={Boolean(xtermModalOlt)}
          onClose={() => setXtermModalOlt(null)}
        />
      )}

    </div>
  )
}
