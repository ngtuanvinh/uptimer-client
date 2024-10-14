"use client";

import LayoutBody from "@/components/LayoutBody";
import ProtectedRoute from "@/components/ProtectedRoute";
import dayjs from "dayjs";
import { ReactElement, ReactNode } from "react";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function UptimeLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <ProtectedRoute>
      <LayoutBody>{children}</LayoutBody>;
    </ProtectedRoute>
  );
}
