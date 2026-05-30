import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
      {icon ? <div className="text-gray-400">{icon}</div> : null}
      <h3 className="font-medium">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-gray-500">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
