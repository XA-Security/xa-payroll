import { Suspense } from "react";
import Image from "next/image";
import LightPillar from "@/components/LightPillar";
import AuthForm from "@/components/auth/auth-form";
import LoginContent from "@/components/auth/login-content";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 md:p-10">
      {/* Full-page light pillar background with XA brand colors */}
      <LightPillar
        topColor="#EDEA82"
        bottomColor="#FFF000"
        intensity={1.0}
        rotationSpeed={0.3}
        glowAmount={0.002}
        pillarWidth={3}
        pillarHeight={0.4}
        noiseIntensity={0.5}
        pillarRotation={25}
        className="absolute inset-0 -z-10"
      />

      {/* Centered auth form */}
      <div className="relative z-10 w-full max-w-sm md:max-w-3xl">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/Logos/Main Logo/PNG/300 ppi/XA_Logo-White.png"
            alt="XA Security Logo"
            width={120}
            height={60}
            className="h-auto w-32 md:w-40"
            priority
          />
        </div>
        <Suspense fallback={<AuthForm />}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}