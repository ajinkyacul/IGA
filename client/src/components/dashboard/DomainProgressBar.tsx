interface DomainProgressBarProps {
  domainName: string;
  progress: number;
}

export default function DomainProgressBar({ domainName, progress }: DomainProgressBarProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-700">{domainName}</span>
        <span className="text-sm font-medium text-slate-700">{progress}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
