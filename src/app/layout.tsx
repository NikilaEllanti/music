import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Language of Vibration — Physics of Music",
  description: "An immersive journey through the physics of music. From a single vibrating particle to harmony, geometry, and emotion. Discover how vibration becomes sound, sound becomes notes, and notes become music.",
  keywords: ["music", "physics", "vibration", "frequency", "harmony", "interactive", "visualization"],
  openGraph: {
    title: "The Language of Vibration",
    description: "An immersive journey through the physics of music",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
