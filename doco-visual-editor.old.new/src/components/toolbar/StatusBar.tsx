import { FileText, Zap, Crown, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBarProps {
  wordCount: number;
  userTier: 'Free' | 'Pro' | 'Premium';
  enhancesUsed: number;
  enhancesLimit: number;
  isOnline: boolean;
  latency?: number;
}

export function StatusBar({
  wordCount,
  userTier,
  enhancesUsed,
  enhancesLimit,
  isOnline,
  latency,
}: StatusBarProps) {
  const tierColors = {
    Free: 'text-slate-400',
    Pro: 'text-blue-400',
    Premium: 'text-gradient-to-r from-orange-400 to-red-400',
  };

  const tierIcons = {
    Free: FileText,
    Pro: Zap,
    Premium: Crown,
  };

  const TierIcon = tierIcons[userTier];
  const enhancesRemaining = enhancesLimit - enhancesUsed;
  const enhancesPercentage = (enhancesUsed / enhancesLimit) * 100;

  return (
    <div className="status-bar bg-slate-900 border-t border-slate-700 h-8 flex items-center justify-between px-4 text-xs">
      {/* Left: Document Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-400">
          <FileText size={12} />
          <span>{wordCount.toLocaleString()} words</span>
        </div>

        <div className="w-px h-4 bg-slate-700" />

        <div className="flex items-center gap-1.5 text-slate-400">
          {isOnline ? (
            <>
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Connected</span>
            </>
          ) : (
            <>
              <AlertCircle size={12} className="text-orange-400" />
              <span className="text-orange-400">Offline</span>
            </>
          )}
        </div>

        {latency !== undefined && (
          <>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  latency < 500
                    ? 'bg-emerald-400'
                    : latency < 1000
                    ? 'bg-orange-400'
                    : 'bg-red-400'
                }`}
              />
              <span className="text-slate-400">{latency}ms</span>
            </div>
          </>
        )}
      </div>

      {/* Right: Tier & Usage */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <span>Enhances:</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  enhancesPercentage < 70
                    ? 'bg-emerald-400'
                    : enhancesPercentage < 90
                    ? 'bg-orange-400'
                    : 'bg-red-400'
                }`}
                style={{ width: `${enhancesPercentage}%` }}
              />
            </div>
            <span className="font-medium">
              {enhancesRemaining}/{enhancesLimit}
            </span>
          </div>
        </div>

        <div className="w-px h-4 bg-slate-700" />

        <div className={`flex items-center gap-1.5 ${tierColors[userTier]}`}>
          <TierIcon size={12} />
          <span className="font-medium">{userTier}</span>
        </div>
      </div>
    </div>
  );
}
