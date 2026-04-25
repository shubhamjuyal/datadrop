interface Props {
  status?: number;
  error: string;
  detail?: string | null;
}

export function ErrorBanner({ status, error, detail }: Props) {
  return (
    <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
      <div className="font-medium text-red-700 dark:text-red-400">
        {status ? `${status} · ` : ""}
        {error}
      </div>
      {detail ? (
        <div className="mt-1 text-red-700/80 dark:text-red-400/80">{detail}</div>
      ) : null}
    </div>
  );
}
