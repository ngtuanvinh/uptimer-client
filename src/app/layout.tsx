import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { apolloClient } from "@/queries/apolloClient";
import ApolloProvider from "@/queries/apolloProvider";
import { ToastContainer } from "react-toastify";
import { MonitorProvider } from "@/context/MonitorContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

dayjs.extend(relativeTime);

export const metadata: Metadata = {
  title: "Uptimer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ApolloProvider client={apolloClient}>
          <ToastContainer />
          <MonitorProvider>{children}</MonitorProvider>
        </ApolloProvider>
      </body>
    </html>
  );
}
