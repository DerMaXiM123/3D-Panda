import React, { useEffect } from 'react';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ slot, format = 'auto', style, className }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.debug('AdSense notice: Ad might be blocked by browser extension.');
    }
  }, []);

  return (
    <div className={`relative overflow-hidden glass rounded-2xl border border-white/5 bg-slate-900/40 p-1 flex items-center justify-center min-h-[90px] ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%', ...style }}
        data-ad-client="ca-pub-2334201209469606"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      <div className="absolute top-1 right-2 pointer-events-none">
         <span className="text-[7px] font-black uppercase text-slate-600 tracking-widest italic opacity-50">Nexus Sponsored Node</span>
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
    </div>
  );
};

export default AdBanner;