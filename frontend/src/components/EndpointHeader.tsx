import { Badge } from "@/components/ui/badge";

interface Props {
  method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT";
  path: string;
  description: string;
}

export function EndpointHeader({ method, path, description }: Props) {
  return (
    <div className="border-b border-border pb-6">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="font-mono text-xs">
          {method}
        </Badge>
        <code className="font-mono text-lg text-foreground">{path}</code>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
