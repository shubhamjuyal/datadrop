"use client";

import { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { JsonViewer } from "@/components/JsonViewer";

interface Props {
  beautified: ReactNode;
  raw: unknown;
}

export function ResponseTabs({ beautified, raw }: Props) {
  return (
    <Tabs defaultValue="beautified" className="w-full">
      <TabsList>
        <TabsTrigger value="beautified">Beautified</TabsTrigger>
        <TabsTrigger value="raw">Raw JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="beautified" className="pt-4">
        {beautified}
      </TabsContent>
      <TabsContent value="raw" className="pt-4">
        <JsonViewer value={raw} />
      </TabsContent>
    </Tabs>
  );
}
