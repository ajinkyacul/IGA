import { Card, CardContent } from "@/components/ui/card";

interface ProgressCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  progressPercentage?: number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function ProgressCard({
  title,
  value,
  icon,
  description,
  progressPercentage,
  trend
}: ProgressCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500">{title}</h3>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
          </div>
          <div className="bg-blue-100 p-2 rounded">
            {icon}
          </div>
        </div>
        
        {progressPercentage !== undefined && (
          <>
            <div className="w-full bg-slate-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            {description && (
              <p className="mt-2 text-xs text-slate-500">{description}</p>
            )}
          </>
        )}
        
        {trend && (
          <p className="text-sm text-slate-600 mt-2">
            <span className={trend.isPositive ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {trend.value}
            </span>
            {" since last week"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
