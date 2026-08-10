export type CounterSample={bytes:number|string|bigint;timestamp:number;uptimeSeconds?:number|null;speedBps?:number|null;interfaceId?:string}
export type CounterRate={bps:number|null;status:'pending'|'ok'|'rollover'|'counter_reset'|'device_restart'|'invalid_counter'|'invalid_timestamp'|'interface_replaced'|'implausible_rate';utilizationPercent:number|null}

const compact=(value:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2,useGrouping:false}).format(value)

export function formatNetworkRate(value:number|null|undefined):string{
  if(value==null)return 'Unavailable'
  if(!Number.isFinite(value)||value<0)return 'Failed to retrieve'
  const units:[string,number][]=[['Tbps',1e12],['Gbps',1e9],['Mbps',1e6],['kbps',1e3],['bps',1]]
  const [unit,scale]=units.find(([,candidate])=>value>=candidate)??units[units.length-1]
  return `${compact(value/scale)} ${unit}`
}

export function formatStorageSize(value:number|null|undefined):string{
  if(value==null)return 'Unavailable'
  if(!Number.isFinite(value)||value<0)return 'Failed to retrieve'
  if(value===0)return '0 B'
  const units=['B','KiB','MiB','GiB','TiB','PiB'],exponent=Math.min(Math.floor(Math.log(value)/Math.log(1024)),units.length-1)
  return `${compact(value/1024**exponent)} ${units[exponent]}`
}

function delta(previous:number|string|bigint,current:number|string|bigint,counterBits?:32|64):{value:bigint|null;status:CounterRate['status']}{
  try{
    const before=BigInt(previous),after=BigInt(current)
    if(before<BigInt(0)||after<BigInt(0))return{value:null,status:'invalid_counter'}
    if(after>=before)return{value:after-before,status:'ok'}
    if(!counterBits)return{value:null,status:'counter_reset'}
    const modulus=BigInt(1)<<BigInt(counterBits)
    if(before<modulus*BigInt(9)/BigInt(10)||after>modulus/BigInt(10))return{value:null,status:'counter_reset'}
    return{value:modulus-before+after,status:'rollover'}
  }catch{return{value:null,status:'invalid_counter'}}
}

export function calculateCounterRate(previous:CounterSample|undefined,current:CounterSample,options:{counterBits?:32|64;utilizationTolerance?:number}={}):CounterRate{
  if(!previous)return{bps:null,status:'pending',utilizationPercent:null}
  if(!Number.isFinite(previous.timestamp)||!Number.isFinite(current.timestamp)||current.timestamp<=previous.timestamp)return{bps:null,status:'invalid_timestamp',utilizationPercent:null}
  if(previous.uptimeSeconds!=null&&current.uptimeSeconds!=null&&current.uptimeSeconds<previous.uptimeSeconds)return{bps:null,status:'device_restart',utilizationPercent:null}
  if(previous.interfaceId&&current.interfaceId&&previous.interfaceId!==current.interfaceId)return{bps:null,status:'interface_replaced',utilizationPercent:null}
  const difference=delta(previous.bytes,current.bytes,options.counterBits)
  if(difference.value==null)return{bps:null,status:difference.status,utilizationPercent:null}
  const bps=Number(difference.value)*8/((current.timestamp-previous.timestamp)/1000),speed=current.speedBps,utilizationPercent=speed&&speed>0?bps/speed*100:null
  const speedChanged=previous.speedBps!=null&&speed!=null&&previous.speedBps!==speed
  if(utilizationPercent!=null&&utilizationPercent>100*(options.utilizationTolerance??1.2)&&!speedChanged)return{bps:null,status:'implausible_rate',utilizationPercent}
  return{bps,status:difference.status,utilizationPercent}
}
